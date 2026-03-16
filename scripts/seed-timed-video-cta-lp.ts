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

async function main() {
  // 既存テナントを1件取得
  const tenant = await prisma.tenant.findFirst()
  if (!tenant) {
    console.error('テナントが見つかりません。先にテナントを作成してください。')
    process.exit(1)
  }
  console.log(`テナント: ${tenant.name} (${tenant.id})`)

  // テスト用ファネル作成（PUBLISHED状態）
  const funnel = await prisma.funnel.create({
    data: {
      tenantId: tenant.id,
      name: '【テスト】時限CTA付き動画LP',
      type: 'SALES',
      status: 'PUBLISHED',
      settings: {},
    },
  })
  console.log(`ファネル作成: ${funnel.id}`)

  // LP コンテンツ（timed-video-cta コンポーネント入り）
  const content = [
    {
      id: 'hero-section',
      type: 'hero',
      props: {
        title: '時限表示CTA付き動画デモ',
        subtitle: '動画の下に、ページ表示から10秒後にCTAボタンが表示されます',
        alignment: 'center',
        bgColor: '#1a1a2e',
        textColor: '#ffffff',
      },
    },
    {
      id: 'timed-video-demo',
      type: 'timed-video-cta',
      props: {
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'デモ動画 — 10秒後にCTAが表示されます',
        ctaText: '今すぐ無料で始める',
        ctaUrl: 'https://example.com/signup',
        ctaSubText: '※ 30日間無料体験・クレジットカード不要',
        delaySeconds: 10,
        triggerType: 'elapsed',
        hideAtSeconds: 0,
        ctaColor: '#dc2626',
        ctaTextColor: '#ffffff',
        animation: 'slideUp',
        aspectRatio: '16:9',
      },
    },
    {
      id: 'timed-video-demo-2',
      type: 'timed-video-cta',
      props: {
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: '5秒後に表示＆20秒で消えるCTA（フェードイン）',
        ctaText: '期間限定オファーを見る',
        ctaUrl: 'https://example.com/offer',
        ctaSubText: '残りわずか！',
        delaySeconds: 5,
        triggerType: 'elapsed',
        hideAtSeconds: 20,
        ctaColor: '#f59e0b',
        ctaTextColor: '#000000',
        animation: 'fadeIn',
        aspectRatio: '16:9',
      },
    },
    {
      id: 'timed-video-demo-3',
      type: 'timed-video-cta',
      props: {
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: '15秒後にズームイン表示されるCTA',
        ctaText: '詳細を確認する',
        ctaUrl: 'https://example.com/details',
        ctaSubText: '',
        delaySeconds: 15,
        triggerType: 'elapsed',
        hideAtSeconds: 0,
        ctaColor: '#7c3aed',
        ctaTextColor: '#ffffff',
        animation: 'zoom',
        aspectRatio: '16:9',
      },
    },
  ]

  // ファネルページ作成（DBスキーマが未マイグレーションの可能性があるためraw SQL使用）
  const pageId = `test-timed-cta-${Date.now()}`
  const slug = 'timed-cta-demo'
  await prisma.$executeRaw`
    INSERT INTO "FunnelPage" (id, "funnelId", name, slug, content, "seoTitle", "seoDescription", "order", "createdAt", "updatedAt")
    VALUES (
      ${pageId},
      ${funnel.id},
      '時限CTA付き動画デモ',
      ${slug},
      ${JSON.stringify(content)}::jsonb,
      '時限表示CTA付き動画デモ',
      'ページ表示後に時間経過でCTAボタンが表示されるデモLP',
      0,
      NOW(),
      NOW()
    )
  `
  console.log(`ページ作成: ${pageId} (slug: ${slug})`)

  console.log('\n========================================')
  console.log('テストLP作成完了！')
  console.log(`URL: /p/${funnel.id}/${slug}`)
  console.log('========================================')
  console.log('\ndev サーバーを起動して上記URLにアクセスしてください:')
  console.log('  npm run dev')
  console.log(`  → http://localhost:3000/p/${funnel.id}/${slug}`)
  console.log('\n動作確認:')
  console.log('  - 動画1: ページ表示から10秒後にスライドアップでCTA表示（常時表示）')
  console.log('  - 動画2: 5秒後にフェードインでCTA表示 → 20秒後に非表示')
  console.log('  - 動画3: 15秒後にズームインでCTA表示（常時表示）')
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
