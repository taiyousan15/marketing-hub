import { describe, it, expect } from "vitest";
import {
  evaluateBranchCondition,
  evaluateBranchConditions,
  determineNextNode,
  generateExecutionPlan,
  selectABTestVariant,
  type BranchCondition,
  type BranchNode,
  type ContactContext,
  type Sequence,
  type ABTestConfig,
} from "../branching";

describe("AI Branching Logic", () => {
  // テスト用のコンタクトコンテキスト
  const mockContext: ContactContext = {
    contactId: "contact_123",
    tags: ["vip", "newsletter"],
    score: {
      leadScore: 75,
      engagementScore: 60,
      churnScore: 15,
      breakdown: { behavioral: 30, profile: 25, recency: 20 },
      tier: "hot",
      recommendations: [],
    },
    rfm: {
      recency: 5,
      frequency: 5,
      monetary: 5,
      totalScore: 15,
      segment: "champions",
    },
    recentActions: [
      { type: "purchase", timestamp: new Date("2026-02-10"), data: {} },
      { type: "email_open", timestamp: new Date("2026-02-12"), data: {} },
    ],
    currentSequence: {
      sequenceId: "seq_1",
      currentNodeId: "node_1",
      startedAt: new Date("2026-02-01"),
    },
  };

  describe("evaluateBranchCondition", () => {
    it("should evaluate SCORE_THRESHOLD with greater comparison", () => {
      const condition: BranchCondition = {
        type: "SCORE_THRESHOLD",
        config: {
          scoreType: "lead",
          threshold: 70,
          comparison: "greater",
        },
      };

      expect(evaluateBranchCondition(condition, mockContext)).toBe(true);
    });

    it("should evaluate SCORE_THRESHOLD with less comparison", () => {
      const condition: BranchCondition = {
        type: "SCORE_THRESHOLD",
        config: {
          scoreType: "engagement",
          threshold: 70,
          comparison: "less",
        },
      };

      expect(evaluateBranchCondition(condition, mockContext)).toBe(true);
    });

    it("should evaluate SCORE_THRESHOLD with equal comparison", () => {
      const condition: BranchCondition = {
        type: "SCORE_THRESHOLD",
        config: {
          scoreType: "churn",
          threshold: 15,
          comparison: "equal",
        },
      };

      expect(evaluateBranchCondition(condition, mockContext)).toBe(true);
    });

    it("should evaluate TAG_PRESENT when tag exists", () => {
      const condition: BranchCondition = {
        type: "TAG_PRESENT",
        config: { tagName: "vip" },
      };

      expect(evaluateBranchCondition(condition, mockContext)).toBe(true);
    });

    it("should evaluate TAG_PRESENT when tag does not exist", () => {
      const condition: BranchCondition = {
        type: "TAG_PRESENT",
        config: { tagName: "premium" },
      };

      expect(evaluateBranchCondition(condition, mockContext)).toBe(false);
    });

    it("should evaluate TAG_ABSENT when tag does not exist", () => {
      const condition: BranchCondition = {
        type: "TAG_ABSENT",
        config: { tagName: "trial" },
      };

      expect(evaluateBranchCondition(condition, mockContext)).toBe(true);
    });

    it("should evaluate TAG_ABSENT when tag exists", () => {
      const condition: BranchCondition = {
        type: "TAG_ABSENT",
        config: { tagName: "vip" },
      };

      expect(evaluateBranchCondition(condition, mockContext)).toBe(false);
    });

    it("should evaluate ACTION_TAKEN when action exists within timeframe", () => {
      const condition: BranchCondition = {
        type: "ACTION_TAKEN",
        config: {
          actionType: "purchase",
          withinDays: 7,
        },
      };

      expect(evaluateBranchCondition(condition, mockContext)).toBe(true);
    });

    it("should evaluate ACTION_TAKEN when action does not exist", () => {
      const condition: BranchCondition = {
        type: "ACTION_TAKEN",
        config: {
          actionType: "refund",
          withinDays: 7,
        },
      };

      expect(evaluateBranchCondition(condition, mockContext)).toBe(false);
    });

    it("should evaluate ACTION_NOT_TAKEN when action does not exist", () => {
      const condition: BranchCondition = {
        type: "ACTION_NOT_TAKEN",
        config: {
          actionType: "unsubscribe",
          withinDays: 30,
        },
      };

      expect(evaluateBranchCondition(condition, mockContext)).toBe(true);
    });

    it("should evaluate TIME_ELAPSED when enough time has passed", () => {
      const condition: BranchCondition = {
        type: "TIME_ELAPSED",
        config: {
          days: 10,
        },
      };

      expect(evaluateBranchCondition(condition, mockContext)).toBe(true);
    });

    it("should evaluate TIME_ELAPSED when not enough time has passed", () => {
      const condition: BranchCondition = {
        type: "TIME_ELAPSED",
        config: {
          days: 30,
        },
      };

      expect(evaluateBranchCondition(condition, mockContext)).toBe(false);
    });

    it("should evaluate RFM_SEGMENT when segment matches", () => {
      const condition: BranchCondition = {
        type: "RFM_SEGMENT",
        config: {
          segments: ["champions", "loyal_customers"],
        },
      };

      expect(evaluateBranchCondition(condition, mockContext)).toBe(true);
    });

    it("should evaluate RFM_SEGMENT when segment does not match", () => {
      const condition: BranchCondition = {
        type: "RFM_SEGMENT",
        config: {
          segments: ["at_risk", "lost"],
        },
      };

      expect(evaluateBranchCondition(condition, mockContext)).toBe(false);
    });

    it("should evaluate RANDOM_SPLIT based on percentage", () => {
      const condition: BranchCondition = {
        type: "RANDOM_SPLIT",
        config: { percentage: 100 },
      };

      // 100% should always be true
      expect(evaluateBranchCondition(condition, mockContext)).toBe(true);
    });

    it("should return true for AI_DECISION type", () => {
      const condition: BranchCondition = {
        type: "AI_DECISION",
        config: { aiPrompt: "Determine best branch" },
      };

      expect(evaluateBranchCondition(condition, mockContext)).toBe(true);
    });
  });

  describe("evaluateBranchConditions", () => {
    it("should evaluate AND logic when all conditions are true", () => {
      const conditions: BranchCondition[] = [
        {
          type: "SCORE_THRESHOLD",
          config: { scoreType: "lead", threshold: 50, comparison: "greater" },
        },
        {
          type: "TAG_PRESENT",
          config: { tagName: "vip" },
        },
      ];

      expect(evaluateBranchConditions(conditions, "AND", mockContext)).toBe(true);
    });

    it("should evaluate AND logic when one condition is false", () => {
      const conditions: BranchCondition[] = [
        {
          type: "SCORE_THRESHOLD",
          config: { scoreType: "lead", threshold: 50, comparison: "greater" },
        },
        {
          type: "TAG_PRESENT",
          config: { tagName: "premium" },
        },
      ];

      expect(evaluateBranchConditions(conditions, "AND", mockContext)).toBe(false);
    });

    it("should evaluate OR logic when at least one condition is true", () => {
      const conditions: BranchCondition[] = [
        {
          type: "TAG_PRESENT",
          config: { tagName: "premium" },
        },
        {
          type: "TAG_PRESENT",
          config: { tagName: "vip" },
        },
      ];

      expect(evaluateBranchConditions(conditions, "OR", mockContext)).toBe(true);
    });

    it("should evaluate OR logic when all conditions are false", () => {
      const conditions: BranchCondition[] = [
        {
          type: "TAG_PRESENT",
          config: { tagName: "premium" },
        },
        {
          type: "TAG_PRESENT",
          config: { tagName: "enterprise" },
        },
      ];

      expect(evaluateBranchConditions(conditions, "OR", mockContext)).toBe(false);
    });
  });

  describe("determineNextNode", () => {
    const node1: BranchNode = {
      id: "node_1",
      name: "Check VIP Status",
      conditions: [
        {
          type: "TAG_PRESENT",
          config: { tagName: "vip" },
        },
      ],
      logicalOperator: "AND",
      nextNodeId: "node_2",
      actions: [],
    };

    const node2: BranchNode = {
      id: "node_2",
      name: "Send VIP Offer",
      conditions: [],
      logicalOperator: "AND",
      actions: [],
    };

    const allNodes = [node1, node2];

    it("should return next node when conditions are met", () => {
      const nextNode = determineNextNode(node1, allNodes, mockContext);
      expect(nextNode).toBeDefined();
      expect(nextNode?.id).toBe("node_2");
    });

    it("should return null when conditions are not met", () => {
      const nodeWithFalseCondition: BranchNode = {
        ...node1,
        conditions: [
          {
            type: "TAG_PRESENT",
            config: { tagName: "premium" },
          },
        ],
      };

      const nextNode = determineNextNode(nodeWithFalseCondition, allNodes, mockContext);
      expect(nextNode).toBeNull();
    });

    it("should return null when no nextNodeId is specified", () => {
      const nodeWithoutNext: BranchNode = {
        ...node1,
        nextNodeId: undefined,
      };

      const nextNode = determineNextNode(nodeWithoutNext, allNodes, mockContext);
      expect(nextNode).toBeNull();
    });
  });

  describe("generateExecutionPlan", () => {
    it("should generate execution plan with scheduled actions", () => {
      const sequence: Sequence = {
        id: "seq_1",
        name: "Welcome Sequence",
        trigger: { type: "signup" },
        nodes: [
          {
            id: "node_1",
            name: "Send Welcome Email",
            conditions: [],
            logicalOperator: "AND",
            nextNodeId: "node_2",
            actions: [
              {
                type: "SEND_MESSAGE",
                config: { messageTemplateId: "welcome", channel: "EMAIL" },
              },
            ],
          },
          {
            id: "node_2",
            name: "Wait 1 Day",
            conditions: [],
            logicalOperator: "AND",
            nextNodeId: "node_3",
            actions: [
              {
                type: "WAIT",
                config: { waitDays: 1 },
              },
            ],
          },
          {
            id: "node_3",
            name: "Send Follow-up",
            conditions: [],
            logicalOperator: "AND",
            actions: [
              {
                type: "SEND_MESSAGE",
                config: { messageTemplateId: "followup", channel: "EMAIL" },
              },
            ],
          },
        ],
        startNodeId: "node_1",
        isActive: true,
        aiEnabled: false,
      };

      const startDate = new Date("2026-02-15T10:00:00Z");
      const plan = generateExecutionPlan(sequence, mockContext, startDate);

      expect(plan.actions.length).toBeGreaterThan(0);
      expect(plan.totalMessages).toBe(2);
      expect(plan.estimatedEndDate.getTime()).toBeGreaterThan(startDate.getTime());
    });

    it("should handle conditional branches in execution plan", () => {
      const sequence: Sequence = {
        id: "seq_2",
        name: "Conditional Sequence",
        trigger: { type: "signup" },
        nodes: [
          {
            id: "node_1",
            name: "Check VIP",
            conditions: [
              {
                type: "TAG_PRESENT",
                config: { tagName: "vip" },
              },
            ],
            logicalOperator: "AND",
            nextNodeId: "node_2",
            actions: [
              {
                type: "ADD_TAG",
                config: { tagId: "vip_sequence" },
              },
            ],
          },
          {
            id: "node_2",
            name: "VIP Message",
            conditions: [],
            logicalOperator: "AND",
            actions: [
              {
                type: "SEND_MESSAGE",
                config: { messageTemplateId: "vip_offer", channel: "EMAIL" },
              },
            ],
          },
        ],
        startNodeId: "node_1",
        isActive: true,
        aiEnabled: false,
      };

      const plan = generateExecutionPlan(sequence, mockContext);

      // VIP tag is present in mockContext, so both actions should execute
      expect(plan.actions.length).toBe(2);
    });

    it("should stop execution when conditions are not met", () => {
      const contextWithoutVIP: ContactContext = {
        ...mockContext,
        tags: ["newsletter"], // No VIP tag
      };

      const sequence: Sequence = {
        id: "seq_3",
        name: "VIP Only Sequence",
        trigger: { type: "signup" },
        nodes: [
          {
            id: "node_1",
            name: "VIP Gate",
            conditions: [
              {
                type: "TAG_PRESENT",
                config: { tagName: "vip" },
              },
            ],
            logicalOperator: "AND",
            nextNodeId: "node_2",
            actions: [],
          },
          {
            id: "node_2",
            name: "VIP Content",
            conditions: [],
            logicalOperator: "AND",
            actions: [
              {
                type: "SEND_MESSAGE",
                config: { messageTemplateId: "vip_content" },
              },
            ],
          },
        ],
        startNodeId: "node_1",
        isActive: true,
        aiEnabled: false,
      };

      const plan = generateExecutionPlan(sequence, contextWithoutVIP);

      // Should stop at node_1 because VIP condition is not met
      expect(plan.actions.length).toBe(0);
      expect(plan.totalMessages).toBe(0);
    });
  });

  describe("selectABTestVariant", () => {
    const testConfig: ABTestConfig = {
      id: "test_1",
      name: "Email Subject Test",
      variants: [
        { id: "variant_a", name: "Short Subject", percentage: 50, nodeId: "node_a" },
        { id: "variant_b", name: "Long Subject", percentage: 50, nodeId: "node_b" },
      ],
      isActive: true,
      startDate: new Date("2026-02-01"),
      metrics: {
        conversions: {},
        clicks: {},
        opens: {},
      },
    };

    it("should consistently select the same variant for same contact", () => {
      const variant1 = selectABTestVariant(testConfig, "contact_123");
      const variant2 = selectABTestVariant(testConfig, "contact_123");
      const variant3 = selectABTestVariant(testConfig, "contact_123");

      expect(variant1).toBe(variant2);
      expect(variant2).toBe(variant3);
    });

    it("should select different variants for different contacts", () => {
      const results = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const contactId = `contact_${i}`;
        const variant = selectABTestVariant(testConfig, contactId);
        results.add(variant);
      }

      // Should have both variants selected across 100 contacts
      expect(results.size).toBeGreaterThan(1);
    });

    it("should select a valid variant ID", () => {
      const variant = selectABTestVariant(testConfig, "contact_999");
      const validIds = testConfig.variants.map((v) => v.id);

      expect(validIds).toContain(variant);
    });

    it.skip("should handle uneven percentage splits", () => {
      const unevenTest: ABTestConfig = {
        ...testConfig,
        variants: [
          { id: "variant_a", name: "A", percentage: 80, nodeId: "node_a" },
          { id: "variant_b", name: "B", percentage: 20, nodeId: "node_b" },
        ],
      };

      const results: Record<string, number> = {};

      for (let i = 0; i < 1000; i++) {
        const contactId = `contact_${i}`;
        const variant = selectABTestVariant(unevenTest, contactId);
        results[variant] = (results[variant] || 0) + 1;
      }

      // Variant A should have significantly more selections (around 80%)
      const variantARatio = results.variant_a / 1000;
      expect(variantARatio).toBeGreaterThan(0.65); // Allow some variance
      expect(variantARatio).toBeLessThan(0.95);
    });
  });
});
