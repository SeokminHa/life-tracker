import { useState, useEffect } from 'react'
import { useStore } from './store.jsx'
import { formatDuration, formatDate } from './utils.js'

const RADIUS = 52
const CIRC = 2 * Math.PI * RADIUS

export default function FastingCard({ onGoalSettings }) {
  const { data, endMeal, startEating } = useStore()
  const fasting = data.fasting || {}
  const { state, stateTime, goalHours = 16, periods = [] } = fasting
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const isFasting = state === 'fasting'
  const elapsed = isFasting && stateTime ? Math.max(0, now - new Date(stateTime).getTime()) : 0
  const h = Math.floor(elapsed / 3600000)
  const m = Math.floor((elapsed % 3600000) / 60000)
  const s = Math.floor((elapsed % 60000) / 1000)

  const progress = isFasting && goalHours > 0 ? Math.min(elapsed / (goalHours * 3600000), 1) : 0
  const goalReached = isFasting && progress >= 1
  const accent = goalReached ? '#10B981' : isFasting ? '#5B7FFF' : '#94A3B8'
  const dashOffset = CIRC * (1 - progress)

  const recentPeriods = periods.slice(-5).reverse()

  return (
    <div className="fasting-card">
      <div className="fasting-header">
        <span className="fasting-title">&#9201;&#65039; 공복 타이머</span>
        <button className="fasting-goal-btn" onClick={onGoalSettings}>
          목표 {goalHours}h &#9662;
        </button>
      </div>

      <div className="fasting-body">
        <div className="fasting-ring-wrap">
          <svg viewBox="0 0 120 120" className="fasting-ring">
            <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="8" />
            {isFasting && (
              <circle
                cx="60" cy="60" r={RADIUS}
                fill="none"
                stroke={accent}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
              />
            )}
          </svg>
          <div className="fasting-ring-inner">
            <div className="fasting-pct" style={{ color: accent }}>
              {isFasting ? `${Math.floor(progress * 100)}%` : '—'}
            </div>
          </div>
        </div>

        <div className="fasting-info">
          <div className="fasting-time" style={{ color: accent }}>
            {isFasting
              ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
              : '--:--:--'}
          </div>
          <div className="fasting-status">
            {!state
              ? '식사 종료를 눌러 시작하세요'
              : state === 'eating'
                ? '식사 중'
                : goalReached
                  ? `목표 달성! (+${Math.floor((elapsed - goalHours * 3600000) / 3600000)}h)`
                  : '공복 진행 중'}
          </div>
          {stateTime && (
            <div className="fasting-last">
              {isFasting ? '마지막 식사 종료' : '식사 시작'}: {new Date(stateTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>

      {isFasting ? (
        <button className="fasting-meal-btn" onClick={() => startEating()}>
          &#127860; 음식 섭취
        </button>
      ) : (
        <button className="fasting-meal-btn" onClick={() => endMeal()}>
          &#9201;&#65039; 식사 종료
        </button>
      )}

      {recentPeriods.length > 0 && (
        <div className="fasting-history">
          <div className="fasting-hist-title">일별 최장 공복</div>
          {recentPeriods.map(p => {
            const met = p.duration >= goalHours * 3600000
            return (
              <div key={p.id} className="fasting-hist-row">
                <span className="fasting-hist-date">{formatDate(p.end)}</span>
                <span className="fasting-hist-time">
                  {new Date(p.start).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  {' → '}
                  {new Date(p.end).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={`fasting-hist-dur ${met ? 'met' : ''}`}>
                  {formatDuration(p.duration)}
                  {met && ' ✓'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
