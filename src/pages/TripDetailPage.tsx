import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTripStore } from '../store/useTripStore'
import ExpenseList from '../components/ExpenseList'
import ExpenseForm from '../components/ExpenseForm'
import SettlementView from '../components/SettlementView'
import TripSettingsPanel from '../components/TripSettingsPanel'
import { Expense, Trip } from '../types'

type Tab = 'list' | 'add' | 'settlement' | 'settings'

export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const { trips, addExpense, updateExpense, deleteExpense, updateTrip } = useTripStore()
  const [activeTab, setActiveTab] = useState<Tab>('list')
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>()

  const trip = trips.find((t) => t.id === tripId)

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-500">找不到旅行記錄</p>
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 underline text-sm"
        >
          返回首頁
        </button>
      </div>
    )
  }

  function handleAddExpense(expense: Omit<Expense, 'id'>) {
    addExpense(trip!.id, expense)
    setActiveTab('list')
  }

  function handleUpdateExpense(expense: Omit<Expense, 'id'>) {
    if (!editingExpense) return
    updateExpense(trip!.id, { ...expense, id: editingExpense.id })
    setEditingExpense(undefined)
    setActiveTab('list')
  }

  function handleEdit(expense: Expense) {
    setEditingExpense(expense)
    setActiveTab('add')
  }

  function handleCancelForm() {
    setEditingExpense(undefined)
    setActiveTab('list')
  }

  function handleSaveSettings(updates: Partial<Pick<Trip, 'name' | 'baseCurrency' | 'members' | 'defaultRates'>>) {
    updateTrip(trip!.id, updates)
    setActiveTab('list')
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'list', label: '支出列表' },
    { key: 'add', label: editingExpense ? '編輯支出' : '新增支出' },
    { key: 'settlement', label: '結算' },
    { key: 'settings', label: '旅行設定' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-gray-500 text-sm"
        >
          ← 返回
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold truncate">{trip.name}</h1>
          <p className="text-xs text-gray-400">本位幣：{trip.baseCurrency}</p>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b flex overflow-x-auto">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              if (key !== 'add') setEditingExpense(undefined)
              setActiveTab(key)
            }}
            className={`flex-1 min-w-fit py-3 px-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <main className="flex-1 overflow-y-auto max-w-lg w-full mx-auto">
        {activeTab === 'list' && (
          <ExpenseList
            expenses={trip.expenses}
            members={trip.members}
            baseCurrency={trip.baseCurrency}
            onDelete={(id) => deleteExpense(trip.id, id)}
            onEdit={handleEdit}
          />
        )}
        {activeTab === 'add' && (
          <ExpenseForm
            members={trip.members}
            existingExpenses={trip.expenses}
            defaultRates={trip.defaultRates ?? {}}
            initialValues={editingExpense}
            onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
            onCancel={handleCancelForm}
          />
        )}
        {activeTab === 'settlement' && <SettlementView trip={trip} />}
        {activeTab === 'settings' && (
          <TripSettingsPanel trip={trip} onSave={handleSaveSettings} />
        )}
      </main>
    </div>
  )
}
