import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local first, then .env
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config({ path: path.join(__dirname, '../.env') })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import fs from 'fs'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 2,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  try {
    const result = await prisma.$queryRaw<Array<{now: Date}>>`SELECT NOW() as now`
    console.log('Connected to DB:', result[0].now)
  } catch (err) {
    console.error('Connection failed:', err instanceof Error ? err.message : err)
    return
  }

  const sqlPath = path.join(__dirname, '../prisma/migrations/apply-utm-meta-ads.sql')
  const sql = fs.readFileSync(sqlPath, 'utf-8')

  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  let ok = 0
  let skipped = 0
  let failed = 0

  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement)
      console.log('✓', statement.slice(0, 70).replace(/\n/g, ' '))
      ok++
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (
        msg.includes('already exists') ||
        msg.includes('duplicate column') ||
        msg.includes('multiple primary keys')
      ) {
        console.log('~ (already exists):', statement.slice(0, 60).replace(/\n/g, ' '))
        skipped++
      } else {
        console.error('✗', statement.slice(0, 80).replace(/\n/g, ' '))
        console.error('  Error:', msg.slice(0, 150))
        failed++
      }
    }
  }

  console.log(`\nDone: ${ok} applied, ${skipped} skipped, ${failed} failed`)
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
