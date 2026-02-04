/**
 * アフィリエイトリンクリダイレクト
 *
 * /r/[code] へのアクセスでクリックを記録し、ターゲットURLへリダイレクト
 */

import { NextRequest, NextResponse } from "next/server";
import { recordAffiliateClick } from "@/lib/affiliate/service";
import { cookies } from "next/headers";

const COOKIE_NAME = "aff_click_id";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30日

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // リクエスト情報を取得
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || undefined;
  const referer = request.headers.get("referer") || undefined;

  // クリックを記録
  const result = await recordAffiliateClick({
    affiliateLinkCode: code,
    ipAddress,
    userAgent,
    referer,
  });

  if (!result.success || !result.targetUrl) {
    // エラー時はホームページにリダイレクト
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ターゲットURLを構築
  const targetUrl = new URL(result.targetUrl);

  // クリックIDをURLパラメータに追加
  if (result.clickId) {
    targetUrl.searchParams.set("aff_click", result.clickId);
  }

  // レスポンスを作成
  const response = NextResponse.redirect(targetUrl);

  // クリックIDをCookieに保存
  if (result.clickId) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, result.clickId, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}
