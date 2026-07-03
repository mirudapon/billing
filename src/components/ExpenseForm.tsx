import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Expense, Member, Split } from '../types'
import { getAutoFillRate, convertToBase } from '../utils/currency'
import { useTripStore } from '../store/useTripStore'
import SplitEditor from './SplitEditor'

interface ExpenseFormProps {
  members: Member[]
  existingExpenses: Expense[]
  defaultRates?: Record<string, Record<string, number>>
  initialValues?: Expense
  onSubmit: (expense: Omit<Expense, 'id'>) => void
  onCancel: () => void
}

function defaultSplits(members: Member[]): Split[] {
  return members.map((m) => ({ memberId: m.id, ratio: 1 }))
}

export default function ExpenseForm({
  members,
  existingExpenses,
  defaultRates,
  initialValues,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const { settings } = useTripStore()

  const [date, setDate] = useState(
    initialValues?.date ?? format(new Date(), 'yyyy-MM-dd')
  )
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [category, setCategory] = useState(
    initialValues?.category ?? settings.categories[0]
  )
  const [paymentMethod, setPaymentMethod] = useState(
    initialValues?.paymentMethod ?? settings.paymentMethods[0]
  )
  const [paidBy, setPaidBy] = useState(
    initialValues?.paidBy ?? (members[0]?.id ?? '')
  )
  const [amount, setAmount] = useState<string>(
    initialValues ? String(initialValues.amount) : ''
  )
  const [currency, setCurrency] = useState(initialValues?.currency ?? 'TWD')
  const [exchangeRate, setExchangeRate] = useState<string>(
    initialValues ? String(initialValues.exchangeRate) : '1'
  )
  const [splits, setSplits] = useState<Split[]>(
    initialValues?.splits ?? defaultSplits(members)
  )

  // Auto-fill exchange rate when currency or paymentMethod changes
  // Priority: defaultRates[paymentMethod][currency] → last expense rate → '1' if TWD
  useEffect(() => {
    if (initialValues) return
    const rate = getAutoFillRate(defaultRates, existingExpenses, currency, paymentMethod)
    if (rate !== undefined) {
      setExchangeRate(String(rate))
    } else {
      setExchangeRate(currency === 'TWD' ? '1' : '')
    }
  }, [currency, paymentMethod, defaultRates, existingExpenses, initialValues])

  const parsedAmount = parseFloat(amount) || 0
  const parsedRate = parseFloat(exchangeRate) || 0
  const totalBaseAmount = convertToBase(parsedAmount, parsedRate)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (splits.length === 0) {
      alert('請至少選擇一位分攤成員')
      return
    }
    onSubmit({
      date,
      description,
      category,
      paymentMethod,
      paidBy,
      amount: parsedAmount,
      currency,
      exchangeRate: parsedRate,
      splits,
    })
  }

  const labelClass = 'block text-sm font-medium mb-1'
  const inputClass = 'w-full border rounded-lg px-3 py-2 text-base'

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <label className={labelClass}>日期</label>
        <input
          type="date"
          className={inputClass}
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>描述</label>
        <input
          className={inputClass}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="例：午餐"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>類別</label>
          <select
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {settings.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>付款方式</label>
          <select
            className={inputClass}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            {settings.paymentMethods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>付款人</label>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setPaidBy(m.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                paidBy === m.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-1">
          <label className={labelClass}>幣別</label>
          <input
            className={inputClass}
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={3}
            placeholder="JPY"
          />
        </div>
        <div className="col-span-1">
          <label className={labelClass}>金額</label>
          <input
            type="number"
            min={0}
            step="any"
            className={inputClass}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="col-span-1">
          <label className={labelClass}>匯率</label>
          <input
            type="number"
            min={0}
            step="any"
            className={inputClass}
            required
            value={exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)}
            placeholder="1"
          />
        </div>
      </div>

      {parsedAmount > 0 && parsedRate > 0 && (
        <p className="text-sm text-gray-500">
          換算後：{totalBaseAmount.toFixed(2)}
        </p>
      )}

      <div>
        <label className={labelClass}>分攤設定</label>
        <SplitEditor
          members={members}
          splits={splits}
          totalBaseAmount={totalBaseAmount}
          onChange={setSplits}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border rounded-lg py-2 text-sm"
        >
          取消
        </button>
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium"
        >
          {initialValues ? '更新' : '新增'}
        </button>
      </div>
    </form>
  )
}
