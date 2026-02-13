/**
 * LINE公式アカウント振り分けロジック - Simplified stub
 *
 * 新規友だち追加時に、複数のLINE公式アカウントに
 * ラウンドロビンまたは重み付けで振り分ける
 *
 * プロジェクト単位で振り分け設定を管理
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
  // LINE distribution is simplified stub - returns null
  return null;
}

/**
 * 新規コンタクト作成時に振り分けを適用（プロジェクト単位）
 */
export async function assignLineAccountToContact(
  tenantId: string,
  contactId: string,
  projectId?: string
): Promise<boolean> {
  // Assignment is simplified stub
  return false;
}

/**
 * 振り分け統計を取得（プロジェクト単位またはテナント全体）
 */
export async function getDistributionStats(tenantId: string, projectId?: string) {
  return {
    accounts: [],
    totalContacts: 0,
    totalAccounts: 0,
    activeAccounts: 0,
  };
}
