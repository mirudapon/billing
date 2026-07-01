import { describe, it, expect } from 'vitest'
import { convertToBase, getLastExchangeRate } from './currency'
import { Expense } from '../types'

const makeExpense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'e1',
  date: '2026-07-01',
  description: 'Test',
  category: '餐飲',
  paymentMethod: '現金',
  paidBy: 'alice',
  amount: 100,
  currency: 'JPY',
  exchangeRate: 0.22,
  splits: [],
  ...overrides,
})

describe('convertToBase', () => {
  it('converts amount by multiplying with rate', () => {
    expect(convertToBase(1000, 0.22)).toBeCloseTo(220, 5)
  })

  it('returns amount unchanged when rate is 1', () => {
    expect(convertToBase(500, 1)).toBe(500)
  })

  it('returns 0 when amount is 0', () => {
    expect(convertToBase(0, 0.22)).toBe(0)
  })
})

describe('getLastExchangeRate', () => {
  it('returns undefined when expenses array is empty', () => {
    expect(getLastExchangeRate([], 'JPY')).toBeUndefined()
  })

  it('returns undefined when currency not found in expenses', () => {
    const expenses = [makeExpense({ currency: 'USD', exchangeRate: 30 })]
    expect(getLastExchangeRate(expenses, 'JPY')).toBeUndefined()
  })

  it('returns the exchangeRate of the matching currency expense', () => {
    const expenses = [makeExpense({ currency: 'JPY', exchangeRate: 0.22 })]
    expect(getLastExchangeRate(expenses, 'JPY')).toBe(0.22)
  })

  it('returns the LAST matching expense rate (by array order)', () => {
    const expenses = [
      makeExpense({ id: 'e1', date: '2026-06-30', currency: 'JPY', exchangeRate: 0.20 }),
      makeExpense({ id: 'e2', date: '2026-07-01', currency: 'JPY', exchangeRate: 0.22 }),
      makeExpense({ id: 'e3', date: '2026-07-01', currency: 'USD', exchangeRate: 32 }),
    ]
    expect(getLastExchangeRate(expenses, 'JPY')).toBe(0.22)
  })

  it('ignores expenses with different currency', () => {
    const expenses = [
      makeExpense({ currency: 'USD', exchangeRate: 32 }),
      makeExpense({ currency: 'USD', exchangeRate: 31 }),
    ]
    expect(getLastExchangeRate(expenses, 'JPY')).toBeUndefined()
  })
})
