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
  it('renders member name pills', () => {
    render(<SettlementView trip={makeTrip()} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows per-member paid and owed amounts', () => {
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
    expect(screen.getByText('200')).toBeInTheDocument()
    expect(screen.getAllByText('100').length).toBeGreaterThanOrEqual(1)
  })
})
