import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  /** 制限数 */
  limit: number;
  /** 時間ウィンドウ（ミリ秒） */
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// インメモリストア（本番では Redis を推奨）
const rateLimitStore = new Map<string, RateLimitEntry>();

// 定期的に古いエントリをクリーンアップ
const CLEANUP_INTERVAL = 60000; // 1分
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
  lastCleanup = now;
}

/**
 * レート制限キーを生成
 */
function getRateLimitKey(request: NextRequest, prefix: string): string {
  // IPアドレスを取得（プロキシ対応）
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  // パスも含めてキーを生成
  const path = request.nextUrl.pathname;

  return `${prefix}:${ip}:${path}`;
}

/**
 * セッショントークンベースのキーを生成
 */
function getSessionRateLimitKey(sessionToken: string, prefix: string): string {
  return `${prefix}:session:${sessionToken}`;
}

/**
 * レート制限をチェック
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanupExpiredEntries();

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // 新しいウィンドウを開始
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);

    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt: newEntry.resetAt,
    };
  }

  if (entry.count >= config.limit) {
    // 制限に達した
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // カウントを増加
  entry.count++;

  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * レート制限レスポンスを生成
 */
export function rateLimitResponse(resetAt: number): NextResponse {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: "Too many requests",
      message: "リクエスト制限に達しました。しばらくしてから再試行してください。",
      retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
      },
    }
  );
}

// ====================
// プリセット設定
// ====================

/**
 * 登録API用レート制限（10件/分/IP）
 */
export const REGISTRATION_RATE_LIMIT: RateLimitConfig = {
  limit: 10,
  windowMs: 60 * 1000, // 1分
};

/**
 * セッションAPI用レート制限（30件/分/IP）
 */
export const SESSION_RATE_LIMIT: RateLimitConfig = {
  limit: 30,
  windowMs: 60 * 1000, // 1分
};

/**
 * 特典受取API用レート制限（5件/分/セッション）
 */
export const REWARD_CLAIM_RATE_LIMIT: RateLimitConfig = {
  limit: 5,
  windowMs: 60 * 1000, // 1分
};

/**
 * 一般API用レート制限（100件/分/IP）
 */
export const GENERAL_API_RATE_LIMIT: RateLimitConfig = {
  limit: 100,
  windowMs: 60 * 1000, // 1分
};

// ====================
// ミドルウェアヘルパー
// ====================

/**
 * IPベースのレート制限を適用
 */
export function withRateLimit(
  request: NextRequest,
  prefix: string,
  config: RateLimitConfig
): NextResponse | null {
  const key = getRateLimitKey(request, prefix);
  const result = checkRateLimit(key, config);

  if (!result.allowed) {
    return rateLimitResponse(result.resetAt);
  }

  return null; // 制限に達していない
}

/**
 * セッショントークンベースのレート制限を適用
 */
export function withSessionRateLimit(
  sessionToken: string,
  prefix: string,
  config: RateLimitConfig
): NextResponse | null {
  const key = getSessionRateLimitKey(sessionToken, prefix);
  const result = checkRateLimit(key, config);

  if (!result.allowed) {
    return rateLimitResponse(result.resetAt);
  }

  return null; // 制限に達していない
}

/**
 * レート制限ヘッダーを追加
 */
export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  resetAt: number,
  limit: number
): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(limit));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
  return response;
}
