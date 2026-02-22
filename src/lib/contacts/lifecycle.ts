import { LifecycleStage } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/**
 * ライフサイクルステージの順序定義
 * 後ろのステージほど高い値（降格は行わない）
 */
const STAGE_ORDER: LifecycleStage[] = [
  "SUBSCRIBER",
  "LEAD",
  "MQL",
  "SQL",
  "OPPORTUNITY",
  "CUSTOMER",
  "EVANGELIST",
];

/**
 * ライフサイクルステージを安全に進める（降格は行わない）
 * 現在のステージが targetStage より低い場合のみ更新する
 */
export async function advanceLifecycleStage(
  contactId: string,
  targetStage: LifecycleStage
): Promise<void> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: { lifecycleStage: true },
  });

  if (!contact) return;

  const currentIndex = STAGE_ORDER.indexOf(contact.lifecycleStage);
  const targetIndex = STAGE_ORDER.indexOf(targetStage);

  if (targetIndex <= currentIndex) {
    // 現在のステージが同じかそれ以上 → 更新不要
    return;
  }

  await prisma.contact.update({
    where: { id: contactId },
    data: { lifecycleStage: targetStage },
  });
}
