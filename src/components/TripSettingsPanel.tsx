import { useState } from 'react'
import { Trip, Member } from '../types'
import { useTripStore } from '../store/useTripStore'

interface TripSettingsPanelProps {
  trip: Trip
  onSave: (updates: Partial<Pick<Trip, 'name' | 'baseCurrency' | 'members' | 'currencies' | 'defaultRates'>>) => void
}

type DefaultRates = Record<string, Record<string, number>>

export default function TripSettingsPanel({ trip, onSave }: TripSettingsPanelProps) {
  const { settings } = useTripStore()
  const [name, setName] = useState(trip.name)
  const [baseCurrency, setBaseCurrency] = useState(trip.baseCurrency)
  const [members, setMembers] = useState<Member[]>(trip.members)
  const [newMemberName, setNewMemberName] = useState('')
  const [defaultRates, setDefaultRates] = useState<DefaultRates>(
    trip.defaultRates ?? {}
  )
  const [currencies, setCurrencies] = useState<string[]>(trip.currencies ?? [])
  const [newCurrencyInput, setNewCurrencyInput] = useState('')

  // New rate form state
  const [newPaymentMethod, setNewPaymentMethod] = useState(settings.paymentMethods[0] ?? '')
  const [newCurrency, setNewCurrency] = useState('')
  const [newRate, setNewRate] = useState('')

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    onSave({ name, baseCurrency, members, currencies, defaultRates })
  }

  function addMember() {
    const trimmed = newMemberName.trim()
    if (!trimmed) return
    setMembers([...members, { id: crypto.randomUUID(), name: trimmed }])
    setNewMemberName('')
  }

  function removeMember(id: string) {
    setMembers(members.filter((m) => m.id !== id))
  }

  function addCurrency() {
    const code = newCurrencyInput.trim().toUpperCase()
    if (!code || currencies.includes(code) || code === baseCurrency) return
    setCurrencies([...currencies, code])
    setNewCurrencyInput('')
  }

  function removeCurrency(code: string) {
    setCurrencies(currencies.filter((c) => c !== code))
  }

  function addRate() {
    const currency = newCurrency.trim().toUpperCase()
    const rate = parseFloat(newRate)
    if (!currency || !newPaymentMethod || isNaN(rate) || rate <= 0) return
    setDefaultRates({
      ...defaultRates,
      [newPaymentMethod]: {
        ...(defaultRates[newPaymentMethod] ?? {}),
        [currency]: rate,
      },
    })
    setNewCurrency('')
    setNewRate('')
  }

  function updateRate(paymentMethod: string, currency: string, value: string) {
    const rate = parseFloat(value)
    if (isNaN(rate) || rate <= 0) return
    setDefaultRates({
      ...defaultRates,
      [paymentMethod]: { ...defaultRates[paymentMethod], [currency]: rate },
    })
  }

  function removeRate(paymentMethod: string, currency: string) {
    const next: DefaultRates = { ...defaultRates }
    const methods = { ...next[paymentMethod] }
    delete methods[currency]
    if (Object.keys(methods).length === 0) {
      delete next[paymentMethod]
    } else {
      next[paymentMethod] = methods
    }
    setDefaultRates(next)
  }

  // Flatten rates for display: [{paymentMethod, currency, rate}]
  const rateRows = Object.entries(defaultRates).flatMap(([pm, currencies]) =>
    Object.entries(currencies).map(([currency, rate]) => ({ pm, currency, rate }))
  )

  const inputClass = 'w-full border rounded-lg px-3 py-2 text-base'
  const labelClass = 'block text-sm font-medium mb-1'

  return (
    <form onSubmit={handleSave} className="p-4 space-y-6">
      {/* 基本資訊 */}
      <section>
        <h2 className="text-base font-semibold mb-3">基本資訊</h2>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>旅行名稱</label>
            <input
              className={inputClass}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：東京五日遊"
            />
          </div>
          <div>
            <label className={labelClass}>本位幣</label>
            <input
              className={inputClass}
              required
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value.toUpperCase())}
              maxLength={3}
              placeholder="TWD"
            />
          </div>
        </div>
      </section>

      {/* 成員管理 */}
      <section>
        <h2 className="text-base font-semibold mb-3">成員管理</h2>
        <div className="bg-white rounded-xl shadow-sm divide-y mb-3">
          {members.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-400">尚無成員</p>
          )}
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm">{m.name}</span>
              <button
                type="button"
                onClick={() => removeMember(m.id)}
                className="text-xs text-red-500"
              >
                移除
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded-lg px-3 py-2 text-base"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())}
            placeholder="新增成員姓名…"
          />
          <button
            type="button"
            onClick={addMember}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            新增
          </button>
        </div>
      </section>

      {/* 幣別管理 */}
      <section>
        <h2 className="text-base font-semibold mb-1">幣別管理</h2>
        <p className="text-xs text-gray-400 mb-3">新增支出時可從下拉選單選擇幣別</p>
        <div className="bg-white rounded-xl shadow-sm divide-y mb-3">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium">{baseCurrency || trip.baseCurrency}</span>
            <span className="text-xs text-gray-400">本位幣</span>
          </div>
          {currencies.map((code) => (
            <div key={code} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm">{code}</span>
              <button
                type="button"
                onClick={() => removeCurrency(code)}
                className="text-xs text-red-500"
              >
                移除
              </button>
            </div>
          ))}
          {currencies.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-400">尚未新增外幣</p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded-lg px-3 py-2 text-base"
            value={newCurrencyInput}
            onChange={(e) => setNewCurrencyInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCurrency())}
            maxLength={3}
            placeholder="JPY"
          />
          <button
            type="button"
            onClick={addCurrency}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            新增
          </button>
        </div>
      </section>

      {/* 預設匯率（依付款方式） */}
      <section>
        <h2 className="text-base font-semibold mb-1">預設匯率</h2>
        <p className="text-xs text-gray-400 mb-3">
          依付款方式設定各幣別預設匯率，新增支出時自動帶入
        </p>

        {/* 已設定的匯率列表 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-3">
          {rateRows.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">尚未設定預設匯率</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-left px-3 py-2">付款方式</th>
                  <th className="text-left px-3 py-2">幣別</th>
                  <th className="text-right px-3 py-2">匯率</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rateRows.map(({ pm, currency, rate }) => (
                  <tr key={`${pm}-${currency}`} className="border-t">
                    <td className="px-3 py-2 text-gray-600">{pm}</td>
                    <td className="px-3 py-2 font-medium">{currency}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={rate}
                        onChange={(e) => updateRate(pm, currency, e.target.value)}
                        className="w-24 border rounded px-2 py-1 text-base text-right ml-auto block"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeRate(pm, currency)}
                        className="text-xs text-red-500"
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 新增匯率 */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">付款方式</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-base"
              value={newPaymentMethod}
              onChange={(e) => setNewPaymentMethod(e.target.value)}
            >
              {settings.paymentMethods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="w-20">
            <label className="block text-xs text-gray-500 mb-1">幣別</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-base"
              value={newCurrency}
              onChange={(e) => setNewCurrency(e.target.value.toUpperCase())}
              maxLength={3}
              placeholder="JPY"
            />
          </div>
          <div className="w-24">
            <label className="block text-xs text-gray-500 mb-1">匯率</label>
            <input
              type="number"
              min={0}
              step="any"
              className="w-full border rounded-lg px-3 py-2 text-base"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              placeholder="0.22"
            />
          </div>
          <button
            type="button"
            onClick={addRate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm shrink-0"
          >
            新增
          </button>
        </div>
      </section>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white rounded-lg py-3 text-sm font-medium"
      >
        儲存變更
      </button>
    </form>
  )
}
