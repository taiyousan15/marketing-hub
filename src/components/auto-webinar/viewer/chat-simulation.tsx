"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  appearAtSeconds: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: "COMMENT" | "QUESTION" | "REACTION" | "TESTIMONIAL";
  reactions?: {
    likes?: number;
    hearts?: number;
  };
}

interface ChatSimulationProps {
  messages: ChatMessage[];
  currentPosition: number;
  className?: string;
  autoScroll?: boolean;
}

/**
 * AIチャットシミュレーション（リアルタイム表示）
 * 動画の再生位置に応じてチャットメッセージを表示
 */
export function ChatSimulation({
  messages,
  currentPosition,
  className = "",
  autoScroll = true,
}: ChatSimulationProps) {
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([]);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousPositionRef = useRef(currentPosition);

  // 現在の再生位置までのメッセージをフィルタリング
  useEffect(() => {
    const currentMessages = messages.filter(
      (msg) => msg.appearAtSeconds <= currentPosition
    );

    // 新しいメッセージを検出
    const previousMessages = messages.filter(
      (msg) => msg.appearAtSeconds <= previousPositionRef.current
    );
    const newMessages = currentMessages.filter(
      (msg) => !previousMessages.some((prev) => prev.id === msg.id)
    );

    if (newMessages.length > 0) {
      const newIds = new Set(newMessages.map((msg) => msg.id));
      setNewMessageIds(newIds);

      // 3秒後に新着フラグを解除
      setTimeout(() => {
        setNewMessageIds((prev) => {
          const updated = new Set(prev);
          newMessages.forEach((msg) => updated.delete(msg.id));
          return updated;
        });
      }, 3000);
    }

    setVisibleMessages(currentMessages);
    previousPositionRef.current = currentPosition;
  }, [currentPosition, messages]);

  // 自動スクロール
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleMessages, autoScroll]);

  const getMessageIcon = (type: ChatMessage["messageType"]) => {
    switch (type) {
      case "QUESTION":
        return "❓";
      case "REACTION":
        return "👍";
      case "TESTIMONIAL":
        return "⭐";
      default:
        return null;
    }
  };

  const getMessageTypeColor = (type: ChatMessage["messageType"]) => {
    switch (type) {
      case "QUESTION":
        return "text-yellow-500";
      case "REACTION":
        return "text-blue-500";
      case "TESTIMONIAL":
        return "text-purple-500";
      default:
        return "text-slate-300";
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="w-5 h-5" />
          チャット
          <Badge variant="secondary" className="ml-auto">
            {visibleMessages.length}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-4 space-y-4">
            {visibleMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">まだメッセージはありません</p>
              </div>
            ) : (
              visibleMessages.map((message) => {
                const isNew = newMessageIds.has(message.id);

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3 p-3 rounded-lg transition-all duration-300",
                      isNew && "bg-blue-500/10 border border-blue-500/20 animate-in slide-in-from-bottom-2"
                    )}
                  >
                    {/* アバター */}
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {getInitials(message.senderName)}
                      </AvatarFallback>
                    </Avatar>

                    {/* メッセージコンテンツ */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm truncate">
                          {message.senderName}
                        </span>
                        {getMessageIcon(message.messageType) && (
                          <span className="text-xs">
                            {getMessageIcon(message.messageType)}
                          </span>
                        )}
                        {isNew && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            NEW
                          </Badge>
                        )}
                      </div>

                      <p
                        className={cn(
                          "text-sm leading-relaxed",
                          getMessageTypeColor(message.messageType)
                        )}
                      >
                        {message.content}
                      </p>

                      {/* リアクション */}
                      {message.reactions && (
                        <div className="flex items-center gap-3 mt-2">
                          {message.reactions.likes && message.reactions.likes > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <ThumbsUp className="w-3 h-3" />
                              <span>{message.reactions.likes}</span>
                            </div>
                          )}
                          {message.reactions.hearts && message.reactions.hearts > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                              <span>{message.reactions.hearts}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* 統計フッター */}
      <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
        <div className="flex justify-between items-center">
          <span>
            {visibleMessages.filter((m) => m.messageType === "QUESTION").length} 件の質問
          </span>
          <span>
            {visibleMessages.filter((m) => m.messageType === "TESTIMONIAL").length} 件の感想
          </span>
        </div>
      </div>
    </Card>
  );
}
