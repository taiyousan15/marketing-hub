/**
 * LIFF経由のアフィリエイトトラッキングAPI - Stub Implementation
 */

import { NextRequest, NextResponse } from "next/server";

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

    if (!clickId && !partnerCode) {
      return NextResponse.json(
        { error: "clickId or partnerCode is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "LIFF affiliate tracking not implemented",
      clickId,
      partnerCode,
    });
  } catch (error) {
    console.error("Error tracking LIFF affiliate:", error);
    return NextResponse.json(
      { error: "Failed to track affiliate" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const lineUserId = searchParams.get("lineUserId");

    if (!tenantId || !lineUserId) {
      return NextResponse.json(
        { error: "tenantId and lineUserId are required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      contact: null,
      affiliate: null,
    });
  } catch (error) {
    console.error("Error retrieving LIFF affiliate:", error);
    return NextResponse.json(
      { error: "Failed to retrieve affiliate" },
      { status: 500 }
    );
  }
}
