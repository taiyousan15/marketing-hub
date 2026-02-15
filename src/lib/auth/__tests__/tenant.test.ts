import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  tenant: { upsert: vi.fn(), findFirst: vi.fn() },
  user: { upsert: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn() },
  $transaction: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }))

import { getCurrentUser, createTenantForUser, withTenantFilter } from '../tenant'

describe('tenant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('withTenantFilter', () => {
    it('should add tenantId to where clause', () => {
      const where = { status: 'active' } as any
      const result = withTenantFilter('tenant-1', where)
      expect(result).toEqual({ status: 'active', tenantId: 'tenant-1' })
    })

    it('should override existing tenantId', () => {
      const result = withTenantFilter('tenant-2', { tenantId: 'old', name: 'test' })
      expect(result.tenantId).toBe('tenant-2')
    })

    it('should work with empty where clause', () => {
      const result = withTenantFilter('tenant-1', {})
      expect(result).toEqual({ tenantId: 'tenant-1' })
    })
  })

  describe('getCurrentUser', () => {
    it('should return dev tenant when Clerk not configured', async () => {
      const mockTenant = { id: 'dev-tenant-id', name: '開発用ワークスペース' }
      const mockUser = { id: 'dev-user-id', email: 'dev@example.com', tenant: mockTenant }

      mockPrisma.tenant.upsert.mockResolvedValue(mockTenant)
      mockPrisma.user.upsert.mockResolvedValue(mockUser)

      const result = await getCurrentUser()

      expect(result).not.toBeNull()
      expect(result!.userId).toBe('dev-user-id')
      expect(result!.tenantId).toBe('dev-tenant-id')
      expect(mockPrisma.tenant.upsert).toHaveBeenCalled()
      expect(mockPrisma.user.upsert).toHaveBeenCalled()
    })

    it('should fallback to findFirst when upsert fails', async () => {
      const mockTenant = { id: 'existing-tenant', name: '開発用ワークスペース' }
      const mockUser = { id: 'existing-user', email: 'dev@example.com', tenant: mockTenant }

      mockPrisma.tenant.upsert.mockRejectedValue(new Error('upsert failed'))
      mockPrisma.tenant.findFirst.mockResolvedValue(mockTenant)
      mockPrisma.user.findFirst.mockResolvedValue(mockUser)

      const result = await getCurrentUser()

      expect(result).not.toBeNull()
      expect(result!.userId).toBe('existing-user')
      expect(result!.tenantId).toBe('existing-tenant')
    })

    it('should throw when upsert fails and no existing data', async () => {
      const error = new Error('upsert failed')
      mockPrisma.tenant.upsert.mockRejectedValue(error)
      mockPrisma.tenant.findFirst.mockResolvedValue(null)
      mockPrisma.user.findFirst.mockResolvedValue(null)

      await expect(getCurrentUser()).rejects.toThrow('upsert failed')
    })
  })

  describe('createTenantForUser', () => {
    it('should return existing user if found', async () => {
      const existingUser = {
        id: 'user-1',
        clerkUserId: 'clerk-1',
        email: 'test@test.com',
        tenant: { id: 'tenant-1', name: 'Workspace' },
      }

      mockPrisma.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        return cb({
          user: {
            findUnique: vi.fn().mockResolvedValue(existingUser),
            create: vi.fn(),
          },
          tenant: { create: vi.fn() },
        })
      })

      const result = await createTenantForUser('clerk-1', 'test@test.com', 'Test')
      expect(result.user).toEqual(existingUser)
      expect(result.tenant).toEqual(existingUser.tenant)
    })

    it('should create new tenant and user when not found', async () => {
      const newTenant = { id: 'new-tenant', name: 'Newのワークスペース' }
      const newUser = { id: 'new-user', clerkUserId: 'clerk-2' }

      mockPrisma.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        return cb({
          user: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue(newUser),
          },
          tenant: {
            create: vi.fn().mockResolvedValue(newTenant),
          },
        })
      })

      const result = await createTenantForUser('clerk-2', 'new@test.com', 'New')
      expect(result.user).toEqual(newUser)
      expect(result.tenant).toEqual(newTenant)
    })
  })
})
