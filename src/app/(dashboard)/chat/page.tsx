"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  MessageSquare,
  Search,
  Bot,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChatInterface, Message } from "@/components/chat/chat-interface";
import { useTenant } from "@/hooks/use-tenant";
import {
  useConversationMessages,
  useConversationList,
} from "@/hooks/use-pusher";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiLastMessage {
  id: string;
  content: unknown;
  direction: string;
  senderType: string;
  createdAt: string;
}

interface ApiConversation {
  id: string;
  contactId: string;
  contactName: string;
  channel: string;
  status: string;
  isAIHandling: boolean;
  lastMessage: ApiLastMessage | null;
  lastMessageAt: string;
}

interface ApiMessage {
  id: string;
  content: unknown;
  direction: string;
  senderType: string;
  status: string;
  createdAt: string;
  metadata?: unknown;
}

// ---------------------------------------------------------------------------
// Helpers (pure functions)
// ---------------------------------------------------------------------------

function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (content && typeof content === "object" && "text" in content) {
    return String((content as { text: unknown }).text);
  }
  return "[メディアメッセージ]";
}

function toMessage(apiMsg: ApiMessage): Message {
  return {
    id: apiMsg.id,
    content: extractText(apiMsg.content),
    sender:
      apiMsg.direction === "INBOUND"
        ? "user"
        : apiMsg.senderType === "AI"
          ? "ai"
          : apiMsg.senderType === "SYSTEM"
            ? "system"
            : "operator",
    timestamp: new Date(apiMsg.createdAt),
    status:
      apiMsg.status === "SENT"
        ? "sent"
        : apiMsg.status === "DELIVERED"
          ? "delivered"
          : "read",
  };
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return "たった今";
  if (diff < 3600000) return Math.floor(diff / 60000) + "分前";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "時間前";
  return date.toLocaleDateString("ja-JP");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChatPage() {
  const { tenantId, loading: tenantLoading } = useTenant();

  // ---- Conversations state ----
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState<string | null>(null);

  // ---- Selected conversation ----
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // ---- Messages state ----
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // ---- UI state ----
  const [searchQuery, setSearchQuery] = useState("");
  const [aiToggleLoading, setAiToggleLoading] = useState(false);

  // ---- Pusher hooks ----
  const { messages: pusherMessages, clearMessages: clearPusherMessages } =
    useConversationMessages(selectedConversationId);
  const { latestUpdate } = useConversationList(tenantId);

  // ---- Derived: selected conversation object ----
  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  // ---- Derived: counts ----
  const aiHandlingCount = useMemo(
    () => conversations.filter((c) => c.isAIHandling).length,
    [conversations]
  );
  const waitingCount = useMemo(
    () => conversations.filter((c) => c.status === "ACTIVE" && !c.isAIHandling).length,
    [conversations]
  );

  // ---- Derived: filtered conversations ----
  const filteredConversations = useMemo(
    () =>
      conversations.filter((conv) =>
        conv.contactName.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [conversations, searchQuery]
  );

  // ---- Fetch conversations ----
  const fetchConversations = useCallback(async () => {
    if (!tenantId) return;

    setConversationsLoading(true);
    setConversationsError(null);
    try {
      const res = await fetch(
        `/api/conversations?tenantId=${encodeURIComponent(tenantId)}&status=ACTIVE`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch conversations: ${res.status}`);
      }
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setConversationsError(message);
    } finally {
      setConversationsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ---- Fetch messages when conversation selected ----
  const fetchMessages = useCallback(async (conversationId: string) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(
        `/api/conversations/${encodeURIComponent(conversationId)}/messages?limit=50`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch messages: ${res.status}`);
      }
      const data = await res.json();
      const apiMessages: ApiMessage[] = data.messages ?? [];
      setMessages(apiMessages.map(toMessage));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setConversationsError(message);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      clearPusherMessages();
      fetchMessages(selectedConversationId);
    } else {
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId, fetchMessages]);

  // ---- Merge Pusher real-time messages (avoid duplicates) ----
  useEffect(() => {
    if (pusherMessages.length === 0) return;

    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const newMessages = pusherMessages
        .filter((pm) => !existingIds.has(pm.id))
        .map((pm) =>
          toMessage({
            id: pm.id,
            content: pm.content,
            direction: pm.direction,
            senderType: pm.senderType,
            status: "SENT",
            createdAt: pm.createdAt,
          })
        );

      if (newMessages.length === 0) return prev;
      return [...prev, ...newMessages];
    });
  }, [pusherMessages]);

  // ---- Merge Pusher conversation-list updates ----
  useEffect(() => {
    if (!latestUpdate) return;

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== latestUpdate.conversationId) return conv;

        const updated = { ...conv };

        if (latestUpdate.status !== undefined) {
          updated.status = latestUpdate.status;
        }
        if (latestUpdate.isAIHandling !== undefined) {
          updated.isAIHandling = latestUpdate.isAIHandling;
        }
        if (latestUpdate.lastMessage) {
          const lm = latestUpdate.lastMessage as ApiLastMessage;
          updated.lastMessage = lm;
          updated.lastMessageAt = lm.createdAt;
        }

        return updated;
      })
    );
  }, [latestUpdate]);

  // ---- Send message ----
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedConversationId) return;

      // Optimistic update
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMessage: Message = {
        id: optimisticId,
        content,
        sender: "operator",
        timestamp: new Date(),
        status: "sending",
      };
      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        const res = await fetch(
          `/api/conversations/${encodeURIComponent(selectedConversationId)}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: content }),
          }
        );

        if (!res.ok) {
          throw new Error(`Failed to send message: ${res.status}`);
        }

        const data = await res.json();

        // Replace optimistic message with server response
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId
              ? {
                  ...m,
                  id: data.message?.id ?? optimisticId,
                  status: "sent" as const,
                }
              : m
          )
        );
      } catch (err) {
        // Mark as error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId ? { ...m, status: "error" as const } : m
          )
        );
        throw err;
      }
    },
    [selectedConversationId]
  );

  // ---- Toggle AI mode ----
  const handleToggleAI = useCallback(
    async (enabled: boolean) => {
      if (!selectedConversationId) return;

      setAiToggleLoading(true);
      try {
        const res = await fetch(
          `/api/conversations/${encodeURIComponent(selectedConversationId)}/ai`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enabled }),
          }
        );

        if (!res.ok) {
          throw new Error(`Failed to toggle AI: ${res.status}`);
        }

        // Optimistically update local state
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedConversationId
              ? { ...conv, isAIHandling: enabled }
              : conv
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setConversationsError(message);
      } finally {
        setAiToggleLoading(false);
      }
    },
    [selectedConversationId]
  );

  // ---- AI assist (sparkle button in ChatInterface) ----
  const handleAIAssist = useCallback(
    async (userMessage: string): Promise<string> => {
      if (!selectedConversationId) {
        return "会話が選択されていません";
      }

      try {
        const res = await fetch(
          `/api/conversations/${encodeURIComponent(selectedConversationId)}/ai/respond`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userMessage }),
          }
        );

        if (!res.ok) {
          throw new Error(`AI respond failed: ${res.status}`);
        }

        const data = await res.json();

        if (data.responded && data.message) {
          return extractText(data.message.content ?? data.message);
        }
        if (data.handoff) {
          return `[引き継ぎ] ${data.reason ?? "AIが対応できない内容です"}`;
        }
        return "AIからの提案はありません";
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        throw new Error(`AI提案の取得に失敗しました: ${message}`);
      }
    },
    [selectedConversationId]
  );

  // ---- Select conversation handler ----
  const handleSelectConversation = useCallback((convId: string) => {
    setSelectedConversationId(convId);
  }, []);

  // ---- Loading state ----
  if (tenantLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">LINEチャット</h1>
          <p className="text-muted-foreground">
            顧客とのリアルタイムチャット・AI自動応答
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Bot className="h-3 w-3" />
            AI対応中: {aiHandlingCount}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            待機中: {waitingCount}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100%-4rem)]">
        {/* Conversation List */}
        <Card className="col-span-4 flex flex-col">
          <CardHeader className="pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="名前で検索..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              {conversationsLoading && conversations.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : conversationsError && conversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-sm text-destructive">{conversationsError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={fetchConversations}
                  >
                    再試行
                  </Button>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">会話がありません</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div key={conv.id}>
                    <button
                      className={
                        "w-full p-4 text-left hover:bg-muted/50 transition-colors " +
                        (selectedConversationId === conv.id ? "bg-muted" : "")
                      }
                      onClick={() => handleSelectConversation(conv.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-green-100">
                            {conv.contactName.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">
                              {conv.contactName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(new Date(conv.lastMessageAt))}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {conv.isAIHandling && (
                              <Sparkles className="h-3 w-3 text-purple-500 flex-shrink-0" />
                            )}
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.lastMessage
                                ? extractText(conv.lastMessage.content)
                                : "メッセージなし"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {conv.isAIHandling ? (
                              <Badge
                                variant="secondary"
                                className="text-xs py-0 bg-purple-100 text-purple-700"
                              >
                                AI対応中
                              </Badge>
                            ) : (
                              conv.status === "ACTIVE" && (
                                <Badge variant="destructive" className="text-xs py-0">
                                  対応待ち
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                    <Separator />
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="col-span-8 flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="pb-2 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-green-100">
                        {selectedConversation.contactName.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">
                        {selectedConversation.contactName}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {selectedConversation.channel ?? "LINE"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedConversation.isAIHandling ? (
                      <Badge
                        className="bg-purple-100 text-purple-700 cursor-pointer hover:bg-purple-200 transition-colors"
                        onClick={() => handleToggleAI(false)}
                      >
                        {aiToggleLoading ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3 mr-1" />
                        )}
                        AI対応中
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAI(true)}
                        disabled={aiToggleLoading}
                      >
                        {aiToggleLoading ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Bot className="h-4 w-4 mr-1" />
                        )}
                        AIに任せる
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ChatInterface
                    contactId={selectedConversation.contactId}
                    contactName={selectedConversation.contactName}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onAIAssist={handleAIAssist}
                    isAIEnabled={true}
                  />
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>会話を選択してください</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
