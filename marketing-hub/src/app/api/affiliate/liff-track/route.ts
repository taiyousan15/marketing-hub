/**
 * LIFF経由のアフィリエイトトラッキングAPI
 *
 * LIFFアプリから友だち追加する前に、アフィリエイト情報を事前に保存する
 * これにより、follow webhookでアフィリエイト情報を取得できるようになる
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { randomUUID } from "crypto";

// LIFFからのアフィリエイト情報を事前登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, lineUserId, clickId, partnerCode } = body;

    if (!tenantId || !lineUserId) {
      return NextResponse.json(
        { error: "tenantId and lineUserId are required" },
        { status: 400 }
      );
    }

    // clickIdまたはpartnerCodeのいずれかが必要
    if (!clickId && !partnerCode) {
      return NextResponse.json(
        { error: "clickId or partnerCode is required" },
        { status: 400 }
      );
    }

    let partnerId: string | null = null;
    let existingClick = null;

    // clickIdが指定されている場合
    if (clickId) {
      existingClick = await prisma.affiliateClick.findUnique({
        where: { clickId },
      });

      if (existingClick) {
        partnerId = existingClick.partnerId;

        // 既存のクリック情報にLINEユーザーIDを追加
        await prisma.affiliateClick.update({
          where: { clickId },
          data: {
            pendingLineUserId: lineUserId,
          },
        });

        return NextResponse.json({
          success: true,
          clickId,
          partnerId,
          message: "Click updated with LINE user ID",
        });
      }
    }

    // partnerCodeから新しいクリックを作成
    if (partnerCode) {
      const partner = await prisma.partner.findFirst({
        where: {
          code: partnerCode,
          tenantId,
          status: "ACTIVE",
        },
      });

      if (!partner) {
        return NextResponse.json(
          { error: "Partner not found or inactive" },
          { status: 404 }
        );
      }

      partnerId = partner.id;

      // デフォルトリンクを探すか、新規クリックを作成
      let link = await prisma.affiliateLink.findFirst({
        where: {
          partnerId: partner.id,
          name: "LINE Default",
        },
      });

      if (!link) {
        // デフォルトリンクを作成
        link = await prisma.affiliateLink.create({
          data: {
            partnerId: partner.id,
            code: `LINE_${partner.code}`,
            targetUrl: `line://ti/p/@${tenantId}`,
            name: "LINE Default",
          },
        });
      }

      // 新規クリックを記録
      const newClickId = randomUUID();
      await prisma.affiliateClick.create({
        data: {
          clickId: newClickId,
          partnerId: partner.id,
          affiliateLinkId: link.id,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          referer: request.headers.get("referer"),
          pendingLineUserId: lineUserId,
          metadata: { source: "LIFF" },
        },
      });

      return NextResponse.json({
        success: true,
        clickId: newClickId,
        partnerId,
        message: "New click created for LIFF tracking",
      });
    }

    return NextResponse.json(
      { error: "Could not process affiliate tracking" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in LIFF affiliate tracking:", error);
    return NextResponse.json(
      { error: "Failed to process affiliate tracking" },
      { status: 500 }
    );
  }
}

// LINE UserIDに紐付いたアフィリエイト情報を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get("lineUserId");
    const tenantId = searchParams.get("tenantId");

    if (!lineUserId || !tenantId) {
      return NextResponse.json(
        { error: "lineUserId and tenantId are required" },
        { status: 400 }
      );
    }

    // コンタクト情報を取得
    const contact = await prisma.contact.findFirst({
      where: {
        tenantId,
        lineUserId,
      },
      select: {
        id: true,
        referredByPartnerId: true,
        referredByPartner: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ contact: null, affiliate: null });
    }

    // 保留中のアフィリエイトクリックを確認
    const pendingClick = await prisma.affiliateClick.findFirst({
      where: {
        pendingLineUserId: lineUserId,
      },
      include: {
        partner: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { clickedAt: "desc" },
    });

    return NextResponse.json({
      contact: {
        id: contact.id,
        referredByPartnerId: contact.referredByPartnerId,
      },
      affiliate: contact.referredByPartner || pendingClick?.partner || null,
      pendingClick: pendingClick
        ? {
            clickId: pendingClick.clickId,
            partnerId: pendingClick.partnerId,
            clickedAt: pendingClick.clickedAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Error getting LIFF affiliate info:", error);
    return NextResponse.json(
      { error: "Failed to get affiliate info" },
      { status: 500 }
    );
  }
}
