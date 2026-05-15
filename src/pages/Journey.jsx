import { useAuth } from '../context/AuthContext'
import { useJourney } from '../hooks/useJourney'
import TopBar from '../components/TopBar'
import BasecampScene from '../components/journey/BasecampScene'

const isDebug = new URLSearchParams(window.location.search).get('debug') === 'true'

function getNarrative(sceneDay) {
  if (sceneDay >= 30) return 'Chapter 1 complete. The summit awaits. What\'s your next adventure?'
  if (sceneDay >= 28) return 'Almost there. One more push.'
  if (sceneDay >= 22) return 'You can see the path clearly now. Every day brings you closer.'
  if (sceneDay >= 15) return 'The team is here. The systems are working. The summit feels closer.'
  if (sceneDay >= 8)  return 'Base camp is alive. You\'re building something real.'
  if (sceneDay >= 4)  return 'Camp is taking shape. The routine is forming. Keep going.'
  return 'You\'ve just arrived. The mountain looms ahead. Everything begins here.'
}

const MILESTONES = [7, 14, 22, 30]

export default function Journey() {
  const { user } = useAuth()
  const { journey, loading, debugAdvanceDay } = useJourney(user?.id, null, null, false)

  const sceneDay         = journey?.scene_day         ?? 0
  const deterioration    = journey?.deterioration_level ?? 0
  const totalCompleted   = journey?.total_days_completed ?? 0
  const progressPct      = Math.min(100, (sceneDay / 30) * 100)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="My Journey" subtitle="Chapter 1 — The Basecamp" />

      <main className="flex-1 overflow-y-auto bg-peak-bg px-4 py-4 lg:px-6">

        {/* Deterioration warning */}
        {deterioration === 1 && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-4 py-3 rounded-xl">
            The fire went out. Come back tomorrow to relight it.
          </div>
        )}
        {deterioration === 2 && (
          <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-700 text-sm font-medium px-4 py-3 rounded-xl">
            The camp is struggling. Show up today to stabilize it.
          </div>
        )}
        {deterioration === 3 && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl">
            The camp is in crisis. Every day you return brings it back.
          </div>
        )}

        {/* Scene */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#1a365d] rounded-2xl overflow-hidden shadow-lg border border-peak-border mb-4">
            {loading ? (
              <div className="aspect-[3/2] flex items-center justify-center">
                <p className="text-blue-300 text-sm">Loading your journey…</p>
              </div>
            ) : (
              <BasecampScene sceneDay={sceneDay} deteriorationLevel={deterioration} />
            )}
          </div>

          {/* Day counter card */}
          <div className="bg-peak-surface border border-peak-border rounded-xl shadow-sm p-5 mb-4">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <p className="text-[11px] font-bold tracking-widest uppercase text-peak-muted mb-0.5">Progress</p>
                <p className="text-3xl font-bold text-peak-text">
                  Day <span className="text-peak-xp">{sceneDay}</span>
                  <span className="text-lg font-medium text-peak-muted"> / 30</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-peak-text">{totalCompleted}</p>
                <p className="text-[11px] text-peak-muted">total days active</p>
              </div>
            </div>

            {/* Progress bar with milestone markers */}
            <div className="relative mb-2">
              <div className="h-2.5 bg-peak-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-peak-xp rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {/* Milestone markers */}
              {MILESTONES.map(day => {
                const pct = (day / 30) * 100
                const reached = sceneDay >= day
                return (
                  <div
                    key={day}
                    className="absolute top-0 -translate-x-1/2"
                    style={{ left: `${pct}%` }}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full border-2 border-white ${reached ? 'bg-peak-xp' : 'bg-peak-border'}`} />
                  </div>
                )
              })}
            </div>

            {/* Milestone labels */}
            <div className="flex justify-between mt-3">
              {MILESTONES.map(day => (
                <div key={day} className="text-center" style={{ width: '25%' }}>
                  <p className={`text-[10px] font-semibold ${sceneDay >= day ? 'text-peak-xp' : 'text-peak-muted'}`}>
                    Day {day}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Narrative line */}
          <div className="bg-peak-surface border border-peak-border rounded-xl shadow-sm px-5 py-4 mb-4 text-center">
            <p className="text-sm text-peak-text font-medium italic">
              "{getNarrative(sceneDay)}"
            </p>
          </div>

          {/* Debug panel — only visible at /journey?debug=true */}
          {isDebug && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
              <p className="text-xs text-yellow-700 font-medium">Debug mode — scene day: {sceneDay}</p>
              <button
                onClick={debugAdvanceDay}
                className="text-xs font-semibold text-yellow-800 bg-yellow-100 border border-yellow-300 px-3 py-1 rounded-lg hover:bg-yellow-200 transition-colors"
              >
                Force +1 Day
              </button>
            </div>
          )}

          {/* Chapter timeline */}
          <div className="bg-peak-surface border border-peak-border rounded-xl shadow-sm px-5 py-4">
            <p className="text-[11px] font-bold tracking-widest uppercase text-peak-muted mb-3">
              CHAPTER 1 OF ∞
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-peak-xp rounded-full" />
              <div className="flex-1 h-1.5 bg-peak-border rounded-full" />
              <div className="flex-1 h-1.5 bg-peak-border rounded-full" />
            </div>
            <div className="flex mt-2 text-[10px]">
              <div className="flex-1 font-semibold text-peak-xp">The Basecamp</div>
              <div className="flex-1 text-peak-muted text-center">???</div>
              <div className="flex-1 text-peak-muted text-right">???</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
