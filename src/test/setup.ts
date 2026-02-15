import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock Prisma client for all tests
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    tenant: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
    contact: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    sMSSettings: { findUnique: vi.fn() },
    sMSLog: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    messageHistory: { create: vi.fn() },
    $transaction: vi.fn(),
  },
  default: {},
}));
