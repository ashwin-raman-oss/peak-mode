import { useEffect, useRef, useState } from 'react'

const CONFETTI_DOTS = [
  { left: '8%',  top: '20%', color: '#F59E0B', delay: '0s',    tx: '-50px', ty: '-60px' },
  { left: '22%', top: '12%', color: '#FBBF24', delay: '0.1s',  tx: '-20px', ty: '-70px' },
  { left: '38%', top: '8%',  color: '#FCD34D', delay: '0.2s',  tx: '10px',  ty: '-75px' },
  { left: '55%', top: '8%',  color: '#F59E0B', delay: '0.05s', tx: '25px',  ty: '-72px' },
  { left: '72%', top: '12%', color: '#FBBF24', delay: '0.15s', tx: '45px',  ty: '-65px' },
  { left: '88%', top: '22%', color: '#F59E0B', delay: '0.08s', tx: '60px',  ty: '-45px' },
  { left: '92%', top: '48%', color: '#FCD34D', delay: '0.25s', tx: '65px',  ty: '5px'   },
  { left: '88%', top: '75%', color: '#F59E0B', delay: '0.12s', tx: '55px',  ty: '50px'  },
  { left: '70%', top: '90%', color: '#FBBF24', delay: '0.3s',  tx: '20px',  ty: '65px'  },
  { left: '50%', top: '93%', color: '#FCD34D', delay: '0.18s', tx: '0px',   ty: '70px'  },
  { left: '28%', top: '90%', color: '#F59E0B', delay: '0.07s', tx: '-25px', ty: '62px'  },
  { left: '10%', top: '78%', color: '#FBBF24', delay: '0.22s', tx: '-58px', ty: '40px'  },
  { left: '5%',  top: '52%', color: '#F59E0B', delay: '0.16s', tx: '-65px', ty: '8px'   },
  { left: '7%',  top: '35%', color: '#FCD34D', delay: '0.28s', tx: '-58px', ty: '-30px' },
]

export default function OKRCompletionModal({ objective, onClose }) {
  const [visible, setVisible] = useState(true)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      onCloseRef.current?.()
    }, 15000)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  function dismiss() { setVisible(false); onCloseRef.current?.() }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
      onClick={dismiss}
    >
      <style>{`
        @keyframes okrBurst {
          0%   { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--cx), var(--cy)) scale(0.2); opacity: 0; }
        }
      `}</style>

      {CONFETTI_DOTS.map((dot, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            left: dot.left,
            top: dot.top,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: dot.color,
            '--cx': dot.tx,
            '--cy': dot.ty,
            animation: `okrBurst 1.8s ease-out ${dot.delay} infinite`,
            pointerEvents: 'none',
          }}
        />
      ))}

      <div
        className="relative bg-peak-surface rounded-2xl px-8 py-10 text-center max-w-sm w-full mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-6xl mb-3">🏆</div>
        <p className="text-xs font-black tracking-widest text-amber-500 uppercase mb-2">Objective Achieved</p>
        <h2 className="text-xl font-black text-peak-text mb-2 leading-snug">{objective.title}</h2>
        {objective.why && (
          <p className="text-sm italic text-peak-muted mb-4 leading-relaxed">{objective.why}</p>
        )}
        {objective.key_results?.length > 0 && (
          <>
            <div className="h-px bg-peak-border mx-2 mb-4" />
            <div className="space-y-1.5 mb-5 text-left">
              {objective.key_results.map(kr => (
                <div key={kr.id} className="flex items-start gap-2 text-xs text-peak-muted">
                  <span className="text-amber-500 shrink-0 mt-0.5">✓</span>
                  <span>{kr.title}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <p className="text-sm text-peak-text font-medium mb-6 leading-relaxed">
          This is what commitment looks like. Every day you showed up brought you here.
        </p>
        <button
          onClick={dismiss}
          className="text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg transition-colors"
        >
          Continue →
        </button>
        <p className="text-[10px] text-peak-muted mt-3">Auto-closes in 15 seconds</p>
      </div>
    </div>
  )
}
