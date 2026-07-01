import { Trip } from '../types'
import { calculateSettlement } from '../utils/settlement'

interface SettlementViewProps {
  trip: Trip
}

export default function SettlementView({ trip }: SettlementViewProps) {
  const transfers = calculateSettlement(trip)

  // Per-member summary
  const summary = trip.members.map((member) => {
    const paid = trip.expenses
      .filter((e) => e.paidBy === member.id)
      .reduce((sum, e) => sum + e.amount * e.exchangeRate, 0)

    const owed = trip.expenses.reduce((sum, e) => {
      const baseAmount = e.amount * e.exchangeRate
      const ratioSum = e.splits.reduce((s, sp) => s + sp.ratio, 0)
      const split = e.splits.find((s) => s.memberId === member.id)
      if (!split || ratioSum === 0) return sum
      return sum + baseAmount * (split.ratio / ratioSum)
    }, 0)

    return { member, paid, owed, net: paid - owed }
  })

  function getMemberName(memberId: string): string {
    return trip.members.find((m) => m.id === memberId)?.name ?? memberId
  }

  return (
    <div className="p-4 space-y-6">
      {/* Per-member summary table */}
      <section>
        <h2 className="text-base font-semibold mb-3">各人總覽</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-3 py-2">成員</th>
                <th className="text-right px-3 py-2">已付</th>
                <th className="text-right px-3 py-2">應付</th>
                <th className="text-right px-3 py-2">差額</th>
              </tr>
            </thead>
            <tbody>
              {summary.map(({ member, paid, owed, net }) => (
                <tr key={member.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{member.name}</td>
                  <td className="px-3 py-2 text-right">{paid.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{owed.toFixed(2)}</td>
                  <td
                    className={`px-3 py-2 text-right font-semibold ${
                      net >= 0 ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {net >= 0 ? '+' : ''}{net.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Minimum transfers */}
      <section>
        <h2 className="text-base font-semibold mb-3">轉帳清單</h2>
        {transfers.length === 0 ? (
          <p className="text-center text-gray-400 py-6">無需轉帳，已結清</p>
        ) : (
          <div className="space-y-2">
            {transfers.map((transfer, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{getMemberName(transfer.from)}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{getMemberName(transfer.to)}</span>
                </div>
                <span className="font-semibold text-blue-600">
                  {trip.baseCurrency} {transfer.amount.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
