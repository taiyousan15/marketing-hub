"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import { getNewMessagesForTime, type ChatMessage } from "@/lib/auto-webinar/chat";

interface LiveChatProps {
  messages: ChatMessage[];
  currentPosition: number;  // 秒
  className?: string;
}

const MESSAGE_TYPE_STYLES = {
  COMMENT: "",
  QUESTION: "bg-blue-500/10 border-l-2 border-blue-500",
  REACTION: "text-sm",
  TESTIMONIAL: "bg-green-500/10 border-l-2 border-green-500",
};

export function LiveChat({
  messages,
  currentPosition,
  className = "",
}: LiveChatProps) {
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([]);
  const [lastPosition, setLastPosition] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 新しいメッセージを取得
    const newMessages = getNewMessagesForTime(messages, currentPosition, lastPosition);

    if (newMessages.length > 0) {
      setVisibleMessages((prev) => {
        const combined = [...prev, ...newMessages];
        // 最新100件のみ保持
        return combined.slice(-100);
      });
      setLastPosition(currentPosition);

      // 自動スクロール
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [currentPosition, messages, lastPosition]);

  // シーク時のリセット
  useEffect(() => {
    if (currentPosition < lastPosition) {
      // 巻き戻しが発生した場合、メッセージをリセット
      const messagesUntilNow = messages.filter(
        (m) => m.appearAtSeconds <= currentPosition
      );
      setVisibleMessages(messagesUntilNow.slice(-100));
      setLastPosition(currentPosition);
    }
  }, [currentPosition, lastPosition, messages]);

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className={`flex flex-col h-full bg-card rounded-lg border ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <MessageSquare className="w-4 h-4" />
        <span className="font-medium">ライブチャット</span>
        <Badge variant="secondary" className="ml-auto">
          {visibleMessages.length}
        </Badge>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {visibleMessages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">チャットメッセージがここに表示されます</p>
            </div>
          ) : (
            visibleMessages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex gap-3 p-2 rounded-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
                  MESSAGE_TYPE_STYLES[message.messageType]
                }`}
              >
                <Avatar className="w-8 h-8 shrink-0">
                  {message.senderAvatar ? (
                    <AvatarImage src={message.senderAvatar} />
                  ) : null}
                  <AvatarFallback className="text-xs">
                    {getInitials(message.senderName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {message.senderName}
                    </span>
                    {message.messageType === "QUESTION" && (
                      <Badge variant="outline" className="text-xs">
                        質問
                      </Badge>
                    )}
                    {message.messageType === "TESTIMONIAL" && (
                      <Badge variant="outline" className="text-xs text-green-600">
                        感想
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground/90 break-words">
                    {message.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
