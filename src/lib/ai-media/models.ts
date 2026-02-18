/**
 * AI image/video generation model registry.
 * Update this file to add new models as they become available.
 * All models use fal.ai or direct provider APIs.
 *
 * Last updated: 2026-02 (based on latest model benchmarks)
 * Sources: HuggingFace Arena ELO, teamday.ai rankings, wavespeed.ai guide
 */

export interface ImageModel {
  id: string;
  name: string;
  provider: "fal" | "openai" | "google";
  apiId: string;
  description: string;
  pricePerImage?: number; // USD estimate at 1024x1024
  quality: "standard" | "high" | "premium";
  supportsNegativePrompt: boolean;
  aspectRatios: string[];
}

export interface VideoModel {
  id: string;
  name: string;
  provider: "fal" | "openai" | "google" | "runway";
  apiId: string;
  description: string;
  pricePerSecond?: number; // USD estimate
  maxDuration: number; // seconds
  resolutions: string[];
  supportsImageToVideo: boolean;
}

/**
 * Image generation models — ranked by benchmark (2026-02).
 * Rankings: Recraft V3 (#1 ELO 1172) > FLUX.2 Pro (#2 ELO 1143) > GPT Image 1 > Ideogram > DALL-E 3
 * fal.ai is the primary API gateway for non-OpenAI models.
 */
export const IMAGE_MODELS: ImageModel[] = [
  {
    id: "recraft-v3",
    name: "Recraft V3",
    provider: "fal",
    apiId: "fal-ai/recraft-v3",
    description: "2026年ベンチマーク1位（ELO 1172）。ロゴ・アイコン・SVGベクター生成に最強。ブランド資産制作向け。",
    pricePerImage: 0.04,
    quality: "premium",
    supportsNegativePrompt: false,
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
  },
  {
    id: "flux-2-pro",
    name: "FLUX.2 [pro]",
    provider: "fal",
    apiId: "fal-ai/flux-2-pro",
    description: "Black Forest Labsのプロ品質モデル（ELO 1143）。フォトリアリズムと人物表現に優秀。",
    pricePerImage: 0.03,
    quality: "premium",
    supportsNegativePrompt: false,
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9"],
  },
  {
    id: "flux-2-dev",
    name: "FLUX.2 [dev]",
    provider: "fal",
    apiId: "fal-ai/flux-2",
    description: "高品質でコスト効率の良いオープンソースモデル。LoRAサポート対応。",
    pricePerImage: 0.012,
    quality: "high",
    supportsNegativePrompt: false,
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
  },
  {
    id: "gpt-image-1",
    name: "GPT Image 1",
    provider: "openai",
    apiId: "gpt-image-1",
    description: "OpenAIフラグシップ。テキスト描画・マーケ素材に最適。品質=medium時の参考単価。",
    pricePerImage: 0.042,
    quality: "premium",
    supportsNegativePrompt: false,
    aspectRatios: ["1:1", "16:9", "9:16"],
  },
  {
    id: "dall-e-3",
    name: "DALL-E 3",
    provider: "openai",
    apiId: "dall-e-3",
    description: "OpenAIの実績あるモデル。創造的で高品質な画像生成が得意。",
    pricePerImage: 0.04,
    quality: "high",
    supportsNegativePrompt: false,
    aspectRatios: ["1:1", "16:9", "9:16"],
  },
];

/**
 * Video generation models — ranked by quality (2026-02).
 * Rankings: Veo 3.2 (#1 物理リアリズム) > Kling 3.0 (#2 人物動作) > Hailuo 02 > Wan 2.6 (最安値)
 * All hosted on fal.ai for unified API access.
 */
export const VIDEO_MODELS: VideoModel[] = [
  {
    id: "kling-3-pro",
    name: "Kling 3.0 Pro",
    provider: "fal",
    apiId: "fal-ai/kling-video/v2.1/pro/text-to-video",
    description: "Kuaishouの最新モデル。自然な動きと人物表現が優秀。コスト効率高。",
    pricePerSecond: 0.10,
    maxDuration: 10,
    resolutions: ["720p", "1080p"],
    supportsImageToVideo: true,
  },
  {
    id: "hailuo-02",
    name: "Hailuo 02 (MiniMax)",
    provider: "fal",
    apiId: "fal-ai/minimax/hailuo-02/text-to-video",
    description: "MiniMaxの最新モデル。物理リアリズムが高くコスパ優秀。768p標準品質。",
    pricePerSecond: 0.045,
    maxDuration: 10,
    resolutions: ["768p", "1080p"],
    supportsImageToVideo: true,
  },
  {
    id: "wan-2-6",
    name: "Wan 2.6",
    provider: "fal",
    apiId: "fal-ai/wan-video/v2.6/text-to-video",
    description: "Alibabaのオープンソースモデル。最安値クラスで高解像度対応。",
    pricePerSecond: 0.05,
    maxDuration: 10,
    resolutions: ["480p", "720p", "1080p"],
    supportsImageToVideo: true,
  },
  {
    id: "seedance-2",
    name: "Seedance 2.0",
    provider: "fal",
    apiId: "fal-ai/seedance/v2/text-to-video",
    description: "ByteDanceの最新モデル。2K解像度・最長15秒・マルチモーダル入力対応。",
    pricePerSecond: 0.12,
    maxDuration: 15,
    resolutions: ["720p", "1080p", "2K"],
    supportsImageToVideo: true,
  },
  {
    id: "veo-3-2",
    name: "Veo 3.2",
    provider: "fal",
    apiId: "fal-ai/veo/v3.2/text-to-video",
    description: "Googleの映画品質モデル。物理表現・照明・カメラ制御が最高水準。",
    pricePerSecond: 0.20,
    maxDuration: 10,
    resolutions: ["720p", "1080p"],
    supportsImageToVideo: false,
  },
];
