import { describe, it, expect } from 'vitest'
import { convertToBase, getLastExchangeRate, getAutoFillRate } from './currency'
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

describe('getAutoFillRate', () => {
  it('returns defaultRates[paymentMethod][currency] when present', () => {
    const defaultRates = { '現金': { JPY: 0.22 }, '信用卡': { JPY: 0.215 } }
    expect(getAutoFillRate(defaultRates, [], 'JPY', '現金')).toBe(0.22)
    expect(getAutoFillRate(defaultRates, [], 'JPY', '信用卡')).toBe(0.215)
  })

  it('falls back to last expense rate when no defaultRate for that paymentMethod', () => {
    const expenses = [makeExpense({ currency: 'JPY', exchangeRate: 0.20 })]
    expect(getAutoFillRate({}, expenses, 'JPY', '現金')).toBe(0.20)
  })

  it('returns undefined when no defaultRate and no matching expense', () => {
    expect(getAutoFillRate(undefined, [], 'JPY', '現金')).toBeUndefined()
  })

  it('defaultRate takes priority over last expense rate', () => {
    const expenses = [makeExpense({ currency: 'JPY', exchangeRate: 0.20 })]
    const defaultRates = { '現金': { JPY: 0.22 } }
    expect(getAutoFillRate(defaultRates, expenses, 'JPY', '現金')).toBe(0.22)
  })

  it('falls back to expense rate when paymentMethod not in defaultRates', () => {
    const defaultRates = { '信用卡': { JPY: 0.215 } }
    const expenses = [makeExpense({ currency: 'JPY', exchangeRate: 0.20 })]
    expect(getAutoFillRate(defaultRates, expenses, 'JPY', '現金')).toBe(0.20)
  })

  it('handles undefined defaultRates gracefully', () => {
    const expenses = [makeExpense({ currency: 'JPY', exchangeRate: 0.20 })]
    expect(getAutoFillRate(undefined, expenses, 'JPY', '現金')).toBe(0.20)
  })
})
