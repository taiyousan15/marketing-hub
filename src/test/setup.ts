import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock'
process.env.CLERK_SECRET_KEY = 'sk_test_mock'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  auth: () => ({
    userId: 'test-user-id',
    sessionId: 'test-session-id',
  }),
  currentUser: () => ({
    id: 'test-user-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
  }),
}))

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              action: 'send_email',
              confidence: 0.95,
              reasoning: 'Mock AI decision',
            }),
          },
        ],
      }),
    }
  },
}))

// Mock Prisma Client
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    contact: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    autopilotDecision: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    aBTest: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}))
