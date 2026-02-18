"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { Message } from "@/components/chat/chat-interface";

const DEMO_CUSTOMER_MESSAGES = [
  "このコースの返金ポリシーについて教えてください",
  "動画が再生できないのですが、対処法はありますか？",
  "次のセミナーの日程を教えてください",
  "支払い方法はクレジットカード以外にありますか？",
  "コースの修了証明書は発行されますか？",
  "グループ割引はありますか？",
  "コースの内容を事前にプレビューできますか？",
  "サポートの対応時間を教えてください",
];

const HANDOFF_KEYWORDS = ["返金", "解約", "クレーム", "怒", "訴", "弁護士"];

interface UseAIAutoResponseParams {
  messages: Message[];
  isAIHandling: boolean;
  onAIAssist: (userMessage: string) => Promise<string>;
  onAddMessage: (message: Message) => void;
  onHandoff: () => void;
}

interface UseAIAutoResponseReturn {
  isAITyping: boolean;
}

export function useAIAutoResponse({
  messages,
  isAIHandling,
  onAIAssist,
  onAddMessage,
  onHandoff,
}: UseAIAutoResponseParams): UseAIAutoResponseReturn {
  const [isAITyping, setIsAITyping] = useState(false);
  const simulationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const responseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const demoIndexRef = useRef(0);
  const isAIHandlingRef = useRef(isAIHandling);

  useEffect(() => {
    isAIHandlingRef.current = isAIHandling;
  }, [isAIHandling]);

  const clearAllTimers = useCallback(() => {
    if (simulationTimerRef.current) {
      clearTimeout(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
  }, []);

  const scheduleNextSimulation = useCallback(() => {
    if (simulationTimerRef.current) {
      clearTimeout(simulationTimerRef.current);
    }

    const delay = 10000 + Math.random() * 10000; // 10-20 seconds
    simulationTimerRef.current = setTimeout(() => {
      if (!isAIHandlingRef.current) return;

      const messageContent =
        DEMO_CUSTOMER_MESSAGES[demoIndexRef.current % DEMO_CUSTOMER_MESSAGES.length];
      demoIndexRef.current += 1;

      const timestamp = new Date();
      const newMessage: Message = {
        id: `sim-${timestamp.getTime()}`,
        content: messageContent,
        sender: "user",
        timestamp,
        status: "delivered",
      };

      onAddMessage(newMessage);
    }, delay);
  }, [onAddMessage]);

  // Auto-respond to new user messages when AI is handling
  useEffect(() => {
    if (!isAIHandling || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender !== "user") return;
    if (processedMessageIdsRef.current.has(lastMessage.id)) return;

    processedMessageIdsRef.current.add(lastMessage.id);

    const typingDelay = 1000 + Math.random() * 2000; // 1-3 seconds

    const handleResponse = async () => {
      setIsAITyping(true);

      if (!isAIHandlingRef.current) {
        setIsAITyping(false);
        return;
      }

      try {
        const responseText = await onAIAssist(lastMessage.content);

        if (!isAIHandlingRef.current) {
          setIsAITyping(false);
          return;
        }

        const timestamp = new Date();
        const aiMessage: Message = {
          id: `ai-${timestamp.getTime()}`,
          content: responseText,
          sender: "ai",
          timestamp,
          status: "delivered",
        };

        setIsAITyping(false);
        onAddMessage(aiMessage);

        // Check for handoff signal
        if (responseText.includes("[担当者へエスカレーション]")) {
          onHandoff();
          return;
        }

        // Check if user message contains handoff keywords
        const needsHandoff = HANDOFF_KEYWORDS.some((kw) =>
          lastMessage.content.includes(kw)
        );
        if (needsHandoff) {
          onHandoff();
          return;
        }

        // Schedule next simulated message
        scheduleNextSimulation();
      } catch (error) {
        console.error("AI auto-response error:", error);
        setIsAITyping(false);
      }
    };

    responseTimerRef.current = setTimeout(handleResponse, typingDelay);

    return () => {
      if (responseTimerRef.current) {
        clearTimeout(responseTimerRef.current);
        responseTimerRef.current = null;
      }
    };
  }, [messages, isAIHandling, onAIAssist, onAddMessage, onHandoff, scheduleNextSimulation]);

  // Start/stop simulation when AI handling toggles
  useEffect(() => {
    if (isAIHandling) {
      scheduleNextSimulation();
      return clearAllTimers;
    }
    clearAllTimers();
    return undefined;
  }, [isAIHandling, scheduleNextSimulation, clearAllTimers]);

  // When AI handling is off, typing indicator should always be false
  const effectiveIsAITyping = isAIHandling ? isAITyping : false;

  return { isAITyping: effectiveIsAITyping };
}
