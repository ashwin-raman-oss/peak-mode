import { useState } from 'react'
import { MorningForm, EveningForm } from './CheckinForms'

export default function CheckinCard({ morningDone, eveningDone, saveCheckin }) {
  const hour = new Date().getHours()

  let cardType = null
  if (hour < 12) cardType = 'morning'
  else if (hour >= 18) cardType = 'evening'
  else return null

  if (cardType === 'morning') {
    return <MorningCard done={morningDone} saveCheckin={saveCheckin} />
  }
  return <EveningCard done={eveningDone} saveCheckin={saveCheckin} />
}

function MorningCard({ done, saveCheckin }) {
  const [dismissed, setDismissed] = useState(false)

  if (done && dismissed) return null
  if (done) {
    return (
      <div className="bg-peak-accent-light border border-peak-accent/20 rounded-lg px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs font-medium text-peak-accent">✓ Morning check-in complete</span>
        <button onClick={() => setDismissed(true)} className="text-peak-muted text-xs hover:text-peak-text">Dismiss</button>
      </div>
    )
  }

  return (
    <div className="bg-white border-l-4 border-peak-accent rounded-lg p-4" style={{ borderLeftColor: '#2D5BE3' }}>
      <p className="text-[10px] font-bold tracking-widest text-peak-accent uppercase mb-1">GOOD MORNING</p>
      <MorningForm saveCheckin={saveCheckin} />
    </div>
  )
}

function EveningCard({ done, saveCheckin }) {
  const [dismissed, setDismissed] = useState(false)

  if (done && dismissed) return null
  if (done) {
    return (
      <div className="bg-peak-accent-light border border-peak-accent/20 rounded-lg px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs font-medium text-peak-accent">✓ Evening check-in complete</span>
        <button onClick={() => setDismissed(true)} className="text-peak-muted text-xs hover:text-peak-text">Dismiss</button>
      </div>
    )
  }

  return (
    <div className="bg-white border-l-4 rounded-lg p-4" style={{ borderLeftColor: '#2D5BE3' }}>
      <p className="text-[10px] font-bold tracking-widest text-peak-accent uppercase mb-1">EVENING CHECK-IN</p>
      <EveningForm saveCheckin={saveCheckin} />
    </div>
  )
}
