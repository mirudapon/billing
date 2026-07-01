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
