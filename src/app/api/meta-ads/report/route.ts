import { NextRequest, NextResponse } from "next/server"

export async function GET(_request: NextRequest) {
  return NextResponse.json({ error: "Not yet implemented" }, { status: 501 })
}
