import { Expense } from '../types'

export function convertToBase(amount: number, rate: number): number {
  return amount * rate
}

export function getLastExchangeRate(
  expenses: Expense[],
  currency: string
): number | undefined {
  const matching = expenses.filter((e) => e.currency === currency)
  if (matching.length === 0) return undefined
  return matching[matching.length - 1].exchangeRate
}

/**
 * Returns the best auto-fill rate for a currency when adding a new expense.
 * Priority: defaultRates[currency] → last expense rate → undefined
 */
export function getAutoFillRate(
  defaultRates: Record<string, number>,
  expenses: Expense[],
  currency: string
): number | undefined {
  if (defaultRates[currency] !== undefined) return defaultRates[currency]
  return getLastExchangeRate(expenses, currency)
}
