import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ExpenseList from './ExpenseList'
import { Expense, Member } from '../types'

const members: Member[] = [
  { id: 'alice', name: 'Alice' },
  { id: 'bob', name: 'Bob' },
]

const expenses: Expense[] = [
  {
    id: 'e1',
    date: '2026-07-01',
    description: 'Ramen',
    category: '餐飲',
    paymentMethod: '現金',
    paidBy: 'alice',
    amount: 1000,
    currency: 'JPY',
    exchangeRate: 0.22,
    splits: [
      { memberId: 'alice', ratio: 1 },
      { memberId: 'bob', ratio: 1 },
    ],
  },
  {
    id: 'e2',
    date: '2026-07-02',
    description: 'Hotel',
    category: '住宿',
    paymentMethod: '信用卡',
    paidBy: 'bob',
    amount: 5000,
    currency: 'TWD',
    exchangeRate: 1,
    splits: [{ memberId: 'alice', ratio: 1 }, { memberId: 'bob', ratio: 1 }],
  },
]

describe('ExpenseList', () => {
  it('renders all expense descriptions', () => {
    render(
      <ExpenseList
        expenses={expenses}
        members={members}
        baseCurrency="TWD"
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    )
    expect(screen.getByText('Ramen')).toBeInTheDocument()
    expect(screen.getByText('Hotel')).toBeInTheDocument()
  })

  it('groups expenses by date', () => {
    render(
      <ExpenseList
        expenses={expenses}
        members={members}
        baseCurrency="TWD"
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    )
    expect(screen.getByText('2026-07-01')).toBeInTheDocument()
    expect(screen.getByText('2026-07-02')).toBeInTheDocument()
  })

  it('shows the payer name', () => {
    render(
      <ExpenseList
        expenses={expenses}
        members={members}
        baseCurrency="TWD"
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    )
    expect(screen.getAllByText(/Alice/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Bob/).length).toBeGreaterThan(0)
  })

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn()
    render(
      <ExpenseList
        expenses={expenses}
        members={members}
        baseCurrency="TWD"
        onDelete={onDelete}
        onEdit={vi.fn()}
      />
    )
    const deleteButtons = screen.getAllByRole('button', { name: /刪除/ })
    fireEvent.click(deleteButtons[0])
    expect(onDelete).toHaveBeenCalledWith('e2')
  })

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn()
    render(
      <ExpenseList
        expenses={expenses}
        members={members}
        baseCurrency="TWD"
        onDelete={vi.fn()}
        onEdit={onEdit}
      />
    )
    const editButtons = screen.getAllByRole('button', { name: /編輯/ })
    fireEvent.click(editButtons[0])
    expect(onEdit).toHaveBeenCalledWith(expenses[1])
  })

  it('shows empty state when no expenses', () => {
    render(
      <ExpenseList
        expenses={[]}
        members={members}
        baseCurrency="TWD"
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    )
    expect(screen.getByText(/尚無支出/)).toBeInTheDocument()
  })
})
