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
  if (expenses.length === 0) {
    return (
      <p className="text-center text-gray-400 mt-16">尚無支出記錄，切換至「新增」頁面</p>
    )
  }

  // Group by date
  const grouped: Record<string, Expense[]> = {}
  const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date))
  for (const expense of sorted) {
    if (!grouped[expense.date]) grouped[expense.date] = []
    grouped[expense.date].push(expense)
  }

  function getPayerName(memberId: string): string {
    return members.find((m) => m.id === memberId)?.name ?? memberId
  }

  return (
    <div className="space-y-4 p-4">
      {Object.entries(grouped).map(([date, dayExpenses]) => (
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
  )
}
