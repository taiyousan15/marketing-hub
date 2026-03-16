import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config({ path: path.join(__dirname, '../.env') })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

const pool = new Pool({ connectionString: databaseUrl, max: 2 })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const LINE_URL = 'https://lin.ee/placeholder'
const IMG_BASE = '/images/lp/kindle-ai'

async function main() {
  const tenant = await prisma.tenant.findFirst()
  if (!tenant) {
    console.error('テナントが見つかりません。')
    process.exit(1)
  }
  console.log(`テナント: ${tenant.name} (${tenant.id})`)

  const funnel = await prisma.funnel.create({
    data: {
      tenantId: tenant.id,
      name: 'Kindle×AI 四次元AIポケットシステム セミナーLP v2',
      type: 'SALES',
      status: 'PUBLISHED',
      settings: {},
    },
  })
  console.log(`ファネル作成: ${funnel.id}`)

  const content = [
    // ===== ヘッダーセクション（常に表示） =====

    // 1. インタラクティブ動画（2分岐 → 両方LINE）
    {
      id: 'header-interactive-video',
      type: 'interactive-video',
      props: {
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: '',
        choicePosition: 'bottom',
        choiceStyle: 'button',
        choices: `セミナーに今すぐ申し込む|${LINE_URL}|0\n詳しく知りたい方はこちら|${LINE_URL}|0`,
        backgroundColor: '#0a0a1a',
        textColor: '#ffffff',
        buttonColor: '#22c55e',
        buttonTextColor: '#ffffff',
      },
    },

    // 2. 時限CTA（10秒後にLINE誘導ボタン表示）
    {
      id: 'header-timed-cta',
      type: 'timed-video-cta',
      props: {
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: '',
        ctaText: '▶ 今すぐ無料セミナーに申し込む',
        ctaUrl: LINE_URL,
        ctaSubText: '※ 参加費無料・定員制・満席次第受付終了',
        delaySeconds: '10',
        triggerType: 'elapsed',
        hideAtSeconds: '0',
        ctaColor: '#22c55e',
        ctaTextColor: '#ffffff',
        animation: 'slideUp',
        backgroundColor: '#0a0a1a',
        textColor: '#ffffff',
      },
    },

    // 3. ヘッダー画像（ヘッドコピー＆ファーストビュー）
    {
      id: 'header-image',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-header-kindle-ai-seminar.jpg`,
        alt: '【警告】2026年、AI格差時代の幕が開きました',
        width: '100%',
        backgroundColor: '#0a0a1a',
      },
    },

    // ===== ボディセクション（15秒後に表示） =====

    // 4. CTA① 画像ボタン
    {
      id: 'body-cta-1-image',
      type: 'cta-image',
      props: {
        src: `${IMG_BASE}/lp-cta-button-01-apply-now.jpg`,
        alt: '今すぐ無料セミナーに申し込む',
        href: LINE_URL,
        width: '100%',
        backgroundColor: '#0a0a1a',
        revealAfterSeconds: 15,
      },
    },

    // 5. 問題提起セクション画像
    {
      id: 'body-section-02-problem',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-02-problem.jpg`,
        alt: '正直に聞かせてください。今のあなたは、こんな状態ではないですか？',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 15,
      },
    },

    // 6. 危機感セクション画像
    {
      id: 'body-section-03-fear',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-03-fear.jpg`,
        alt: 'そのまま1年が過ぎたら、あなたはどこにいますか？',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 15,
      },
    },

    // 7. 解決策セクション画像
    {
      id: 'body-section-04-solution',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-04-solution.jpg`,
        alt: 'あなたがやることは、たったの2つ',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 15,
      },
    },

    // 8. Kindle報酬体系セクション画像
    {
      id: 'body-section-05-kindle',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-05-kindle-reward.jpg`,
        alt: 'Kindleの報酬体系が2種類あることをご存知でしたか？',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 15,
      },
    },

    // 9. カラクリ＋資産セクション画像
    {
      id: 'body-section-06-mechanism',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-06-mechanism-assets.jpg`,
        alt: 'なぜ無料で提供できるのか——カラクリを正直に話します',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 15,
      },
    },

    // 10. CTA② 画像ボタン
    {
      id: 'body-cta-2-image',
      type: 'cta-image',
      props: {
        src: `${IMG_BASE}/lp-cta-button-02-details.jpg`,
        alt: '無料セミナーで仕組みの全詳細を聞く',
        href: LINE_URL,
        width: '100%',
        backgroundColor: '#0a0a1a',
        revealAfterSeconds: 15,
      },
    },

    // 11. 自動化＋セミナー内容セクション画像
    {
      id: 'body-section-07-automation',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-07-automation-seminar.jpg`,
        alt: '24時間、あなたの代わりに働き続ける仕組み',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 15,
      },
    },

    // 12. お客様の声セクション画像
    {
      id: 'body-section-08-testimonials',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-08-testimonials.jpg`,
        alt: '実績・お客様の声',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 15,
      },
    },

    // 13. FAQセクション画像
    {
      id: 'body-section-09-faq',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-09-faq.jpg`,
        alt: 'よくある質問',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 15,
      },
    },

    // 14. 受け取れることセクション画像
    {
      id: 'body-section-10-value',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-10-value.jpg`,
        alt: 'このセミナーで受け取れること',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 15,
      },
    },

    // 15. ストーリー＋メッセージセクション画像
    {
      id: 'body-section-11-story',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-11-story-message.jpg`,
        alt: '私は今、48歳です。8年ぶりに表舞台に立ちます。',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 15,
      },
    },

    // 16. 最終CTA＋対象者セクション画像
    {
      id: 'body-section-12-final',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-12-final-cta.jpg`,
        alt: '75歳の方が、ゼロから使いこなしています',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 15,
      },
    },

    // 17. 最終CTA 画像ボタン
    {
      id: 'body-final-cta-image',
      type: 'cta-image',
      props: {
        src: `${IMG_BASE}/lp-cta-button-01-apply-now.jpg`,
        alt: '今すぐ無料セミナーに申し込む',
        href: LINE_URL,
        width: '100%',
        backgroundColor: '#0a0a1a',
        revealAfterSeconds: 15,
      },
    },

    // 18. 参加費テキスト
    {
      id: 'body-final-note',
      type: 'text',
      props: {
        text: '<div style="text-align:center;padding:16px 0;"><span style="font-size:1.1em;color:#9ca3af">参加費：<strong style="color:#22c55e">完全無料</strong> ／ 定員制・満席次第受付終了</span></div>',
        backgroundColor: '#0a0a1a',
        textColor: '#9ca3af',
        revealAfterSeconds: 15,
      },
    },

    // 19. フッター
    {
      id: 'body-footer',
      type: 'footer',
      props: {
        text: '\u00a9 2026 四次元AIポケットシステム All rights reserved.',
        backgroundColor: '#000000',
        textColor: '#6b7280',
        revealAfterSeconds: 15,
      },
    },
  ]

  const pageId = `kindle-ai-lp-v2-${Date.now()}`
  const slug = 'kindle-ai-seminar-v2'
  await prisma.$executeRaw`
    INSERT INTO "FunnelPage" (id, "funnelId", name, slug, content, "seoTitle", "seoDescription", "order", "createdAt", "updatedAt")
    VALUES (
      ${pageId},
      ${funnel.id},
      'Kindle×AI 四次元AIポケットシステム セミナーLP v2（画像版）',
      ${slug},
      ${JSON.stringify(content)}::jsonb,
      'Kindle報酬を全額あなたへ届ける仕組み｜四次元AIポケットシステム無料セミナー',
      'スキルや知識ゼロ、自宅でもできるKindle出版の全く新しい仕組み。Kindle報酬は全額あなたへ。96人のAIチームが24時間働く四次元AIポケットシステムを無料セミナーで初公開。',
      0,
      NOW(),
      NOW()
    )
  `
  console.log(`ページ作成: ${pageId} (slug: ${slug})`)

  // FunnelStep を作成
  await prisma.funnelStep.create({
    data: {
      funnelId: funnel.id,
      name: 'メインLP',
      type: 'LANDING',
      order: 0,
      pageId,
    },
  })
  console.log('ステップ作成完了')

  console.log('\n========================================')
  console.log('Kindle×AI セミナーLP v2 作成完了！')
  console.log(`URL: /p/${funnel.id}/${slug}`)
  console.log('========================================')
}

main()
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
