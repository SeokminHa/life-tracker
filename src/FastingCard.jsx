import { useState, useEffect } from 'react'
import { useStore } from './store.jsx'
import { formatDuration, formatDate } from './utils.js'

const RADIUS = 52
const CIRC = 2 * Math.PI * RADIUS

export default function FastingCard({ onGoalSettings }) {
  const { data, logMeal } = useStore()
  const fasting = data.fasting || {}
  const { lastMealTime, goalHours = 16, periods = [] } = fasting
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const elapsed = lastMealTime ? Math.max(0, now - new Date(lastMealTime).getTime()) : 0
  const h = Math.floor(elapsed / 3600000)
  const m = Math.floor((elapsed % 3600000) / 60000)
  const s = Math.floor((elapsed % 60000) / 1000)

  const progress = goalHours > 0 ? Math.min(elapsed / (goalHours * 3600000), 1) : 0
  const goalReached = progress >= 1
  const accent = goalReached ? '#10B981' : '#5B7FFF'
  const dashOffset = CIRC * (1 - progress)

  const handleMeal = () => {
    logMeal()
  }

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
            {lastMealTime && (
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
              {lastMealTime ? `${Math.floor(progress * 100)}%` : '—'}
            </div>
          </div>
        </div>

        <div className="fasting-info">
          <div className="fasting-time" style={{ color: accent }}>
            {lastMealTime
              ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
              : '--:--:--'}
          </div>
          <div className="fasting-status">
            {!lastMealTime
              ? '첫 식사를 기록하세요'
              : goalReached
                ? `목표 달성! (+${Math.floor((elapsed - goalHours * 3600000) / 3600000)}h)`
                : '공복 진행 중'}
          </div>
          {lastMealTime && (
            <div className="fasting-last">
              마지막 식사: {new Date(lastMealTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>

      <button className="fasting-meal-btn" onClick={handleMeal}>
        &#127860; 식사 완료
      </button>

      {recentPeriods.length > 0 && (
        <div className="fasting-history">
          <div className="fasting-hist-title">최근 단식 기록</div>
          {recentPeriods.map(p => {
            const met = p.duration >= goalHours * 3600000
            return (
              <div key={p.id} className="fasting-hist-row">
                <span className="fasting-hist-date">{formatDate(p.end)}</span>
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
