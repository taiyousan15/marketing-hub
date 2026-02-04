# MarketingHub 最高品質AI実装提案書

**作成日**: 2026-02-04
**目標**: 品質スコアを66点 → 90点（Sランク）へ引き上げる
**実装期間目安**: 3ヶ月（フェーズ1〜3）

---

## 目次

1. [アーキテクチャ全体像](#1-アーキテクチャ全体像)
2. [Phase 1: 基盤強化（1ヶ月目）](#2-phase-1-基盤強化)
3. [Phase 2: AI機能拡張（2ヶ月目）](#3-phase-2-ai機能拡張)
4. [Phase 3: 高度な自動化（3ヶ月目）](#4-phase-3-高度な自動化)
5. [技術スタック推奨](#5-技術スタック推奨)
6. [コスト見積もり](#6-コスト見積もり)
7. [KPI・成功指標](#7-kpi成功指標)

---

## 1. アーキテクチャ全体像

### 1.1 目指すアーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MarketingHub AI Platform v2                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     AI Orchestration Layer                           │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │   │
│  │  │ Intent  │  │Sentiment│  │ Entity  │  │ Context │  │ Router  │  │   │
│  │  │Detector │  │Analyzer │  │Extract  │  │ Manager │  │  Agent  │  │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  │   │
│  └───────┼───────────┼───────────┼───────────┼───────────┼──────────┘   │
│          │           │           │           │           │               │
│  ┌───────┼───────────┼───────────┼───────────┼───────────┼──────────┐   │
│  │       │         RAG Pipeline (Knowledge Layer)        │          │   │
│  │  ┌────┴────────────────────────────────────────────────┴────┐    │   │
│  │  │                    Vector Database                        │    │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │    │   │
│  │  │  │ Products │  │   FAQ    │  │Conversa- │  │ Company  │ │    │   │
│  │  │  │   Index  │  │  Index   │  │tion Logs │  │Knowledge │ │    │   │
│  │  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │    │   │
│  │  └───────────────────────────────────────────────────────────┘    │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │                   Multi-Channel Integration                        │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐     │   │
│  │  │  LINE  │  │ Email  │  │  Web   │  │WhatsApp│  │  SMS   │     │   │
│  │  │  Bot   │  │  Bot   │  │ Widget │  │  Bot   │  │  Bot   │     │   │
│  │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘     │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │                   AI Workflow Engine                               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │   │
│  │  │  Visual     │  │    AI       │  │  Predictive │               │   │
│  │  │  Builder    │  │  Branching  │  │   Scoring   │               │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 コアコンポーネント

| コンポーネント | 役割 | 技術選定 |
|---------------|------|---------|
| Intent Detector | ユーザー意図の分類 | Claude 3.5 Haiku |
| Sentiment Analyzer | 感情分析・エスカレーション判定 | Claude 3.5 Haiku |
| Entity Extractor | 商品名・日付等の抽出 | Claude 3.5 Sonnet |
| Context Manager | 会話履歴・セッション管理 | Redis + PostgreSQL |
| Router Agent | 最適な応答パスの選択 | Claude 3.5 Sonnet |
| Vector Database | 知識ベース・RAG | Qdrant / Pinecone |

---

## 2. Phase 1: 基盤強化（1ヶ月目）

### 2.1 RAG（検索拡張生成）実装

**優先度: 最高 | インパクト: +20点**

#### 2.1.1 アーキテクチャ

```typescript
// src/lib/ai/rag/index.ts
import { QdrantClient } from '@qdrant/js-client-rest';
import { Anthropic } from '@anthropic-ai/sdk';

interface RAGConfig {
  collectionName: string;
  embeddingModel: string;
  topK: number;
  scoreThreshold: number;
}

export class RAGPipeline {
  private qdrant: QdrantClient;
  private anthropic: Anthropic;

  constructor(config: RAGConfig) {
    this.qdrant = new QdrantClient({ url: process.env.QDRANT_URL });
    this.anthropic = new Anthropic();
  }

  async query(userQuery: string, context: ConversationContext): Promise<RAGResult> {
    // 1. クエリを埋め込みベクトルに変換
    const queryEmbedding = await this.getEmbedding(userQuery);

    // 2. ベクトル検索で関連ドキュメントを取得
    const searchResults = await this.qdrant.search(this.config.collectionName, {
      vector: queryEmbedding,
      limit: this.config.topK,
      score_threshold: this.config.scoreThreshold,
    });

    // 3. 検索結果をコンテキストとしてClaudeに渡す
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: this.buildSystemPrompt(searchResults),
      messages: context.messages,
    });

    return {
      answer: response.content[0].text,
      sources: searchResults.map(r => r.payload),
      confidence: this.calculateConfidence(searchResults),
    };
  }
}
```

#### 2.1.2 ナレッジベース構造

```yaml
# 知識ベースのインデックス構造
collections:
  - name: products
    description: 商品情報（名前、価格、説明、FAQ）
    update_frequency: daily

  - name: faq
    description: よくある質問と回答
    update_frequency: weekly

  - name: policies
    description: 返品・配送ポリシー
    update_frequency: monthly

  - name: conversations
    description: 過去の優良対話ログ
    update_frequency: real-time
```

### 2.2 会話履歴の永続化

**優先度: 高 | インパクト: +10点**

```typescript
// src/lib/ai/context/conversation-store.ts
import { prisma } from '@/lib/db/prisma';
import Redis from 'ioredis';

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    sentiment?: number;
    entities?: Record<string, string>;
  };
}

export class ConversationStore {
  private redis: Redis;
  private readonly TTL = 3600 * 24 * 7; // 7日間

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  // セッション内の高速アクセス（Redis）
  async getRecentMessages(sessionId: string, limit = 10): Promise<ConversationMessage[]> {
    const key = `conv:${sessionId}:messages`;
    const messages = await this.redis.lrange(key, -limit, -1);
    return messages.map(m => JSON.parse(m));
  }

  async addMessage(sessionId: string, message: ConversationMessage): Promise<void> {
    const key = `conv:${sessionId}:messages`;
    await this.redis.rpush(key, JSON.stringify(message));
    await this.redis.expire(key, this.TTL);

    // 長期保存（PostgreSQL）へ非同期で永続化
    this.persistToDB(sessionId, message);
  }

  // 長期保存（PostgreSQL）
  private async persistToDB(sessionId: string, message: ConversationMessage): Promise<void> {
    await prisma.conversationMessage.create({
      data: {
        sessionId,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        metadata: message.metadata,
      },
    });
  }

  // 会話サマリー生成（長い履歴の圧縮）
  async generateSummary(sessionId: string): Promise<string> {
    const messages = await this.getAllMessages(sessionId);
    if (messages.length < 10) return '';

    // Claude で要約生成
    const summary = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `以下の会話を3文以内で要約してください:\n\n${this.formatMessages(messages)}`,
      }],
    });

    return summary.content[0].text;
  }
}
```

### 2.3 API改善（ストリーミング対応）

**優先度: 高 | インパクト: +5点**

```typescript
// src/app/api/chat/stream/route.ts
import { Anthropic } from '@anthropic-ai/sdk';
import { StreamingTextResponse } from 'ai';

export async function POST(req: Request) {
  const { messages, conversationId } = await req.json();

  const anthropic = new Anthropic();

  // ストリーミングレスポンス
  const stream = await anthropic.messages.stream({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages,
  });

  // Server-Sent Events として返却
  return new StreamingTextResponse(stream.toReadableStream());
}
```

```typescript
// フロントエンド実装
// src/hooks/useAIChat.ts
import { useChat } from 'ai/react';

export function useAIChat(conversationId: string) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat/stream',
    body: { conversationId },
    onFinish: (message) => {
      // 会話履歴を保存
      saveToHistory(conversationId, message);
    },
  });

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  };
}
```

---

## 3. Phase 2: AI機能拡張（2ヶ月目）

### 3.1 インテント検出 & 感情分析

**優先度: 高 | インパクト: +15点**

```typescript
// src/lib/ai/analysis/intent-detector.ts
export interface IntentResult {
  primaryIntent: Intent;
  confidence: number;
  subIntents: Intent[];
  entities: ExtractedEntity[];
}

export enum Intent {
  // 情報系
  PRODUCT_INQUIRY = 'product_inquiry',
  SHIPPING_STATUS = 'shipping_status',
  PRICING_QUESTION = 'pricing_question',

  // アクション系
  PURCHASE_INTENT = 'purchase_intent',
  CANCELLATION = 'cancellation',
  REFUND_REQUEST = 'refund_request',

  // サポート系
  COMPLAINT = 'complaint',
  TECHNICAL_ISSUE = 'technical_issue',
  ESCALATION_REQUEST = 'escalation_request',

  // その他
  GREETING = 'greeting',
  FAREWELL = 'farewell',
  UNKNOWN = 'unknown',
}

export class IntentDetector {
  private anthropic: Anthropic;

  async detect(message: string, context: ConversationContext): Promise<IntentResult> {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      system: `あなたはインテント分類の専門家です。
ユーザーメッセージを分析し、以下のJSON形式で返してください：
{
  "primaryIntent": "intent_name",
  "confidence": 0.0-1.0,
  "subIntents": ["intent1", "intent2"],
  "entities": [{"type": "product", "value": "商品名"}, ...]
}

利用可能なインテント: ${Object.values(Intent).join(', ')}`,
      messages: [{ role: 'user', content: message }],
    });

    return JSON.parse(response.content[0].text);
  }
}

// src/lib/ai/analysis/sentiment-analyzer.ts
export interface SentimentResult {
  score: number; // -1.0 (very negative) to 1.0 (very positive)
  label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  shouldEscalate: boolean;
  escalationReason?: string;
}

export class SentimentAnalyzer {
  private readonly ESCALATION_THRESHOLD = -0.5;
  private readonly CRITICAL_KEYWORDS = ['クレーム', '訴訟', '消費者センター', '詐欺'];

  async analyze(message: string, context: ConversationContext): Promise<SentimentResult> {
    // 1. キーワードベースの即座エスカレーションチェック
    const hasCriticalKeyword = this.CRITICAL_KEYWORDS.some(kw =>
      message.includes(kw)
    );

    if (hasCriticalKeyword) {
      return {
        score: -1.0,
        label: 'very_negative',
        urgency: 'critical',
        shouldEscalate: true,
        escalationReason: 'Critical keyword detected',
      };
    }

    // 2. Claude による詳細分析
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 300,
      system: `感情分析を行い、JSON形式で返してください。
過去の会話コンテキストも考慮してください。`,
      messages: [
        ...context.recentMessages,
        { role: 'user', content: message },
      ],
    });

    const result = JSON.parse(response.content[0].text);

    return {
      ...result,
      shouldEscalate: result.score < this.ESCALATION_THRESHOLD,
    };
  }
}
```

### 3.2 自動エスカレーション & ルーティング

```typescript
// src/lib/ai/routing/escalation-handler.ts
export interface EscalationConfig {
  rules: EscalationRule[];
  defaultHandler: 'ai' | 'human' | 'queue';
  notificationChannels: NotificationChannel[];
}

export interface EscalationRule {
  condition: (analysis: MessageAnalysis) => boolean;
  action: EscalationAction;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class EscalationHandler {
  private config: EscalationConfig;

  async handleMessage(
    message: string,
    intent: IntentResult,
    sentiment: SentimentResult,
    context: ConversationContext
  ): Promise<RoutingDecision> {
    const analysis: MessageAnalysis = { message, intent, sentiment, context };

    // ルールベースの評価
    for (const rule of this.config.rules) {
      if (rule.condition(analysis)) {
        await this.executeEscalation(rule, analysis);
        return {
          handler: rule.action.handler,
          reason: rule.action.reason,
          priority: rule.priority,
        };
      }
    }

    // デフォルト: AI が対応継続
    return {
      handler: this.config.defaultHandler,
      reason: 'No escalation rule matched',
      priority: 'low',
    };
  }

  private async executeEscalation(
    rule: EscalationRule,
    analysis: MessageAnalysis
  ): Promise<void> {
    // 1. 通知を送信
    for (const channel of this.config.notificationChannels) {
      await this.notify(channel, {
        type: 'escalation',
        priority: rule.priority,
        summary: this.generateSummary(analysis),
        conversationId: analysis.context.id,
      });
    }

    // 2. 会話をキューに追加
    await this.addToQueue(analysis.context.id, rule.priority);

    // 3. ログを記録
    await this.logEscalation(analysis, rule);
  }
}
```

### 3.3 AIコピーライティング統合（ファネルビルダー）

```typescript
// src/lib/ai/copywriting/funnel-ai.ts
export interface CopyGenerationRequest {
  componentType: 'headline' | 'subheadline' | 'cta' | 'body' | 'bullet';
  context: {
    productName?: string;
    targetAudience?: string;
    painPoints?: string[];
    benefits?: string[];
    tone?: 'professional' | 'friendly' | 'urgent' | 'casual';
  };
  currentContent?: string;
}

export class FunnelCopywriter {
  private anthropic: Anthropic;

  async generateCopy(request: CopyGenerationRequest): Promise<CopyVariants> {
    const systemPrompt = this.buildPrompt(request);

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `${request.componentType}のコピーを3パターン生成してください。`,
      }],
    });

    return this.parseVariants(response.content[0].text);
  }

  async improveCopy(currentCopy: string, feedback: string): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      system: `あなたは一流のコピーライターです。
与えられたコピーをフィードバックに基づいて改善してください。
太陽スタイル（感情に訴える、具体的な数字、行動を促す）を適用してください。`,
      messages: [{
        role: 'user',
        content: `現在のコピー:\n${currentCopy}\n\nフィードバック:\n${feedback}`,
      }],
    });

    return response.content[0].text;
  }

  private buildPrompt(request: CopyGenerationRequest): string {
    const basePrompt = `あなたは日本市場向けの一流コピーライターです。
太陽スタイルのコピーライティング技術を適用してください：
- 感情に訴える言葉を使う
- 具体的な数字や実績を含める
- 緊急性と限定性を演出
- 行動を促すCTAを含める`;

    if (request.context.targetAudience) {
      return `${basePrompt}\n\nターゲット: ${request.context.targetAudience}`;
    }

    return basePrompt;
  }
}
```

---

## 4. Phase 3: 高度な自動化（3ヶ月目）

### 4.1 ビジュアルワークフロービルダー

**優先度: 高 | インパクト: +15点**

```typescript
// src/components/workflow-builder/types.ts
export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'ai_branch' | 'delay' | 'split';
  position: { x: number; y: number };
  data: NodeData;
  connections: Connection[];
}

export interface AIBranchNode extends WorkflowNode {
  type: 'ai_branch';
  data: {
    model: 'claude-3-5-haiku' | 'claude-3-5-sonnet';
    prompt: string;
    branches: {
      condition: string;
      targetNodeId: string;
    }[];
    fallbackNodeId: string;
  };
}

// src/lib/workflow/ai-branch-executor.ts
export class AIBranchExecutor {
  async evaluate(
    node: AIBranchNode,
    context: WorkflowContext
  ): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: node.data.model,
      max_tokens: 200,
      system: `ワークフロー分岐を決定してください。
利用可能な分岐: ${node.data.branches.map(b => b.condition).join(', ')}
JSONで返してください: {"branch": "選択した分岐"}`,
      messages: [{
        role: 'user',
        content: `コンテキスト:\n${JSON.stringify(context)}\n\n${node.data.prompt}`,
      }],
    });

    const result = JSON.parse(response.content[0].text);
    const selectedBranch = node.data.branches.find(b => b.condition === result.branch);

    return selectedBranch?.targetNodeId ?? node.data.fallbackNodeId;
  }
}
```

### 4.2 予測リードスコアリング

```typescript
// src/lib/ai/scoring/predictive-scorer.ts
export interface LeadScore {
  totalScore: number; // 0-100
  buyingProbability: number; // 0-1
  segments: string[];
  signals: ScoringSignal[];
  recommendations: string[];
}

export interface ScoringSignal {
  type: string;
  weight: number;
  value: any;
  contribution: number;
}

export class PredictiveLeadScorer {
  // 30以上の購買シグナル
  private readonly SIGNALS: SignalDefinition[] = [
    // 行動シグナル
    { name: 'page_views', weight: 5, category: 'engagement' },
    { name: 'time_on_site', weight: 8, category: 'engagement' },
    { name: 'email_opens', weight: 10, category: 'engagement' },
    { name: 'email_clicks', weight: 15, category: 'engagement' },
    { name: 'form_submissions', weight: 20, category: 'conversion' },
    { name: 'cart_additions', weight: 25, category: 'conversion' },
    { name: 'checkout_started', weight: 35, category: 'conversion' },

    // 属性シグナル
    { name: 'company_size', weight: 10, category: 'fit' },
    { name: 'industry_match', weight: 15, category: 'fit' },
    { name: 'budget_range', weight: 20, category: 'fit' },

    // インテントシグナル
    { name: 'pricing_page_view', weight: 30, category: 'intent' },
    { name: 'competitor_comparison', weight: 25, category: 'intent' },
    { name: 'demo_request', weight: 40, category: 'intent' },

    // 時間シグナル
    { name: 'recency', weight: 15, category: 'timing' },
    { name: 'frequency', weight: 10, category: 'timing' },
    { name: 'velocity', weight: 20, category: 'timing' },
  ];

  async calculateScore(contactId: string): Promise<LeadScore> {
    // 1. 全シグナルデータを収集
    const signalData = await this.collectSignals(contactId);

    // 2. 各シグナルのスコア計算
    const scoredSignals = this.SIGNALS.map(signal => ({
      ...signal,
      value: signalData[signal.name],
      contribution: this.calculateContribution(signal, signalData[signal.name]),
    }));

    // 3. 総合スコア計算
    const totalScore = scoredSignals.reduce((sum, s) => sum + s.contribution, 0);

    // 4. AIによる購買確率予測
    const buyingProbability = await this.predictProbability(scoredSignals);

    // 5. セグメント分類
    const segments = this.classifySegments(totalScore, scoredSignals);

    // 6. 推奨アクション生成
    const recommendations = await this.generateRecommendations(scoredSignals);

    return {
      totalScore: Math.min(100, totalScore),
      buyingProbability,
      segments,
      signals: scoredSignals,
      recommendations,
    };
  }

  private async predictProbability(signals: ScoringSignal[]): Promise<number> {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 100,
      system: `リードスコアリングの専門家として、購買確率を0-1で予測してください。
JSON形式: {"probability": 0.XX, "reasoning": "簡潔な理由"}`,
      messages: [{
        role: 'user',
        content: `シグナルデータ:\n${JSON.stringify(signals)}`,
      }],
    });

    const result = JSON.parse(response.content[0].text);
    return result.probability;
  }
}
```

### 4.3 A/Bテスト自動最適化

```typescript
// src/lib/ai/optimization/ab-test-optimizer.ts
export interface ABTestConfig {
  variants: Variant[];
  metric: 'conversion' | 'engagement' | 'revenue';
  minSampleSize: number;
  confidenceLevel: number;
  autoOptimize: boolean;
}

export class ABTestOptimizer {
  async evaluateTest(testId: string): Promise<TestEvaluation> {
    const test = await this.getTest(testId);
    const results = await this.getResults(testId);

    // 1. 統計的有意性チェック
    const significance = this.calculateSignificance(results);

    // 2. 勝者判定
    const winner = this.determineWinner(results, significance);

    // 3. AI による分析と提案
    const analysis = await this.analyzeWithAI(test, results);

    return {
      testId,
      status: significance.isSignificant ? 'conclusive' : 'running',
      winner,
      significance,
      analysis,
      recommendation: analysis.recommendation,
    };
  }

  private async analyzeWithAI(
    test: ABTest,
    results: TestResults
  ): Promise<AIAnalysis> {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      system: `A/Bテストの分析専門家として、結果を分析し、
次のステップを提案してください。`,
      messages: [{
        role: 'user',
        content: `テスト設定:\n${JSON.stringify(test)}\n\n結果:\n${JSON.stringify(results)}`,
      }],
    });

    return JSON.parse(response.content[0].text);
  }

  // 自動最適化（トラフィック配分の動的調整）
  async autoOptimize(testId: string): Promise<void> {
    const evaluation = await this.evaluateTest(testId);

    if (!evaluation.significance.isSignificant) {
      // Multi-Armed Bandit アルゴリズムで動的配分
      const allocations = this.calculateBanditAllocation(evaluation);
      await this.updateTrafficAllocation(testId, allocations);
    }
  }
}
```

---

## 5. 技術スタック推奨

### 5.1 AI / ML

| 用途 | 推奨技術 | 理由 |
|------|---------|------|
| メインLLM | Claude 3.5 Sonnet | 高精度、日本語対応良好 |
| 高速処理 | Claude 3.5 Haiku | コスト効率、レイテンシ |
| 埋め込み | text-embedding-3-large | 高品質、多言語対応 |
| ベクトルDB | Qdrant | 高性能、自己ホスト可 |

### 5.2 インフラ

| 用途 | 推奨技術 | 理由 |
|------|---------|------|
| キャッシュ | Redis | 低レイテンシ、Pub/Sub |
| メッセージキュー | BullMQ | Redis ベース、信頼性高 |
| ストリーミング | Vercel AI SDK | Next.js 統合、簡単 |
| モニタリング | Langfuse | LLM特化、コスト追跡 |

### 5.3 フロントエンド

| 用途 | 推奨技術 | 理由 |
|------|---------|------|
| ワークフローUI | React Flow | 高機能、カスタマイズ性 |
| リアルタイム | Socket.io | 安定、スケーラブル |
| 状態管理 | Zustand | シンプル、高性能 |

---

## 6. コスト見積もり

### 6.1 月間運用コスト（1,000アクティブユーザー想定）

| 項目 | 単価 | 月間使用量 | 月額コスト |
|------|------|----------|-----------|
| Claude API（Sonnet） | $3/MTok | 50 MTok | $150 |
| Claude API（Haiku） | $0.25/MTok | 100 MTok | $25 |
| OpenAI Embeddings | $0.13/MTok | 20 MTok | $2.6 |
| Qdrant Cloud | - | - | $50 |
| Redis Cloud | - | - | $30 |
| Vercel Pro | - | - | $20 |
| **合計** | | | **約 $280/月** |

### 6.2 初期開発コスト

| フェーズ | 工数 | コスト目安 |
|---------|------|-----------|
| Phase 1 | 160h | ¥800,000 |
| Phase 2 | 200h | ¥1,000,000 |
| Phase 3 | 240h | ¥1,200,000 |
| **合計** | **600h** | **¥3,000,000** |

---

## 7. KPI・成功指標

### 7.1 AI品質指標

| 指標 | 現状 | 目標 | 測定方法 |
|------|------|------|---------|
| AI応答精度 | 70% | 95% | 人間評価 |
| 自動解決率 | 40% | 75% | エスカレーション率 |
| 顧客満足度 | - | 4.5/5.0 | CSAT調査 |
| 平均応答時間 | 5秒 | 1秒 | APM |

### 7.2 ビジネス指標

| 指標 | 現状 | 目標 | 測定方法 |
|------|------|------|---------|
| CVR改善 | - | +30% | A/Bテスト |
| サポートコスト削減 | - | -40% | 人件費比較 |
| リード品質スコア | - | +25% | スコアリング |

### 7.3 技術指標

| 指標 | 現状 | 目標 | 測定方法 |
|------|------|------|---------|
| API可用性 | 99% | 99.9% | アップタイム |
| P95レイテンシ | 2秒 | 500ms | APM |
| エラー率 | 5% | 0.5% | ログ分析 |

---

## 次のステップ

1. **今週中**: Phase 1 の詳細設計レビュー
2. **来週**: Qdrant / Redis 環境構築
3. **2週間後**: RAG パイプライン MVP 完成
4. **1ヶ月後**: Phase 1 完了、Phase 2 開始

---

*このドキュメントは実装の進捗に応じて更新されます。*
