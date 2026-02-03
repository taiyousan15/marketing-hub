import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

interface RouteParams {
  params: Promise<{ id: string; offerId: string }>;
}

/**
 * オファーフォーム送信（メール登録等）
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, offerId } = await params;
    const body = await request.json();
    const { sessionToken, contactId, actionType, email, name } = body;

    // オファーの存在確認
    const offer = await prisma.autoWebinarTimedOffer.findFirst({
      where: {
        id: offerId,
        webinarId: id,
      },
      include: {
        webinar: {
          select: { tenantId: true },
        },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    // セッションの検証（あれば）
    if (sessionToken) {
      const session = await prisma.autoWebinarSession.findUnique({
        where: { sessionToken },
      });

      if (!session) {
        return NextResponse.json({ error: "Invalid session" }, { status: 400 });
      }
    }

    // アクションタイプ別の処理
    switch (actionType) {
      case "EMAIL_FORM":
        if (!email) {
          return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        // コンタクトを作成または更新
        let contact = await prisma.contact.findFirst({
          where: {
            tenantId: offer.webinar.tenantId,
            email,
          },
        });

        if (!contact) {
          contact = await prisma.contact.create({
            data: {
              tenantId: offer.webinar.tenantId,
              email,
              name: name || null,
              source: "WEBINAR_OFFER",
            },
          });
        } else if (name && !contact.name) {
          // 名前がなければ更新
          await prisma.contact.update({
            where: { id: contact.id },
            data: { name },
          });
        }

        // タグを付与（設定されていれば）
        if (offer.emailFormTagId) {
          // タグの存在確認
          const tag = await prisma.tag.findFirst({
            where: {
              id: offer.emailFormTagId,
              tenantId: offer.webinar.tenantId,
            },
          });

          if (tag) {
            // 既存のタグ付けがないか確認
            const existingTagging = await prisma.contactTag.findFirst({
              where: {
                contactId: contact.id,
                tagId: tag.id,
              },
            });

            if (!existingTagging) {
              await prisma.contactTag.create({
                data: {
                  contactId: contact.id,
                  tagId: tag.id,
                },
              });
            }
          }
        }

        // フォーム送信カウントを更新
        await prisma.autoWebinarTimedOffer.update({
          where: { id: offerId },
          data: {
            formSubmitCount: { increment: 1 },
            conversionCount: { increment: 1 },
          },
        });

        return NextResponse.json({
          success: true,
          contactId: contact.id,
          message: offer.emailSuccessMessage || "登録が完了しました",
        });

      default:
        // クリックカウントを更新
        await prisma.autoWebinarTimedOffer.update({
          where: { id: offerId },
          data: {
            clickCount: { increment: 1 },
          },
        });

        return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("Failed to submit offer form:", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
