import { NextResponse } from "next/server";
import { OcrClient } from "@/lib/ocr/client";

export async function GET() {
  const client = new OcrClient();
  const status = await client.checkHealth();
  const httpStatus = status.available ? 200 : 503;
  return NextResponse.json(status, { status: httpStatus });
}
