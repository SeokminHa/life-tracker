import { useState, useRef } from 'react'
import { useStore } from './store.jsx'
import { getLastEvent, formatTimeAgo, getItemEvents, formatDuration } from './utils.js'
import FastingCard from './FastingCard.jsx'

export default function Home({ onBack, onViewItem, onLogEvent, onAddItem, onAddCategory, onEditCategory, onFastingGoal }) {
  const { data, reorderItem } = useStore()
  const dragRef = useRef(null)
  const justDraggedRef = useRef(false)
  const [dragState, setDragState] = useState(null)

  const startDrag = (e, itemId, catId, idx, count) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)

    const el = e.currentTarget.closest('.item-card')
    const itemHeight = el ? el.offsetHeight + 6 : 66

    const d = {
      itemId, catId, originIdx: idx, currentIdx: idx,
      startY: e.clientY, offsetY: 0,
      itemHeight, maxIdx: count - 1, active: true,
    }
    dragRef.current = d
    setDragState({ ...d })
  }

  const onPointerMove = (e) => {
    const d = dragRef.current
    if (!d?.active) return
    e.preventDefault()
    const deltaY = e.clientY - d.startY
    const posOff = Math.round(deltaY / d.itemHeight)
    d.currentIdx = Math.max(0, Math.min(d.originIdx + posOff, d.maxIdx))
    d.offsetY = deltaY
    setDragState({ ...d })
  }

  const onPointerUp = (e) => {
    const d = dragRef.current
    if (!d?.active) return
    if (d.currentIdx !== d.originIdx) {
      reorderItem(d.itemId, d.currentIdx)
    }
    justDraggedRef.current = true
    setTimeout(() => { justDraggedRef.current = false }, 0)
    dragRef.current = null
    setDragState(null)
  }

  const getItemStyle = (itemId, catId, idx) => {
    if (!dragState?.active || dragState.catId !== catId) return {}
    if (dragState.itemId === itemId) {
      return {
        transform: `translateY(${dragState.offsetY}px) scale(1.02)`,
        zIndex: 100,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        position: 'relative',
        opacity: 0.9,
      }
    }
    const { originIdx, currentIdx, itemHeight } = dragState
    if (originIdx < currentIdx && idx > originIdx && idx <= currentIdx) {
      return { transform: `translateY(-${itemHeight}px)`, transition: 'transform 0.15s ease' }
    }
    if (originIdx > currentIdx && idx >= currentIdx && idx < originIdx) {
      return { transform: `translateY(${itemHeight}px)`, transition: 'transform 0.15s ease' }
    }
    return { transition: 'transform 0.15s ease' }
  }

  return (
    <div className="home">
      <header className="header">
        <button className="back-btn" onClick={onBack}>&#8592;</button>
        <h1 className="header-title">항목 관리</h1>
        <button className="header-btn" onClick={onAddCategory} title="Add category">+</button>
      </header>

      <main className="content">
        <FastingCard onGoalSettings={onFastingGoal} />

        {data.categories.map(cat => {
          const items = data.items.filter(i => i.categoryId === cat.id)
          return (
            <section key={cat.id} className="category-section">
              <div
                className="category-header"
                onClick={() => onEditCategory(cat.id)}
              >
                <span className="category-icon">{cat.icon}</span>
                <span className="category-name">{cat.name}</span>
                <span className="category-count">{items.length}</span>
              </div>

              <div className="item-list">
                {items.map((item, idx) => {
                  const lastEvt = getLastEvent(data.events, item.id)
                  const events = getItemEvents(data.events, item.id)
                  const daysSince = lastEvt
                    ? Math.floor((Date.now() - new Date(lastEvt.timestamp)) / 86400000)
                    : null

                  return (
                    <div
                      key={item.id}
                      className={`item-card ${dragState?.itemId === item.id ? 'dragging' : ''}`}
                      style={getItemStyle(item.id, cat.id, idx)}
                      onClick={() => { if (justDraggedRef.current) return; onViewItem(item.id) }}
                    >
                      <div
                        className="reorder-handle"
                        onPointerDown={e => startDrag(e, item.id, cat.id, idx, items.length)}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        style={{ touchAction: 'none' }}
                      >&#9776;</div>
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        {item.currentProduct && (
                          <div className="item-product">{item.currentProduct}</div>
                        )}
                        <div className="item-meta">
                          {lastEvt ? (
                            <>
                              <span className="item-ago">{formatTimeAgo(lastEvt.timestamp)}</span>
                              {daysSince > 0 && (
                                <span className="item-in-use">
                                  &middot; {formatDuration(Date.now() - new Date(lastEvt.timestamp))}
                                </span>
                              )}
                              {events.length >= 2 && (
                                <span className="item-count">&middot; {events.length}회</span>
                              )}
                            </>
                          ) : (
                            <span className="item-ago faded">기록 없음</span>
                          )}
                        </div>
                      </div>
                      <button
                        className="log-btn"
                        style={{ backgroundColor: (item.color || cat.color) + '18', color: item.color || cat.color }}
                        onClick={e => { e.stopPropagation(); onLogEvent(item.id) }}
                      >
                        +
                      </button>
                    </div>
                  )
                })}

                {items.length === 0 && (
                  <div className="empty-hint">항목 없음</div>
                )}
              </div>

              <button className="add-item-btn" onClick={() => onAddItem(cat.id)}>
                + 항목 추가
              </button>
            </section>
          )
        })}

        {data.categories.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>카테고리가 없습니다</p>
            <button className="btn btn-primary" onClick={onAddCategory}>
              카테고리 추가
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
