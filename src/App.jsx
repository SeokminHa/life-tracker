import { useState, useRef } from 'react'
import { useStore } from './store.jsx'
import Home from './Home.jsx'
import ItemDetail from './ItemDetail.jsx'
import Calendar from './Calendar.jsx'

const ICON_OPTIONS = ['🍽️', '🥗', '💊', '🧴', '🧖', '💅', '✂️', '🏠', '📋', '🧹', '🏋️', '🚗', '📚', '🎵', '💰', '❤️', '🌱', '🐾', '👕', '🦷', '🧼', '🩺', '☕', '🍷']
const COLOR_OPTIONS = [
  '#FF6B6B', '#EF4444', '#F97316', '#FF8E53',
  '#FFD93D', '#EAB308', '#84CC16', '#6BCB77',
  '#10B981', '#4ECDC4', '#14B8A6', '#06B6D4',
  '#0EA5E9', '#5B7FFF', '#3B82F6', '#6366F1',
  '#A78BFA', '#8B5CF6', '#E991C5', '#F472B6',
  '#EC4899', '#D946EF', '#94A3B8', '#78716C',
]

function ModalOverlay({ children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

function LogEventModal({ itemId, presetDate, onClose }) {
  const { data, logEvent } = useStore()
  const item = data.items.find(i => i.id === itemId)
  const [memo, setMemo] = useState('')
  const [type, setType] = useState('use')
  const [date, setDate] = useState(presetDate || new Date().toISOString().slice(0, 10))

  const handleSubmit = e => {
    e.preventDefault()
    logEvent(itemId, memo.trim(), new Date(date + 'T12:00:00').toISOString(), type)
    onClose()
  }

  return (
    <ModalOverlay onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h2 className="modal-title">기록</h2>
        <p className="modal-subtitle">{item?.name}</p>

        {item?.trackOpen && (
          <div className="type-toggle">
            <button type="button" className={`type-btn ${type === 'use' ? 'active' : ''}`} onClick={() => setType('use')}>
              사용
            </button>
            <button type="button" className={`type-btn ${type === 'new' ? 'active' : ''}`} onClick={() => setType('new')}>
              개봉
            </button>
          </div>
        )}

        <label className="field-label">날짜</label>
        <input type="date" className="field-input" value={date} onChange={e => setDate(e.target.value)} />

        <label className="field-label">메모 (선택)</label>
        <input
          type="text"
          className="field-input"
          placeholder={type === 'new' ? '예: 브랜드, 제품명...' : '예: 메모...'}
          value={memo}
          onChange={e => setMemo(e.target.value)}
          autoFocus
        />

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>취소</button>
          <button type="submit" className="btn btn-primary">기록</button>
        </div>
      </form>
    </ModalOverlay>
  )
}

function AddItemModal({ categoryId, onClose }) {
  const { data, addItem } = useStore()
  const cat = data.categories.find(c => c.id === categoryId)
  const [name, setName] = useState('')
  const [product, setProduct] = useState('')
  const [color, setColor] = useState(cat?.color || '#5B7FFF')
  const [trackOpen, setTrackOpen] = useState(false)
  const [useCycle, setUseCycle] = useState(false)
  const [cycleDays, setCycleDays] = useState(0)

  const handleSubmit = e => {
    e.preventDefault()
    if (!name.trim()) return
    addItem(categoryId, name.trim(), product.trim(), color, trackOpen, useCycle ? (Number(cycleDays) || 0) : 0)
    onClose()
  }

  return (
    <ModalOverlay onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h2 className="modal-title">항목 추가</h2>

        <label className="field-label">이름 *</label>
        <input
          type="text"
          className="field-input"
          placeholder="예: EVOO, Vitamin C, 머리 자르기..."
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          required
        />

        <label className="field-label">현재 제품 (선택)</label>
        <input
          type="text"
          className="field-input"
          placeholder="예: 브랜드, 크기..."
          value={product}
          onChange={e => setProduct(e.target.value)}
        />

        <label className="field-label">색상</label>
        <div className="picker-grid">
          {COLOR_OPTIONS.map(c => (
            <button
              key={c}
              type="button"
              className={`picker-color ${color === c ? 'selected' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <label className="toggle-row" onClick={() => setTrackOpen(v => !v)}>
          <span className="toggle-label">개봉 추적</span>
          <span className={`toggle-switch ${trackOpen ? 'on' : ''}`} />
        </label>

        <label className="toggle-row" onClick={() => setUseCycle(v => !v)}>
          <span className="toggle-label">주기 알림</span>
          <span className={`toggle-switch ${useCycle ? 'on' : ''}`} />
        </label>
        {useCycle && (
          <>
            <div className="cycle-presets">
              {[{ l: '1주', d: 7 }, { l: '2주', d: 14 }, { l: '1개월', d: 30 }, { l: '3개월', d: 90 }].map(p => (
                <button
                  key={p.d}
                  type="button"
                  className={`cycle-preset-btn ${Number(cycleDays) === p.d ? 'selected' : ''}`}
                  onClick={() => setCycleDays(p.d)}
                >{p.l}</button>
              ))}
            </div>
            <input
              type="number"
              className="field-input"
              min="1"
              placeholder="일 수 입력"
              value={cycleDays || ''}
              onChange={e => setCycleDays(e.target.value)}
            />
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>취소</button>
          <button type="submit" className="btn btn-primary">추가</button>
        </div>
      </form>
    </ModalOverlay>
  )
}

function AddCategoryModal({ onClose }) {
  const { addCategory } = useStore()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📋')

  const handleSubmit = e => {
    e.preventDefault()
    if (!name.trim()) return
    addCategory(name.trim(), icon, '#5B7FFF')
    onClose()
  }

  return (
    <ModalOverlay onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h2 className="modal-title">카테고리 추가</h2>

        <label className="field-label">이름 *</label>
        <input
          type="text"
          className="field-input"
          placeholder="예: Health, Supplements..."
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          required
        />

        <label className="field-label">아이콘</label>
        <div className="picker-grid">
          {ICON_OPTIONS.map(ic => (
            <button
              key={ic}
              type="button"
              className={`picker-item ${icon === ic ? 'selected' : ''}`}
              onClick={() => setIcon(ic)}
            >{ic}</button>
          ))}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>취소</button>
          <button type="submit" className="btn btn-primary">추가</button>
        </div>
      </form>
    </ModalOverlay>
  )
}

function EditItemModal({ itemId, onClose, onDeleted }) {
  const { data, updateItem, deleteItem } = useStore()
  const item = data.items.find(i => i.id === itemId)
  const cat = item ? data.categories.find(c => c.id === item.categoryId) : null
  const [name, setName] = useState(item?.name || '')
  const [product, setProduct] = useState(item?.currentProduct || '')
  const [color, setColor] = useState(item?.color || cat?.color || '#5B7FFF')
  const [trackOpen, setTrackOpen] = useState(item?.trackOpen || false)
  const [useCycle, setUseCycle] = useState((item?.cycleDays || 0) > 0)
  const [cycleDays, setCycleDays] = useState(item?.cycleDays || 0)

  if (!item) return null

  const handleSubmit = e => {
    e.preventDefault()
    if (!name.trim()) return
    updateItem(itemId, { name: name.trim(), currentProduct: product.trim(), color, trackOpen, cycleDays: useCycle ? (Number(cycleDays) || 0) : 0 })
    onClose()
  }

  const handleDelete = () => {
    if (confirm(`"${item.name}" 항목과 모든 기록을 삭제할까요?`)) {
      deleteItem(itemId)
      onDeleted?.()
      onClose()
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h2 className="modal-title">항목 수정</h2>

        <label className="field-label">이름</label>
        <input type="text" className="field-input" value={name} onChange={e => setName(e.target.value)} required />

        <label className="field-label">현재 제품</label>
        <input
          type="text"
          className="field-input"
          placeholder="브랜드, 종류, 크기..."
          value={product}
          onChange={e => setProduct(e.target.value)}
        />

        <label className="field-label">색상</label>
        <div className="picker-grid">
          {COLOR_OPTIONS.map(c => (
            <button
              key={c}
              type="button"
              className={`picker-color ${color === c ? 'selected' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <label className="toggle-row" onClick={() => setTrackOpen(v => !v)}>
          <span className="toggle-label">개봉 추적</span>
          <span className={`toggle-switch ${trackOpen ? 'on' : ''}`} />
        </label>

        <label className="toggle-row" onClick={() => setUseCycle(v => !v)}>
          <span className="toggle-label">주기 알림</span>
          <span className={`toggle-switch ${useCycle ? 'on' : ''}`} />
        </label>
        {useCycle && (
          <>
            <div className="cycle-presets">
              {[{ l: '1주', d: 7 }, { l: '2주', d: 14 }, { l: '1개월', d: 30 }, { l: '3개월', d: 90 }].map(p => (
                <button
                  key={p.d}
                  type="button"
                  className={`cycle-preset-btn ${Number(cycleDays) === p.d ? 'selected' : ''}`}
                  onClick={() => setCycleDays(p.d)}
                >{p.l}</button>
              ))}
            </div>
            <input
              type="number"
              className="field-input"
              min="1"
              placeholder="일 수 입력"
              value={cycleDays || ''}
              onChange={e => setCycleDays(e.target.value)}
            />
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-danger" onClick={handleDelete}>삭제</button>
          <div className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>취소</button>
          <button type="submit" className="btn btn-primary">저장</button>
        </div>
      </form>
    </ModalOverlay>
  )
}

function EditCategoryModal({ categoryId, onClose }) {
  const { data, updateCategory, deleteCategory } = useStore()
  const cat = data.categories.find(c => c.id === categoryId)
  const [name, setName] = useState(cat?.name || '')
  const [icon, setIcon] = useState(cat?.icon || '📋')

  if (!cat) return null

  const itemCount = data.items.filter(i => i.categoryId === categoryId).length

  const handleSubmit = e => {
    e.preventDefault()
    if (!name.trim()) return
    updateCategory(categoryId, { name: name.trim(), icon })
    onClose()
  }

  const handleDelete = () => {
    const msg = itemCount > 0
      ? `"${cat.name}" 카테고리와 ${itemCount}개 항목을 모두 삭제할까요?`
      : `"${cat.name}" 카테고리를 삭제할까요?`
    if (confirm(msg)) {
      deleteCategory(categoryId)
      onClose()
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h2 className="modal-title">카테고리 수정</h2>

        <label className="field-label">이름</label>
        <input type="text" className="field-input" value={name} onChange={e => setName(e.target.value)} required />

        <label className="field-label">아이콘</label>
        <div className="picker-grid">
          {ICON_OPTIONS.map(ic => (
            <button
              key={ic}
              type="button"
              className={`picker-item ${icon === ic ? 'selected' : ''}`}
              onClick={() => setIcon(ic)}
            >{ic}</button>
          ))}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-danger" onClick={handleDelete}>삭제</button>
          <div className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>취소</button>
          <button type="submit" className="btn btn-primary">저장</button>
        </div>
      </form>
    </ModalOverlay>
  )
}

const FASTING_PRESETS = [
  { label: '12:12', hours: 12 },
  { label: '16:8', hours: 16 },
  { label: '18:6', hours: 18 },
  { label: '20:4', hours: 20 },
  { label: 'OMAD', hours: 23 },
]

function FastingGoalModal({ onClose }) {
  const { data, updateFastingGoal } = useStore()
  const [hours, setHours] = useState(data.fasting?.goalHours || 16)

  const handleSubmit = e => {
    e.preventDefault()
    updateFastingGoal(Number(hours))
    onClose()
  }

  return (
    <ModalOverlay onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h2 className="modal-title">단식 목표 설정</h2>

        <div className="preset-grid">
          {FASTING_PRESETS.map(p => (
            <button
              key={p.hours}
              type="button"
              className={`preset-btn ${Number(hours) === p.hours ? 'selected' : ''}`}
              onClick={() => setHours(p.hours)}
            >
              <div className="preset-label">{p.label}</div>
              <div className="preset-hours">{p.hours}h</div>
            </button>
          ))}
        </div>

        <label className="field-label">목표 시간 (hours)</label>
        <input
          type="number"
          className="field-input"
          min="1"
          max="48"
          value={hours}
          onChange={e => setHours(e.target.value)}
        />

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>취소</button>
          <button type="submit" className="btn btn-primary">저장</button>
        </div>
      </form>
    </ModalOverlay>
  )
}

function SettingsModal({ onClose }) {
  const { exportData, importData } = useStore()
  const fileRef = useRef(null)

  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `life-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    if (importData(text)) {
      alert('Data imported successfully!')
      onClose()
    } else {
      alert('Invalid backup file.')
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="modal-title">Settings</h2>

      <div className="settings-section">
        <h3 className="settings-heading">Backup &amp; Restore</h3>
        <button className="btn btn-outline full-width" onClick={handleExport}>
          Export Data (JSON)
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} hidden />
        <button className="btn btn-outline full-width" onClick={() => fileRef.current?.click()}>
          Import Data
        </button>
      </div>

      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
    </ModalOverlay>
  )
}

function EditEventModal({ eventId, onClose }) {
  const { data, updateEvent, deleteEvent } = useStore()
  const evt = data.events.find(e => e.id === eventId)
  const item = evt ? data.items.find(i => i.id === evt.itemId) : null

  const [memo, setMemo] = useState(evt?.memo || '')
  const [type, setType] = useState(evt?.type || 'use')
  const [date, setDate] = useState(evt ? evt.timestamp.slice(0, 10) : '')

  if (!evt) return null

  const handleSubmit = e => {
    e.preventDefault()
    updateEvent(eventId, {
      memo: memo.trim(),
      type,
      timestamp: new Date(date + 'T12:00:00').toISOString(),
    })
    onClose()
  }

  const handleDelete = () => {
    if (confirm('이 기록을 삭제할까요?')) {
      deleteEvent(eventId)
      onClose()
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h2 className="modal-title">기록 수정</h2>
        <p className="modal-subtitle">{item?.name}</p>

        {item?.trackOpen && (
          <div className="type-toggle">
            <button type="button" className={`type-btn ${type === 'use' ? 'active' : ''}`} onClick={() => setType('use')}>
              사용
            </button>
            <button type="button" className={`type-btn ${type === 'new' ? 'active' : ''}`} onClick={() => setType('new')}>
              개봉
            </button>
          </div>
        )}

        <label className="field-label">날짜</label>
        <input type="date" className="field-input" value={date} onChange={e => setDate(e.target.value)} />

        <label className="field-label">메모 (선택)</label>
        <input
          type="text"
          className="field-input"
          placeholder="메모..."
          value={memo}
          onChange={e => setMemo(e.target.value)}
        />

        <div className="modal-actions">
          <button type="button" className="btn btn-danger" onClick={handleDelete}>삭제</button>
          <div className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>취소</button>
          <button type="submit" className="btn btn-primary">저장</button>
        </div>
      </form>
    </ModalOverlay>
  )
}

function EditFastingModal({ periodId, onClose }) {
  const { data, updateFastingPeriod, deleteFastingPeriod } = useStore()
  const period = (data.fasting?.periods || []).find(p => p.id === periodId)

  const toLocalInput = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const [start, setStart] = useState(toLocalInput(period?.start))
  const [end, setEnd] = useState(toLocalInput(period?.end))

  if (!period) return null

  const handleSubmit = e => {
    e.preventDefault()
    if (!start || !end) return
    updateFastingPeriod(periodId, new Date(start).toISOString(), new Date(end).toISOString())
    onClose()
  }

  const handleDelete = () => {
    if (confirm('이 단식 기록을 삭제할까요?')) {
      deleteFastingPeriod(periodId)
      onClose()
    }
  }

  const dur = start && end ? Math.max(0, new Date(end) - new Date(start)) : 0
  const durH = Math.floor(dur / 3600000)
  const durM = Math.floor((dur % 3600000) / 60000)

  return (
    <ModalOverlay onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h2 className="modal-title">단식 기록 수정</h2>

        <label className="field-label">공복 시작 (식사 종료)</label>
        <input type="datetime-local" className="field-input" value={start} onChange={e => setStart(e.target.value)} required />

        <label className="field-label">공복 종료 (음식 섭취)</label>
        <input type="datetime-local" className="field-input" value={end} onChange={e => setEnd(e.target.value)} required />

        {dur > 0 && (
          <div className="fasting-edit-dur">공복 시간: {durH}시간 {durM}분</div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-danger" onClick={handleDelete}>삭제</button>
          <div className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>취소</button>
          <button type="submit" className="btn btn-primary">저장</button>
        </div>
      </form>
    </ModalOverlay>
  )
}

function ItemPickerModal({ date, onSelect, onClose }) {
  const { data } = useStore()

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="modal-title">기록 추가</h2>
      <p className="modal-subtitle">{(() => {
        try {
          return new Date(date + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
        } catch { return date }
      })()}</p>

      <div className="item-picker-list">
        {data.categories.map(cat => {
          const items = data.items.filter(i => i.categoryId === cat.id)
          if (items.length === 0) return null
          return (
            <div key={cat.id} className="item-picker-group">
              <div className="item-picker-cat" style={{ borderLeftColor: cat.color }}>
                <span>{cat.icon}</span> {cat.name}
              </div>
              {items.map(item => (
                <button
                  key={item.id}
                  className="item-picker-row"
                  onClick={() => onSelect(item.id)}
                >
                  <span className="item-picker-dot" style={{ backgroundColor: item.color || cat.color }} />
                  {item.name}
                </button>
              ))}
            </div>
          )
        })}
        {data.items.length === 0 && (
          <div className="cal-empty">항목이 없습니다. 항목 관리에서 추가하세요.</div>
        )}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>취소</button>
      </div>
    </ModalOverlay>
  )
}

export default function App() {
  const [view, setView] = useState({ type: 'calendar' })
  const [modal, setModal] = useState(null)

  const closeModal = () => setModal(null)
  const goCalendar = () => setView({ type: 'calendar' })
  const goItems = () => setView({ type: 'items' })

  return (
    <div className="app">
      {view.type === 'calendar' && (
        <Calendar
          onItems={goItems}
          onAddEvent={date => setModal({ type: 'pickItem', date })}
          onEditEvent={eventId => setModal({ type: 'editEvent', eventId })}
          onEditFasting={periodId => setModal({ type: 'editFasting', periodId })}
          onSettings={() => setModal({ type: 'settings' })}
          onFastingGoal={() => setModal({ type: 'fastingGoal' })}
        />
      )}

      {view.type === 'items' && (
        <Home
          onBack={goCalendar}
          onViewItem={id => setView({ type: 'detail', itemId: id })}
          onLogEvent={id => setModal({ type: 'logEvent', itemId: id })}
          onAddItem={catId => setModal({ type: 'addItem', categoryId: catId })}
          onAddCategory={() => setModal({ type: 'addCategory' })}
          onEditCategory={id => setModal({ type: 'editCategory', categoryId: id })}
          onFastingGoal={() => setModal({ type: 'fastingGoal' })}
          onEditFasting={periodId => setModal({ type: 'editFasting', periodId })}
        />
      )}

      {view.type === 'detail' && (
        <ItemDetail
          itemId={view.itemId}
          onBack={goItems}
          onLogEvent={() => setModal({ type: 'logEvent', itemId: view.itemId })}
          onEdit={() => setModal({ type: 'editItem', itemId: view.itemId })}
        />
      )}

      {modal?.type === 'pickItem' && (
        <ItemPickerModal
          date={modal.date}
          onSelect={itemId => setModal({ type: 'logEvent', itemId, presetDate: modal.date })}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'editEvent' && <EditEventModal eventId={modal.eventId} onClose={closeModal} />}
      {modal?.type === 'editFasting' && <EditFastingModal periodId={modal.periodId} onClose={closeModal} />}
      {modal?.type === 'logEvent' && <LogEventModal itemId={modal.itemId} presetDate={modal.presetDate} onClose={closeModal} />}
      {modal?.type === 'addItem' && <AddItemModal categoryId={modal.categoryId} onClose={closeModal} />}
      {modal?.type === 'addCategory' && <AddCategoryModal onClose={closeModal} />}
      {modal?.type === 'editItem' && <EditItemModal itemId={modal.itemId} onClose={closeModal} onDeleted={goItems} />}
      {modal?.type === 'editCategory' && <EditCategoryModal categoryId={modal.categoryId} onClose={closeModal} />}
      {modal?.type === 'settings' && <SettingsModal onClose={closeModal} />}
      {modal?.type === 'fastingGoal' && <FastingGoalModal onClose={closeModal} />}
    </div>
  )
}
