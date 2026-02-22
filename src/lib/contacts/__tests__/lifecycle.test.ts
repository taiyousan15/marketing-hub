import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  contact: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }))

import { advanceLifecycleStage } from '../lifecycle'

describe('advanceLifecycleStage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('contactが存在しない場合は何もしない', async () => {
    mockPrisma.contact.findUnique.mockResolvedValue(null)

    await advanceLifecycleStage('nonexistent-id', 'LEAD')

    expect(mockPrisma.contact.findUnique).toHaveBeenCalledWith({
      where: { id: 'nonexistent-id' },
      select: { lifecycleStage: true },
    })
    expect(mockPrisma.contact.update).not.toHaveBeenCalled()
  })

  it('targetが現在と同じステージの場合は更新しない', async () => {
    mockPrisma.contact.findUnique.mockResolvedValue({ lifecycleStage: 'LEAD' })

    await advanceLifecycleStage('contact-1', 'LEAD')

    expect(mockPrisma.contact.update).not.toHaveBeenCalled()
  })

  it('targetが現在より低いステージの場合は更新しない（降格防止）', async () => {
    mockPrisma.contact.findUnique.mockResolvedValue({ lifecycleStage: 'SQL' })

    await advanceLifecycleStage('contact-1', 'MQL')

    expect(mockPrisma.contact.update).not.toHaveBeenCalled()
  })

  it('targetが現在より高いステージの場合は更新する', async () => {
    mockPrisma.contact.findUnique.mockResolvedValue({ lifecycleStage: 'LEAD' })
    mockPrisma.contact.update.mockResolvedValue({ id: 'contact-1', lifecycleStage: 'MQL' })

    await advanceLifecycleStage('contact-1', 'MQL')

    expect(mockPrisma.contact.update).toHaveBeenCalledWith({
      where: { id: 'contact-1' },
      data: { lifecycleStage: 'MQL' },
    })
  })

  it('SUBSCRIBERからCUSTOMERへ昇格する', async () => {
    mockPrisma.contact.findUnique.mockResolvedValue({ lifecycleStage: 'SUBSCRIBER' })
    mockPrisma.contact.update.mockResolvedValue({ id: 'contact-1', lifecycleStage: 'CUSTOMER' })

    await advanceLifecycleStage('contact-1', 'CUSTOMER')

    expect(mockPrisma.contact.update).toHaveBeenCalledWith({
      where: { id: 'contact-1' },
      data: { lifecycleStage: 'CUSTOMER' },
    })
  })

  it('CUSTOMERからLEADへ降格しようとしても更新しない', async () => {
    mockPrisma.contact.findUnique.mockResolvedValue({ lifecycleStage: 'CUSTOMER' })

    await advanceLifecycleStage('contact-1', 'LEAD')

    expect(mockPrisma.contact.update).not.toHaveBeenCalled()
  })
})
