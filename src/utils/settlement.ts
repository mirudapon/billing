import { Trip, Transfer } from '../types'

export function calculateSettlement(trip: Trip): Transfer[] {
  if (trip.expenses.length === 0) return []

  // Step 1: compute net balance per member (positive = creditor, negative = debtor)
  const net: Record<string, number> = {}
  trip.members.forEach((m) => (net[m.id] = 0))

  for (const expense of trip.expenses) {
    const baseAmount = expense.amount * expense.exchangeRate
    const ratioSum = expense.splits.reduce((sum, s) => sum + s.ratio, 0)

    // paidBy member gets credit for the full base amount
    net[expense.paidBy] = (net[expense.paidBy] ?? 0) + baseAmount

    // each split member owes their share
    for (const split of expense.splits) {
      const share = baseAmount * (split.ratio / ratioSum)
      net[split.memberId] = (net[split.memberId] ?? 0) - share
    }
  }

  // Step 2: greedy minimum transfers
  const transfers: Transfer[] = []
  const creditors = Object.entries(net)
    .filter(([, v]) => v > 0.005)
    .map(([id, v]) => ({ id, amount: v }))
  const debtors = Object.entries(net)
    .filter(([, v]) => v < -0.005)
    .map(([id, v]) => ({ id, amount: -v }))

  let ci = 0
  let di = 0

  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci]
    const debt = debtors[di]
    const transferAmount = Math.min(credit.amount, debt.amount)
    const rounded = Math.round(transferAmount * 100) / 100

    if (rounded > 0) {
      transfers.push({ from: debt.id, to: credit.id, amount: rounded })
    }

    credit.amount -= transferAmount
    debt.amount -= transferAmount

    if (credit.amount < 0.005) ci++
    if (debt.amount < 0.005) di++
  }

  return transfers
}
