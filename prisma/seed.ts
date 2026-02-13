import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demo Tenant',
      subdomain: 'demo',
      plan: 'STARTER',
      settings: { timezone: 'Asia/Tokyo', language: 'ja' },
    },
  });
  console.log(`✅ Tenant: ${tenant.name}`);

  // 2. User
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@demo.local',
      name: 'Admin',
      role: 'ADMIN',
      clerkUserId: 'clerk_test_001',
    },
  });
  console.log(`✅ User: ${user.email}`);

  // 3. Contacts
  const contact1 = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      email: 'customer1@example.com',
      name: 'Taro Yamada',
      score: 100,
    },
  });
  console.log(`✅ Contact 1: ${contact1.name}`);

  const contact2 = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      email: 'customer2@example.com',
      name: 'Hanako Suzuki',
      score: 50,
    },
  });
  console.log(`✅ Contact 2: ${contact2.name}`);

  // 4. Tags
  await prisma.tag.create({
    data: { tenantId: tenant.id, name: 'VIP', color: '#FF0000' },
  });
  await prisma.tag.create({
    data: { tenantId: tenant.id, name: 'Trial', color: '#00FF00' },
  });
  console.log(`✅ Tags: 2`);

  // 5. Segment
  await prisma.segment.create({
    data: {
      tenantId: tenant.id,
      name: 'High-Value Customers',
      description: 'Score > 100',
    },
  });
  console.log(`✅ Segment: 1`);

  // 6. Campaign
  await prisma.campaign.create({
    data: {
      tenantId: tenant.id,
      name: 'Welcome Campaign',
      type: 'EMAIL_STEP',
      status: 'DRAFT',
    },
  });
  console.log(`✅ Campaign: 1`);

  // 7. Funnel
  await prisma.funnel.create({
    data: {
      tenantId: tenant.id,
      name: 'Sales Funnel',
      status: 'PUBLISHED',
    },
  });
  console.log(`✅ Funnel: 1`);

  // 8. Product
  await prisma.product.create({
    data: {
      tenantId: tenant.id,
      name: 'Digital Course',
      price: 9900,
      currency: 'JPY',
    },
  });
  console.log(`✅ Product: 1`);

  // 9. Course
  await prisma.course.create({
    data: {
      tenantId: tenant.id,
      name: 'Marketing Basics',
    },
  });
  console.log(`✅ Course: 1`);

  // 10. Event
  await prisma.event.create({
    data: {
      tenantId: tenant.id,
      name: 'Webinar: AI Marketing',
      type: 'WEBINAR',
      status: 'SCHEDULED',
      startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    },
  });
  console.log(`✅ Event: 1`);

  console.log('\n✨ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
