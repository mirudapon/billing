export interface Member {
  id: string
  name: string
}

export interface Split {
  memberId: string
  ratio: number
}

export interface Expense {
  id: string
  date: string           // ISO date string, e.g. "2026-07-01"
  description: string
  category: string
  paymentMethod: string
  paidBy: string         // memberId
  amount: number         // original amount in `currency`
  currency: string       // e.g. "JPY"
  exchangeRate: number   // amount * exchangeRate = baseCurrency amount
  splits: Split[]
}

export interface Trip {
  id: string
  name: string
  baseCurrency: string            // e.g. "TWD"
  members: Member[]
  expenses: Expense[]
  createdAt: string               // ISO date string
  defaultRates?: Record<string, number> // currency → default exchange rate
}

export interface Transfer {
  from: string   // memberId
  to: string     // memberId
  amount: number // in baseCurrency
}

export interface AppSettings {
  categories: string[]
  paymentMethods: string[]
}

export const DEFAULT_CATEGORIES: string[] = [
  '餐飲',
  '交通',
  '住宿',
  '購物',
  '票券',
  '其他',
]

export const DEFAULT_PAYMENT_METHODS: string[] = [
  '現金',
  '信用卡',
  '行動支付',
]
