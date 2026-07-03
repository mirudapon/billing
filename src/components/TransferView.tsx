import { Trip } from '../types'
import { calculateSettlement } from '../utils/settlement'
import { useTripStore } from '../store/useTripStore'

interface TransferViewProps {
  trip: Trip
}

export default function TransferView({ trip }: TransferViewProps) {
  const { confirmTransfer } = useTripStore()
  const transfers = calculateSettlement(trip)
  const confirmations = trip.transferConfirmations ?? {}

  function getMemberName(memberId: string): string {
    return trip.members.find((m) => m.id === memberId)?.name ?? memberId
  }

  if (transfers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-4xl mb-3">✓</p>
        <p className="text-sm">無需轉帳，已結清</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-gray-400 mb-1">輸入實際收到的金額以確認匯款</p>
      {transfers.map((transfer) => {
        const key = `${transfer.from}-${transfer.to}`
        const confirmed = confirmations[key] ?? 0
        const isDone = confirmed >= transfer.amount - 0.005

        return (
          <div
            key={key}
            className={`bg-white rounded-xl shadow-sm p-4 space-y-3 border-l-4 ${
              isDone ? 'border-green-400' : 'border-gray-200'
            }`}
          >
            {/* Transfer header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{getMemberName(transfer.from)}</span>
                <span className="text-gray-400">→</span>
                <span className="font-semibold">{getMemberName(transfer.to)}</span>
              </div>
              {isDone ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">已確認</span>
              ) : (
                <span className="text-xs text-gray-400">待確認</span>
              )}
            </div>

            {/* Amount row */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">應付金額</span>
              <span className="font-bold text-blue-600">
                {trip.baseCurrency} {transfer.amount.toFixed(0)}
              </span>
            </div>

            {/* Confirmation input */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-500 shrink-0">實收金額</label>
              <input
                type="number"
                min={0}
                step="any"
                className="flex-1 border rounded-lg px-3 py-2 text-base text-right"
                placeholder={transfer.amount.toFixed(0)}
                value={confirmed > 0 ? confirmed : ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  confirmTransfer(trip.id, key, isNaN(val) ? 0 : val)
                }}
              />
              <button
                type="button"
                onClick={() => confirmTransfer(trip.id, key, transfer.amount)}
                className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium ${
                  isDone
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {isDone ? '✓' : '確認'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
