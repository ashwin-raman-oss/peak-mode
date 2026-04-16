import { useState } from 'react'

export function MorningForm({ saveCheckin, onSuccess }) {
  const [intention, setIntention] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!intention.trim()) return
    setSubmitting(true)
    try {
      await saveCheckin('morning', { intention: intention.trim() })
      onSuccess?.()
    } catch {
      // error logged in hook
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-xs text-peak-muted mb-3">Set your intention for today</p>
      <textarea
        value={intention}
        onChange={e => setIntention(e.target.value)}
        placeholder="My focus today is..."
        className="w-full text-sm border border-peak-border rounded-md p-2.5 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
      />
      <button
        type="submit"
        disabled={submitting || !intention.trim()}
        className="bg-peak-accent text-white text-xs font-semibold px-4 py-2 rounded-md hover:opacity-90 mt-3 disabled:opacity-50"
      >
        Set Intention →
      </button>
    </form>
  )
}

export function EveningForm({ saveCheckin, onSuccess }) {
  const [dayRating, setDayRating] = useState(null)
  const [gratitude1, setGratitude1] = useState('')
  const [gratitude2, setGratitude2] = useState('')
  const [gratitude3, setGratitude3] = useState('')
  const [reflection, setReflection] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!dayRating) return
    setSubmitting(true)
    try {
      await saveCheckin('evening', {
        day_rating: dayRating,
        gratitude_1: gratitude1.trim() || null,
        gratitude_2: gratitude2.trim() || null,
        gratitude_3: gratitude3.trim() || null,
        reflection: reflection.trim() || null,
      })
      onSuccess?.()
    } catch {
      // error logged in hook
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-2 mb-3">
        {[1, 2, 3, 4, 5].map(n => (
          <div
            key={n}
            onClick={() => setDayRating(n)}
            className={`w-8 h-8 rounded-full border-2 text-sm font-semibold flex items-center justify-center cursor-pointer transition-colors select-none ${
              dayRating === n
                ? 'bg-peak-accent border-peak-accent text-white'
                : 'border-peak-border text-peak-muted hover:border-peak-accent/50'
            }`}
          >
            {n}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={gratitude1}
        onChange={e => setGratitude1(e.target.value)}
        placeholder="I'm grateful for... (1)"
        className="w-full text-sm border border-peak-border rounded-md p-2 mb-1.5 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
      />
      <input
        type="text"
        value={gratitude2}
        onChange={e => setGratitude2(e.target.value)}
        placeholder="I'm grateful for... (2)"
        className="w-full text-sm border border-peak-border rounded-md p-2 mb-1.5 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
      />
      <input
        type="text"
        value={gratitude3}
        onChange={e => setGratitude3(e.target.value)}
        placeholder="I'm grateful for... (3)"
        className="w-full text-sm border border-peak-border rounded-md p-2 mb-1.5 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
      />
      <textarea
        value={reflection}
        onChange={e => setReflection(e.target.value)}
        placeholder="One thing I learned or want to remember..."
        className="w-full text-sm border border-peak-border rounded-md p-2.5 resize-none h-16 focus:outline-none focus:ring-2 focus:ring-peak-accent/30 mt-1"
      />
      <button
        type="submit"
        disabled={submitting || !dayRating}
        className="bg-peak-accent text-white text-xs font-semibold px-4 py-2 rounded-md hover:opacity-90 mt-3 disabled:opacity-50"
      >
        Save Check-in →
      </button>
    </form>
  )
}
