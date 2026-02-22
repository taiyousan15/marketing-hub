import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import type { Partner } from "@prisma/client";

const COOKIE_NAME = "partner_session";
const TOKEN_TTL_HOURS = 24;
const COOKIE_MAX_AGE_DAYS = 30;

export async function generatePartnerToken(partnerId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await prisma.partner.update({
    where: { id: partnerId },
    data: {
      partnerAccessToken: token,
      tokenExpiresAt: expiresAt,
    },
  });

  return token;
}

export async function getPartnerSession(
  request: NextRequest
): Promise<Partner | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const partner = await prisma.partner.findFirst({
    where: {
      partnerAccessToken: token,
      tokenExpiresAt: { gt: new Date() },
    },
  });

  return partner ?? null;
}

export async function getPartnerSessionFromCookies(): Promise<Partner | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const partner = await prisma.partner.findFirst({
    where: {
      partnerAccessToken: token,
      tokenExpiresAt: { gt: new Date() },
    },
  });

  return partner ?? null;
}

export function setPartnerCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export function clearPartnerCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}
