"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Bot,
  User,
  Clock,
  CheckCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChatInterface, Message } from "@/components/chat/chat-interface";

interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  isAIHandling: boolean;
  status: "active" | "waiting" | "resolved";
}

const sampleConversations: Conversation[] = [
  {
    id: "1",
    contactId: "c1",
    contactName: "田中 太郎",
    lastMessage: "商品の発送はいつ頃になりますか？",
    lastMessageAt: new Date(Date.now() - 5 * 60000),
    unreadCount: 2,
    isAIHandling: false,
    status: "waiting",
  },
  {
    id: "2",
    contactId: "c2",
    contactName: "鈴木 花子",
    lastMessage: "ありがとうございます！",
    lastMessageAt: new Date(Date.now() - 30 * 60000),
    unreadCount: 0,
    isAIHandling: true,
    status: "active",
  },
  {
    id: "3",
    contactId: "c3",
    contactName: "佐藤 一郎",
    lastMessage: "セミナーの日程について教えてください",
    lastMessageAt: new Date(Date.now() - 2 * 3600000),
    unreadCount: 1,
    isAIHandling: false,
    status: "waiting",
  },
];

const sampleMessages: Message[] = [
  {
    id: "m1",
    content: "こんにちは！商品について質問があります。",
    sender: "user",
    timestamp: new Date(Date.now() - 10 * 60000),
    status: "read",
  },
  {
    id: "m2",
    content: "こんにちは！ご質問ありがとうございます。どのような内容でしょうか？",
    sender: "ai",
    timestamp: new Date(Date.now() - 9 * 60000),
    status: "read",
  },
  {
    id: "m3",
    content: "オンラインコースの内容について詳しく知りたいです。",
    sender: "user",
    timestamp: new Date(Date.now() - 8 * 60000),
    status: "read",
  },
  {
    id: "m4",
    content: "オンラインコースは全12回のレッスンで構成されており、マーケティングの基礎から応用まで学べます。動画は何度でも視聴可能で、質問フォーラムもご利用いただけます。",
    sender: "ai",
    timestamp: new Date(Date.now() - 7 * 60000),
    status: "read",
  },
  {
    id: "m5",
    content: "商品の発送はいつ頃になりますか？",
    sender: "user",
    timestamp: new Date(Date.now() - 5 * 60000),
    status: "delivered",
  },
];

export default function ChatPage() {
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
    sampleConversations[0]
  );
  const [messages, setMessages] = useState<Message[]>(sampleMessages);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredConversations = sampleConversations.filter((conv) =>
    conv.contactName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async (content: string) => {
    const newMessage: Message = {
      id: "m" + Date.now(),
      content,
      sender: "operator",
      timestamp: new Date(),
      status: "sending",
    };
    setMessages((prev) => [...prev, newMessage]);
    
    // Simulate sending
    await new Promise((resolve) => setTimeout(resolve, 500));
    setMessages((prev) =>
      prev.map((m) => (m.id === newMessage.id ? { ...m, status: "sent" } : m))
    );
  };

  const handleAIAssist = async (userMessage: string): Promise<string> => {
    // Simulate AI response generation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return "ご質問ありがとうございます。発送は通常、ご注文から3営業日以内に行っております。詳細な配送状況はマイページからご確認いただけます。";
  };

  const formatTime = (date: Date) => {
    if (!isClient) return "--";
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "たった今";
    if (diff < 3600000) return Math.floor(diff / 60000) + "分前";
    if (diff < 86400000) return Math.floor(diff / 3600000) + "時間前";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

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
            AI対応中: 1
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            待機中: 2
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
              {filteredConversations.map((conv) => (
                <div key={conv.id}>
                  <button
                    className={
                      "w-full p-4 text-left hover:bg-muted/50 transition-colors " +
                      (selectedConversation?.id === conv.id ? "bg-muted" : "")
                    }
                    onClick={() => setSelectedConversation(conv)}
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
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {conv.isAIHandling && (
                            <Sparkles className="h-3 w-3 text-purple-500 flex-shrink-0" />
                          )}
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.lastMessage}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {conv.status === "waiting" && (
                            <Badge variant="destructive" className="text-xs py-0">
                              対応待ち
                            </Badge>
                          )}
                          {conv.unreadCount > 0 && (
                            <Badge className="text-xs py-0">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                  <Separator />
                </div>
              ))}
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
                      <p className="text-xs text-muted-foreground">LINE</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedConversation.isAIHandling ? (
                      <Badge className="bg-purple-100 text-purple-700">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI対応中
                      </Badge>
                    ) : (
                      <Button variant="outline" size="sm">
                        <Bot className="h-4 w-4 mr-1" />
                        AIに任せる
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ChatInterface
                  contactId={selectedConversation.contactId}
                  contactName={selectedConversation.contactName}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onAIAssist={handleAIAssist}
                  isAIEnabled={true}
                />
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
