import { useState } from 'react'
import { supabase } from '../lib/supabase'

function getYesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function getMinDateStr() {
  const d = new Date()
  d.setDate(d.getDate() - 90)
  return d.toISOString().slice(0, 10)
}

export default function PastEntryModal({ userId, onClose, onSuccess }) {
  const [date, setDate] = useState(getYesterdayStr())
  const [type, setType] = useState('morning')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Morning fields
  const [intention, setIntention] = useState('')

  // Evening fields
  const [dayRating, setDayRating] = useState(null)
  const [gratitude1, setGratitude1] = useState('')
  const [gratitude2, setGratitude2] = useState('')
  const [gratitude3, setGratitude3] = useState('')
  const [reflection, setReflection] = useState('')

  function resetForm() {
    setIntention('')
    setDayRating(null)
    setGratitude1('')
    setGratitude2('')
    setGratitude3('')
    setReflection('')
    setError(null)
  }

  function handleTypeChange(newType) {
    setType(newType)
    resetForm()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (type === 'morning' && !intention.trim()) return
    if (type === 'evening' && !dayRating) return

    setSubmitting(true)
    setError(null)
    try {
      const payload =
        type === 'morning'
          ? { intention: intention.trim() }
          : {
              day_rating: dayRating,
              gratitude_1: gratitude1.trim() || null,
              gratitude_2: gratitude2.trim() || null,
              gratitude_3: gratitude3.trim() || null,
              reflection: reflection.trim() || null,
            }

      const { error: dbError } = await supabase
        .from('daily_checkins')
        .upsert(
          { user_id: userId, date, type, ...payload },
          { onConflict: 'user_id,date,type' }
        )

      if (dbError) throw dbError
      onSuccess?.()
    } catch (err) {
      console.error('Failed to save past entry:', err)
      setError('Could not save entry. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-peak-surface border border-peak-border rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-peak-border">
          <h2 className="text-sm font-bold text-peak-text">Log Past Entry</h2>
          <button onClick={onClose} className="text-peak-muted hover:text-peak-text text-lg leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Date picker */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-peak-muted block mb-1">Date</label>
            <input
              type="date"
              value={date}
              min={getMinDateStr()}
              max={getYesterdayStr()}
              onChange={e => setDate(e.target.value)}
              className="w-full text-sm border border-peak-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-peak-accent/30 text-peak-text"
            />
          </div>

          {/* Morning / Evening toggle */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-peak-muted block mb-1">Session</label>
            <div className="flex gap-2">
              {['morning', 'evening'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors capitalize ${
                    type === t
                      ? 'bg-peak-accent border-peak-accent text-white'
                      : 'border-peak-border text-peak-muted hover:text-peak-text'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Morning form */}
          {type === 'morning' && (
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-peak-muted block mb-1">Intention</label>
              <textarea
                autoFocus
                value={intention}
                onChange={e => setIntention(e.target.value)}
                placeholder="My focus that day was..."
                className="w-full text-sm border border-peak-border rounded-lg p-2.5 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
              />
            </div>
          )}

          {/* Evening form */}
          {type === 'evening' && (
            <>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-peak-muted block mb-2">Day rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <div
                      key={n}
                      onClick={() => setDayRating(n)}
                      className={`w-9 h-9 rounded-full border-2 text-sm font-semibold flex items-center justify-center cursor-pointer transition-colors select-none ${
                        dayRating === n
                          ? 'bg-peak-accent border-peak-accent text-white'
                          : 'border-peak-border text-peak-muted hover:border-peak-accent/50'
                      }`}
                    >
                      {n}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <input type="text" value={gratitude1} onChange={e => setGratitude1(e.target.value)} placeholder="Grateful for... (1)" className="w-full text-sm border border-peak-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-peak-accent/30" />
                <input type="text" value={gratitude2} onChange={e => setGratitude2(e.target.value)} placeholder="Grateful for... (2)" className="w-full text-sm border border-peak-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-peak-accent/30" />
                <input type="text" value={gratitude3} onChange={e => setGratitude3(e.target.value)} placeholder="Grateful for... (3)" className="w-full text-sm border border-peak-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-peak-accent/30" />
              </div>
              <div>
                <textarea
                  value={reflection}
                  onChange={e => setReflection(e.target.value)}
                  placeholder="One thing I learned or want to remember..."
                  className="w-full text-sm border border-peak-border rounded-lg p-2.5 resize-none h-16 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || (type === 'morning' ? !intention.trim() : !dayRating)}
            className="w-full bg-peak-accent text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Entry'}
          </button>
        </form>
      </div>
    </div>
  )
}
