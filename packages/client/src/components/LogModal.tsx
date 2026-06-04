import { useState } from 'react'
import { api } from '../lib/api'

interface LogModalProps {
  itunesId: number
  onSuccess: () => void
  onClose: () => void
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function maxDay(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, i) => CURRENT_YEAR - i)

export default function LogModal({ itunesId, onSuccess, onClose }: LogModalProps) {
  const today = new Date()

  const [dateMode, setDateMode] = useState<'today' | 'custom' | 'none'>('today')
  const [day, setDay] = useState(today.getDate())
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())

  const [isFirstListen, setIsFirstListen] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function handleTodayCheck(checked: boolean) {
    setDateMode(checked ? 'today' : 'custom')
  }

  function handleSkipCheck(checked: boolean) {
    setDateMode(checked ? 'none' : 'today')
  }

  function handleMonthChange(newMonth: number) {
    const max = maxDay(year, newMonth)
    setMonth(newMonth)
    if (day > max) setDay(max)
  }

  function handleYearChange(newYear: number) {
    const max = maxDay(newYear, month)
    setYear(newYear)
    if (day > max) setDay(max)
  }

  const todayLabel = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    try {
      const listenedAt =
        dateMode === 'today' ? formatDate(new Date()) :
        dateMode === 'custom' ? formatDate(new Date(year, month, day)) :
        undefined

      const body: Record<string, unknown> = { itunesId, isFirstListen }
      if (listenedAt !== undefined) body.listenedAt = listenedAt
      if (notes) body.notes = notes

      const res = await api.post('/api/diary', body)
      if (!res.ok) {
        setSubmitError('Failed to log. Please try again.')
        return
      }
      onSuccess()
      onClose()
    } catch {
      setSubmitError('Failed to log. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const currentMaxDay = maxDay(year, month)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '8px', padding: '24px',
          width: '100%', maxWidth: '440px', position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
          aria-label="Close"
        >
          ×
        </button>
        <h2 style={{ marginTop: 0 }}>Log this album</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Date section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={dateMode === 'today'}
                onChange={(e) => handleTodayCheck(e.target.checked)}
              />
              Today
            </label>

            {dateMode === 'today' && (
              <div style={{ fontSize: '0.875rem', color: '#374151', paddingLeft: '24px' }}>
                Today — {todayLabel}
              </div>
            )}

            {dateMode === 'custom' && (
              <div style={{ display: 'flex', gap: '8px', paddingLeft: '24px' }}>
                <select
                  value={day}
                  onChange={(e) => setDay(Number(e.target.value))}
                  style={{ padding: '4px' }}
                >
                  {Array.from({ length: currentMaxDay }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={month}
                  onChange={(e) => handleMonthChange(Number(e.target.value))}
                  style={{ padding: '4px' }}
                >
                  {MONTHS.map((name, i) => (
                    <option key={i} value={i}>{name}</option>
                  ))}
                </select>
                <select
                  value={year}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  style={{ padding: '4px' }}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={dateMode === 'none'}
                onChange={(e) => handleSkipCheck(e.target.checked)}
              />
              Skip date
            </label>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={isFirstListen}
              onChange={(e) => setIsFirstListen(e.target.checked)}
            />
            First listen?
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>Notes ({notes.length}/2000)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 2000))}
              rows={4}
              style={{ padding: '6px', resize: 'vertical' }}
            />
          </label>

          {submitError && (
            <div style={{ color: '#dc2626', fontSize: '0.875rem' }}>{submitError}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{ padding: '8px 16px', cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? 'Logging...' : 'Log'}
          </button>
        </form>
      </div>
    </div>
  )
}
