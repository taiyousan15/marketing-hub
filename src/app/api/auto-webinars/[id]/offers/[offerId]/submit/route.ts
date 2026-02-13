import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string; offerId: string }>;
}

/**
 * オファーフォーム送信（メール登録等）- Stub Implementation
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, offerId } = await params;

    if (!id || !offerId) {
      return NextResponse.json(
        { error: "Webinar ID and Offer ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { sessionToken, formData } = body;

    if (!sessionToken || !formData) {
      return NextResponse.json(
        { error: "sessionToken and formData are required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: false,
      error: "Offer form submission not implemented",
    });
  } catch (error) {
    console.error("Error submitting offer form:", error);
    return NextResponse.json(
      { error: "Failed to submit offer form" },
      { status: 500 }
    );
  }
}
