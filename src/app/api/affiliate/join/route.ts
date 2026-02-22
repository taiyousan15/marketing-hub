/**
 * 公開パートナー登録API
 * 認証不要。tenantIdをクエリパラメータで受け取る。
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { generateAffiliateCode } from "@/lib/affiliate/service";
import { sendPartnerMagicLinkEmail } from "@/lib/email/resend-client";

const bodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  channelType: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    // テナントの存在確認
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return NextResponse.json({ error: "Invalid tenantId" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, channelType } = parsed.data;

    // 重複チェック
    const existing = await prisma.partner.findFirst({
      where: { tenantId, email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています" },
        { status: 409 }
      );
    }

    // ユニークコード生成
    let code = generateAffiliateCode();
    while (await prisma.partner.findUnique({ where: { code } })) {
      code = generateAffiliateCode();
    }

    // パートナー作成（PENDING状態）
    await prisma.partner.create({
      data: {
        tenantId,
        name,
        email,
        code,
        commissionRate: 10,
        status: "PENDING",
        bio: channelType,
      },
    });

    // マジックリンクメール送信（メール設定がある場合）
    if (process.env.RESEND_API_KEY) {
      const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/partner/login`;
      sendPartnerMagicLinkEmail(email, name, portalUrl).catch((err) => {
        console.error("Magic link email failed:", err);
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Affiliate join error:", error);
    return NextResponse.json(
      { error: "登録処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
