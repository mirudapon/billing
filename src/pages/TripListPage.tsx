import { useState } from 'react'
import { useTripStore } from '../store/useTripStore'
import TripCard from '../components/TripCard'

interface NewTripForm {
  name: string
  baseCurrency: string
  memberNames: string
}

const EMPTY_FORM: NewTripForm = {
  name: '',
  baseCurrency: 'TWD',
  memberNames: '',
}

export default function TripListPage() {
  const { trips, addTrip, deleteTrip } = useTripStore()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<NewTripForm>(EMPTY_FORM)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const members = form.memberNames
      .split(/[,，、\n]+/)
      .map((n) => n.trim())
      .filter(Boolean)
      .map((name) => ({ id: crypto.randomUUID(), name }))
    addTrip({ name: form.name, baseCurrency: form.baseCurrency, members, defaultRates: {} })
    setForm(EMPTY_FORM)
    setShowModal(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">旅遊記帳</h1>
        <div className="flex items-center gap-2">
          <a href="/settings" className="text-gray-500 text-sm px-2 py-1">設定</a>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white text-sm px-3 py-1 rounded-lg"
          >
            新增旅行
          </button>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {trips.length === 0 ? (
          <p className="text-center text-gray-400 mt-16">尚無旅行記錄，點擊「新增旅行」開始</p>
        ) : (
          trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onDelete={() => deleteTrip(trip.id)}
            />
          ))
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-5">
            <h2 className="text-lg font-semibold mb-4">新增旅行</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">旅行名稱</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例：東京五日遊"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">本位幣</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                  value={form.baseCurrency}
                  onChange={(e) =>
                    setForm({ ...form, baseCurrency: e.target.value.toUpperCase() })
                  }
                  placeholder="TWD"
                  maxLength={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  成員（用逗號或換行分隔）
                </label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                  value={form.memberNames}
                  onChange={(e) =>
                    setForm({ ...form, memberNames: e.target.value })
                  }
                  placeholder="Alice, Bob, Carol"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setForm(EMPTY_FORM)
                  }}
                  className="flex-1 border rounded-lg py-2 text-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium"
                >
                  新增
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
