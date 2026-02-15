/**
 * AI Engine Index
 *
 * 全AIエンジンのエクスポートとファクトリ関数
 */

// Intent Analyzer
export {
  type PurchaseIntentLevel,
  type PurchaseBarrier,
  type CustomerPsychologyPhase,
  type IntentAnalysisResult,
  type BehaviorSignal,
  type BranchDecision,
  calculateIntentScoreFromMessage,
  calculateIntentScoreFromBehaviors,
  determineIntentLevel,
  decideBranch
} from "./intent-analyzer";

// Sentiment Analyzer
export {
  type SentimentType,
  type EmotionType,
  type SentimentAnalysisResult,
  analyzeWithKeywords,
  analyzeSentimentTrend,
  getEmotionLabel,
  getSentimentColor
} from "./sentiment-analyzer";

// Content Generator
export {
  type ContentType,
  type ContentTone,
  type ContentPurpose,
  type ContentContext,
  type GeneratedContent
} from "./content-generator";

// Predictive Engine
export {
  type PredictionType,
  type PredictionInput,
  type ConversionPrediction,
  type ChurnPrediction,
  type LTVPrediction,
  type SendTimePrediction,
  type ChannelPrediction,
  type NextActionPrediction
} from "./predictive-engine";

// A/B Optimizer
export {
  type ABTestAlgorithm,
  type ABTestStatus,
  type ABTestMetric,
  type ABVariant,
  type ABTest,
  selectVariantEpsilonGreedy,
  selectVariantUCB1,
  selectVariantThompsonSampling,
  selectVariantFixedSplit,
  selectVariant,
  calculateConfidenceInterval,
  testSignificance,
  determineWinner,
  createABTest,
  recordResult,
  startTest,
  completeTest,
  generateReport,
  type ABTestReport
} from "./ab-optimizer";

// Autopilot
export {
  AutopilotSystem,
  createAutopilot,
  type AutopilotConfig,
  type AutopilotState,
  type AutopilotEvent,
  type AutomatedAction,
  type DecisionLog,
  type PriorityRule,
  type SafetyGuard,
  type CustomerPrediction
} from "./autopilot";

// Local LLM (Ollama)
export {
  checkOllamaHealth,
  generateSimulatedChat,
  generateOfferCopy,
  generateText,
  generateTextStream,
  summarizeWebinarContent,
  generateQuestionAnswer,
  type GeneratedChatMessage,
  type GeneratedOffer,
  type LLMGenerateOptions
} from "./local-llm";
