import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useJournal } from '../hooks/useJournal'
import { useCheckin } from '../hooks/useCheckin'
import TopBar from '../components/TopBar'
import { MorningForm, EveningForm } from '../components/CheckinForms'
import PastEntryModal from '../components/PastEntryModal'

function formatJournalDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function Journal() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const { entries, loading, refresh } = useJournal(user?.id)
  const { morningDone, eveningDone, saveCheckin } = useCheckin(user?.id)
  const [filter, setFilter] = useState('week')
  const [modal, setModal] = useState(null) // null | 'morning' | 'evening'
  const [showPastEntry, setShowPastEntry] = useState(false)

  const filtered = useMemo(() => {
    const now = new Date()
    return entries.filter(e => {
      const d = new Date(e.date + 'T00:00:00')
      if (filter === 'week') {
        const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - dayOfWeek)
        weekStart.setHours(0, 0, 0, 0)
        return d >= weekStart
      }
      if (filter === 'month') {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      }
      return true
    })
  }, [entries, filter])

  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach(e => {
      if (!map[e.date]) map[e.date] = { morning: null, evening: null }
      map[e.date][e.type] = e
    })
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
  }, [filtered])

  function handleSuccess() {
    setModal(null)
    refresh()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Journal"
        subtitle="Morning & evening check-ins"
        action={
          <button
            onClick={() => setShowPastEntry(true)}
            className="text-xs font-semibold bg-peak-accent text-white px-3 py-1.5 rounded-lg hover:bg-amber-500 transition-colors"
          >
            + Log Past Entry
          </button>
        }
      />
      <main className="flex-1 overflow-y-auto bg-peak-bg p-6">
        {/* Today's check-in buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => !morningDone && setModal('morning')}
            disabled={morningDone}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              morningDone
                ? 'border-peak-border text-peak-muted cursor-default'
                : 'border-peak-accent text-peak-accent hover:bg-peak-accent-light'
            }`}
          >
            {morningDone ? '✓ Morning Done' : 'Morning Check-in'}
          </button>
          <button
            onClick={() => !eveningDone && setModal('evening')}
            disabled={eveningDone}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              eveningDone
                ? 'bg-peak-bg border border-peak-border text-peak-muted cursor-default'
                : 'bg-peak-accent text-white hover:bg-amber-500'
            }`}
          >
            {eveningDone ? '✓ Evening Done' : 'Evening Check-in'}
          </button>
          {/* Filter */}
          <div className="ml-auto flex gap-1">
            {['week', 'month', 'all'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filter === f
                    ? 'bg-peak-text text-white'
                    : 'text-peak-muted hover:text-peak-text'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        {grouped.length === 0 && (
          <p className="text-center text-peak-muted text-sm py-16">No entries yet.</p>
        )}
        <div className="space-y-4">
          {grouped.map(([date, { morning, evening }]) => (
            <div key={date} className="bg-peak-surface border border-peak-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-peak-border flex items-center justify-between">
                <span className="text-xs font-bold text-peak-text">{formatJournalDate(date)}</span>
                {date !== new Date().toISOString().slice(0, 10) && (
                  <span className="text-[9px] text-peak-muted">· backdated</span>
                )}
              </div>
              {morning && <JournalEntry entry={morning} type="morning" />}
              {evening && <JournalEntry entry={evening} type="evening" />}
            </div>
          ))}
        </div>
      </main>

      {/* Today's check-in modals */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-md bg-peak-surface border border-peak-border rounded-2xl p-6 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-peak-text">
                {modal === 'morning' ? 'Morning Check-in' : 'Evening Check-in'}
              </h2>
              <button onClick={() => setModal(null)} className="text-peak-muted hover:text-peak-text text-lg">&times;</button>
            </div>
            {modal === 'morning'
              ? <MorningForm saveCheckin={saveCheckin} onSuccess={handleSuccess} />
              : <EveningForm saveCheckin={saveCheckin} onSuccess={handleSuccess} />
            }
          </div>
        </div>
      )}

      {showPastEntry && (
        <PastEntryModal
          userId={user?.id}
          onClose={() => setShowPastEntry(false)}
          onSuccess={() => { setShowPastEntry(false); refresh() }}
        />
      )}
    </div>
  )
}

function ScoreBar({ value, max = 5 }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 bg-peak-border rounded-full overflow-hidden">
        <div className="h-full bg-peak-accent rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-peak-muted">{value}/{max}</span>
    </div>
  )
}

function JournalEntry({ entry, type }) {
  return (
    <div className="px-5 py-4 border-b border-peak-border last:border-0">
      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-3 ${
        type === 'morning' ? 'bg-peak-accent-light text-peak-accent' : 'bg-[#EFF6FF] text-[#2563EB]'
      }`}>
        {type === 'morning' ? 'Morning' : 'Evening'}
      </span>
      {type === 'morning' && entry.intention && (
        <p className="text-sm text-peak-text">{entry.intention}</p>
      )}
      {type === 'evening' && (
        <div className="space-y-2">
          {entry.day_rating && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-peak-muted w-16">Day rating</span>
              <ScoreBar value={entry.day_rating} />
            </div>
          )}
          {[entry.gratitude_1, entry.gratitude_2, entry.gratitude_3].filter(Boolean).map((g, i) => (
            <p key={i} className="text-sm text-peak-text">· {g}</p>
          ))}
          {entry.reflection && <p className="text-sm text-peak-muted italic mt-1">{entry.reflection}</p>}
        </div>
      )}
    </div>
  )
}
