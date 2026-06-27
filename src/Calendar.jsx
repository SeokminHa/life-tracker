import { useState, useMemo } from 'react'
import { useStore } from './store.jsx'
import { formatDuration } from './utils.js'

function toDateKey(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DOW = ['일', '월', '화', '수', '목', '금', '토']

export default function Calendar({ onItems, onAddEvent, onEditEvent, onSettings, onFastingGoal }) {
  const { data } = useStore()
  const now = new Date()
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const todayKey = toDateKey(now)
  const [selected, setSelected] = useState(todayKey)
  const [filterIds, setFilterIds] = useState(new Set())
  const [showFilters, setShowFilters] = useState(false)

  const goalMs = (data.fasting?.goalHours || 16) * 3600000

  const allEvents = useMemo(() => {
    const list = []

    data.events.forEach(evt => {
      const item = data.items.find(i => i.id === evt.itemId)
      const cat = item ? data.categories.find(c => c.id === item.categoryId) : null
      list.push({
        kind: 'tracker',
        eventId: evt.id,
        itemId: evt.itemId,
        date: toDateKey(evt.timestamp),
        time: evt.timestamp,
        name: item?.name || '?',
        memo: evt.memo,
        type: evt.type || 'use',
        color: item?.color || cat?.color || '#5B7FFF',
        icon: cat?.icon || '📋',
        sub: cat?.name || '',
      })
    })

    ;(data.fasting?.periods || []).forEach(p => {
      list.push({
        kind: 'fasting',
        itemId: '__fasting__',
        date: toDateKey(p.end),
        time: p.end,
        name: '단식 완료',
        memo: `공복 ${formatDuration(p.duration)}`,
        fastStart: p.start,
        fastEnd: p.end,
        color: p.duration >= goalMs ? '#10B981' : '#FF8E53',
        icon: '⏱️',
        sub: '',
      })
    })

    if (data.fasting?.lastMealTime) {
      const covered = (data.fasting.periods || []).some(p => p.end === data.fasting.lastMealTime)
      if (!covered) {
        list.push({
          kind: 'meal',
          itemId: '__meal__',
          date: toDateKey(data.fasting.lastMealTime),
          time: data.fasting.lastMealTime,
          name: '식사',
          memo: '',
          color: '#FF6B6B',
          icon: '🍴',
          sub: '',
        })
      }
    }

    return list
  }, [data, goalMs])

  const filteredEvents = useMemo(() => {
    if (filterIds.size === 0) return allEvents
    return allEvents.filter(e =>
      e.kind !== 'tracker' || filterIds.has(e.itemId)
    )
  }, [allEvents, filterIds])

  const eventsByDate = useMemo(() => {
    const map = {}
    filteredEvents.forEach(e => {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    })
    return map
  }, [filteredEvents])

  const firstDow = new Date(ym.y, ym.m, 1).getDay()
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dk = `${ym.y}-${String(ym.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, dk, events: eventsByDate[dk] || [] })
  }

  const prevMonth = () => setYm(p => {
    const d = new Date(p.y, p.m - 1, 1)
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const nextMonth = () => setYm(p => {
    const d = new Date(p.y, p.m + 1, 1)
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const goToday = () => {
    setYm({ y: now.getFullYear(), m: now.getMonth() })
    setSelected(todayKey)
  }

  const toggleFilter = (itemId) => {
    setFilterIds(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  const clearFilters = () => setFilterIds(new Set())

  const dayEvents = (eventsByDate[selected] || [])
    .slice()
    .sort((a, b) => new Date(a.time) - new Date(b.time))

  const selectedLabel = (() => {
    try {
      return new Date(selected + 'T00:00:00').toLocaleDateString('ko-KR', {
        month: 'long', day: 'numeric', weekday: 'short',
      })
    } catch { return selected }
  })()

  const itemsWithColor = useMemo(() => {
    return data.items.map(item => {
      const cat = data.categories.find(c => c.id === item.categoryId)
      return { id: item.id, name: item.name, color: item.color || cat?.color || '#5B7FFF', icon: cat?.icon || '📋' }
    })
  }, [data.items, data.categories])

  return (
    <div className="calendar-view">
      <header className="header">
        <h1 className="header-title">Life Tracker</h1>
        <button className="header-btn" onClick={onFastingGoal} title="단식 설정" style={{ fontSize: '16px' }}>⏱️</button>
        <button className="header-btn" onClick={() => setShowFilters(f => !f)} title="필터" style={{ fontSize: '16px' }}>
          {filterIds.size > 0 ? '🔍' : '🔎'}
        </button>
        <button className="header-btn" onClick={onItems} title="항목 관리" style={{ fontSize: '16px' }}>📋</button>
        <button className="header-btn" onClick={onSettings} title="Settings" style={{ fontSize: '16px' }}>&#9881;</button>
      </header>

      <main className="content">
        {showFilters && (
          <div className="cal-filter-bar">
            <div className="cal-filter-chips">
              {itemsWithColor.map(item => (
                <button
                  key={item.id}
                  className={`cal-filter-chip ${filterIds.has(item.id) ? 'active' : ''}`}
                  style={filterIds.has(item.id) ? { background: item.color + '20', borderColor: item.color, color: item.color } : {}}
                  onClick={() => toggleFilter(item.id)}
                >
                  <span className="cal-filter-dot" style={{ backgroundColor: item.color }} />
                  {item.name}
                </button>
              ))}
            </div>
            {filterIds.size > 0 && (
              <button className="cal-filter-clear" onClick={clearFilters}>초기화</button>
            )}
          </div>
        )}

        <div className="cal-nav">
          <button className="cal-arrow" onClick={prevMonth}>&#9664;</button>
          <span className="cal-month-label">{ym.y}년 {ym.m + 1}월</span>
          <button className="cal-arrow" onClick={nextMonth}>&#9654;</button>
          <button className="cal-today-btn" onClick={goToday}>오늘</button>
        </div>

        <div className="cal-grid">
          {DOW.map((d, i) => (
            <div key={d} className={`cal-dow ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`}>{d}</div>
          ))}
          {cells.map((cell, i) =>
            cell ? (
              <div
                key={i}
                className={`cal-cell ${cell.dk === selected ? 'sel' : ''} ${cell.dk === todayKey ? 'today' : ''}`}
                onClick={() => setSelected(cell.dk)}
              >
                <span className={`cal-num ${i % 7 === 0 ? 'sun' : i % 7 === 6 ? 'sat' : ''}`}>{cell.day}</span>
                {cell.events.length > 0 && (
                  <div className="cal-dots">
                    {[...new Map(cell.events.map(e => [e.color, e.color])).values()].slice(0, 3).map((c, j) => (
                      <span key={j} className="cal-dot" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div key={i} className="cal-cell empty" />
            )
          )}
        </div>

        <div className="cal-events">
          <div className="cal-events-header">
            <h3 className="cal-events-title">{selectedLabel}</h3>
            <button className="cal-add-btn" onClick={() => onAddEvent(selected)}>+ 기록</button>
          </div>
          {dayEvents.length > 0 ? (
            dayEvents.map((evt, i) => (
              <div
                key={i}
                className={`cal-ev ${evt.kind === 'tracker' ? 'cal-ev-clickable' : ''}`}
                onClick={() => evt.kind === 'tracker' && onEditEvent(evt.eventId)}
              >
                <span className="cal-ev-dot" style={{ backgroundColor: evt.color }} />
                <div className="cal-ev-body">
                  <div className="cal-ev-name">
                    {evt.name}
                    {evt.kind === 'tracker' && (
                      <span className={`cal-ev-type ${evt.type === 'new' ? 'cal-ev-type-new' : ''}`}>
                        {evt.type === 'new' ? '개봉' : '사용'}
                      </span>
                    )}
                  </div>
                  {evt.kind === 'fasting' && evt.fastStart && (
                    <div className="cal-ev-memo">
                      {new Date(evt.fastStart).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      {' → '}
                      {new Date(evt.fastEnd).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {evt.memo && <div className="cal-ev-memo">{evt.memo}</div>}
                </div>
              </div>
            ))
          ) : (
            <div className="cal-empty">기록 없음</div>
          )}
        </div>
      </main>
    </div>
  )
}
