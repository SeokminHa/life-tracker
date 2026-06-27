import { useMemo } from 'react'
import { useStore } from './store.jsx'
import { getItemEvents, formatDate, formatDuration } from './utils.js'

export default function ItemDetail({ itemId, onBack, onLogEvent, onEdit }) {
  const { data, deleteEvent } = useStore()
  const item = data.items.find(i => i.id === itemId)
  const category = item ? data.categories.find(c => c.id === item.categoryId) : null
  const events = getItemEvents(data.events, itemId)
  const accent = item?.color || category?.color || '#5B7FFF'

  const { useCount, newCount, newDurMap, avgNewDur, lastNew } = useMemo(() => {
    const useEvts = events.filter(e => (e.type || 'use') === 'use')
    const newEvts = events.filter(e => e.type === 'new')
    const durMap = {}
    for (let i = 0; i < newEvts.length - 1; i++) {
      durMap[newEvts[i].id] = new Date(newEvts[i].timestamp) - new Date(newEvts[i + 1].timestamp)
    }
    const durs = Object.values(durMap)
    return {
      useCount: useEvts.length,
      newCount: newEvts.length,
      newDurMap: durMap,
      avgNewDur: durs.length > 0 ? durs.reduce((a, b) => a + b, 0) / durs.length : null,
      lastNew: newEvts[0] || null,
    }
  }, [events])

  if (!item) {
    return (
      <div className="detail">
        <header className="header">
          <button className="back-btn" onClick={onBack}>&#8592;</button>
          <h1 className="header-title">Not Found</h1>
        </header>
        <main className="content"><div className="empty-state"><p>삭제된 항목</p></div></main>
      </div>
    )
  }

  const openedAgo = lastNew ? Date.now() - new Date(lastNew.timestamp).getTime() : null

  return (
    <div className="detail">
      <header className="header">
        <button className="back-btn" onClick={onBack}>&#8592;</button>
        <h1 className="header-title">{item.name}</h1>
        <button className="header-btn" onClick={onEdit}>&#9998;</button>
      </header>

      <main className="content">
        {item.currentProduct && (
          <div className="detail-product">
            <span className="detail-label">현재 제품</span>
            <span className="detail-value">{item.currentProduct}</span>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{useCount}</div>
            <div className="stat-label">사용</div>
          </div>
          {newCount > 0 && (
            <div className="stat-card">
              <div className="stat-value">{newCount}</div>
              <div className="stat-label">개봉</div>
            </div>
          )}
          {avgNewDur && (
            <div className="stat-card">
              <div className="stat-value">{formatDuration(avgNewDur)}</div>
              <div className="stat-label">개봉 주기</div>
            </div>
          )}
          {openedAgo && openedAgo > 0 && (
            <div className="stat-card">
              <div className="stat-value" style={{ color: accent }}>{formatDuration(openedAgo)}</div>
              <div className="stat-label">개봉 후</div>
            </div>
          )}
        </div>

        <h2 className="section-title">기록</h2>

        <div className="timeline">
          {events.map((evt, idx) => {
            const isNew = evt.type === 'new'
            const openDur = newDurMap[evt.id]

            return (
              <div key={evt.id} className="tl-entry">
                <div className="tl-line-area">
                  <div
                    className={`tl-dot ${isNew ? 'tl-dot-new' : ''}`}
                    style={{ backgroundColor: accent }}
                  />
                  {idx < events.length - 1 && <div className="tl-line" />}
                </div>
                <div className="tl-body">
                  <div className="tl-top">
                    <span className="tl-date">{formatDate(evt.timestamp)}</span>
                    <span className={`tl-badge ${isNew ? 'tl-badge-new' : 'tl-badge-use'}`}>
                      {isNew ? '개봉' : '사용'}
                    </span>
                    <button
                      className="tl-delete"
                      onClick={() => { if (confirm('이 기록을 삭제할까요?')) deleteEvent(evt.id) }}
                    >&times;</button>
                  </div>
                  {evt.memo && <div className="tl-memo">{evt.memo}</div>}
                  {isNew && openDur && (
                    <div className="tl-open-dur">이전 개봉 후 {formatDuration(openDur)}</div>
                  )}
                </div>
              </div>
            )
          })}

          {events.length === 0 && (
            <div className="empty-state small"><p>아직 기록이 없습니다</p></div>
          )}
        </div>

        <button className="fab" style={{ backgroundColor: accent }} onClick={onLogEvent}>
          + 기록하기
        </button>
      </main>
    </div>
  )
}
