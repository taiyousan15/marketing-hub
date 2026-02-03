/**
 * パートナー（アフィリエイター）管理API
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateAffiliateCode } from "@/lib/affiliate/service";

// パートナー一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { tenantId };
    if (status) {
      where.status = status;
    }

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        include: {
          parentPartner: {
            select: { id: true, name: true, code: true },
          },
          _count: {
            select: {
              affiliateConversions: true,
              referredContacts: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.partner.count({ where }),
    ]);

    return NextResponse.json({
      partners,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching partners:", error);
    return NextResponse.json(
      { error: "Failed to fetch partners" },
      { status: 500 }
    );
  }
}

// パートナー登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      email,
      name,
      companyName,
      phone,
      parentPartnerCode,
      defaultOptinCommission = 500,
      defaultFrontendCommission = 30,
      defaultBackendCommission = 20,
      tier2CommissionRate = 10,
      autoApprove = false,
    } = body;

    if (!tenantId || !email || !name) {
      return NextResponse.json(
        { error: "tenantId, email, and name are required" },
        { status: 400 }
      );
    }

    // 既存パートナーをチェック
    const existing = await prisma.partner.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Partner with this email already exists" },
        { status: 409 }
      );
    }

    // 親パートナーを検索
    let parentPartnerId: string | null = null;
    if (parentPartnerCode) {
      const parentPartner = await prisma.partner.findUnique({
        where: { code: parentPartnerCode },
      });
      if (parentPartner && parentPartner.tenantId === tenantId) {
        parentPartnerId = parentPartner.id;
      }
    }

    // アフィリエイトコードを生成
    let code = generateAffiliateCode();
    // 重複チェック
    while (await prisma.partner.findUnique({ where: { code } })) {
      code = generateAffiliateCode();
    }

    // パートナーを作成
    const partner = await prisma.partner.create({
      data: {
        tenantId,
        email,
        name,
        companyName,
        phone,
        code,
        parentPartnerId,
        defaultOptinCommission,
        defaultFrontendCommission,
        defaultBackendCommission,
        tier2CommissionRate,
        status: autoApprove ? "ACTIVE" : "PENDING",
        approvedAt: autoApprove ? new Date() : null,
      },
      include: {
        parentPartner: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return NextResponse.json({ partner }, { status: 201 });
  } catch (error) {
    console.error("Error creating partner:", error);
    return NextResponse.json(
      { error: "Failed to create partner" },
      { status: 500 }
    );
  }
}

// パートナー承認
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { partnerId, action, ...updateData } = body;

    if (!partnerId) {
      return NextResponse.json(
        { error: "partnerId is required" },
        { status: 400 }
      );
    }

    let data: Record<string, unknown> = {};

    switch (action) {
      case "approve":
        data = { status: "ACTIVE", approvedAt: new Date() };
        break;
      case "suspend":
        data = { status: "SUSPENDED" };
        break;
      case "reject":
        data = { status: "REJECTED" };
        break;
      case "update":
        data = updateData;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    const partner = await prisma.partner.update({
      where: { id: partnerId },
      data,
    });

    return NextResponse.json({ partner });
  } catch (error) {
    console.error("Error updating partner:", error);
    return NextResponse.json(
      { error: "Failed to update partner" },
      { status: 500 }
    );
  }
}
