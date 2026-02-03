/**
 * LINE公式アカウント振り分けロジック
 *
 * 新規友だち追加時に、複数のLINE公式アカウントに
 * ラウンドロビンまたは重み付けで振り分ける
 *
 * プロジェクト単位で振り分け設定を管理
 */

import { prisma } from "@/lib/db/prisma";

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
  // プロジェクトが指定されていない場合、デフォルトのTenant設定を使用
  if (!projectId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        lineChannelId: true,
        lineChannelSecret: true,
        lineAccessToken: true,
      },
    });

    if (!tenant?.lineChannelId || !tenant?.lineAccessToken || !tenant?.lineChannelSecret) {
      return null;
    }

    return {
      accountId: "",
      channelId: tenant.lineChannelId,
      accessToken: tenant.lineAccessToken,
      channelSecret: tenant.lineChannelSecret,
    };
  }

  // プロジェクトの振り分け設定を取得
  const setting = await prisma.lineDistributionSetting.findUnique({
    where: { projectId },
  });

  // 振り分けが無効の場合、プロジェクト内の最初のアカウントを使用
  if (!setting?.isEnabled) {
    const firstAccount = await prisma.lineAccount.findFirst({
      where: {
        projectId,
        isActive: true,
        isConnected: true,
      },
      orderBy: { order: "asc" },
    });

    if (!firstAccount) {
      return null;
    }

    return {
      accountId: firstAccount.id,
      channelId: firstAccount.channelId,
      accessToken: firstAccount.accessToken,
      channelSecret: firstAccount.channelSecret,
      projectId,
    };
  }

  // プロジェクト内のアクティブなLINEアカウント一覧を取得
  const accounts = await prisma.lineAccount.findMany({
    where: {
      projectId,
      isActive: true,
      isConnected: true,
    },
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { contacts: true },
      },
    },
  });

  if (accounts.length === 0) {
    return null;
  }

  // 振り分け方式に応じて選択
  let selectedAccount = null;

  switch (setting.distributionType) {
    case "ROUND_ROBIN":
      selectedAccount = await selectRoundRobin(
        projectId,
        accounts,
        setting.currentIndex,
        setting.maxListsPerRotation,
        setting.onLimitReached
      );
      break;

    case "WEIGHTED":
      selectedAccount = await selectWeighted(accounts, setting.onLimitReached);
      break;

    case "FILL_FIRST":
      selectedAccount = await selectFillFirst(accounts, setting.onLimitReached);
      break;

    default:
      selectedAccount = accounts[0];
  }

  if (!selectedAccount) {
    return null;
  }

  return {
    accountId: selectedAccount.id,
    channelId: selectedAccount.channelId,
    accessToken: selectedAccount.accessToken,
    channelSecret: selectedAccount.channelSecret,
    projectId,
  };
}

/**
 * ラウンドロビン方式で選択
 */
async function selectRoundRobin(
  projectId: string,
  accounts: Array<{
    id: string;
    channelId: string;
    accessToken: string;
    channelSecret: string;
    maxFriends: number | null;
    _count: { contacts: number };
  }>,
  currentIndex: number,
  maxListsPerRotation: number,
  onLimitReached: string
) {
  // 利用可能なアカウントをフィルタリング
  const availableAccounts = accounts.filter((account) => {
    if (account.maxFriends === null) return true;
    return account._count.contacts < account.maxFriends;
  });

  if (availableAccounts.length === 0) {
    if (onLimitReached === "STOP") {
      return null;
    }
    // すべて上限に達している場合、最初のアカウントを使用
    return accounts[0];
  }

  // 次のインデックスを計算
  const nextIndex = currentIndex % availableAccounts.length;
  const selectedAccount = availableAccounts[nextIndex];

  // インデックスを更新（プロジェクト単位）
  await prisma.lineDistributionSetting.update({
    where: { projectId },
    data: { currentIndex: nextIndex + 1 },
  });

  return selectedAccount;
}

/**
 * 重み付け方式で選択
 */
async function selectWeighted(
  accounts: Array<{
    id: string;
    channelId: string;
    accessToken: string;
    channelSecret: string;
    weight: number;
    maxFriends: number | null;
    _count: { contacts: number };
  }>,
  onLimitReached: string
) {
  // 利用可能なアカウントをフィルタリング
  const availableAccounts = accounts.filter((account) => {
    if (account.maxFriends === null) return true;
    return account._count.contacts < account.maxFriends;
  });

  if (availableAccounts.length === 0) {
    if (onLimitReached === "STOP") {
      return null;
    }
    return accounts[0];
  }

  // 重みの合計を計算
  const totalWeight = availableAccounts.reduce((sum, acc) => sum + acc.weight, 0);

  // ランダムに選択
  let random = Math.random() * totalWeight;

  for (const account of availableAccounts) {
    random -= account.weight;
    if (random <= 0) {
      return account;
    }
  }

  return availableAccounts[0];
}

/**
 * 順次充填方式で選択（1つのアカウントが上限に達するまで使用）
 */
async function selectFillFirst(
  accounts: Array<{
    id: string;
    channelId: string;
    accessToken: string;
    channelSecret: string;
    maxFriends: number | null;
    _count: { contacts: number };
  }>,
  onLimitReached: string
) {
  // 上限に達していない最初のアカウントを選択
  for (const account of accounts) {
    if (account.maxFriends === null || account._count.contacts < account.maxFriends) {
      return account;
    }
  }

  if (onLimitReached === "STOP") {
    return null;
  }

  return accounts[0];
}

/**
 * 新規コンタクト作成時に振り分けを適用（プロジェクト単位）
 */
export async function assignLineAccountToContact(
  tenantId: string,
  contactId: string,
  projectId?: string
): Promise<boolean> {
  const account = await getNextLineAccount(tenantId, projectId);

  if (!account || !account.accountId) {
    return false;
  }

  await prisma.contact.update({
    where: { id: contactId },
    data: { lineAccountId: account.accountId },
  });

  // アカウントのcurrentFriendsを更新
  await prisma.lineAccount.update({
    where: { id: account.accountId },
    data: { currentFriends: { increment: 1 } },
  });

  // プロジェクトのtotalFriendsを更新
  if (account.projectId) {
    await prisma.lineProject.update({
      where: { id: account.projectId },
      data: { totalFriends: { increment: 1 } },
    });
  }

  return true;
}

/**
 * 振り分け統計を取得（プロジェクト単位またはテナント全体）
 */
export async function getDistributionStats(tenantId: string, projectId?: string) {
  const whereClause: { tenantId?: string; projectId?: string } = {};
  if (projectId) {
    whereClause.projectId = projectId;
  } else {
    whereClause.tenantId = tenantId;
  }

  const accounts = await prisma.lineAccount.findMany({
    where: whereClause,
    orderBy: { order: "asc" },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      _count: {
        select: { contacts: true },
      },
    },
  });

  const totalContacts = accounts.reduce(
    (sum, acc) => sum + acc._count.contacts,
    0
  );

  return {
    accounts: accounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      projectId: acc.projectId,
      projectName: acc.project?.name,
      projectColor: acc.project?.color,
      contacts: acc._count.contacts,
      maxFriends: acc.maxFriends,
      percentage:
        totalContacts > 0
          ? ((acc._count.contacts / totalContacts) * 100).toFixed(1)
          : "0",
      isAtLimit:
        acc.maxFriends !== null && acc._count.contacts >= acc.maxFriends,
    })),
    totalContacts,
    totalAccounts: accounts.length,
    activeAccounts: accounts.filter((acc) => acc.isActive).length,
  };
}
