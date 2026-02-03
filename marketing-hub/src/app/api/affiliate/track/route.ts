/**
 * アフィリエイトトラッキングAPI
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateLinkCode } from "@/lib/affiliate/service";
import { cookies } from "next/headers";

const COOKIE_NAME = "aff_click_id";

// クリックID取得（Cookieから）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "getClickId") {
      // CookieからクリックIDを取得
      const cookieStore = await cookies();
      const clickId = cookieStore.get(COOKIE_NAME)?.value;

      if (!clickId) {
        return NextResponse.json({ clickId: null });
      }

      // クリック情報を取得
      const click = await prisma.affiliateClick.findUnique({
        where: { clickId },
        include: {
          partner: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      return NextResponse.json({
        clickId,
        click: click
          ? {
              partnerId: click.partnerId,
              partnerCode: click.partner.code,
              clickedAt: click.clickedAt,
            }
          : null,
      });
    }

    // URLパラメータからクリックIDを取得
    const clickIdFromParam = searchParams.get("aff_click");
    if (clickIdFromParam) {
      const click = await prisma.affiliateClick.findUnique({
        where: { clickId: clickIdFromParam },
        include: {
          partner: {
            select: { id: true, code: true },
          },
        },
      });

      return NextResponse.json({
        clickId: clickIdFromParam,
        valid: !!click,
        partnerCode: click?.partner.code,
      });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error getting click info:", error);
    return NextResponse.json(
      { error: "Failed to get click info" },
      { status: 500 }
    );
  }
}

// アフィリエイトリンク作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partnerId, targetUrl, name, customParams } = body;

    if (!partnerId || !targetUrl) {
      return NextResponse.json(
        { error: "partnerId and targetUrl are required" },
        { status: 400 }
      );
    }

    // パートナーを確認
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 }
      );
    }

    if (partner.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Partner is not active" },
        { status: 400 }
      );
    }

    // リンクコードを生成
    let code = generateLinkCode();
    while (await prisma.affiliateLink.findUnique({ where: { code } })) {
      code = generateLinkCode();
    }

    // リンクを作成
    const link = await prisma.affiliateLink.create({
      data: {
        partnerId,
        code,
        targetUrl,
        name,
        customParams: customParams || null,
      },
    });

    // 完全なリンクURLを構築
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const affiliateUrl = `${baseUrl}/r/${link.code}`;

    return NextResponse.json({
      link: {
        ...link,
        affiliateUrl,
      },
    });
  } catch (error) {
    console.error("Error creating affiliate link:", error);
    return NextResponse.json(
      { error: "Failed to create affiliate link" },
      { status: 500 }
    );
  }
}

// アフィリエイトリンク一覧取得
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { partnerId, page = 1, limit = 20 } = body;

    if (!partnerId) {
      return NextResponse.json(
        { error: "partnerId is required" },
        { status: 400 }
      );
    }

    const [links, total] = await Promise.all([
      prisma.affiliateLink.findMany({
        where: { partnerId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.affiliateLink.count({ where: { partnerId } }),
    ]);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return NextResponse.json({
      links: links.map((link) => ({
        ...link,
        affiliateUrl: `${baseUrl}/r/${link.code}`,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching affiliate links:", error);
    return NextResponse.json(
      { error: "Failed to fetch affiliate links" },
      { status: 500 }
    );
  }
}
