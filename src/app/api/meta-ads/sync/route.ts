import { NextRequest, NextResponse } from "next/server"

export async function POST(_request: NextRequest) {
  return NextResponse.json({ error: "Not yet implemented" }, { status: 501 })
}
