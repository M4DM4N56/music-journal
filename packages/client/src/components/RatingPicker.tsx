import { useState } from 'react'
import { api } from '../lib/api'

type RatingPickerProps = {
  itunesId: number
  initialScore: number | null
  onRated: (score: number) => void
}

export default function RatingPicker({ itunesId, initialScore, onRated }: RatingPickerProps) {
  const [selected, setSelected] = useState<number | null>(initialScore)
  const [saving, setSaving] = useState(false)

  async function handleClick(score: number) {
    setSaving(true)
    try {
      const res = await api.post('/api/ratings', { itunesId, score })
      if (res.ok) {
        setSelected(score)
        onRated(score)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => handleClick(n)}
          disabled={saving}
          style={{
            width: '36px',
            height: '36px',
            fontWeight: selected === n ? 'bold' : 'normal',
            background: selected === n ? '#333' : '#f0f0f0',
            color: selected === n ? '#fff' : '#333',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {n}
        </button>
      ))}
      {saving && <span style={{ fontSize: '0.85em', color: '#666' }}>Saving...</span>}
    </div>
  )
}
