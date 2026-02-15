/**
 * オファーA/Bテストシステム（開発中）
 *
 * TODO: Implement when auto-webinar tables are added to Prisma schema
 */

import { ABTestStatus, ABTestAlgorithm } from "@prisma/client";

// 型定義
interface VariantStats {
  id: string;
  name: string;
  impressions: number;
  clicks: number;
  conversions: number;
  clickRate: number;
  conversionRate: number;
  weight: number;
}

interface ABTestResult {
  testId: string;
  status: ABTestStatus;
  variants: VariantStats[];
  winner: VariantStats | null;
  isSignificant: boolean;
  confidenceLevel: number;
  pValue: number | null;
  improvement: number | null;
}

// Stub implementations
export async function assignVariant(
  testId: string,
  sessionId: string,
  contactId?: string
): Promise<string | null> {
  console.log("assignVariant called - auto-webinar feature under development");
  return null;
}

export async function analyzeABTest(testId: string): Promise<ABTestResult> {
  console.log("analyzeABTest called - auto-webinar feature under development");
  return {
    testId,
    status: ABTestStatus.DRAFT,
    variants: [],
    winner: null,
    isSignificant: false,
    confidenceLevel: 0,
    pValue: null,
    improvement: null,
  };
}

export async function startABTest(testId: string) {
  console.log("startABTest called - auto-webinar feature under development");
}

export async function pauseABTest(testId: string) {
  console.log("pauseABTest called - auto-webinar feature under development");
}

export async function completeABTest(testId: string, winnerId: string) {
  console.log("completeABTest called - auto-webinar feature under development");
}

export async function recordImpression(testId: string, sessionId: string) {
  console.log("recordImpression called - auto-webinar feature under development");
}

export async function recordClick(testId: string, sessionId: string) {
  console.log("recordClick called - auto-webinar feature under development");
}

export async function recordConversion(testId: string, sessionId: string) {
  console.log("recordConversion called - auto-webinar feature under development");
}

export async function getOfferVariant(
  testId: string,
  sessionId: string
): Promise<any | null> {
  console.log("getOfferVariant called - auto-webinar feature under development");
  return null;
}
