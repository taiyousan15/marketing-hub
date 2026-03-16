import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config({ path: path.join(__dirname, '../.env') })

import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  process.exit(1)
}

const pool = new Pool({ connectionString: databaseUrl, max: 2 })

const LINE_URL = 'https://utage-system.com/page/gDhlVgHf6Krs'
const IMG_BASE = '/images/lp/kindle-ai'

async function main() {
  const content = [
    // ===== ヘッダーセクション（常に表示） =====

    // 1. LP動画プレーヤー（30秒でCTA表示、60秒でボディ表示）
    {
      id: 'header-video-player',
      type: 'lp-video-player',
      props: {
        videoUrl: '/videos/lp/kindle-ai/seminar-intro.mp4',
        poster: `${IMG_BASE}/video-thumbnail.jpg`,
        backgroundColor: '#0a0a1a',
      },
    },

    // 2. ヘッダー画像（ヘッドコピー＆ファーストビュー）
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

    // ===== CTAセクション（動画30秒後に表示） =====

    // 3. CTA① 画像ボタン
    {
      id: 'body-cta-1-image',
      type: 'cta-image',
      props: {
        src: `${IMG_BASE}/lp-cta-button-01-apply-now.jpg`,
        alt: '今すぐ無料セミナーに申し込む',
        href: LINE_URL,
        width: '100%',
        backgroundColor: '#0a0a1a',
        revealGroup: 'cta',
      },
    },

    // ===== ボディセクション（動画60秒後に表示） =====

    // 4. 問題提起セクション画像
    {
      id: 'body-section-02-problem',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-02-problem.jpg`,
        alt: '正直に聞かせてください。今のあなたは、こんな状態ではないですか？',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 60,
      },
    },

    // 5. 危機感セクション画像
    {
      id: 'body-section-03-fear',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-03-fear.jpg`,
        alt: 'そのまま1年が過ぎたら、あなたはどこにいますか？',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 60,
      },
    },

    // 6. 解決策セクション画像
    {
      id: 'body-section-04-solution',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-04-solution.jpg`,
        alt: 'あなたがやることは、たったの2つ',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 60,
      },
    },

    // 7. Kindle報酬体系セクション画像
    {
      id: 'body-section-05-kindle',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-05-kindle-reward.jpg`,
        alt: 'Kindleの報酬体系が2種類あることをご存知でしたか？',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 60,
      },
    },

    // 8. カラクリ＋資産セクション画像
    {
      id: 'body-section-06-mechanism',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-06-mechanism-assets.jpg`,
        alt: 'なぜ無料で提供できるのか——カラクリを正直に話します',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 60,
      },
    },

    // 9. CTA② 画像ボタン
    {
      id: 'body-cta-2-image',
      type: 'cta-image',
      props: {
        src: `${IMG_BASE}/lp-cta-button-02-details.jpg`,
        alt: '無料セミナーで仕組みの全詳細を聞く',
        href: LINE_URL,
        width: '100%',
        backgroundColor: '#0a0a1a',
        revealAfterSeconds: 60,
      },
    },

    // 10. 自動化＋セミナー内容セクション画像
    {
      id: 'body-section-07-automation',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-07-automation-seminar.jpg`,
        alt: '24時間、あなたの代わりに働き続ける仕組み',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 60,
      },
    },

    // 11. お客様の声セクション画像
    {
      id: 'body-section-08-testimonials',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-08-testimonials.jpg`,
        alt: '実績・お客様の声',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 60,
      },
    },

    // 12. FAQセクション画像
    {
      id: 'body-section-09-faq',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-09-faq.jpg`,
        alt: 'よくある質問',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 60,
      },
    },

    // 13. 受け取れることセクション画像
    {
      id: 'body-section-10-value',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-10-value.jpg`,
        alt: 'このセミナーで受け取れること',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 60,
      },
    },

    // 14. ストーリー＋メッセージセクション画像
    {
      id: 'body-section-11-story',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-11-story-message.jpg`,
        alt: '私は今、48歳です。8年ぶりに表舞台に立ちます。',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 60,
      },
    },

    // 15. 最終CTA＋対象者セクション画像
    {
      id: 'body-section-12-final',
      type: 'section-image',
      props: {
        src: `${IMG_BASE}/lp-body-12-final-cta.jpg`,
        alt: '75歳の方が、ゼロから使いこなしています',
        width: '100%',
        backgroundColor: '#ffffff',
        revealAfterSeconds: 60,
      },
    },

    // 16. 最終CTA 画像ボタン
    {
      id: 'body-final-cta-image',
      type: 'cta-image',
      props: {
        src: `${IMG_BASE}/lp-cta-button-01-apply-now.jpg`,
        alt: '今すぐ無料セミナーに申し込む',
        href: LINE_URL,
        width: '100%',
        backgroundColor: '#0a0a1a',
        revealAfterSeconds: 60,
      },
    },

    // 17. 参加費テキスト
    {
      id: 'body-final-note',
      type: 'text',
      props: {
        text: '<div style="text-align:center;padding:16px 0;"><span style="font-size:1.1em;color:#9ca3af">参加費：<strong style="color:#22c55e">完全無料</strong> ／ 定員制・満席次第受付終了</span></div>',
        backgroundColor: '#0a0a1a',
        textColor: '#9ca3af',
        revealAfterSeconds: 60,
      },
    },

    // 18. フッター
    {
      id: 'body-footer',
      type: 'footer',
      props: {
        text: '\u00a9 2026 四次元AIポケットシステム All rights reserved.',
        backgroundColor: '#000000',
        textColor: '#6b7280',
        revealAfterSeconds: 60,
      },
    },
  ]

  // 既存のページを更新（slug: kindle-ai-seminar-v2）
  const result = await pool.query(
    `UPDATE "FunnelPage" SET content = $1::jsonb, "updatedAt" = NOW() WHERE slug = $2 RETURNING id`,
    [JSON.stringify(content), 'kindle-ai-seminar-v2']
  )

  if (result.rowCount === 0) {
    console.error('ページが見つかりません（slug: kindle-ai-seminar-v2）')
    process.exit(1)
  }

  console.log(`ページ更新完了: ${result.rows[0].id}`)
  console.log('- 動画: lp-video-player（サムネイル付き）')
  console.log('- CTA: 30秒後に表示（revealGroup: cta）')
  console.log('- ボディ: 60秒後に表示（revealAfterSeconds: 60）')
  console.log(`- 全CTA URL: ${LINE_URL}`)
}

main()
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })
