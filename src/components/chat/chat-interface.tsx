"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Message {
  id: string;
  content: string;
  sender: "user" | "operator" | "bot" | "ai";
  timestamp: Date;
  status?: "sending" | "sent" | "delivered" | "read" | "error";
}

interface ChatInterfaceProps {
  contactId: string;
  contactName: string;
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  onAIAssist?: (content: string) => Promise<string>;
  isAIEnabled?: boolean;
}

export function ChatInterface({
  contactName,
  messages,
  onSendMessage,
  onAIAssist,
  isAIEnabled = false,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(input.trim());
      setInput("");
      setAiSuggestion(null);
    } catch (error) {
      console.error("Send error:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleAIAssist = async () => {
    if (!onAIAssist || !messages.length) return;

    setIsAIThinking(true);
    try {
      const lastUserMessage = [...messages].reverse().find((m) => m.sender === "user");
      if (lastUserMessage) {
        const suggestion = await onAIAssist(lastUserMessage.content);
        setAiSuggestion(suggestion);
      }
    } catch (error) {
      console.error("AI assist error:", error);
    } finally {
      setIsAIThinking(false);
    }
  };

  const useSuggestion = () => {
    if (aiSuggestion) {
      setInput(aiSuggestion);
      setAiSuggestion(null);
    }
  };

  const getSenderIcon = (sender: Message["sender"]) => {
    switch (sender) {
      case "user":
        return <User className="h-4 w-4" />;
      case "bot":
      case "ai":
        return <Bot className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getSenderLabel = (sender: Message["sender"]) => {
    switch (sender) {
      case "user":
        return contactName;
      case "operator":
        return "オペレーター";
      case "bot":
        return "Bot";
      case "ai":
        return "AI";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                "flex gap-3 " +
                (message.sender === "user" ? "" : "flex-row-reverse")
              }
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback
                  className={
                    message.sender === "user"
                      ? "bg-green-100"
                      : message.sender === "ai"
                      ? "bg-purple-100"
                      : "bg-blue-100"
                  }
                >
                  {getSenderIcon(message.sender)}
                </AvatarFallback>
              </Avatar>
              <div
                className={
                  "flex flex-col max-w-[70%] " +
                  (message.sender === "user" ? "" : "items-end")
                }
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">
                    {getSenderLabel(message.sender)}
                  </span>
                  {(message.sender === "bot" || message.sender === "ai") && (
                    <Badge variant="secondary" className="text-xs py-0">
                      {message.sender === "ai" ? "AI" : "Bot"}
                    </Badge>
                  )}
                </div>
                <div
                  className={
                    "rounded-lg px-3 py-2 " +
                    (message.sender === "user"
                      ? "bg-green-100"
                      : message.sender === "ai"
                      ? "bg-purple-100"
                      : "bg-muted")
                  }
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {message.timestamp.toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {aiSuggestion && (
        <div className="p-3 border-t bg-purple-50">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-purple-500 mt-1" />
            <div className="flex-1">
              <p className="text-xs text-purple-600 font-medium mb-1">AI提案</p>
              <p className="text-sm text-gray-700">{aiSuggestion}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setAiSuggestion(null)}>
                却下
              </Button>
              <Button size="sm" onClick={useSuggestion}>
                使用
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border-t">
        <div className="flex gap-2">
          {isAIEnabled && onAIAssist && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleAIAssist}
              disabled={isAIThinking || messages.length === 0}
              title="AI提案を取得"
            >
              {isAIThinking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
          )}
          <Input
            placeholder="メッセージを入力..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isSending}
          />
          <Button onClick={handleSend} disabled={!input.trim() || isSending}>
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
