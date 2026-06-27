import { useStore } from './store.jsx'
import { getLastEvent, formatTimeAgo, getItemEvents, formatDuration } from './utils.js'
import FastingCard from './FastingCard.jsx'

export default function Home({ onBack, onViewItem, onLogEvent, onAddItem, onAddCategory, onEditCategory, onFastingGoal }) {
  const { data } = useStore()

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
                style={{ borderLeftColor: cat.color }}
                onClick={() => onEditCategory(cat.id)}
              >
                <span className="category-icon">{cat.icon}</span>
                <span className="category-name">{cat.name}</span>
                <span className="category-count">{items.length}</span>
              </div>

              <div className="item-list">
                {items.map(item => {
                  const lastEvt = getLastEvent(data.events, item.id)
                  const events = getItemEvents(data.events, item.id)
                  const daysSince = lastEvt
                    ? Math.floor((Date.now() - new Date(lastEvt.timestamp)) / 86400000)
                    : null

                  return (
                    <div key={item.id} className="item-card" onClick={() => onViewItem(item.id)}>
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
                                  &middot; in use {formatDuration(Date.now() - new Date(lastEvt.timestamp))}
                                </span>
                              )}
                              {events.length >= 2 && (
                                <span className="item-count">&middot; {events.length} logs</span>
                              )}
                            </>
                          ) : (
                            <span className="item-ago faded">No events yet</span>
                          )}
                        </div>
                      </div>
                      <button
                        className="log-btn"
                        style={{ backgroundColor: (item.color || cat.color) + '18', color: item.color || cat.color }}
                        onClick={e => { e.stopPropagation(); onLogEvent(item.id) }}
                        title="Log event"
                      >
                        +
                      </button>
                    </div>
                  )
                })}

                {items.length === 0 && (
                  <div className="empty-hint">No items yet</div>
                )}
              </div>

              <button className="add-item-btn" onClick={() => onAddItem(cat.id)}>
                + Add item
              </button>
            </section>
          )
        })}

        {data.categories.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No categories yet</p>
            <button className="btn btn-primary" onClick={onAddCategory}>
              Add your first category
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
