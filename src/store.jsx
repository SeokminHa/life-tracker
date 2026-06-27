import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const StoreContext = createContext(null)
const STORAGE_KEY = 'life-tracker-data'

const DEFAULT_DATA = {
  categories: [
    { id: 'cat-food', name: 'Food', icon: '🍽️', color: '#FF6B6B' },
    { id: 'cat-beauty', name: 'Beauty', icon: '💄', color: '#E991C5' },
    { id: 'cat-daily', name: 'Daily', icon: '📋', color: '#4ECDC4' },
  ],
  items: [],
  events: [],
  fasting: {
    lastMealTime: null,
    goalHours: 16,
    periods: [],
  },
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (!data.fasting) {
        data.fasting = { lastMealTime: null, goalHours: 16, periods: [] }
      }
      return data
    }
  } catch {}
  return structuredClone(DEFAULT_DATA)
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function genId() {
  return crypto.randomUUID()
}

export function StoreProvider({ children }) {
  const [data, setData] = useState(load)

  const persist = useCallback((updater) => {
    setData(prev => {
      const next = updater(prev)
      save(next)
      return next
    })
  }, [])

  const actions = useMemo(() => ({
    addCategory(name, icon, color) {
      persist(d => ({
        ...d,
        categories: [...d.categories, { id: genId(), name, icon, color }],
      }))
    },

    updateCategory(id, updates) {
      persist(d => ({
        ...d,
        categories: d.categories.map(c => c.id === id ? { ...c, ...updates } : c),
      }))
    },

    deleteCategory(id) {
      persist(d => {
        const itemIds = new Set(d.items.filter(i => i.categoryId === id).map(i => i.id))
        return {
          ...d,
          categories: d.categories.filter(c => c.id !== id),
          items: d.items.filter(i => i.categoryId !== id),
          events: d.events.filter(e => !itemIds.has(e.itemId)),
        }
      })
    },

    addItem(categoryId, name, currentProduct = '', color = '') {
      persist(d => ({
        ...d,
        items: [...d.items, { id: genId(), categoryId, name, currentProduct, color, createdAt: new Date().toISOString() }],
      }))
    },

    updateItem(id, updates) {
      persist(d => ({
        ...d,
        items: d.items.map(i => i.id === id ? { ...i, ...updates } : i),
      }))
    },

    deleteItem(id) {
      persist(d => ({
        ...d,
        items: d.items.filter(i => i.id !== id),
        events: d.events.filter(e => e.itemId !== id),
      }))
    },

    logEvent(itemId, memo = '', timestamp = null, type = 'use') {
      persist(d => ({
        ...d,
        events: [...d.events, {
          id: genId(),
          itemId,
          timestamp: timestamp || new Date().toISOString(),
          memo,
          type,
        }],
      }))
    },

    updateEvent(id, updates) {
      persist(d => ({
        ...d,
        events: d.events.map(e => e.id === id ? { ...e, ...updates } : e),
      }))
    },

    deleteEvent(id) {
      persist(d => ({
        ...d,
        events: d.events.filter(e => e.id !== id),
      }))
    },

    logMeal(timestamp = null) {
      const now = timestamp || new Date().toISOString()
      persist(d => {
        const fasting = { ...d.fasting }
        const periods = [...(fasting.periods || [])]
        if (fasting.lastMealTime) {
          periods.push({
            id: genId(),
            start: fasting.lastMealTime,
            end: now,
            duration: new Date(now) - new Date(fasting.lastMealTime),
          })
        }
        return { ...d, fasting: { ...fasting, lastMealTime: now, periods } }
      })
    },

    updateFastingGoal(hours) {
      persist(d => ({
        ...d,
        fasting: { ...d.fasting, goalHours: hours },
      }))
    },

    deleteFastingPeriod(id) {
      persist(d => ({
        ...d,
        fasting: {
          ...d.fasting,
          periods: (d.fasting.periods || []).filter(p => p.id !== id),
        },
      }))
    },

    exportData() {
      return JSON.stringify(data, null, 2)
    },

    importData(jsonStr) {
      try {
        const imported = JSON.parse(jsonStr)
        if (imported.categories && imported.items && imported.events) {
          persist(() => imported)
          return true
        }
      } catch {}
      return false
    },
  }), [persist, data])

  const value = useMemo(() => ({ data, ...actions }), [data, actions])

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be inside StoreProvider')
  return ctx
}
