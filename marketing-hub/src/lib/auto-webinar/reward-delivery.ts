// src/lib/auto-webinar/reward-delivery.ts
// 特典配信処理（サーバーサイド専用）

import { prisma } from '@/lib/db/prisma'
import { sendEmail } from '@/lib/email/resend-client'
import { pushTextMessage } from '@/lib/line/client'
import type { RewardDefinition, DeliveryResult } from './rewards'

/**
 * 特典配布処理（サーバーサイド）
 */
export async function deliverRewardServer(
  reward: RewardDefinition,
  contactId: string | null,
  inputData?: Record<string, string>
): Promise<DeliveryResult> {
  // コンタクト情報を取得
  let contact = null
  if (contactId) {
    contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { id: true, email: true, name: true, lineUserId: true, tenantId: true }
    })
  }

  switch (reward.deliveryType) {
    case 'DOWNLOAD':
      // ダウンロードURLを返す
      return {
        success: true,
        data: { downloadUrl: reward.popupDescription || '' }
      }

    case 'COUPON':
      // クーポンコードを生成または取得
      const couponCode = generateCouponCode(reward.id)
      return {
        success: true,
        message: 'クーポンコードを取得しました',
        data: { couponCode }
      }

    case 'EMAIL':
      // メール送信
      if (!contact?.email) {
        // inputDataからメールを取得
        const email = inputData?.email
        if (!email) {
          return { success: false, message: 'メールアドレスが見つかりません' }
        }
        try {
          await sendRewardEmail(email, '', reward)
          return { success: true, message: 'メールを送信しました' }
        } catch (error) {
          console.error('Reward email error:', error)
          return { success: false, message: 'メール送信に失敗しました' }
        }
      }
      try {
        await sendRewardEmail(contact.email, contact.name || '', reward)
        return { success: true, message: 'メールを送信しました' }
      } catch (error) {
        console.error('Reward email error:', error)
        return { success: false, message: 'メール送信に失敗しました' }
      }

    case 'LINE':
      // LINE送信
      if (!contact?.lineUserId) {
        return { success: false, message: 'LINE連携がされていません' }
      }
      try {
        await sendRewardLine(contact.lineUserId, reward)
        return { success: true, message: 'LINEで送信しました' }
      } catch (error) {
        console.error('Reward LINE error:', error)
        return { success: false, message: 'LINE送信に失敗しました' }
      }

    case 'TAG_ADD':
      // タグ付与
      if (!contact) {
        return { success: false, message: 'コンタクト情報が見つかりません' }
      }
      try {
        await addTagToContact(contact.id, contact.tenantId, reward)
        return { success: true, message: 'タグを付与しました' }
      } catch (error) {
        console.error('Tag add error:', error)
        return { success: false, message: 'タグ付与に失敗しました' }
      }

    case 'UNLOCK_CONTENT':
      // コンテンツ解放
      if (!contact) {
        return { success: false, message: 'コンタクト情報が見つかりません' }
      }
      try {
        await unlockContent(contact.id, reward)
        return { success: true, message: 'コンテンツが解放されました' }
      } catch (error) {
        console.error('Unlock content error:', error)
        return { success: false, message: 'コンテンツ解放に失敗しました' }
      }

    default:
      return {
        success: false,
        message: '配布方法が不明です'
      }
  }
}

/**
 * クーポンコード生成
 */
function generateCouponCode(rewardId: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const randomPart = Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('')
  return `WEB-${randomPart}`
}

/**
 * 特典メール送信
 */
async function sendRewardEmail(
  email: string,
  name: string,
  reward: RewardDefinition
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0;">${reward.popupTitle || '特典をお届けします'}</h1>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
    <p>${name || ''}様</p>
    <p>ウェビナーをご視聴いただきありがとうございます。</p>
    <p>${reward.popupDescription || '特典をお届けします。'}</p>
  </div>
</body>
</html>
  `

  await sendEmail({
    to: email,
    subject: reward.popupTitle || `【特典】${reward.name}`,
    html,
  })
}

/**
 * 特典LINE送信
 */
async function sendRewardLine(
  lineUserId: string,
  reward: RewardDefinition
): Promise<void> {
  const message = `🎁 ${reward.popupTitle || '特典をお届けします'}\n\n${reward.popupDescription || ''}\n\n${reward.name}`
  await pushTextMessage(lineUserId, message)
}

/**
 * タグ付与
 */
async function addTagToContact(
  contactId: string,
  tenantId: string,
  reward: RewardDefinition
): Promise<void> {
  const tagName = reward.popupDescription || `特典: ${reward.name}`

  let tag = await prisma.tag.findFirst({
    where: { tenantId, name: tagName }
  })

  if (!tag) {
    tag = await prisma.tag.create({
      data: {
        tenantId,
        name: tagName,
        color: '#667eea',
      }
    })
  }

  const existingTagging = await prisma.contactTag.findFirst({
    where: { contactId, tagId: tag.id }
  })

  if (!existingTagging) {
    await prisma.contactTag.create({
      data: { contactId, tagId: tag.id }
    })
  }
}

/**
 * コンテンツ解放
 */
async function unlockContent(
  contactId: string,
  reward: RewardDefinition
): Promise<void> {
  const contentRef = reward.popupDescription || ''
  const [contentType, contentId] = contentRef.split(':')

  if (contentType === 'course' && contentId) {
    const existingEnrollment = await prisma.courseEnrollment.findFirst({
      where: { courseId: contentId, contactId }
    })

    if (!existingEnrollment) {
      await prisma.courseEnrollment.create({
        data: {
          courseId: contentId,
          contactId,
        }
      })
    }
  }
}
