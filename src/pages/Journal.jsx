import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useJournal } from '../hooks/useJournal'
import { useCheckin } from '../hooks/useCheckin'
import Header from '../components/Header'
import Modal from '../components/ui/Modal'
import { MorningForm, EveningForm } from '../components/CheckinForms'

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
    <div className="min-h-screen bg-peak-bg">
      <Header profile={profile} />
      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-extrabold text-peak-primary uppercase tracking-tight">JOURNAL</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => !morningDone && setModal('morning')}
              disabled={morningDone}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md border transition-colors ${
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
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                eveningDone
                  ? 'bg-peak-elevated text-peak-muted cursor-default'
                  : 'bg-peak-accent text-white hover:opacity-90'
              }`}
            >
              {eveningDone ? '✓ Evening Done' : 'Evening Check-in'}
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 bg-peak-elevated rounded-lg p-1 w-fit">
          {['week', 'month', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filter === f
                  ? 'bg-white text-peak-primary shadow-sm'
                  : 'text-peak-muted hover:text-peak-text'
              }`}
            >
              {f === 'week' ? 'This Week' : f === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Entries grouped by date */}
        {grouped.map(([date, { morning, evening }]) => (
          <div key={date} className="mb-6">
            <p className="text-[11px] font-bold text-peak-muted uppercase tracking-widest mb-2">
              {formatJournalDate(date)}
            </p>
            <div className="bg-white rounded-xl border border-peak-border p-5">
              {morning && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold tracking-widest text-peak-accent uppercase mb-1">MORNING</p>
                  <p className="text-sm text-peak-text italic">{morning.intention}</p>
                </div>
              )}
              {evening && (
                <div className={morning ? 'border-t border-peak-border pt-4' : ''}>
                  <p className="text-[10px] font-bold tracking-widest text-peak-accent uppercase mb-2">EVENING</p>
                  {evening.day_rating && (
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <div key={n} className={`w-2.5 h-2.5 rounded-full ${n <= evening.day_rating ? 'bg-peak-accent' : 'bg-peak-border'}`} />
                      ))}
                    </div>
                  )}
                  {[evening.gratitude_1, evening.gratitude_2, evening.gratitude_3].filter(Boolean).length > 0 && (
                    <ul className="mb-2 space-y-0.5">
                      {[evening.gratitude_1, evening.gratitude_2, evening.gratitude_3].filter(Boolean).map((g, i) => (
                        <li key={i} className="text-xs text-peak-text">• {g}</li>
                      ))}
                    </ul>
                  )}
                  {evening.reflection && (
                    <p className="text-sm text-peak-text italic">{evening.reflection}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {!loading && grouped.length === 0 && (
          <p className="text-peak-muted text-sm text-center mt-16">
            No entries yet. Start your first check-in from the dashboard.
          </p>
        )}
      </main>

      {/* Check-in modals */}
      {modal === 'morning' && (
        <Modal title="Morning Check-in" onClose={() => setModal(null)}>
          <MorningForm saveCheckin={saveCheckin} onSuccess={handleSuccess} />
        </Modal>
      )}
      {modal === 'evening' && (
        <Modal title="Evening Check-in" onClose={() => setModal(null)}>
          <EveningForm saveCheckin={saveCheckin} onSuccess={handleSuccess} />
        </Modal>
      )}
    </div>
  )
}
