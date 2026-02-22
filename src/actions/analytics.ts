'use server';

import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/tenant';
import { subDays, startOfDay, eachDayOfInterval, format } from 'date-fns';

type DateRange = '7d' | '30d' | '90d';

function getDateRange(range: DateRange) {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const from = startOfDay(subDays(new Date(), days - 1));
  const to = new Date();
  return { from, to, days };
}

export async function getCampaignAnalytics(range: DateRange = '30d') {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const { from } = getDateRange(range);

  const messages = await prisma.messageHistory.findMany({
    where: {
      tenantId: user.tenantId,
      sentAt: { gte: from },
    },
    select: {
      channel: true,
      status: true,
      openedAt: true,
      clickedAt: true,
      sentAt: true,
    },
  });

  const total = messages.length;
  const opened = messages.filter((m) => m.openedAt).length;
  const clicked = messages.filter((m) => m.clickedAt).length;

  const emailMessages = messages.filter((m) => m.channel === 'EMAIL');
  const lineMessages = messages.filter((m) => m.channel === 'LINE');

  return {
    total,
    openRate: total > 0 ? (opened / total) * 100 : 0,
    clickRate: total > 0 ? (clicked / total) * 100 : 0,
    email: {
      total: emailMessages.length,
      openRate: emailMessages.length > 0
        ? (emailMessages.filter((m) => m.openedAt).length / emailMessages.length) * 100
        : 0,
    },
    line: {
      total: lineMessages.length,
      openRate: lineMessages.length > 0
        ? (lineMessages.filter((m) => m.openedAt).length / lineMessages.length) * 100
        : 0,
    },
  };
}

export async function getContactGrowthAnalytics(range: DateRange = '30d') {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const { from, days } = getDateRange(range);

  const contacts = await prisma.contact.findMany({
    where: {
      tenantId: user.tenantId,
      createdAt: { gte: from },
    },
    select: { createdAt: true, lifecycleStage: true },
  });

  const now = new Date();
  const interval = eachDayOfInterval({ start: from, end: now });
  const dailyGrowth = interval.map((date) => {
    const dateStr = format(date, 'MM/dd');
    const count = contacts.filter(
      (c) => format(c.createdAt, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    ).length;
    return { date: dateStr, count };
  });

  const lifecycleBreakdown = await prisma.contact.groupBy({
    by: ['lifecycleStage'],
    where: { tenantId: user.tenantId },
    _count: true,
  });

  const totalContacts = await prisma.contact.count({
    where: { tenantId: user.tenantId },
  });

  return { dailyGrowth, lifecycleBreakdown, totalContacts, newContacts: contacts.length };
}

export async function getRevenueAnalytics(range: DateRange = '30d') {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const { from } = getDateRange(range);

  const orders = await prisma.order.findMany({
    where: {
      tenantId: user.tenantId,
      createdAt: { gte: from },
      status: 'COMPLETED',
    },
    select: { amount: true, createdAt: true },
  });

  const now = new Date();
  const interval = eachDayOfInterval({ start: from, end: now });
  const dailyRevenue = interval.map((date) => {
    const dateStr = format(date, 'MM/dd');
    const revenue = orders
      .filter((o) => format(o.createdAt, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
      .reduce((sum, o) => sum + o.amount, 0);
    return { date: dateStr, revenue };
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
  const orderCount = orders.length;
  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  return { dailyRevenue, totalRevenue, orderCount, avgOrderValue };
}

export async function getFunnelAnalytics(funnelId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const funnels = await prisma.funnel.findMany({
    where: {
      tenantId: user.tenantId,
      ...(funnelId ? { id: funnelId } : {}),
    },
    include: {
      pages: {
        orderBy: { order: 'asc' },
        select: { id: true, name: true, order: true },
      },
    },
    take: 10,
  });

  return funnels;
}

export async function getEmailMetrics(range: DateRange = '30d') {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const { from, days } = getDateRange(range);

  const messages = await prisma.messageHistory.findMany({
    where: {
      tenantId: user.tenantId,
      channel: 'EMAIL',
      createdAt: { gte: from },
    },
    select: {
      status: true,
      openedAt: true,
      clickedAt: true,
      createdAt: true,
    },
  });

  const now = new Date();
  const interval = eachDayOfInterval({ start: from, end: now });

  const dailyMetrics = interval.map((date) => {
    const dayMessages = messages.filter(
      (m) => format(m.createdAt, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    const sent = dayMessages.length;
    const opened = dayMessages.filter((m) => m.openedAt).length;
    const clicked = dayMessages.filter((m) => m.clickedAt).length;

    return {
      date: format(date, 'MM/dd'),
      sent,
      openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
      clickRate: sent > 0 ? Math.round((clicked / sent) * 100) : 0,
    };
  });

  return { dailyMetrics };
}

export async function getDashboardSummary() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  const from30d = startOfDay(subDays(new Date(), 29));

  const [totalContacts, newContacts, totalRevenue, activeCampaigns] = await Promise.all([
    prisma.contact.count({ where: { tenantId: user.tenantId } }),
    prisma.contact.count({
      where: { tenantId: user.tenantId, createdAt: { gte: from30d } },
    }),
    prisma.order.aggregate({
      where: {
        tenantId: user.tenantId,
        status: 'COMPLETED',
        createdAt: { gte: from30d },
      },
      _sum: { amount: true },
    }),
    prisma.campaign.count({
      where: { tenantId: user.tenantId, status: 'ACTIVE' },
    }),
  ]);

  return {
    totalContacts,
    newContacts,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    activeCampaigns,
  };
}
