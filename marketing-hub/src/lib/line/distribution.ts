/**
 * LINE公式アカウント振り分けロジック
 *
 * Stub implementation - LINE account distribution not fully implemented
 */

interface DistributionResult {
  accountId: string;
  channelId: string;
  accessToken: string;
  channelSecret: string;
  projectId?: string;
}

/**
 * 次の振り分け先LINEアカウントを取得（プロジェクト単位）
 */
export async function getNextLineAccount(
  tenantId: string,
  projectId?: string
): Promise<DistributionResult | null> {
  return null;
}

/**
 * 振り分け先を登録
 */
export async function registerDistributionAccount(
  projectId: string,
  channelId: string,
  accessToken: string,
  channelSecret: string,
  weight?: number
): Promise<void> {
  // Stub
}

/**
 * 振り分け先を削除
 */
export async function removeDistributionAccount(
  projectId: string,
  channelId: string
): Promise<void> {
  // Stub
}

/**
 * 振り分け先の重みを更新
 */
export async function updateDistributionWeight(
  projectId: string,
  channelId: string,
  weight: number
): Promise<void> {
  // Stub
}
