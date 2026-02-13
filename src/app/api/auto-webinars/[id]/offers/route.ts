import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * タイムドオファー一覧取得 - Stub Implementation
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Webinar ID required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      offers: [],
      total: 0,
    });
  } catch (error) {
    console.error("Error fetching offers:", error);
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 }
    );
  }
}

/**
 * タイムドオファー作成
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Webinar ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    return NextResponse.json({
      success: false,
      error: "Offer creation not implemented",
    });
  } catch (error) {
    console.error("Error creating offer:", error);
    return NextResponse.json(
      { error: "Failed to create offer" },
      { status: 500 }
    );
  }
}

/**
 * タイムドオファー更新
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Webinar ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    return NextResponse.json({
      success: false,
      error: "Offer update not implemented",
    });
  } catch (error) {
    console.error("Error updating offer:", error);
    return NextResponse.json(
      { error: "Failed to update offer" },
      { status: 500 }
    );
  }
}

/**
 * タイムドオファー削除
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Webinar ID required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: false,
      error: "Offer deletion not implemented",
    });
  } catch (error) {
    console.error("Error deleting offer:", error);
    return NextResponse.json(
      { error: "Failed to delete offer" },
      { status: 500 }
    );
  }
}
