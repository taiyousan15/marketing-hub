import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const pool = new Pool({ connectionString: databaseUrl })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // 既存のテナントを取得（なければ作成）
  let tenant = await prisma.tenant.findFirst()

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        subdomain: 'test',
      },
    })
    console.log('Created tenant:', tenant.id)
  } else {
    console.log('Using existing tenant:', tenant.id)
  }

  // テスト用ライブ配信イベントを作成
  const event = await prisma.event.create({
    data: {
      tenantId: tenant.id,
      name: 'テスト用ライブ配信',
      description: 'LiveKit接続テスト用のライブ配信イベントです',
      type: 'LIVESTREAM',
      startAt: new Date(),
      endAt: new Date(Date.now() + 3600000), // 1時間後
      isOnline: true,
      status: 'SCHEDULED',
    },
  })
  console.log('Created event:', event.id)

  // LiveStreamレコードを作成
  const livestream = await prisma.liveStream.create({
    data: {
      tenantId: tenant.id,
      eventId: event.id,
      title: 'テスト用ライブ配信',
      description: 'LiveKit接続テスト',
      roomName: `event-${event.id}`,
      recordingEnabled: true,
      chatEnabled: true,
      status: 'SCHEDULED',
    },
  })
  console.log('Created livestream:', livestream.id)
  console.log('Room name:', livestream.roomName)
  console.log('\n✅ Test event created!')
  console.log(`\nOpen: http://localhost:3000/livestream/${event.id}/studio`)
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
