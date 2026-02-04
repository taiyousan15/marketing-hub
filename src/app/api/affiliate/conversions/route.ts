/**
 * コンバージョン管理API
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  recordConversion,
  processLineOptin,
  processPurchase,
} from "@/lib/affiliate/service";
import { AffiliateConversionType } from "@prisma/client";

// コンバージョン一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const partnerId = searchParams.get("partnerId");
    const type = searchParams.get("type");
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
    if (partnerId) where.partnerId = partnerId;
    if (type) where.type = type;
    if (status) where.status = status;

    const [conversions, total] = await Promise.all([
      prisma.affiliateConversion.findMany({
        where,
        include: {
          partner: {
            select: { id: true, name: true, code: true },
          },
          contact: {
            select: { id: true, name: true, email: true, lineUserId: true },
          },
          commissions: {
            select: { id: true, amount: true, tier: true, status: true },
          },
        },
        orderBy: { convertedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.affiliateConversion.count({ where }),
    ]);

    return NextResponse.json({
      conversions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching conversions:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversions" },
      { status: 500 }
    );
  }
}

// コンバージョン記録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      type,
      clickId,
      partnerCode,
      contactId,
      lineUserId,
      orderId,
      productId,
      amount,
    } = body;

    if (!tenantId || !type) {
      return NextResponse.json(
        { error: "tenantId and type are required" },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case "LINE_OPTIN":
        if (!contactId) {
          return NextResponse.json(
            { error: "contactId is required for LINE_OPTIN" },
            { status: 400 }
          );
        }
        result = await processLineOptin({
          tenantId,
          contactId,
          lineUserId: lineUserId || "",
          clickId,
          partnerCode,
        });
        break;

      case "EMAIL_OPTIN":
        if (!contactId) {
          return NextResponse.json(
            { error: "contactId is required for EMAIL_OPTIN" },
            { status: 400 }
          );
        }
        result = await recordConversion({
          tenantId,
          clickId,
          partnerCode,
          type: AffiliateConversionType.EMAIL_OPTIN,
          contactId,
        });
        break;

      case "FRONTEND_PURCHASE":
      case "BACKEND_PURCHASE":
        if (!orderId || !contactId || !productId || !amount) {
          return NextResponse.json(
            {
              error:
                "orderId, contactId, productId, and amount are required for purchase",
            },
            { status: 400 }
          );
        }
        result = await processPurchase({
          tenantId,
          orderId,
          contactId,
          productId,
          amount,
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid conversion type" },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      conversionId: result.conversionId,
      commissions: result.commissions,
    });
  } catch (error) {
    console.error("Error recording conversion:", error);
    return NextResponse.json(
      { error: "Failed to record conversion" },
      { status: 500 }
    );
  }
}

// コンバージョン承認/却下
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversionId, action, rejectionReason } = body;

    if (!conversionId || !action) {
      return NextResponse.json(
        { error: "conversionId and action are required" },
        { status: 400 }
      );
    }

    const conversion = await prisma.affiliateConversion.findUnique({
      where: { id: conversionId },
      include: { commissions: true },
    });

    if (!conversion) {
      return NextResponse.json(
        { error: "Conversion not found" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      // コンバージョンを承認
      await prisma.affiliateConversion.update({
        where: { id: conversionId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
        },
      });

      // 関連するコミッションも承認
      await prisma.affiliateCommission.updateMany({
        where: { conversionId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
        },
      });
    } else if (action === "reject") {
      // コンバージョンを却下
      await prisma.affiliateConversion.update({
        where: { id: conversionId },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
          rejectionReason,
        },
      });

      // 関連するコミッションもキャンセル
      await prisma.affiliateCommission.updateMany({
        where: { conversionId },
        data: {
          status: "CANCELLED",
        },
      });

      // パートナーの未払い報酬を減算
      for (const commission of conversion.commissions) {
        await prisma.partner.update({
          where: { id: commission.partnerId },
          data: {
            totalEarnings: { decrement: commission.amount },
            unpaidEarnings: { decrement: commission.amount },
          },
        });
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updated = await prisma.affiliateConversion.findUnique({
      where: { id: conversionId },
      include: {
        commissions: true,
        partner: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return NextResponse.json({ conversion: updated });
  } catch (error) {
    console.error("Error updating conversion:", error);
    return NextResponse.json(
      { error: "Failed to update conversion" },
      { status: 500 }
    );
  }
}
