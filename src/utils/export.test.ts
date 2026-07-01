import { describe, it, expect, vi, afterEach } from 'vitest'
import { exportJSON, exportCSV, tripToJSON, tripToCSV } from './export'
import { Trip } from '../types'

const makeTrip = (): Trip => ({
  id: 'trip-1',
  name: 'Tokyo 2026',
  baseCurrency: 'TWD',
  createdAt: '2026-07-01T00:00:00.000Z',
  members: [
    { id: 'alice', name: 'Alice' },
    { id: 'bob', name: 'Bob' },
  ],
  expenses: [
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
  ],
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('tripToJSON', () => {
  it('serializes the trip as valid JSON', () => {
    const text = tripToJSON(makeTrip())
    const parsed = JSON.parse(text)
    expect(parsed.id).toBe('trip-1')
    expect(parsed.name).toBe('Tokyo 2026')
    expect(parsed.expenses).toHaveLength(1)
  })
})

describe('tripToCSV', () => {
  it('includes CSV header and expense row', () => {
    const text = tripToCSV(makeTrip())
    const lines = text.trim().split('\n')
    expect(lines.length).toBe(2) // header + 1 expense
    expect(lines[0]).toContain('日期')
    expect(lines[1]).toContain('Ramen')
    expect(lines[1]).toContain('Alice') // paidBy name resolved
  })

  it('calculates base amount correctly', () => {
    const text = tripToCSV(makeTrip())
    const dataLine = text.split('\n')[1]
    expect(dataLine).toContain('220.00') // 1000 * 0.22
  })
})

describe('exportJSON', () => {
  it('triggers a download by clicking an anchor', () => {
    const clickMock = vi.fn()
    const anchorMock = { href: '', download: '', click: clickMock } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValue(anchorMock)

    exportJSON(makeTrip())
    expect(clickMock).toHaveBeenCalledOnce()
  })

  it('sets download attribute to trip name with .json extension', () => {
    const anchorMock = { href: '', download: '', click: vi.fn() } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValue(anchorMock)

    exportJSON(makeTrip())
    expect(anchorMock.download).toBe('Tokyo 2026.json')
  })
})

describe('exportCSV', () => {
  it('triggers a download by clicking an anchor', () => {
    const clickMock = vi.fn()
    const anchorMock = { href: '', download: '', click: clickMock } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValue(anchorMock)

    exportCSV(makeTrip())
    expect(clickMock).toHaveBeenCalledOnce()
  })

  it('sets download attribute to trip name with .csv extension', () => {
    const anchorMock = { href: '', download: '', click: vi.fn() } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValue(anchorMock)

    exportCSV(makeTrip())
    expect(anchorMock.download).toBe('Tokyo 2026.csv')
  })
})
