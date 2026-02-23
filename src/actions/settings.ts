import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

export const emailSettingsSchema = z.object({
  provider: z.literal("resend").default("resend"),
  apiKey: z.string().optional(),
  fromEmail: z.string().email().optional().or(z.literal("")),
  fromName: z.string().optional(),
  replyTo: z.string().email().optional().or(z.literal("")).nullable(),
});

export const aiSettingsSchema = z.object({
  provider: z.enum(["anthropic", "google", "openai"]).default("anthropic"),
  apiKey: z.string().optional(),
  mode: z.enum(["support", "sales", "faq"]).default("support"),
  temperature: z.number().min(0).max(1).default(0.7),
  maxTokens: z.number().min(100).max(4000).default(500),
  customPrompt: z.string().optional(),
  handoffKeywords: z.string().optional(),
  isEnabled: z.boolean().default(true),
  faqs: z
    .array(z.object({ id: z.string(), question: z.string(), answer: z.string() }))
    .optional()
    .default([]),
});

export const botSettingsSchema = z.object({
  isEnabled: z.boolean().default(true),
  rules: z
    .array(
      z.object({
        id: z.string(),
        trigger: z.string(),
        triggerType: z.enum(["keyword", "contains", "regex"]),
        response: z.string(),
        isActive: z.boolean(),
      })
    )
    .default([]),
});

export const paymentSettingsSchema = z.object({
  publishableKey: z.string().optional(),
  secretKey: z.string().optional(),
  webhookSecret: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Credential Masking Helpers
// ---------------------------------------------------------------------------

function maskCredential(value: string | undefined | null): string | null {
  if (!value) return null;
  if (value.length <= 8) return "********";
  return "***" + value.slice(-4);
}

function isMasked(value: string | undefined | null): boolean {
  if (!value) return false;
  return value.startsWith("***") || value === "********";
}

function resolveCredential(
  newValue: string | undefined | null,
  existingValue: string | undefined | null
): string | undefined {
  if (!newValue) return undefined;
  if (isMasked(newValue)) return existingValue ?? undefined;
  return newValue;
}

// ---------------------------------------------------------------------------
// Generic Tenant Settings CRUD
// ---------------------------------------------------------------------------

async function getTenantWithSettings(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  return (tenant?.settings as Record<string, unknown>) ?? {};
}

export async function getTenantSettings(key: string) {
  const user = await getCurrentUser();
  if (!user?.tenantId) return null;

  const settings = await getTenantWithSettings(user.tenantId);
  return (settings[key] as Record<string, unknown>) ?? null;
}

export async function updateTenantSettings(
  key: string,
  data: Record<string, unknown>
) {
  const user = await getCurrentUser();
  if (!user?.tenantId) throw new Error("Unauthorized");

  const existing = await getTenantWithSettings(user.tenantId);
  const updated = { ...existing, [key]: data };

  await prisma.tenant.update({
    where: { id: user.tenantId },
    data: { settings: updated as Prisma.InputJsonValue },
  });

  return data;
}

// ---------------------------------------------------------------------------
// Email Settings
// ---------------------------------------------------------------------------

export async function getEmailSettings() {
  const data = await getTenantSettings("email");
  if (!data) {
    return {
      provider: "resend" as const,
      apiKey: null,
      fromEmail: "",
      fromName: "",
      replyTo: "",
    };
  }
  return {
    ...data,
    apiKey: maskCredential(data.apiKey as string | undefined),
  };
}

export async function updateEmailSettings(input: z.infer<typeof emailSettingsSchema>) {
  const validated = emailSettingsSchema.parse(input);
  const existing = await getTenantSettings("email");

  const data = {
    provider: validated.provider,
    apiKey: resolveCredential(validated.apiKey, existing?.apiKey as string | undefined),
    fromEmail: validated.fromEmail || "",
    fromName: validated.fromName || "",
    replyTo: validated.replyTo || "",
  };

  await updateTenantSettings("email", data as Record<string, unknown>);
  return { ...data, apiKey: maskCredential(data.apiKey) };
}

// ---------------------------------------------------------------------------
// AI Settings
// ---------------------------------------------------------------------------

export async function getAISettings() {
  const data = await getTenantSettings("ai");
  if (!data) {
    return {
      provider: "anthropic" as const,
      apiKey: null,
      mode: "support" as const,
      temperature: 0.7,
      maxTokens: 500,
      customPrompt: "",
      handoffKeywords: "",
      isEnabled: true,
      faqs: [],
    };
  }
  return {
    ...data,
    apiKey: maskCredential(data.apiKey as string | undefined),
  };
}

export async function updateAISettings(input: z.infer<typeof aiSettingsSchema>) {
  const validated = aiSettingsSchema.parse(input);
  const existing = await getTenantSettings("ai");

  const data = {
    ...validated,
    apiKey: resolveCredential(validated.apiKey, existing?.apiKey as string | undefined),
  };

  await updateTenantSettings("ai", data as Record<string, unknown>);
  return { ...data, apiKey: maskCredential(data.apiKey) };
}

// ---------------------------------------------------------------------------
// Bot Settings
// ---------------------------------------------------------------------------

export async function getBotSettings() {
  const data = await getTenantSettings("bot");
  if (!data) {
    return { isEnabled: true, rules: [] };
  }
  return data;
}

export async function updateBotSettings(input: z.infer<typeof botSettingsSchema>) {
  const validated = botSettingsSchema.parse(input);
  await updateTenantSettings("bot", validated as unknown as Record<string, unknown>);
  return validated;
}

// ---------------------------------------------------------------------------
// Payment Settings
// ---------------------------------------------------------------------------

export async function getPaymentSettings() {
  const data = await getTenantSettings("payments");
  if (!data) {
    return {
      publishableKey: null,
      secretKey: null,
      webhookSecret: null,
    };
  }
  return {
    publishableKey: maskCredential(data.publishableKey as string | undefined),
    secretKey: maskCredential(data.secretKey as string | undefined),
    webhookSecret: maskCredential(data.webhookSecret as string | undefined),
  };
}

export async function updatePaymentSettings(input: z.infer<typeof paymentSettingsSchema>) {
  const validated = paymentSettingsSchema.parse(input);
  const existing = await getTenantSettings("payments");

  const data = {
    publishableKey: resolveCredential(
      validated.publishableKey,
      existing?.publishableKey as string | undefined
    ),
    secretKey: resolveCredential(
      validated.secretKey,
      existing?.secretKey as string | undefined
    ),
    webhookSecret: resolveCredential(
      validated.webhookSecret,
      existing?.webhookSecret as string | undefined
    ),
  };

  await updateTenantSettings("payments", data as Record<string, unknown>);
  return {
    publishableKey: maskCredential(data.publishableKey),
    secretKey: maskCredential(data.secretKey),
    webhookSecret: maskCredential(data.webhookSecret),
  };
}
