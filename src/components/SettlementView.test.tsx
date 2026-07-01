import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SettlementView from './SettlementView'
import { Trip } from '../types'

const makeTrip = (overrides: Partial<Trip> = {}): Trip => ({
  id: 'trip-1',
  name: 'Test',
  baseCurrency: 'TWD',
  createdAt: '2026-07-01T00:00:00.000Z',
  members: [
    { id: 'alice', name: 'Alice' },
    { id: 'bob', name: 'Bob' },
  ],
  expenses: [],
  ...overrides,
})

describe('SettlementView', () => {
  it('shows empty transfer message when no expenses', () => {
    render(<SettlementView trip={makeTrip()} />)
    expect(screen.getByText(/無需轉帳/)).toBeInTheDocument()
  })

  it('renders member names in the summary table', () => {
    render(<SettlementView trip={makeTrip()} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows transfer direction and amount when one person paid for all', () => {
    const trip = makeTrip({
      expenses: [
        {
          id: 'e1',
          date: '2026-07-01',
          description: 'Hotel',
          category: '住宿',
          paymentMethod: '信用卡',
          paidBy: 'alice',
          amount: 1000,
          currency: 'TWD',
          exchangeRate: 1,
          splits: [
            { memberId: 'alice', ratio: 1 },
            { memberId: 'bob', ratio: 1 },
          ],
        },
      ],
    })
    render(<SettlementView trip={trip} />)
    expect(screen.getAllByText(/Bob/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Alice/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/500/).length).toBeGreaterThan(0)
  })

  it('shows per-member paid and owed amounts in summary', () => {
    const trip = makeTrip({
      expenses: [
        {
          id: 'e1',
          date: '2026-07-01',
          description: 'Lunch',
          category: '餐飲',
          paymentMethod: '現金',
          paidBy: 'alice',
          amount: 200,
          currency: 'TWD',
          exchangeRate: 1,
          splits: [
            { memberId: 'alice', ratio: 1 },
            { memberId: 'bob', ratio: 1 },
          ],
        },
      ],
    })
    render(<SettlementView trip={trip} />)
    expect(screen.getByText('200.00')).toBeInTheDocument()
    expect(screen.getAllByText('100.00').length).toBeGreaterThanOrEqual(1)
  })
})
