import { useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'peak_onboarding_dismissed'

const STEPS = [
  { step: 1, text: 'Add tasks to your arenas (Career, Health, Learning, Misc)' },
  { step: 2, text: 'Complete tasks each day to earn XP and build your streak' },
  { step: 3, text: 'Set your Big 3 priorities each morning to stay focused' },
]

export default function OnboardingBanner() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === '1'
  )

  if (dismissed) return null

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-bold text-peak-text">Welcome to Peak Mode 👋</p>
        <button
          onClick={handleDismiss}
          className="text-peak-muted hover:text-peak-text text-xs ml-3 shrink-0 transition-colors"
          aria-label="Dismiss onboarding"
        >
          ✕
        </button>
      </div>
      <p className="text-xs text-peak-muted mb-4">Get started in 3 simple steps:</p>
      <div className="space-y-2 mb-4">
        {STEPS.map(({ step, text }) => (
          <div key={step} className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-peak-accent-light text-peak-accent text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              {step}
            </span>
            <span className="text-xs text-peak-muted">{text}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Link
          to="/arena/career"
          className="text-xs font-semibold text-white bg-peak-accent hover:bg-[#1D4ED8] px-4 py-2 rounded-lg transition-colors"
        >
          Set up Career tasks →
        </Link>
        <button
          onClick={handleDismiss}
          className="text-xs text-peak-muted hover:text-peak-text transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
