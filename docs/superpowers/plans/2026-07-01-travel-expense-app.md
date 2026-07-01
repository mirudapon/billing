# Travel Expense PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first PWA for tracking travel expenses with multi-currency support, custom split ratios, and settlement calculation.

**Architecture:** React 18 + Vite SPA with Zustand for state management and localStorage persistence. All computation (settlement, currency conversion) is pure utility functions tested in isolation. No backend — fully offline-capable PWA.

**Tech Stack:** React 18, TypeScript, Vite, vite-plugin-pwa, Zustand, React Router v6, Tailwind CSS, date-fns, Vitest, React Testing Library

## Global Constraints

- Node.js ≥ 18
- React 18
- TypeScript strict mode
- Mobile-first (375px min-width)
- All text in Traditional Chinese (zh-TW)
- IDs generated with `crypto.randomUUID()`
- Data persisted to localStorage key: `travel-expense-store`

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json` (via Vite scaffold)
- Create: `vite.config.ts`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `tsconfig.json`
- Create: `src/main.tsx`
- Create: `src/index.css`
- Create: `index.html`

**Interfaces:**
- Consumes: nothing
- Produces: working `npm run dev` server at localhost:5173, `npm run test` via Vitest

- [ ] **Step 1: Scaffold the Vite project**

Run in your target parent directory (not inside `billing`):

```bash
npm create vite@latest travel-expense -- --template react-ts
cd travel-expense
```

Expected output ends with:
```
Done. Now run:
  cd travel-expense
  npm install
  npm run dev
```

- [ ] **Step 2: Install all dependencies**

```bash
npm install
npm install zustand react-router-dom date-fns
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa @vitejs/plugin-react
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Expected: no peer dependency errors. `node_modules` created.

- [ ] **Step 3: Initialise Tailwind**

```bash
npx tailwindcss init -p
```

Expected output: `Created Tailwind CSS config file: tailwind.config.js` and `Created PostCSS config file: postcss.config.js`

- [ ] **Step 4: Configure tailwind.config.js**

Replace the generated file with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 5: Configure src/index.css**

Replace the generated file with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6: Configure vite.config.ts**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
```

- [ ] **Step 7: Create src/test-setup.ts**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 8: Add test script to package.json**

In `package.json`, add to the `"scripts"` block:

```json
"test": "vitest",
"test:run": "vitest run",
"coverage": "vitest run --coverage"
```

- [ ] **Step 9: Update tsconfig.json for strict mode**

Ensure `compilerOptions` contains:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 10: Verify dev server starts**

```bash
npm run dev
```

Expected output includes:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in browser — Vite + React default page renders.

- [ ] **Step 11: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Vite + React + TS project with Tailwind and Vitest"
```

---

### Task 2: TypeScript Types

**Files:**
- Create: `src/types/index.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `Trip`, `Member`, `Expense`, `Split`, `Transfer`, `AppSettings` interfaces (exported)
  - `DEFAULT_CATEGORIES: string[]`
  - `DEFAULT_PAYMENT_METHODS: string[]`

- [ ] **Step 1: Create src/types/index.ts**

```ts
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
  baseCurrency: string   // e.g. "TWD"
  members: Member[]
  expenses: Expense[]
  createdAt: string      // ISO date string
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
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add TypeScript type definitions"
```

---

### Task 3: Zustand Store

**Files:**
- Create: `src/store/useTripStore.ts`

**Interfaces:**
- Consumes:
  - `Trip`, `Member`, `Expense`, `AppSettings`, `DEFAULT_CATEGORIES`, `DEFAULT_PAYMENT_METHODS` from `src/types/index.ts`
- Produces (store shape, all exported via `useTripStore`):
  ```ts
  trips: Trip[]
  settings: AppSettings
  addTrip(trip: Omit<Trip, 'id' | 'createdAt' | 'expenses'>): void
  deleteTrip(tripId: string): void
  addExpense(tripId: string, expense: Omit<Expense, 'id'>): void
  updateExpense(tripId: string, expense: Expense): void
  deleteExpense(tripId: string, expenseId: string): void
  addCategory(category: string): void
  removeCategory(category: string): void
  addPaymentMethod(method: string): void
  removePaymentMethod(method: string): void
  ```

- [ ] **Step 1: Install zustand (already done in Task 1; verify)**

```bash
node -e "require('zustand'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 2: Create src/store/useTripStore.ts**

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Trip,
  Expense,
  AppSettings,
  DEFAULT_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
} from '../types'

interface TripStore {
  trips: Trip[]
  settings: AppSettings
  addTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'expenses'>) => void
  deleteTrip: (tripId: string) => void
  addExpense: (tripId: string, expense: Omit<Expense, 'id'>) => void
  updateExpense: (tripId: string, expense: Expense) => void
  deleteExpense: (tripId: string, expenseId: string) => void
  addCategory: (category: string) => void
  removeCategory: (category: string) => void
  addPaymentMethod: (method: string) => void
  removePaymentMethod: (method: string) => void
}

export const useTripStore = create<TripStore>()(
  persist(
    (set) => ({
      trips: [],
      settings: {
        categories: [...DEFAULT_CATEGORIES],
        paymentMethods: [...DEFAULT_PAYMENT_METHODS],
      },

      addTrip: (tripData) =>
        set((state) => ({
          trips: [
            ...state.trips,
            {
              ...tripData,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              expenses: [],
            },
          ],
        })),

      deleteTrip: (tripId) =>
        set((state) => ({
          trips: state.trips.filter((t) => t.id !== tripId),
        })),

      addExpense: (tripId, expenseData) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  expenses: [
                    ...trip.expenses,
                    { ...expenseData, id: crypto.randomUUID() },
                  ],
                }
              : trip
          ),
        })),

      updateExpense: (tripId, expense) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  expenses: trip.expenses.map((e) =>
                    e.id === expense.id ? expense : e
                  ),
                }
              : trip
          ),
        })),

      deleteExpense: (tripId, expenseId) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  expenses: trip.expenses.filter((e) => e.id !== expenseId),
                }
              : trip
          ),
        })),

      addCategory: (category) =>
        set((state) => ({
          settings: {
            ...state.settings,
            categories: [...state.settings.categories, category],
          },
        })),

      removeCategory: (category) =>
        set((state) => ({
          settings: {
            ...state.settings,
            categories: state.settings.categories.filter((c) => c !== category),
          },
        })),

      addPaymentMethod: (method) =>
        set((state) => ({
          settings: {
            ...state.settings,
            paymentMethods: [...state.settings.paymentMethods, method],
          },
        })),

      removePaymentMethod: (method) =>
        set((state) => ({
          settings: {
            ...state.settings,
            paymentMethods: state.settings.paymentMethods.filter(
              (m) => m !== method
            ),
          },
        })),
    }),
    {
      name: 'travel-expense-store',
    }
  )
)
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/store/useTripStore.ts
git commit -m "feat: add Zustand store with localStorage persistence"
```

---

### Task 4: Settlement Utility (TDD)

**Files:**
- Create: `src/utils/settlement.ts`
- Create: `src/utils/settlement.test.ts`

**Interfaces:**
- Consumes:
  - `Trip`, `Transfer`, `Expense`, `Split`, `Member` from `src/types/index.ts`
- Produces:
  ```ts
  calculateSettlement(trip: Trip): Transfer[]
  ```
  Each `Transfer` has `{ from: string, to: string, amount: number }` where `from`/`to` are memberIds and `amount` is rounded to 2 decimal places.

- [ ] **Step 1: Create the test file src/utils/settlement.test.ts**

```ts
import { describe, it, expect } from 'vitest'
import { calculateSettlement } from './settlement'
import { Trip } from '../types'

const makeTrip = (overrides: Partial<Trip> = {}): Trip => ({
  id: 'trip-1',
  name: 'Test Trip',
  baseCurrency: 'TWD',
  createdAt: '2026-07-01T00:00:00.000Z',
  members: [
    { id: 'alice', name: 'Alice' },
    { id: 'bob', name: 'Bob' },
    { id: 'carol', name: 'Carol' },
  ],
  expenses: [],
  ...overrides,
})

describe('calculateSettlement', () => {
  it('returns empty array when no expenses', () => {
    const result = calculateSettlement(makeTrip())
    expect(result).toEqual([])
  })

  it('returns empty array when all members paid equally and split equally', () => {
    const trip = makeTrip({
      members: [
        { id: 'alice', name: 'Alice' },
        { id: 'bob', name: 'Bob' },
      ],
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
        {
          id: 'e2',
          date: '2026-07-01',
          description: 'Dinner',
          category: '餐飲',
          paymentMethod: '現金',
          paidBy: 'bob',
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
    const result = calculateSettlement(trip)
    expect(result).toEqual([])
  })

  it('calculates one transfer when one person paid for everything', () => {
    const trip = makeTrip({
      members: [
        { id: 'alice', name: 'Alice' },
        { id: 'bob', name: 'Bob' },
      ],
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
    const result = calculateSettlement(trip)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ from: 'bob', to: 'alice', amount: 500 })
  })

  it('handles currency conversion via exchangeRate', () => {
    const trip = makeTrip({
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
          amount: 1000,  // 1000 JPY
          currency: 'JPY',
          exchangeRate: 0.22, // 1 JPY = 0.22 TWD → 220 TWD total
          splits: [
            { memberId: 'alice', ratio: 1 },
            { memberId: 'bob', ratio: 1 },
          ],
        },
      ],
    })
    const result = calculateSettlement(trip)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ from: 'bob', to: 'alice', amount: 110 })
  })

  it('handles unequal split ratios', () => {
    // Alice pays 3000; splits alice:1, bob:2 → alice owes 1000, bob owes 2000
    // Alice paid 3000, owes 1000 → net +2000 (creditor)
    // Bob paid 0, owes 2000 → net -2000 (debtor)
    const trip = makeTrip({
      members: [
        { id: 'alice', name: 'Alice' },
        { id: 'bob', name: 'Bob' },
      ],
      expenses: [
        {
          id: 'e1',
          date: '2026-07-01',
          description: 'Tour',
          category: '票券',
          paymentMethod: '信用卡',
          paidBy: 'alice',
          amount: 3000,
          currency: 'TWD',
          exchangeRate: 1,
          splits: [
            { memberId: 'alice', ratio: 1 },
            { memberId: 'bob', ratio: 2 },
          ],
        },
      ],
    })
    const result = calculateSettlement(trip)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ from: 'bob', to: 'alice', amount: 2000 })
  })

  it('produces minimum transfers for three-person scenario', () => {
    // Alice pays 900 split equally (3 ways) → each owes 300
    // Net: alice +600, bob -300, carol -300
    const trip = makeTrip({
      expenses: [
        {
          id: 'e1',
          date: '2026-07-01',
          description: 'Dinner',
          category: '餐飲',
          paymentMethod: '現金',
          paidBy: 'alice',
          amount: 900,
          currency: 'TWD',
          exchangeRate: 1,
          splits: [
            { memberId: 'alice', ratio: 1 },
            { memberId: 'bob', ratio: 1 },
            { memberId: 'carol', ratio: 1 },
          ],
        },
      ],
    })
    const result = calculateSettlement(trip)
    expect(result).toHaveLength(2)
    const fromBob = result.find((t) => t.from === 'bob')
    const fromCarol = result.find((t) => t.from === 'carol')
    expect(fromBob).toEqual({ from: 'bob', to: 'alice', amount: 300 })
    expect(fromCarol).toEqual({ from: 'carol', to: 'alice', amount: 300 })
  })

  it('rounds amounts to 2 decimal places', () => {
    // 100 / 3 = 33.333...
    const trip = makeTrip({
      members: [
        { id: 'alice', name: 'Alice' },
        { id: 'bob', name: 'Bob' },
        { id: 'carol', name: 'Carol' },
      ],
      expenses: [
        {
          id: 'e1',
          date: '2026-07-01',
          description: 'Snack',
          category: '餐飲',
          paymentMethod: '現金',
          paidBy: 'alice',
          amount: 100,
          currency: 'TWD',
          exchangeRate: 1,
          splits: [
            { memberId: 'alice', ratio: 1 },
            { memberId: 'bob', ratio: 1 },
            { memberId: 'carol', ratio: 1 },
          ],
        },
      ],
    })
    const result = calculateSettlement(trip)
    result.forEach((t) => {
      expect(Number.isFinite(t.amount)).toBe(true)
      expect(t.amount).toBe(Math.round(t.amount * 100) / 100)
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/utils/settlement.test.ts
```

Expected: FAIL — `Cannot find module './settlement'`

- [ ] **Step 3: Create src/utils/settlement.ts**

```ts
import { Trip, Transfer } from '../types'

export function calculateSettlement(trip: Trip): Transfer[] {
  if (trip.expenses.length === 0) return []

  // Step 1: compute net balance per member (positive = creditor, negative = debtor)
  const net: Record<string, number> = {}
  trip.members.forEach((m) => (net[m.id] = 0))

  for (const expense of trip.expenses) {
    const baseAmount = expense.amount * expense.exchangeRate
    const ratioSum = expense.splits.reduce((sum, s) => sum + s.ratio, 0)

    // paidBy member gets credit for the full base amount
    net[expense.paidBy] = (net[expense.paidBy] ?? 0) + baseAmount

    // each split member owes their share
    for (const split of expense.splits) {
      const share = baseAmount * (split.ratio / ratioSum)
      net[split.memberId] = (net[split.memberId] ?? 0) - share
    }
  }

  // Step 2: greedy minimum transfers
  const transfers: Transfer[] = []
  const creditors = Object.entries(net)
    .filter(([, v]) => v > 0.005)
    .map(([id, v]) => ({ id, amount: v }))
  const debtors = Object.entries(net)
    .filter(([, v]) => v < -0.005)
    .map(([id, v]) => ({ id, amount: -v }))

  let ci = 0
  let di = 0

  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci]
    const debt = debtors[di]
    const transferAmount = Math.min(credit.amount, debt.amount)
    const rounded = Math.round(transferAmount * 100) / 100

    if (rounded > 0) {
      transfers.push({ from: debt.id, to: credit.id, amount: rounded })
    }

    credit.amount -= transferAmount
    debt.amount -= transferAmount

    if (credit.amount < 0.005) ci++
    if (debt.amount < 0.005) di++
  }

  return transfers
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/utils/settlement.test.ts
```

Expected:
```
 ✓ src/utils/settlement.test.ts (6)
   ✓ calculateSettlement > returns empty array when no expenses
   ✓ calculateSettlement > returns empty array when all members paid equally and split equally
   ✓ calculateSettlement > calculates one transfer when one person paid for everything
   ✓ calculateSettlement > handles currency conversion via exchangeRate
   ✓ calculateSettlement > handles unequal split ratios
   ✓ calculateSettlement > produces minimum transfers for three-person scenario
   ✓ calculateSettlement > rounds amounts to 2 decimal places

 Test Files  1 passed (1)
 Tests  7 passed (7)
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/settlement.ts src/utils/settlement.test.ts
git commit -m "feat: add settlement utility with TDD (calculateSettlement)"
```

---

### Task 5: Currency Utility (TDD)

**Files:**
- Create: `src/utils/currency.ts`
- Create: `src/utils/currency.test.ts`

**Interfaces:**
- Consumes:
  - `Expense` from `src/types/index.ts`
- Produces:
  ```ts
  convertToBase(amount: number, rate: number): number
  getLastExchangeRate(expenses: Expense[], currency: string): number | undefined
  ```

- [ ] **Step 1: Create src/utils/currency.test.ts**

```ts
import { describe, it, expect } from 'vitest'
import { convertToBase, getLastExchangeRate } from './currency'
import { Expense } from '../types'

const makeExpense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'e1',
  date: '2026-07-01',
  description: 'Test',
  category: '餐飲',
  paymentMethod: '現金',
  paidBy: 'alice',
  amount: 100,
  currency: 'JPY',
  exchangeRate: 0.22,
  splits: [],
  ...overrides,
})

describe('convertToBase', () => {
  it('converts amount by multiplying with rate', () => {
    expect(convertToBase(1000, 0.22)).toBeCloseTo(220, 5)
  })

  it('returns amount unchanged when rate is 1', () => {
    expect(convertToBase(500, 1)).toBe(500)
  })

  it('returns 0 when amount is 0', () => {
    expect(convertToBase(0, 0.22)).toBe(0)
  })
})

describe('getLastExchangeRate', () => {
  it('returns undefined when expenses array is empty', () => {
    expect(getLastExchangeRate([], 'JPY')).toBeUndefined()
  })

  it('returns undefined when currency not found in expenses', () => {
    const expenses = [makeExpense({ currency: 'USD', exchangeRate: 30 })]
    expect(getLastExchangeRate(expenses, 'JPY')).toBeUndefined()
  })

  it('returns the exchangeRate of the matching currency expense', () => {
    const expenses = [makeExpense({ currency: 'JPY', exchangeRate: 0.22 })]
    expect(getLastExchangeRate(expenses, 'JPY')).toBe(0.22)
  })

  it('returns the LAST matching expense rate (by array order)', () => {
    const expenses = [
      makeExpense({ id: 'e1', date: '2026-06-30', currency: 'JPY', exchangeRate: 0.20 }),
      makeExpense({ id: 'e2', date: '2026-07-01', currency: 'JPY', exchangeRate: 0.22 }),
      makeExpense({ id: 'e3', date: '2026-07-01', currency: 'USD', exchangeRate: 32 }),
    ]
    expect(getLastExchangeRate(expenses, 'JPY')).toBe(0.22)
  })

  it('ignores expenses with different currency', () => {
    const expenses = [
      makeExpense({ currency: 'USD', exchangeRate: 32 }),
      makeExpense({ currency: 'USD', exchangeRate: 31 }),
    ]
    expect(getLastExchangeRate(expenses, 'JPY')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/utils/currency.test.ts
```

Expected: FAIL — `Cannot find module './currency'`

- [ ] **Step 3: Create src/utils/currency.ts**

```ts
import { Expense } from '../types'

export function convertToBase(amount: number, rate: number): number {
  return amount * rate
}

export function getLastExchangeRate(
  expenses: Expense[],
  currency: string
): number | undefined {
  const matching = expenses.filter((e) => e.currency === currency)
  if (matching.length === 0) return undefined
  return matching[matching.length - 1].exchangeRate
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/utils/currency.test.ts
```

Expected:
```
 ✓ src/utils/currency.test.ts (8)
   ✓ convertToBase > converts amount by multiplying with rate
   ✓ convertToBase > returns amount unchanged when rate is 1
   ✓ convertToBase > returns 0 when amount is 0
   ✓ getLastExchangeRate > returns undefined when expenses array is empty
   ✓ getLastExchangeRate > returns undefined when currency not found in expenses
   ✓ getLastExchangeRate > returns the exchangeRate of the matching currency expense
   ✓ getLastExchangeRate > returns the LAST matching expense rate (by array order)
   ✓ getLastExchangeRate > ignores expenses with different currency

 Test Files  1 passed (1)
 Tests  8 passed (8)
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/currency.ts src/utils/currency.test.ts
git commit -m "feat: add currency utility with TDD (convertToBase, getLastExchangeRate)"
```

---

### Task 6: Export Utility (TDD)

**Files:**
- Create: `src/utils/export.ts`
- Create: `src/utils/export.test.ts`

**Interfaces:**
- Consumes:
  - `Trip` from `src/types/index.ts`
- Produces:
  ```ts
  exportJSON(trip: Trip): void   // triggers browser download of <trip.name>.json
  exportCSV(trip: Trip): void    // triggers browser download of <trip.name>.csv
  ```

- [ ] **Step 1: Create src/utils/export.test.ts**

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { exportJSON, exportCSV } from './export'
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

// Helper to capture the last anchor element click triggered by export functions
function setupDownloadMock() {
  const clickMock = vi.fn()
  const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') {
      const a = document.createElement.wrappedFunction
        ? document.createElement.wrappedFunction.call(document, tag)
        : Object.create(HTMLAnchorElement.prototype) as HTMLAnchorElement
      a.click = clickMock
      return a
    }
    return document.createElement(tag)
  })
  const revokeObjectURLMock = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  const createObjectURLMock = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url')

  return { clickMock, createElementSpy, revokeObjectURLMock, createObjectURLMock }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('exportJSON', () => {
  it('triggers a download with a .json filename', () => {
    const { clickMock, createObjectURLMock } = setupDownloadMock()
    const trip = makeTrip()
    exportJSON(trip)
    expect(createObjectURLMock).toHaveBeenCalledOnce()
    expect(clickMock).toHaveBeenCalledOnce()
  })

  it('serializes the trip as valid JSON', () => {
    let capturedBlob: Blob | undefined
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      capturedBlob = blob as Blob
      return 'blob:fake'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const anchorMock = { href: '', download: '', click: vi.fn() } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValue(anchorMock)

    exportJSON(makeTrip())

    expect(capturedBlob).toBeDefined()
    return capturedBlob!.text().then((text) => {
      const parsed = JSON.parse(text)
      expect(parsed.id).toBe('trip-1')
      expect(parsed.name).toBe('Tokyo 2026')
      expect(parsed.expenses).toHaveLength(1)
    })
  })

  it('sets download attribute to trip name with .json extension', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const anchorMock = { href: '', download: '', click: vi.fn() } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValue(anchorMock)

    exportJSON(makeTrip())

    expect(anchorMock.download).toBe('Tokyo 2026.json')
  })
})

describe('exportCSV', () => {
  it('triggers a download with a .csv filename', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const anchorMock = { href: '', download: '', click: vi.fn() } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValue(anchorMock)

    exportCSV(makeTrip())

    expect(anchorMock.download).toBe('Tokyo 2026.csv')
    expect(anchorMock.click).toHaveBeenCalledOnce()
  })

  it('includes a header row and one data row per expense', () => {
    let capturedBlob: Blob | undefined
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      capturedBlob = blob as Blob
      return 'blob:fake'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const anchorMock = { href: '', download: '', click: vi.fn() } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValue(anchorMock)

    exportCSV(makeTrip())

    return capturedBlob!.text().then((text) => {
      const lines = text.trim().split('\n')
      expect(lines).toHaveLength(2) // header + 1 expense
      expect(lines[0]).toContain('日期')
      expect(lines[0]).toContain('描述')
      expect(lines[0]).toContain('金額')
      expect(lines[1]).toContain('Ramen')
      expect(lines[1]).toContain('1000')
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/utils/export.test.ts
```

Expected: FAIL — `Cannot find module './export'`

- [ ] **Step 3: Create src/utils/export.ts**

```ts
import { Trip } from '../types'

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportJSON(trip: Trip): void {
  const json = JSON.stringify(trip, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  triggerDownload(blob, `${trip.name}.json`)
}

export function exportCSV(trip: Trip): void {
  const headers = ['日期', '描述', '類別', '付款方式', '付款人', '金額', '幣別', '匯率', '本位幣金額']
  const rows = trip.expenses.map((e) => {
    const payer = trip.members.find((m) => m.id === e.paidBy)?.name ?? e.paidBy
    const baseAmount = e.amount * e.exchangeRate
    return [
      e.date,
      `"${e.description.replace(/"/g, '""')}"`,
      e.category,
      e.paymentMethod,
      payer,
      e.amount,
      e.currency,
      e.exchangeRate,
      baseAmount.toFixed(2),
    ].join(',')
  })
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `${trip.name}.csv`)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/utils/export.test.ts
```

Expected:
```
 ✓ src/utils/export.test.ts (5)
 Test Files  1 passed (1)
 Tests  5 passed (5)
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/export.ts src/utils/export.test.ts
git commit -m "feat: add export utility with TDD (exportJSON, exportCSV)"
```

---

### Task 7: TripCard + TripListPage

**Files:**
- Create: `src/components/TripCard.tsx`
- Create: `src/pages/TripListPage.tsx`
- Modify: `src/main.tsx`
- Create: `src/App.tsx`

**Interfaces:**
- Consumes:
  - `useTripStore` from `src/store/useTripStore.ts` — `trips`, `addTrip`, `deleteTrip`
  - `exportJSON`, `exportCSV` from `src/utils/export.ts`
  - `Trip` from `src/types/index.ts`
- Produces:
  - Route `/` renders `TripListPage`
  - Route `/trips/:tripId` placeholder (filled in Task 12)
  - `TripCard` props: `{ trip: Trip; onDelete: () => void }`

- [ ] **Step 1: Set up App.tsx with routing**

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TripListPage from './pages/TripListPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TripListPage />} />
        <Route path="/trips/:tripId" element={<div>旅行詳情（即將推出）</div>} />
        <Route path="/settings" element={<div>設定（即將推出）</div>} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Update src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 3: Create src/components/TripCard.tsx**

```tsx
import { Trip } from '../types'
import { exportJSON, exportCSV } from '../utils/export'

interface TripCardProps {
  trip: Trip
  onDelete: () => void
}

export default function TripCard({ trip, onDelete }: TripCardProps) {
  const totalBase = trip.expenses.reduce(
    (sum, e) => sum + e.amount * e.exchangeRate,
    0
  )

  const dateRange = (() => {
    if (trip.expenses.length === 0) return '無支出'
    const dates = trip.expenses.map((e) => e.date).sort()
    const first = dates[0]
    const last = dates[dates.length - 1]
    return first === last ? first : `${first} ～ ${last}`
  })()

  return (
    <div className="bg-white rounded-xl shadow p-4 mb-3">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{trip.name}</h2>
          <p className="text-sm text-gray-500">{dateRange}</p>
          <p className="text-sm text-gray-700 mt-1">
            {trip.baseCurrency} {totalBase.toFixed(0)} 合計
          </p>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <a
            href={`/trips/${trip.id}`}
            className="text-blue-600 text-sm font-medium"
          >
            詳情
          </a>
          <button
            onClick={() => exportJSON(trip)}
            className="text-xs text-gray-500"
          >
            匯出 JSON
          </button>
          <button
            onClick={() => exportCSV(trip)}
            className="text-xs text-gray-500"
          >
            匯出 CSV
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-red-500 mt-1"
          >
            刪除
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create src/pages/TripListPage.tsx**

```tsx
import { useState } from 'react'
import { useTripStore } from '../store/useTripStore'
import TripCard from '../components/TripCard'

interface NewTripForm {
  name: string
  baseCurrency: string
  memberNames: string
}

const EMPTY_FORM: NewTripForm = {
  name: '',
  baseCurrency: 'TWD',
  memberNames: '',
}

export default function TripListPage() {
  const { trips, addTrip, deleteTrip } = useTripStore()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<NewTripForm>(EMPTY_FORM)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const members = form.memberNames
      .split(/[,，、\n]+/)
      .map((n) => n.trim())
      .filter(Boolean)
      .map((name) => ({ id: crypto.randomUUID(), name }))
    addTrip({ name: form.name, baseCurrency: form.baseCurrency, members })
    setForm(EMPTY_FORM)
    setShowModal(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">旅遊記帳</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white text-sm px-3 py-1 rounded-lg"
        >
          新增旅行
        </button>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {trips.length === 0 ? (
          <p className="text-center text-gray-400 mt-16">尚無旅行記錄，點擊「新增旅行」開始</p>
        ) : (
          trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onDelete={() => deleteTrip(trip.id)}
            />
          ))
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-5">
            <h2 className="text-lg font-semibold mb-4">新增旅行</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">旅行名稱</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例：東京五日遊"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">本位幣</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                  value={form.baseCurrency}
                  onChange={(e) =>
                    setForm({ ...form, baseCurrency: e.target.value.toUpperCase() })
                  }
                  placeholder="TWD"
                  maxLength={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  成員（用逗號或換行分隔）
                </label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                  value={form.memberNames}
                  onChange={(e) =>
                    setForm({ ...form, memberNames: e.target.value })
                  }
                  placeholder="Alice, Bob, Carol"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setForm(EMPTY_FORM)
                  }}
                  className="flex-1 border rounded-lg py-2 text-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium"
                >
                  新增
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Verify the app renders in browser**

```bash
npm run dev
```

Open http://localhost:5173 — should see the 旅遊記帳 header and an empty state message. Click 新增旅行 — modal appears. Fill in name/currency/members and submit — trip card appears.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/main.tsx src/components/TripCard.tsx src/pages/TripListPage.tsx
git commit -m "feat: add TripListPage and TripCard with create/delete flow"
```

---

### Task 8: SplitEditor Component

**Files:**
- Create: `src/components/SplitEditor.tsx`
- Create: `src/components/SplitEditor.test.tsx`

**Interfaces:**
- Consumes:
  - `Member`, `Split` from `src/types/index.ts`
- Produces:
  ```ts
  // Props
  interface SplitEditorProps {
    members: Member[]
    splits: Split[]           // controlled
    totalBaseAmount: number   // in baseCurrency, for showing per-person amount
    onChange: (splits: Split[]) => void
  }
  ```

- [ ] **Step 1: Create src/components/SplitEditor.test.tsx**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SplitEditor from './SplitEditor'
import { Member, Split } from '../types'

const members: Member[] = [
  { id: 'alice', name: 'Alice' },
  { id: 'bob', name: 'Bob' },
]

const defaultSplits: Split[] = [
  { memberId: 'alice', ratio: 1 },
  { memberId: 'bob', ratio: 1 },
]

describe('SplitEditor', () => {
  it('renders a row for each member', () => {
    render(
      <SplitEditor
        members={members}
        splits={defaultSplits}
        totalBaseAmount={200}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows calculated share amount for each member', () => {
    // 200 total, equal ratios → 100 each
    render(
      <SplitEditor
        members={members}
        splits={defaultSplits}
        totalBaseAmount={200}
        onChange={vi.fn()}
      />
    )
    const amounts = screen.getAllByText('100.00')
    expect(amounts).toHaveLength(2)
  })

  it('shows correct amounts for unequal ratios', () => {
    // 300 total, alice:1 bob:2 → alice=100, bob=200
    render(
      <SplitEditor
        members={members}
        splits={[
          { memberId: 'alice', ratio: 1 },
          { memberId: 'bob', ratio: 2 },
        ]}
        totalBaseAmount={300}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText('100.00')).toBeInTheDocument()
    expect(screen.getByText('200.00')).toBeInTheDocument()
  })

  it('calls onChange when a ratio input changes', () => {
    const onChange = vi.fn()
    render(
      <SplitEditor
        members={members}
        splits={defaultSplits}
        totalBaseAmount={200}
        onChange={onChange}
      />
    )
    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '3' } })
    expect(onChange).toHaveBeenCalledOnce()
    const newSplits: Split[] = onChange.mock.calls[0][0]
    expect(newSplits.find((s) => s.memberId === 'alice')?.ratio).toBe(3)
  })

  it('calls onChange with member removed when checkbox unchecked', () => {
    const onChange = vi.fn()
    render(
      <SplitEditor
        members={members}
        splits={defaultSplits}
        totalBaseAmount={200}
        onChange={onChange}
      />
    )
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0]) // uncheck Alice
    expect(onChange).toHaveBeenCalledOnce()
    const newSplits: Split[] = onChange.mock.calls[0][0]
    expect(newSplits.find((s) => s.memberId === 'alice')).toBeUndefined()
  })

  it('calls onChange with member added when checkbox checked', () => {
    const onChange = vi.fn()
    render(
      <SplitEditor
        members={members}
        splits={[{ memberId: 'bob', ratio: 1 }]} // Alice not included
        totalBaseAmount={100}
        onChange={onChange}
      />
    )
    const checkboxes = screen.getAllByRole('checkbox')
    // Alice checkbox is first; it should be unchecked
    fireEvent.click(checkboxes[0]) // check Alice
    expect(onChange).toHaveBeenCalledOnce()
    const newSplits: Split[] = onChange.mock.calls[0][0]
    expect(newSplits.find((s) => s.memberId === 'alice')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/components/SplitEditor.test.tsx
```

Expected: FAIL — `Cannot find module './SplitEditor'`

- [ ] **Step 3: Create src/components/SplitEditor.tsx**

```tsx
import { Member, Split } from '../types'

interface SplitEditorProps {
  members: Member[]
  splits: Split[]
  totalBaseAmount: number
  onChange: (splits: Split[]) => void
}

export default function SplitEditor({
  members,
  splits,
  totalBaseAmount,
  onChange,
}: SplitEditorProps) {
  const ratioSum = splits.reduce((s, sp) => s + sp.ratio, 0)

  function getShare(memberId: string): number {
    const split = splits.find((s) => s.memberId === memberId)
    if (!split || ratioSum === 0) return 0
    return totalBaseAmount * (split.ratio / ratioSum)
  }

  function handleCheck(memberId: string, checked: boolean) {
    if (checked) {
      onChange([...splits, { memberId, ratio: 1 }])
    } else {
      onChange(splits.filter((s) => s.memberId !== memberId))
    }
  }

  function handleRatio(memberId: string, value: number) {
    onChange(
      splits.map((s) =>
        s.memberId === memberId ? { ...s, ratio: isNaN(value) ? 1 : value } : s
      )
    )
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const split = splits.find((s) => s.memberId === member.id)
        const included = !!split
        return (
          <div key={member.id} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={included}
              onChange={(e) => handleCheck(member.id, e.target.checked)}
              className="w-4 h-4"
            />
            <span className="flex-1 text-sm">{member.name}</span>
            <input
              type="number"
              min={1}
              value={included ? split!.ratio : ''}
              disabled={!included}
              onChange={(e) => handleRatio(member.id, parseFloat(e.target.value))}
              className="w-16 border rounded px-2 py-1 text-sm text-center disabled:bg-gray-100"
            />
            <span className="w-20 text-right text-sm text-gray-600">
              {getShare(member.id).toFixed(2)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/components/SplitEditor.test.tsx
```

Expected:
```
 ✓ src/components/SplitEditor.test.tsx (6)
 Test Files  1 passed (1)
 Tests  6 passed (6)
```

- [ ] **Step 5: Commit**

```bash
git add src/components/SplitEditor.tsx src/components/SplitEditor.test.tsx
git commit -m "feat: add SplitEditor component with TDD"
```

---

### Task 9: ExpenseForm Component

**Files:**
- Create: `src/components/ExpenseForm.tsx`

**Interfaces:**
- Consumes:
  - `Member`, `Expense`, `Split` from `src/types/index.ts`
  - `SplitEditor` from `src/components/SplitEditor.tsx` — props: `{ members, splits, totalBaseAmount, onChange }`
  - `getLastExchangeRate` from `src/utils/currency.ts`
  - `convertToBase` from `src/utils/currency.ts`
  - `useTripStore` — `settings.categories`, `settings.paymentMethods`
  - `date-fns/format` for default date
- Produces:
  ```ts
  interface ExpenseFormProps {
    members: Member[]
    existingExpenses: Expense[]    // for auto-fill exchange rate
    initialValues?: Expense        // when editing
    onSubmit: (expense: Omit<Expense, 'id'>) => void
    onCancel: () => void
  }
  ```

- [ ] **Step 1: Create src/components/ExpenseForm.tsx**

```tsx
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Expense, Member, Split } from '../types'
import { getLastExchangeRate, convertToBase } from '../utils/currency'
import { useTripStore } from '../store/useTripStore'
import SplitEditor from './SplitEditor'

interface ExpenseFormProps {
  members: Member[]
  existingExpenses: Expense[]
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

  // Auto-fill exchange rate when currency changes
  useEffect(() => {
    if (initialValues) return // don't override when editing
    const last = getLastExchangeRate(existingExpenses, currency)
    if (last !== undefined) {
      setExchangeRate(String(last))
    } else {
      setExchangeRate(currency === 'TWD' ? '1' : '')
    }
  }, [currency, existingExpenses, initialValues])

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
  const inputClass = 'w-full border rounded-lg px-3 py-2 text-sm'

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
        <select
          className={inputClass}
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
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
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/ExpenseForm.tsx
git commit -m "feat: add ExpenseForm component with auto-fill exchange rate and SplitEditor"
```

---

### Task 10: ExpenseList Component

**Files:**
- Create: `src/components/ExpenseList.tsx`
- Create: `src/components/ExpenseList.test.tsx`

**Interfaces:**
- Consumes:
  - `Expense`, `Member` from `src/types/index.ts`
  - `convertToBase` from `src/utils/currency.ts`
  - `date-fns/format`, `date-fns/parseISO` for date formatting
- Produces:
  ```ts
  interface ExpenseListProps {
    expenses: Expense[]
    members: Member[]
    baseCurrency: string
    onDelete: (expenseId: string) => void
    onEdit: (expense: Expense) => void
  }
  ```

- [ ] **Step 1: Create src/components/ExpenseList.test.tsx**

```tsx
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
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
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
    expect(onDelete).toHaveBeenCalledWith('e1')
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
    expect(onEdit).toHaveBeenCalledWith(expenses[0])
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/components/ExpenseList.test.tsx
```

Expected: FAIL — `Cannot find module './ExpenseList'`

- [ ] **Step 3: Create src/components/ExpenseList.tsx**

```tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/components/ExpenseList.test.tsx
```

Expected:
```
 ✓ src/components/ExpenseList.test.tsx (6)
 Test Files  1 passed (1)
 Tests  6 passed (6)
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ExpenseList.tsx src/components/ExpenseList.test.tsx
git commit -m "feat: add ExpenseList component with date grouping and TDD"
```

---

### Task 11: SettlementView Component

**Files:**
- Create: `src/components/SettlementView.tsx`
- Create: `src/components/SettlementView.test.tsx`

**Interfaces:**
- Consumes:
  - `Trip`, `Transfer`, `Member` from `src/types/index.ts`
  - `calculateSettlement` from `src/utils/settlement.ts`
- Produces:
  ```ts
  interface SettlementViewProps {
    trip: Trip
  }
  ```

- [ ] **Step 1: Create src/components/SettlementView.test.tsx**

```tsx
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
    // Bob owes Alice 500
    expect(screen.getByText(/Bob/)).toBeInTheDocument()
    expect(screen.getByText(/Alice/)).toBeInTheDocument()
    expect(screen.getByText(/500/)).toBeInTheDocument()
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
    // Alice paid 200, owed 100
    expect(screen.getByText('200.00')).toBeInTheDocument()
    expect(screen.getAllByText('100.00').length).toBeGreaterThanOrEqual(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- src/components/SettlementView.test.tsx
```

Expected: FAIL — `Cannot find module './SettlementView'`

- [ ] **Step 3: Create src/components/SettlementView.tsx**

```tsx
import { Trip } from '../types'
import { calculateSettlement } from '../utils/settlement'

interface SettlementViewProps {
  trip: Trip
}

export default function SettlementView({ trip }: SettlementViewProps) {
  const transfers = calculateSettlement(trip)

  // Per-member summary
  const summary = trip.members.map((member) => {
    const paid = trip.expenses
      .filter((e) => e.paidBy === member.id)
      .reduce((sum, e) => sum + e.amount * e.exchangeRate, 0)

    const owed = trip.expenses.reduce((sum, e) => {
      const baseAmount = e.amount * e.exchangeRate
      const ratioSum = e.splits.reduce((s, sp) => s + sp.ratio, 0)
      const split = e.splits.find((s) => s.memberId === member.id)
      if (!split || ratioSum === 0) return sum
      return sum + baseAmount * (split.ratio / ratioSum)
    }, 0)

    return { member, paid, owed, net: paid - owed }
  })

  function getMemberName(memberId: string): string {
    return trip.members.find((m) => m.id === memberId)?.name ?? memberId
  }

  return (
    <div className="p-4 space-y-6">
      {/* Per-member summary table */}
      <section>
        <h2 className="text-base font-semibold mb-3">各人總覽</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-3 py-2">成員</th>
                <th className="text-right px-3 py-2">已付</th>
                <th className="text-right px-3 py-2">應付</th>
                <th className="text-right px-3 py-2">差額</th>
              </tr>
            </thead>
            <tbody>
              {summary.map(({ member, paid, owed, net }) => (
                <tr key={member.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{member.name}</td>
                  <td className="px-3 py-2 text-right">{paid.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{owed.toFixed(2)}</td>
                  <td
                    className={`px-3 py-2 text-right font-semibold ${
                      net >= 0 ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {net >= 0 ? '+' : ''}{net.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Minimum transfers */}
      <section>
        <h2 className="text-base font-semibold mb-3">轉帳清單</h2>
        {transfers.length === 0 ? (
          <p className="text-center text-gray-400 py-6">無需轉帳，已結清</p>
        ) : (
          <div className="space-y-2">
            {transfers.map((transfer, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{getMemberName(transfer.from)}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{getMemberName(transfer.to)}</span>
                </div>
                <span className="font-semibold text-blue-600">
                  {trip.baseCurrency} {transfer.amount.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- src/components/SettlementView.test.tsx
```

Expected:
```
 ✓ src/components/SettlementView.test.tsx (4)
 Test Files  1 passed (1)
 Tests  4 passed (4)
```

- [ ] **Step 5: Commit**

```bash
git add src/components/SettlementView.tsx src/components/SettlementView.test.tsx
git commit -m "feat: add SettlementView component with member summary table and transfer list"
```

---

### Task 12: TripDetailPage

**Files:**
- Create: `src/pages/TripDetailPage.tsx`
- Modify: `src/App.tsx` — replace placeholder `/trips/:tripId` route

**Interfaces:**
- Consumes:
  - `useTripStore` — `trips`, `addExpense`, `updateExpense`, `deleteExpense`
  - `ExpenseList` from `src/components/ExpenseList.tsx`
  - `ExpenseForm` from `src/components/ExpenseForm.tsx`
  - `SettlementView` from `src/components/SettlementView.tsx`
  - `useParams` from `react-router-dom`
  - `Expense` from `src/types/index.ts`
- Produces: Route `/trips/:tripId` renders three-tab page

- [ ] **Step 1: Create src/pages/TripDetailPage.tsx**

```tsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTripStore } from '../store/useTripStore'
import ExpenseList from '../components/ExpenseList'
import ExpenseForm from '../components/ExpenseForm'
import SettlementView from '../components/SettlementView'
import { Expense } from '../types'

type Tab = 'list' | 'add' | 'settlement'

export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const { trips, addExpense, updateExpense, deleteExpense } = useTripStore()
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

  const tabs: { key: Tab; label: string }[] = [
    { key: 'list', label: '支出列表' },
    { key: 'add', label: editingExpense ? '編輯支出' : '新增支出' },
    { key: 'settlement', label: '結算' },
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
      <nav className="bg-white border-b flex">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              if (key !== 'add') setEditingExpense(undefined)
              setActiveTab(key)
            }}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
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
            initialValues={editingExpense}
            onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
            onCancel={handleCancelForm}
          />
        )}
        {activeTab === 'settlement' && <SettlementView trip={trip} />}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Update src/App.tsx to use TripDetailPage**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TripListPage from './pages/TripListPage'
import TripDetailPage from './pages/TripDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TripListPage />} />
        <Route path="/trips/:tripId" element={<TripDetailPage />} />
        <Route path="/settings" element={<div>設定（即將推出）</div>} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Manual smoke test in browser**

```bash
npm run dev
```

1. Open http://localhost:5173
2. Create a trip with 2 members
3. Click 詳情 link → TripDetailPage loads with trip name in header
4. Switch to 新增支出 tab → ExpenseForm renders with member names in 付款人 dropdown
5. Add an expense → switches to 支出列表 tab, expense appears grouped by date
6. Switch to 結算 tab → member summary table and transfer list appear
7. Refresh page → data persists (localStorage)

- [ ] **Step 5: Commit**

```bash
git add src/pages/TripDetailPage.tsx src/App.tsx
git commit -m "feat: add TripDetailPage with three-tab layout (list/add/settlement)"
```

---

### Task 13: SettingsPage

**Files:**
- Create: `src/pages/SettingsPage.tsx`
- Modify: `src/App.tsx` — replace settings placeholder route
- Modify: `src/pages/TripListPage.tsx` — add link to settings

**Interfaces:**
- Consumes:
  - `useTripStore` — `settings`, `addCategory`, `removeCategory`, `addPaymentMethod`, `removePaymentMethod`
  - `DEFAULT_CATEGORIES`, `DEFAULT_PAYMENT_METHODS` from `src/types/index.ts`
- Produces: Route `/settings` renders SettingsPage

- [ ] **Step 1: Create src/pages/SettingsPage.tsx**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTripStore } from '../store/useTripStore'
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS } from '../types'

export default function SettingsPage() {
  const navigate = useNavigate()
  const {
    settings,
    addCategory,
    removeCategory,
    addPaymentMethod,
    removePaymentMethod,
  } = useTripStore()

  const [newCategory, setNewCategory] = useState('')
  const [newPaymentMethod, setNewPaymentMethod] = useState('')

  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newCategory.trim()
    if (!trimmed || settings.categories.includes(trimmed)) return
    addCategory(trimmed)
    setNewCategory('')
  }

  function handleAddPaymentMethod(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newPaymentMethod.trim()
    if (!trimmed || settings.paymentMethods.includes(trimmed)) return
    addPaymentMethod(trimmed)
    setNewPaymentMethod('')
  }

  const isDefaultCategory = (c: string) => DEFAULT_CATEGORIES.includes(c)
  const isDefaultPaymentMethod = (m: string) => DEFAULT_PAYMENT_METHODS.includes(m)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-gray-500 text-sm"
        >
          ← 返回
        </button>
        <h1 className="text-lg font-bold">設定</h1>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-6">
        {/* Categories */}
        <section>
          <h2 className="text-base font-semibold mb-3">類別管理</h2>
          <div className="bg-white rounded-xl shadow-sm divide-y">
            {settings.categories.map((cat) => (
              <div key={cat} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">{cat}</span>
                {!isDefaultCategory(cat) && (
                  <button
                    onClick={() => removeCategory(cat)}
                    className="text-xs text-red-500"
                  >
                    刪除
                  </button>
                )}
                {isDefaultCategory(cat) && (
                  <span className="text-xs text-gray-300">預設</span>
                )}
              </div>
            ))}
          </div>
          <form onSubmit={handleAddCategory} className="mt-3 flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="新增類別…"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              新增
            </button>
          </form>
        </section>

        {/* Payment Methods */}
        <section>
          <h2 className="text-base font-semibold mb-3">付款方式管理</h2>
          <div className="bg-white rounded-xl shadow-sm divide-y">
            {settings.paymentMethods.map((method) => (
              <div key={method} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">{method}</span>
                {!isDefaultPaymentMethod(method) && (
                  <button
                    onClick={() => removePaymentMethod(method)}
                    className="text-xs text-red-500"
                  >
                    刪除
                  </button>
                )}
                {isDefaultPaymentMethod(method) && (
                  <span className="text-xs text-gray-300">預設</span>
                )}
              </div>
            ))}
          </div>
          <form onSubmit={handleAddPaymentMethod} className="mt-3 flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              value={newPaymentMethod}
              onChange={(e) => setNewPaymentMethod(e.target.value)}
              placeholder="新增付款方式…"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              新增
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Update src/App.tsx to use SettingsPage**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TripListPage from './pages/TripListPage'
import TripDetailPage from './pages/TripDetailPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TripListPage />} />
        <Route path="/trips/:tripId" element={<TripDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Add settings link to TripListPage header**

In `src/pages/TripListPage.tsx`, update the header section — replace:

```tsx
<header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
  <h1 className="text-xl font-bold">旅遊記帳</h1>
  <button
    onClick={() => setShowModal(true)}
    className="bg-blue-600 text-white text-sm px-3 py-1 rounded-lg"
  >
    新增旅行
  </button>
</header>
```

with:

```tsx
<header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
  <h1 className="text-xl font-bold">旅遊記帳</h1>
  <div className="flex items-center gap-2">
    <a href="/settings" className="text-gray-500 text-sm px-2 py-1">設定</a>
    <button
      onClick={() => setShowModal(true)}
      className="bg-blue-600 text-white text-sm px-3 py-1 rounded-lg"
    >
      新增旅行
    </button>
  </div>
</header>
```

- [ ] **Step 4: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/pages/SettingsPage.tsx src/App.tsx src/pages/TripListPage.tsx
git commit -m "feat: add SettingsPage for managing categories and payment methods"
```

---

### Task 14: PWA Configuration

**Files:**
- Modify: `vite.config.ts` — add VitePWA plugin
- Create: `public/manifest.webmanifest`
- Create: `public/icons/icon-192.png` (placeholder — see step notes)
- Create: `public/icons/icon-512.png` (placeholder — see step notes)

**Interfaces:**
- Consumes: everything built in Tasks 1–13
- Produces: installable PWA with offline capability

- [ ] **Step 1: Create placeholder PWA icons**

You need two PNG icons. If you have a design tool, export a simple icon at 192×192 and 512×512 to `public/icons/`. Alternatively, generate them quickly with this Node script run once:

```bash
node -e "
const { createCanvas } = require('canvas');
// If canvas not available, use any PNG editor to create icons manually
// at public/icons/icon-192.png and public/icons/icon-512.png
console.log('Create icons manually at public/icons/icon-192.png and public/icons/icon-512.png');
"
```

**Minimum viable option:** Copy any 192×192 PNG to `public/icons/icon-192.png` and any 512×512 PNG to `public/icons/icon-512.png`. The PWA will not install without valid icon files. You can use a free tool like https://favicon.io to generate.

- [ ] **Step 2: Create public/manifest.webmanifest**

```json
{
  "name": "旅遊記帳",
  "short_name": "旅遊記帳",
  "description": "多人旅遊支出記帳與結算",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f9fafb",
  "theme_color": "#2563eb",
  "lang": "zh-TW",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

- [ ] **Step 3: Update vite.config.ts with VitePWA plugin**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // we use our own manifest.webmanifest in /public
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
```

- [ ] **Step 4: Add manifest link to index.html**

In `index.html`, add inside `<head>`:

```html
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#2563eb" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="旅遊記帳" />
```

- [ ] **Step 5: Run full test suite to confirm nothing is broken**

```bash
npm run test:run
```

Expected:
```
 Test Files  X passed (X)
 Tests  XX passed (XX)
```

All tests green.

- [ ] **Step 6: Build and verify PWA**

```bash
npm run build
npm run preview
```

Expected output from build:
```
✓ built in X.XXs
```

Open http://localhost:4173 in Chrome. Then:
1. Open DevTools → Application → Manifest — verify name "旅遊記帳", icons listed, display "standalone"
2. Application → Service Workers — verify SW is registered and active
3. Network tab → set throttle to "Offline" → reload → app still loads
4. Address bar should show install icon (⊕) for PWA install prompt

- [ ] **Step 7: Commit**

```bash
git add vite.config.ts public/manifest.webmanifest public/icons/ index.html
git commit -m "feat: configure PWA with service worker, manifest, and offline support"
```

---

## Full Test Suite Verification

After all tasks are complete, run the full test suite:

```bash
npm run test:run
```

Expected: all tests pass with output similar to:
```
 Test Files  6 passed (6)
 Tests  31 passed (31)
```

Run TypeScript check:
```bash
npx tsc --noEmit
```

Expected: no output.

Build for production:
```bash
npm run build
```

Expected: no errors, `dist/` folder created.
