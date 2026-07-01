import { useState } from 'react'
import { Trip, Member } from '../types'

interface TripSettingsPanelProps {
  trip: Trip
  onSave: (updates: Partial<Pick<Trip, 'name' | 'baseCurrency' | 'members' | 'defaultRates'>>) => void
}

export default function TripSettingsPanel({ trip, onSave }: TripSettingsPanelProps) {
  const [name, setName] = useState(trip.name)
  const [baseCurrency, setBaseCurrency] = useState(trip.baseCurrency)
  const [members, setMembers] = useState<Member[]>(trip.members)
  const [newMemberName, setNewMemberName] = useState('')
  const [defaultRates, setDefaultRates] = useState<Record<string, number>>(
    trip.defaultRates ?? {}
  )
  const [newRateCurrency, setNewRateCurrency] = useState('')
  const [newRateValue, setNewRateValue] = useState('')

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    onSave({ name, baseCurrency, members, defaultRates })
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

  function addDefaultRate() {
    const currency = newRateCurrency.trim().toUpperCase()
    const rate = parseFloat(newRateValue)
    if (!currency || isNaN(rate) || rate <= 0) return
    setDefaultRates({ ...defaultRates, [currency]: rate })
    setNewRateCurrency('')
    setNewRateValue('')
  }

  function removeDefaultRate(currency: string) {
    const next = { ...defaultRates }
    delete next[currency]
    setDefaultRates(next)
  }

  function updateDefaultRate(currency: string, value: string) {
    const rate = parseFloat(value)
    if (!isNaN(rate) && rate > 0) {
      setDefaultRates({ ...defaultRates, [currency]: rate })
    }
  }

  const inputClass = 'w-full border rounded-lg px-3 py-2 text-sm'
  const labelClass = 'block text-sm font-medium mb-1'

  return (
    <form onSubmit={handleSave} className="p-4 space-y-6">
      {/* 旅行名稱 */}
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
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
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

      {/* 預設匯率 */}
      <section>
        <h2 className="text-base font-semibold mb-1">預設匯率</h2>
        <p className="text-xs text-gray-400 mb-3">
          新增支出時，選擇幣別後自動帶入此匯率（優先於最近一筆）
        </p>
        <div className="bg-white rounded-xl shadow-sm divide-y mb-3">
          {Object.keys(defaultRates).length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-400">尚未設定預設匯率</p>
          )}
          {Object.entries(defaultRates).map(([currency, rate]) => (
            <div key={currency} className="flex items-center gap-3 px-4 py-2">
              <span className="text-sm font-medium w-12">{currency}</span>
              <input
                type="number"
                min={0}
                step="any"
                className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                value={rate}
                onChange={(e) => updateDefaultRate(currency, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeDefaultRate(currency)}
                className="text-xs text-red-500 shrink-0"
              >
                刪除
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="w-20 border rounded-lg px-3 py-2 text-sm"
            value={newRateCurrency}
            onChange={(e) => setNewRateCurrency(e.target.value.toUpperCase())}
            maxLength={3}
            placeholder="JPY"
          />
          <input
            type="number"
            min={0}
            step="any"
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            value={newRateValue}
            onChange={(e) => setNewRateValue(e.target.value)}
            placeholder="匯率，例 0.22"
          />
          <button
            type="button"
            onClick={addDefaultRate}
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
