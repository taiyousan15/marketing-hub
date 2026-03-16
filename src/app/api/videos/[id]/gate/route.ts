/**
 * 動画ゲートAPI（スタブ）
 * Video モデルが未実装のため、501 を返す
 */

import { NextRequest, NextResponse } from "next/server"

export async function POST(
  _request: NextRequest,
  _context: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: "Video gate API is not yet implemented" },
    { status: 501 }
  )
}

export async function GET(
  _request: NextRequest,
  _context: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: "Video gate API is not yet implemented" },
    { status: 501 }
  )
}
