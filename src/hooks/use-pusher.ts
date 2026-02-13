"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PusherClient from "pusher-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IncomingMessage {
  id: string;
  content: unknown;
  direction: string;
  senderType: string;
  createdAt: string;
}

interface ConversationUpdate {
  conversationId: string;
  lastMessage?: unknown;
  status?: string;
  isAIHandling?: boolean;
}

interface UseConversationMessagesResult {
  messages: IncomingMessage[];
  clearMessages: () => void;
}

interface UseConversationListResult {
  updates: ConversationUpdate[];
  latestUpdate: ConversationUpdate | null;
  clearUpdates: () => void;
}

// ---------------------------------------------------------------------------
// Singleton Pusher client
// ---------------------------------------------------------------------------

let pusherSingleton: PusherClient | null = null;

function getPusherClient(): PusherClient | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  if (!key) {
    return null;
  }

  if (!pusherSingleton) {
    pusherSingleton = new PusherClient(key, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap3",
    });
  }

  return pusherSingleton;
}

// ---------------------------------------------------------------------------
// useConversationMessages
// ---------------------------------------------------------------------------

/**
 * Subscribe to a conversation channel and receive new incoming messages
 * in real-time via Pusher.
 *
 * @param conversationId - The conversation to subscribe to, or null to skip.
 */
export function useConversationMessages(
  conversationId: string | null
): UseConversationMessagesResult {
  const [messages, setMessages] = useState<IncomingMessage[]>([]);
  const channelRef = useRef<ReturnType<PusherClient["subscribe"]> | null>(null);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const pusher = getPusherClient();
    if (!pusher) {
      return;
    }

    const channelName = `conversation-${conversationId}`;
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    const handleNewMessage = (data: IncomingMessage) => {
      setMessages((prev) => [...prev, data]);
    };

    channel.bind("new-message", handleNewMessage);

    return () => {
      channel.unbind("new-message", handleNewMessage);
      pusher.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [conversationId]);

  return { messages, clearMessages };
}

// ---------------------------------------------------------------------------
// useConversationList
// ---------------------------------------------------------------------------

/**
 * Subscribe to a tenant channel and receive conversation-list updates
 * (new messages, status changes, AI-handling toggles) in real-time.
 *
 * @param tenantId - The tenant to subscribe to, or null to skip.
 */
export function useConversationList(
  tenantId: string | null
): UseConversationListResult {
  const [updates, setUpdates] = useState<ConversationUpdate[]>([]);
  const [latestUpdate, setLatestUpdate] = useState<ConversationUpdate | null>(
    null
  );
  const channelRef = useRef<ReturnType<PusherClient["subscribe"]> | null>(null);

  const clearUpdates = useCallback(() => {
    setUpdates([]);
    setLatestUpdate(null);
  }, []);

  useEffect(() => {
    if (!tenantId) {
      return;
    }

    const pusher = getPusherClient();
    if (!pusher) {
      return;
    }

    const channelName = `tenant-${tenantId}`;
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    const handleConversationUpdate = (data: ConversationUpdate) => {
      setLatestUpdate(data);
      setUpdates((prev) => [...prev, data]);
    };

    channel.bind("conversation-update", handleConversationUpdate);

    return () => {
      channel.unbind("conversation-update", handleConversationUpdate);
      pusher.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [tenantId]);

  return { updates, latestUpdate, clearUpdates };
}
