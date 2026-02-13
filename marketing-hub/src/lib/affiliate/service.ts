/**
 * アフィリエイトサービス
 *
 * Stub implementation - affiliate feature not fully implemented
 */

// Type enums from Prisma schema
type AffiliateConversionType = "LINE_OPTIN" | "EMAIL_OPTIN" | "FRONTEND_PURCHASE" | "BACKEND_PURCHASE";
type AffiliateConversionStatus = "PENDING" | "APPROVED" | "REJECTED";
type AffiliateCommissionTypeName = string;
type AffiliateCommissionStatus = "PENDING" | "APPROVED" | "CANCELLED" | "PAID";
type ProductCategory = string;

// ==================== クリック追跡 ====================

interface RecordClickInput {
  affiliateLinkCode: string;
  ipAddress?: string;
  userAgent?: string;
  referer?: string;
  fingerprint?: string;
}

interface RecordClickResult {
  success: boolean;
  clickId?: string;
  targetUrl?: string;
  error?: string;
}

/**
 * アフィリエイトリンクのクリックを記録
 */
export async function recordAffiliateClick(
  input: RecordClickInput
): Promise<RecordClickResult> {
  return {
    success: false,
    error: "Affiliate click recording not implemented",
  };
}

// ==================== コンバージョン記録 ====================

interface RecordConversionInput {
  tenantId: string;
  clickId?: string;
  partnerCode?: string;
  type: AffiliateConversionType;
  contactId?: string;
  orderId?: string;
  amount?: number;
}

interface RecordConversionResult {
  success: boolean;
  conversionId?: string;
  commissions?: {
    partnerId: string;
    amount: number;
    tier: number;
  }[];
  error?: string;
}

/**
 * コンバージョン（成果）を記録し、報酬を計算
 */
export async function recordConversion(
  input: RecordConversionInput
): Promise<RecordConversionResult> {
  return {
    success: false,
    error: "Conversion recording not implemented",
  };
}

// ==================== LINE登録 ====================

interface ProcessLineOptinInput {
  tenantId: string;
  contactId: string;
  lineUserId: string;
  clickId?: string;
  partnerCode?: string;
}

/**
 * LINE登録コンバージョンを処理
 */
export async function processLineOptin(
  input: ProcessLineOptinInput
): Promise<RecordConversionResult> {
  return {
    success: false,
    error: "LINE optin processing not implemented",
  };
}

// ==================== 購入 ====================

interface ProcessPurchaseInput {
  tenantId: string;
  orderId: string;
  contactId: string;
  productId: string;
  amount: number;
}

/**
 * 購入コンバージョンを処理
 */
export async function processPurchase(
  input: ProcessPurchaseInput
): Promise<RecordConversionResult> {
  return {
    success: false,
    error: "Purchase processing not implemented",
  };
}

// ==================== ユーティリティ ====================

function detectDeviceType(userAgent?: string): string {
  return "unknown";
}
