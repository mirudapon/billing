import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTripStore } from '../store/useTripStore'
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS } from '../types'

export default function SettingsPage() {
  const navigate = useNavigate()
  const {
    settings,
    addCategory,
    removeCategory,
    addPaymentMethod,
    removePaymentMethod,
  } = useTripStore()

  const [newCategory, setNewCategory] = useState('')
  const [newPaymentMethod, setNewPaymentMethod] = useState('')

  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newCategory.trim()
    if (!trimmed || settings.categories.includes(trimmed)) return
    addCategory(trimmed)
    setNewCategory('')
  }

  function handleAddPaymentMethod(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newPaymentMethod.trim()
    if (!trimmed || settings.paymentMethods.includes(trimmed)) return
    addPaymentMethod(trimmed)
    setNewPaymentMethod('')
  }

  const isDefaultCategory = (c: string) => DEFAULT_CATEGORIES.includes(c)
  const isDefaultPaymentMethod = (m: string) => DEFAULT_PAYMENT_METHODS.includes(m)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-gray-500 text-sm"
        >
          ← 返回
        </button>
        <h1 className="text-lg font-bold">設定</h1>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-6">
        {/* Categories */}
        <section>
          <h2 className="text-base font-semibold mb-3">類別管理</h2>
          <div className="bg-white rounded-xl shadow-sm divide-y">
            {settings.categories.map((cat) => (
              <div key={cat} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">{cat}</span>
                {!isDefaultCategory(cat) && (
                  <button
                    onClick={() => removeCategory(cat)}
                    className="text-xs text-red-500"
                  >
                    刪除
                  </button>
                )}
                {isDefaultCategory(cat) && (
                  <span className="text-xs text-gray-300">預設</span>
                )}
              </div>
            ))}
          </div>
          <form onSubmit={handleAddCategory} className="mt-3 flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="新增類別…"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              新增
            </button>
          </form>
        </section>

        {/* Payment Methods */}
        <section>
          <h2 className="text-base font-semibold mb-3">付款方式管理</h2>
          <div className="bg-white rounded-xl shadow-sm divide-y">
            {settings.paymentMethods.map((method) => (
              <div key={method} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">{method}</span>
                {!isDefaultPaymentMethod(method) && (
                  <button
                    onClick={() => removePaymentMethod(method)}
                    className="text-xs text-red-500"
                  >
                    刪除
                  </button>
                )}
                {isDefaultPaymentMethod(method) && (
                  <span className="text-xs text-gray-300">預設</span>
                )}
              </div>
            ))}
          </div>
          <form onSubmit={handleAddPaymentMethod} className="mt-3 flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              value={newPaymentMethod}
              onChange={(e) => setNewPaymentMethod(e.target.value)}
              placeholder="新增付款方式…"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              新增
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
