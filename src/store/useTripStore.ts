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
  updateTrip: (tripId: string, updates: Partial<Pick<Trip, 'name' | 'baseCurrency' | 'members' | 'defaultRates'>>) => void
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
              defaultRates: tripData.defaultRates ?? {},
            },
          ],
        })),

      updateTrip: (tripId, updates) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId ? { ...trip, ...updates } : trip
          ),
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
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { trips?: Trip[] }
        if (version < 1 && state.trips) {
          state.trips = state.trips.map((t) => ({
            ...t,
            defaultRates: t.defaultRates ?? {},
          }))
        }
        return state
      },
    }
  )
)
