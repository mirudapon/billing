import { useNavigate } from 'react-router-dom'
import { Trip } from '../types'
import { exportJSON, exportCSV } from '../utils/export'

interface TripCardProps {
  trip: Trip
  onDelete: () => void
}

export default function TripCard({ trip, onDelete }: TripCardProps) {
  const navigate = useNavigate()
  const totalBase = trip.expenses.reduce(
    (sum, e) => sum + e.amount * e.exchangeRate,
    0
  )

  const dateRange = (() => {
    if (trip.expenses.length === 0) return '無支出'
    const dates = trip.expenses.map((e) => e.date).sort()
    const first = dates[0]
    const last = dates[dates.length - 1]
    return first === last ? first : `${first} ～ ${last}`
  })()

  return (
    <div className="bg-white rounded-xl shadow p-4 mb-3">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{trip.name}</h2>
          <p className="text-sm text-gray-500">{dateRange}</p>
          <p className="text-sm text-gray-700 mt-1">
            {trip.baseCurrency} {totalBase.toFixed(0)} 合計
          </p>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <button
            onClick={() => navigate(`/trips/${trip.id}`)}
            className="text-blue-600 text-sm font-medium"
          >
            詳情
          </button>
          <button
            onClick={() => exportJSON(trip)}
            className="text-xs text-gray-500"
          >
            匯出 JSON
          </button>
          <button
            onClick={() => exportCSV(trip)}
            className="text-xs text-gray-500"
          >
            匯出 CSV
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-red-500 mt-1"
          >
            刪除
          </button>
        </div>
      </div>
    </div>
  )
}
