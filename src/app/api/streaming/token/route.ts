/**
 * LiveKit Token API
 *
 * ウェビナー・ミーティング参加用トークンを発行
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createWebinarRoom,
  joinWebinar,
  createMeetingRoom,
  joinMeeting,
  type ParticipantRole,
} from "@/lib/streaming/livekit-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type, // "webinar" | "meeting"
      action, // "create" | "join"
      roomId,
      participantId,
      participantName,
      role,
    } = body;

    // 入力検証
    if (!type || !action || !roomId || !participantId || !participantName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let result;

    if (type === "webinar") {
      if (action === "create") {
        // ウェビナー作成（ホストのみ）
        result = await createWebinarRoom(roomId, participantId, participantName);
      } else {
        // ウェビナー参加
        result = await joinWebinar(
          roomId,
          participantId,
          participantName,
          (role as ParticipantRole) || "viewer"
        );
      }
    } else if (type === "meeting") {
      if (action === "create") {
        // ミーティング作成
        result = await createMeetingRoom(roomId, participantId, participantName);
      } else {
        // ミーティング参加
        result = await joinMeeting(roomId, participantId, participantName);
      }
    } else {
      return NextResponse.json(
        { error: "Invalid type. Use 'webinar' or 'meeting'" },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
