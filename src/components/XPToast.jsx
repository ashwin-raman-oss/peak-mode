import { useEffect, useState } from 'react'

export default function XPToast({ xp, hypeMessage, onDone }) {
  const [phase, setPhase] = useState('xp') // 'xp' | 'hype' | 'done'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hype'), 1400)
    const t2 = setTimeout(() => { setPhase('done'); onDone?.() }, 4000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  if (phase === 'done') return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex flex-col items-center justify-center gap-3">
      {phase === 'xp' && (
        <div className="animate-xp-float text-peak-accent font-black text-2xl tracking-widest">
          +{xp} XP
        </div>
      )}
      {phase === 'hype' && hypeMessage && (
        <div className="animate-fade-in bg-peak-accent-dim border border-peak-accent/40 text-peak-accent text-sm font-medium px-5 py-3 rounded-xl max-w-xs text-center shadow-lg">
          {hypeMessage}
        </div>
      )}
    </div>
  )
}
