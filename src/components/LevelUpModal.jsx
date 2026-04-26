import { useEffect, useState } from 'react'

function getLevelTitle(level) {
  if (level >= 10) return 'Peak Mode'
  if (level >= 7)  return 'Elite'
  if (level >= 5)  return 'Performer'
  if (level >= 3)  return 'Contender'
  return 'Rookie'
}

function getLevelMessage(level) {
  if (level >= 10) return "You've reached the summit. This is what Peak Mode looks like."
  if (level >= 7)  return "Elite territory. Most people never make it here."
  if (level >= 5)  return "You're performing at a high level. Stay consistent."
  if (level >= 3)  return "Building momentum. Keep showing up every day."
  return "Your journey begins. One day at a time."
}

const CONFETTI = [
  { left: '10%', delay: '0s' },
  { left: '24%', delay: '0.12s' },
  { left: '40%', delay: '0.22s' },
  { left: '56%', delay: '0.08s' },
  { left: '72%', delay: '0.18s' },
  { left: '86%', delay: '0.28s' },
]

export default function LevelUpModal({ newLevel, onClose }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      onClose?.()
    }, 8000)
    return () => clearTimeout(t)
  }, [onClose])

  if (!visible) return null

  const title   = getLevelTitle(newLevel)
  const message = getLevelMessage(newLevel)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in"
      onClick={() => { setVisible(false); onClose?.() }}
    >
      <div
        className="relative bg-peak-surface rounded-2xl px-10 py-10 text-center max-w-sm w-full mx-4 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Confetti dots */}
        {CONFETTI.map((pos, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-amber-400 animate-confetti"
            style={{ left: pos.left, top: '18%', animationDelay: pos.delay }}
          />
        ))}

        <div className="text-6xl mb-4">⚡</div>
        <p className="text-2xl font-black tracking-widest text-peak-xp mb-1">LEVEL UP!</p>
        <p className="text-4xl font-black text-peak-xp mb-1">{newLevel}</p>
        <p className="text-sm font-bold text-peak-xp mb-3">{title}</p>
        <p className="text-sm text-peak-muted mb-6 leading-relaxed">{message}</p>

        {/* Progress bar at 0% — fresh start for new level */}
        <div className="mb-6">
          <div className="flex justify-between text-[10px] text-peak-muted mb-1">
            <span>0 XP</span>
            <span>1,000 XP to Level {newLevel + 1}</span>
          </div>
          <div className="h-2 bg-peak-border rounded-full overflow-hidden">
            <div className="h-full w-0 bg-peak-xp rounded-full" />
          </div>
        </div>

        <button
          onClick={() => { setVisible(false); onClose?.() }}
          className="text-xs font-semibold bg-peak-accent text-white px-4 py-2 rounded-lg hover:bg-[#1D4ED8] transition-colors"
        >
          Let's go →
        </button>
      </div>
    </div>
  )
}
