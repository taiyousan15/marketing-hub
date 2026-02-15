import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import { FunnelStepType } from "@prisma/client";

/**
 * ファネル一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const funnels = await prisma.funnel.findMany({
      where: {
        ...(type ? { type: type as any } : {}),
        ...(status ? { status: status as any } : {}),
      },
      include: {
        pages: {
          select: { id: true, name: true, slug: true, order: true },
          orderBy: { order: "asc" },
        },
        steps: {
          select: { id: true, name: true, type: true, order: true },
          orderBy: { order: "asc" },
        },
        _count: {
          select: { pages: true, steps: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ funnels });
  } catch (error) {
    console.error("Failed to fetch funnels:", error);
    return NextResponse.json(
      { error: "Failed to fetch funnels" },
      { status: 500 }
    );
  }
}

/**
 * ファネル作成
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const tenantId = currentUser.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
    }

    // ファネル作成
    const funnel = await prisma.funnel.create({
      data: {
        tenantId,
        name: body.name,
        type: body.type || "SALES",
        domain: body.domain,
        settings: body.settings || {},
      },
      include: {
        pages: true,
        steps: true,
      },
    });

    // ファネルタイプに応じたデフォルトステップを作成
    const defaultSteps = getDefaultStepsForType(body.type || "SALES");

    if (defaultSteps.length > 0) {
      await prisma.funnelStep.createMany({
        data: defaultSteps.map((step, index) => ({
          funnelId: funnel.id,
          name: step.name,
          type: step.type,
          order: index,
        })),
      });
    }

    // 更新後のファネルを取得
    const updatedFunnel = await prisma.funnel.findUnique({
      where: { id: funnel.id },
      include: {
        pages: true,
        steps: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({ funnel: updatedFunnel }, { status: 201 });
  } catch (error) {
    console.error("Failed to create funnel:", error);
    return NextResponse.json(
      { error: "Failed to create funnel" },
      { status: 500 }
    );
  }
}

/**
 * ファネルタイプに応じたデフォルトステップを取得
 */
function getDefaultStepsForType(type: string): Array<{ name: string; type: FunnelStepType }> {
  const stepTemplates: Record<string, Array<{ name: string; type: FunnelStepType }>> = {
    OPTIN: [
      { name: "オプトインページ", type: "OPTIN" },
      { name: "サンキューページ", type: "THANKYOU" },
    ],
    SALES: [
      { name: "セールスページ", type: "SALES" },
      { name: "注文フォーム", type: "ORDER_FORM" },
      { name: "アップセル", type: "UPSELL" },
      { name: "サンキューページ", type: "THANKYOU" },
    ],
    WEBINAR: [
      { name: "登録ページ", type: "OPTIN" },
      { name: "確認ページ", type: "CONFIRMATION" },
      { name: "ウェビナーページ", type: "WEBINAR" },
      { name: "リプレイページ", type: "REPLAY" },
      { name: "オファーページ", type: "SALES" },
    ],
    PRODUCT_LAUNCH: [
      { name: "オプトイン", type: "OPTIN" },
      { name: "PLC動画1", type: "CONTENT" },
      { name: "PLC動画2", type: "CONTENT" },
      { name: "PLC動画3", type: "CONTENT" },
      { name: "PLC動画4", type: "CONTENT" },
      { name: "セールス", type: "SALES" },
      { name: "注文フォーム", type: "ORDER_FORM" },
    ],
    MEMBERSHIP: [
      { name: "セールスページ", type: "SALES" },
      { name: "注文フォーム", type: "ORDER_FORM" },
      { name: "会員登録", type: "MEMBERSHIP_ACCESS" },
      { name: "サンキュー", type: "THANKYOU" },
    ],
    TRIPWIRE: [
      { name: "オプトイン", type: "OPTIN" },
      { name: "トリップワイヤー", type: "SALES" },
      { name: "アップセル1", type: "UPSELL" },
      { name: "アップセル2", type: "UPSELL" },
      { name: "サンキュー", type: "THANKYOU" },
    ],
    APPLICATION: [
      { name: "ランディングページ", type: "LANDING" },
      { name: "申込みフォーム", type: "APPLICATION_FORM" },
      { name: "確認ページ", type: "CONFIRMATION" },
    ],
  };

  return stepTemplates[type] || stepTemplates.SALES;
}
