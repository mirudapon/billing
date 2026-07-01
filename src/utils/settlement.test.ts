import { describe, it, expect } from 'vitest'
import { calculateSettlement } from './settlement'
import { Trip } from '../types'

const makeTrip = (overrides: Partial<Trip> = {}): Trip => ({
  id: 'trip-1',
  name: 'Test Trip',
  baseCurrency: 'TWD',
  createdAt: '2026-07-01T00:00:00.000Z',
  members: [
    { id: 'alice', name: 'Alice' },
    { id: 'bob', name: 'Bob' },
    { id: 'carol', name: 'Carol' },
  ],
  expenses: [],
  ...overrides,
})

describe('calculateSettlement', () => {
  it('returns empty array when no expenses', () => {
    const result = calculateSettlement(makeTrip())
    expect(result).toEqual([])
  })

  it('returns empty array when all members paid equally and split equally', () => {
    const trip = makeTrip({
      members: [
        { id: 'alice', name: 'Alice' },
        { id: 'bob', name: 'Bob' },
      ],
      expenses: [
        {
          id: 'e1',
          date: '2026-07-01',
          description: 'Lunch',
          category: '餐飲',
          paymentMethod: '現金',
          paidBy: 'alice',
          amount: 200,
          currency: 'TWD',
          exchangeRate: 1,
          splits: [
            { memberId: 'alice', ratio: 1 },
            { memberId: 'bob', ratio: 1 },
          ],
        },
        {
          id: 'e2',
          date: '2026-07-01',
          description: 'Dinner',
          category: '餐飲',
          paymentMethod: '現金',
          paidBy: 'bob',
          amount: 200,
          currency: 'TWD',
          exchangeRate: 1,
          splits: [
            { memberId: 'alice', ratio: 1 },
            { memberId: 'bob', ratio: 1 },
          ],
        },
      ],
    })
    const result = calculateSettlement(trip)
    expect(result).toEqual([])
  })

  it('calculates one transfer when one person paid for everything', () => {
    const trip = makeTrip({
      members: [
        { id: 'alice', name: 'Alice' },
        { id: 'bob', name: 'Bob' },
      ],
      expenses: [
        {
          id: 'e1',
          date: '2026-07-01',
          description: 'Hotel',
          category: '住宿',
          paymentMethod: '信用卡',
          paidBy: 'alice',
          amount: 1000,
          currency: 'TWD',
          exchangeRate: 1,
          splits: [
            { memberId: 'alice', ratio: 1 },
            { memberId: 'bob', ratio: 1 },
          ],
        },
      ],
    })
    const result = calculateSettlement(trip)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ from: 'bob', to: 'alice', amount: 500 })
  })

  it('handles currency conversion via exchangeRate', () => {
    const trip = makeTrip({
      members: [
        { id: 'alice', name: 'Alice' },
        { id: 'bob', name: 'Bob' },
      ],
      expenses: [
        {
          id: 'e1',
          date: '2026-07-01',
          description: 'Ramen',
          category: '餐飲',
          paymentMethod: '現金',
          paidBy: 'alice',
          amount: 1000,
          currency: 'JPY',
          exchangeRate: 0.22,
          splits: [
            { memberId: 'alice', ratio: 1 },
            { memberId: 'bob', ratio: 1 },
          ],
        },
      ],
    })
    const result = calculateSettlement(trip)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ from: 'bob', to: 'alice', amount: 110 })
  })

  it('handles unequal split ratios', () => {
    const trip = makeTrip({
      members: [
        { id: 'alice', name: 'Alice' },
        { id: 'bob', name: 'Bob' },
      ],
      expenses: [
        {
          id: 'e1',
          date: '2026-07-01',
          description: 'Tour',
          category: '票券',
          paymentMethod: '信用卡',
          paidBy: 'alice',
          amount: 3000,
          currency: 'TWD',
          exchangeRate: 1,
          splits: [
            { memberId: 'alice', ratio: 1 },
            { memberId: 'bob', ratio: 2 },
          ],
        },
      ],
    })
    const result = calculateSettlement(trip)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ from: 'bob', to: 'alice', amount: 2000 })
  })

  it('produces minimum transfers for three-person scenario', () => {
    const trip = makeTrip({
      expenses: [
        {
          id: 'e1',
          date: '2026-07-01',
          description: 'Dinner',
          category: '餐飲',
          paymentMethod: '現金',
          paidBy: 'alice',
          amount: 900,
          currency: 'TWD',
          exchangeRate: 1,
          splits: [
            { memberId: 'alice', ratio: 1 },
            { memberId: 'bob', ratio: 1 },
            { memberId: 'carol', ratio: 1 },
          ],
        },
      ],
    })
    const result = calculateSettlement(trip)
    expect(result).toHaveLength(2)
    const fromBob = result.find((t) => t.from === 'bob')
    const fromCarol = result.find((t) => t.from === 'carol')
    expect(fromBob).toEqual({ from: 'bob', to: 'alice', amount: 300 })
    expect(fromCarol).toEqual({ from: 'carol', to: 'alice', amount: 300 })
  })

  it('rounds amounts to 2 decimal places', () => {
    const trip = makeTrip({
      members: [
        { id: 'alice', name: 'Alice' },
        { id: 'bob', name: 'Bob' },
        { id: 'carol', name: 'Carol' },
      ],
      expenses: [
        {
          id: 'e1',
          date: '2026-07-01',
          description: 'Snack',
          category: '餐飲',
          paymentMethod: '現金',
          paidBy: 'alice',
          amount: 100,
          currency: 'TWD',
          exchangeRate: 1,
          splits: [
            { memberId: 'alice', ratio: 1 },
            { memberId: 'bob', ratio: 1 },
            { memberId: 'carol', ratio: 1 },
          ],
        },
      ],
    })
    const result = calculateSettlement(trip)
    result.forEach((t) => {
      expect(Number.isFinite(t.amount)).toBe(true)
      expect(t.amount).toBe(Math.round(t.amount * 100) / 100)
    })
  })
})
