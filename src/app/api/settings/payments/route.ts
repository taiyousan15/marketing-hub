import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/tenant";
import {
  getPaymentSettings,
  updatePaymentSettings,
  paymentSettingsSchema,
} from "@/actions/settings";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const settings = await getPaymentSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/settings/payments error:", error);
    return NextResponse.json({ error: "Failed to get payment settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = paymentSettingsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const settings = await updatePaymentSettings(validation.data);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("PUT /api/settings/payments error:", error);
    return NextResponse.json({ error: "Failed to update payment settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { secretKey } = body;

    if (!secretKey || typeof secretKey !== "string" || secretKey.startsWith("***")) {
      return NextResponse.json(
        { error: "Secret key is required for connection test" },
        { status: 400 }
      );
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey);
    await stripe.paymentMethods.list({ limit: 1 });

    return NextResponse.json({ success: true, message: "Stripe connection successful" });
  } catch (error) {
    console.error("POST /api/settings/payments error:", error);
    return NextResponse.json(
      { success: false, error: "Stripe connection failed. Check your secret key." },
      { status: 400 }
    );
  }
}
