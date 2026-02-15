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
        where: { id: clickId },
      });

      if (existingClick) {
        partnerId = existingClick.partnerId || null;

        return NextResponse.json({
          success: true,
          clickId,
          partnerId,
          message: "Click found",
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
          tenantId,
        },
      });

      if (!link) {
        // デフォルトリンクを作成
        link = await prisma.affiliateLink.create({
          data: {
            tenantId,
            partnerId: partner.id,
            linkCode: `LINE_${partner.code}_${Date.now()}`,
            url: `line://ti/p/@${tenantId}`,
            updatedAt: new Date(),
          },
        });
      }

      // 新規クリックを記録
      const newClick = await prisma.affiliateClick.create({
        data: {
          tenantId,
          linkId: link.id,
          partnerId: partner.id,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          referrer: request.headers.get("referer"),
        },
      });

      return NextResponse.json({
        success: true,
        clickId: newClick.id,
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
      },
    });

    if (!contact) {
      return NextResponse.json({ contact: null, affiliate: null });
    }

    // パートナー情報を取得
    let affiliate = null;
    if (contact.referredByPartnerId) {
      affiliate = await prisma.partner.findUnique({
        where: { id: contact.referredByPartnerId },
        select: { id: true, name: true, code: true },
      });
    }

    return NextResponse.json({
      contact: {
        id: contact.id,
        referredByPartnerId: contact.referredByPartnerId,
      },
      affiliate,
    });
  } catch (error) {
    console.error("Error getting LIFF affiliate info:", error);
    return NextResponse.json(
      { error: "Failed to get affiliate info" },
      { status: 500 }
    );
  }
}
