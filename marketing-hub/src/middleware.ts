import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Clerkが設定されているかチェック
const isClerkConfigured =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_");

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/api/webhooks/(.*)",
  "/p/(.*)",  // 公開ファネルページ
  "/m/(.*)",  // 会員サイト公開ページ
  "/r/(.*)",  // 予約ページ
  "/w/(.*)",  // ウェビナーページ
  "/unsubscribe/(.*)",
]);

// Clerkが設定されていない場合のフォールバックミドルウェア
function devMiddleware(req: NextRequest) {
  // 開発環境では全てのルートを許可
  return NextResponse.next();
}

// Clerkミドルウェア
const authMiddleware = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export default isClerkConfigured ? authMiddleware : devMiddleware;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
