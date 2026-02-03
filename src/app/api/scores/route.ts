/**
 * Scores API
 *
 * スコアリング機能のAPI
 * 根拠: ev-005 (AIスコアリングで成約率向上)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  calculateAndSaveScore,
  recalculateAllScores,
  getScoreSummary,
  getHotLeads,
  getAtRiskContacts,
} from "@/lib/marketing/scoring";

// GET: スコア情報取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId");
    const action = searchParams.get("action") || "summary";
    const contactId = searchParams.get("contactId");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "summary": {
        const summary = await getScoreSummary(tenantId);
        return NextResponse.json({ summary });
      }

      case "hot_leads": {
        const hotLeads = await getHotLeads(tenantId, limit);
        return NextResponse.json({ hotLeads });
      }

      case "at_risk": {
        const atRisk = await getAtRiskContacts(tenantId, limit);
        return NextResponse.json({ atRisk });
      }

      case "contact": {
        if (!contactId) {
          return NextResponse.json(
            { error: "contactId is required for contact action" },
            { status: 400 }
          );
        }
        const score = await prisma.contactScore.findUnique({
          where: { contactId },
        });
        return NextResponse.json({ score });
      }

      case "list": {
        const tier = searchParams.get("tier");
        const orderBy = searchParams.get("orderBy") || "leadScore";
        const order = searchParams.get("order") || "desc";

        const scores = await prisma.contactScore.findMany({
          where: {
            tenantId,
            ...(tier && { tier }),
          },
          orderBy: { [orderBy]: order as "asc" | "desc" },
          take: limit,
        });
        return NextResponse.json({ scores });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Scores GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch scores" },
      { status: 500 }
    );
  }
}

// POST: スコア計算
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, action, contactId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "calculate_single": {
        if (!contactId) {
          return NextResponse.json(
            { error: "contactId is required" },
            { status: 400 }
          );
        }
        const result = await calculateAndSaveScore(contactId, tenantId);
        return NextResponse.json({ result });
      }

      case "recalculate_all": {
        const result = await recalculateAllScores(tenantId);
        return NextResponse.json({ result });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'calculate_single' or 'recalculate_all'" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Scores POST error:", error);
    return NextResponse.json(
      { error: "Failed to calculate scores" },
      { status: 500 }
    );
  }
}
