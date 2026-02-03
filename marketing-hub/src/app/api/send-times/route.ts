/**
 * Send Times API
 *
 * 送信時間最適化のAPI
 * 根拠: ev-002 (AIが購読者行動から学習し最適送信時間を予測)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  analyzeOpenPattern,
  saveSendTimePreference,
  getOptimalSendTime,
  calculateBulkSendTimes,
  analyzeAndUpdateAllSendTimes,
  getSendTimeSummary,
  getRecommendedSendWindows,
} from "@/lib/marketing/send-optimizer";

// GET: 送信時間情報取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId");
    const action = searchParams.get("action") || "summary";
    const contactId = searchParams.get("contactId");
    const type = (searchParams.get("type") || "business") as "business" | "consumer";

    if (!tenantId && action !== "recommendations") {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "summary": {
        const summary = await getSendTimeSummary(tenantId!);
        return NextResponse.json({ summary });
      }

      case "contact": {
        if (!contactId) {
          return NextResponse.json(
            { error: "contactId is required" },
            { status: 400 }
          );
        }
        const preference = await prisma.sendTimePreference.findUnique({
          where: { contactId },
        });
        return NextResponse.json({ preference });
      }

      case "optimal": {
        if (!contactId) {
          return NextResponse.json(
            { error: "contactId is required" },
            { status: 400 }
          );
        }
        const optimalTime = await getOptimalSendTime(contactId, new Date(), type);
        return NextResponse.json({
          contactId,
          optimalTime: optimalTime.toISOString(),
          timezone: "Asia/Tokyo",
        });
      }

      case "recommendations": {
        const windows = getRecommendedSendWindows(type);
        return NextResponse.json({ windows });
      }

      case "list": {
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const preferences = await prisma.sendTimePreference.findMany({
          where: { tenantId: tenantId! },
          orderBy: { confidence: "desc" },
          take: limit,
        });
        return NextResponse.json({ preferences });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Send times GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch send times" },
      { status: 500 }
    );
  }
}

// POST: 送信時間分析・計算
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, action, contactId, contactIds, type = "business" } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "analyze_single": {
        if (!contactId) {
          return NextResponse.json(
            { error: "contactId is required" },
            { status: 400 }
          );
        }

        const analysis = await analyzeOpenPattern(contactId);

        if (!analysis) {
          return NextResponse.json({
            success: false,
            message: "Not enough data to analyze (minimum 3 opens required)",
          });
        }

        await saveSendTimePreference(contactId, tenantId, analysis);

        return NextResponse.json({
          success: true,
          analysis,
        });
      }

      case "analyze_all": {
        const result = await analyzeAndUpdateAllSendTimes(tenantId);
        return NextResponse.json({ result });
      }

      case "calculate_bulk": {
        if (!contactIds || !Array.isArray(contactIds)) {
          return NextResponse.json(
            { error: "contactIds array is required" },
            { status: 400 }
          );
        }

        const results = await calculateBulkSendTimes(
          contactIds,
          new Date(),
          type as "business" | "consumer"
        );

        return NextResponse.json({ results });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'analyze_single', 'analyze_all', or 'calculate_bulk'" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Send times POST error:", error);
    return NextResponse.json(
      { error: "Failed to process send times" },
      { status: 500 }
    );
  }
}
