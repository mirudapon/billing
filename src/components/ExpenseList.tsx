import { useState } from 'react'
import { Expense, Member } from '../types'
import { convertToBase } from '../utils/currency'

const CATEGORY_ICONS: Record<string, string> = {
  餐飲: '🍜',
  交通: '🚌',
  住宿: '🏨',
  購物: '🛍',
  票券: '🎫',
  其他: '📌',
}

interface ExpenseListProps {
  expenses: Expense[]
  members: Member[]
  baseCurrency: string
  onDelete: (expenseId: string) => void
  onEdit: (expense: Expense) => void
}

export default function ExpenseList({
  expenses,
  members,
  baseCurrency,
  onDelete,
  onEdit,
}: ExpenseListProps) {
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterMemberId, setFilterMemberId] = useState<string>('')

  const categories = [...new Set(expenses.map((e) => e.category))]

  const filtered = expenses.filter((e) => {
    if (filterCategory && e.category !== filterCategory) return false
    if (filterMemberId) {
      const involved =
        e.paidBy === filterMemberId ||
        e.splits.some((s) => s.memberId === filterMemberId)
      if (!involved) return false
    }
    return true
  })

  if (expenses.length === 0) {
    return (
      <p className="text-center text-gray-400 mt-16">尚無支出記錄，切換至「新增」頁面</p>
    )
  }

  // Group by date
  const grouped: Record<string, Expense[]> = {}
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date))
  for (const expense of sorted) {
    if (!grouped[expense.date]) grouped[expense.date] = []
    grouped[expense.date].push(expense)
  }

  function getPayerName(memberId: string): string {
    return members.find((m) => m.id === memberId)?.name ?? memberId
  }

  const pillClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
      active ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'
    }`

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white border-b px-4 py-3 space-y-2">
        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button className={pillClass(filterCategory === '')} onClick={() => setFilterCategory('')}>全部類別</button>
            {categories.map((cat) => (
              <button
                key={cat}
                className={pillClass(filterCategory === cat)}
                onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
        {/* Member filter */}
        {members.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button className={pillClass(filterMemberId === '')} onClick={() => setFilterMemberId('')}>全部成員</button>
            {members.map((m) => (
              <button
                key={m.id}
                className={pillClass(filterMemberId === m.id)}
                onClick={() => setFilterMemberId(filterMemberId === m.id ? '' : m.id)}
              >
                {m.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-4 px-4">
      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-8 text-sm">無符合條件的支出</p>
      )}
      {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, dayExpenses]) => (
        <section key={date}>
          <h3 className="text-sm font-semibold text-gray-500 mb-2">{date}</h3>
          <div className="space-y-2">
            {dayExpenses.map((expense) => {
              const baseAmount = convertToBase(expense.amount, expense.exchangeRate)
              const icon = CATEGORY_ICONS[expense.category] ?? '📌'
              return (
                <div
                  key={expense.id}
                  className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3"
                >
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{expense.description}</p>
                    <p className="text-xs text-gray-500">
                      {getPayerName(expense.paidBy)} · {expense.category}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">
                      {expense.currency} {expense.amount}
                    </p>
                    <p className="text-xs text-gray-400">
                      {baseCurrency} {baseAmount.toFixed(0)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => onEdit(expense)}
                      className="text-xs text-blue-500"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => onDelete(expense.id)}
                      className="text-xs text-red-500"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
      </div>
    </div>
  )
}
