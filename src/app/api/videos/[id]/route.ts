import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _request: NextRequest,
  _context: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({ error: "Not yet implemented" }, { status: 501 })
}

export async function PATCH(
  _request: NextRequest,
  _context: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({ error: "Not yet implemented" }, { status: 501 })
}

export async function DELETE(
  _request: NextRequest,
  _context: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({ error: "Not yet implemented" }, { status: 501 })
}
