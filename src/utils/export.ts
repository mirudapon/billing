import { Trip } from '../types'

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function tripToJSON(trip: Trip): string {
  return JSON.stringify(trip, null, 2)
}

export function tripToCSV(trip: Trip): string {
  const memberMap = Object.fromEntries(trip.members.map((m) => [m.id, m.name]))
  const header = ['日期', '描述', '類別', '付款方式', '付款人', '金額', '貨幣', '匯率', '本位幣金額']
  const rows = trip.expenses.map((e) => {
    const baseAmount = (e.amount * e.exchangeRate).toFixed(2)
    return [
      e.date,
      `"${e.description}"`,
      e.category,
      e.paymentMethod,
      memberMap[e.paidBy] ?? e.paidBy,
      e.amount,
      e.currency,
      e.exchangeRate,
      baseAmount,
    ].join(',')
  })
  return [header.join(','), ...rows].join('\n')
}

export function exportJSON(trip: Trip): void {
  const blob = new Blob([tripToJSON(trip)], { type: 'application/json' })
  triggerDownload(blob, `${trip.name}.json`)
}

export function exportCSV(trip: Trip): void {
  const blob = new Blob([tripToCSV(trip)], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `${trip.name}.csv`)
}
