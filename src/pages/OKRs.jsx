import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useOKRs } from '../hooks/useOKRs'
import TopBar from '../components/TopBar'
import Modal from '../components/ui/Modal'

const PROGRESS_STEPS = [0, 25, 50, 75, 100]

function avgProgress(keyResults) {
  if (!keyResults.length) return 0
  return Math.round(keyResults.reduce((s, kr) => s + kr.progress, 0) / keyResults.length)
}

export default function OKRs() {
  const { user } = useAuth()
  const { okrs, loading, addOKR, addKeyResult, updateProgress, deleteOKR, deleteKeyResult } = useOKRs(user?.id)
  const [showAdd, setShowAdd] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-peak-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-peak-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="OKRs"
        subtitle={<span className="inline-flex items-center gap-1.5">
          Objectives & Key Results
          <span className="text-[10px] font-semibold bg-peak-accent-light text-peak-accent px-2 py-0.5 rounded-full">H1 2026</span>
        </span>}
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="text-xs font-semibold bg-peak-accent text-white px-3 py-1.5 rounded-lg hover:bg-amber-500 transition-colors"
          >
            + Add Objective
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto bg-peak-bg p-6">
        {okrs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-peak-muted text-sm mb-4">No objectives yet. Add your first OKR to get started.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="text-sm font-semibold bg-peak-accent text-white px-5 py-2.5 rounded-lg hover:bg-amber-500 transition-colors"
            >
              + Add Objective
            </button>
          </div>
        ) : (
          <div className="space-y-5 max-w-3xl">
            {okrs.map(okr => (
              <OKRCard
                key={okr.id}
                okr={okr}
                onUpdateProgress={updateProgress}
                onAddKR={addKeyResult}
                onDeleteKR={deleteKeyResult}
                onDeleteOKR={deleteOKR}
              />
            ))}
          </div>
        )}
      </main>

      {showAdd && (
        <AddOKRModal
          onClose={() => setShowAdd(false)}
          onSave={async ({ title, why, period, keyResults }) => {
            const okr = await addOKR({ title, why, period })
            for (const kr of keyResults) {
              if (kr.trim()) await addKeyResult(okr.id, { title: kr.trim() })
            }
            setShowAdd(false)
          }}
        />
      )}
    </div>
  )
}

function OKRCard({ okr, onUpdateProgress, onAddKR, onDeleteKR, onDeleteOKR }) {
  const [addingKR, setAddingKR] = useState(false)
  const [newKRTitle, setNewKRTitle] = useState('')
  const [savingKR, setSavingKR] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const progress = avgProgress(okr.key_results)

  async function handleAddKR() {
    if (!newKRTitle.trim()) return
    setSavingKR(true)
    try {
      await onAddKR(okr.id, { title: newKRTitle.trim() })
      setNewKRTitle('')
      setAddingKR(false)
    } finally {
      setSavingKR(false)
    }
  }

  return (
    <div className="bg-peak-surface border border-peak-border rounded-xl p-6 shadow-sm">
      {/* Card header */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="text-sm font-bold text-peak-text leading-snug">{okr.title}</h3>
          {okr.why && (
            <p className="text-sm text-peak-muted italic mt-0.5">{okr.why}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-semibold bg-peak-accent-light text-peak-accent px-2 py-0.5 rounded-full">
            {okr.period}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowMenu(v => !v)}
              className="text-peak-muted hover:text-peak-text text-sm px-1 transition-colors"
            >
              ···
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-6 z-20 bg-peak-surface border border-peak-border rounded-lg shadow-lg py-1 min-w-[150px]">
                  <button
                    onClick={() => { setShowMenu(false); onDeleteOKR(okr.id) }}
                    className="w-full text-left text-xs text-[#DC2626] px-3 py-2 hover:bg-peak-bg transition-colors"
                  >
                    Delete objective
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-peak-muted">Overall progress</span>
          <span className="text-[10px] font-semibold text-peak-accent">{progress}%</span>
        </div>
        <div className="h-[3px] bg-peak-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: '#F59E0B' }}
          />
        </div>
      </div>

      {/* Key Results */}
      {okr.key_results.length > 0 && (
        <div className="space-y-3 mb-3">
          {okr.key_results.map(kr => (
            <div key={kr.id} className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-peak-text mb-1.5 leading-snug">{kr.title}</p>
                <div className="flex gap-1 flex-wrap">
                  {PROGRESS_STEPS.map(step => (
                    <button
                      key={step}
                      onClick={() => onUpdateProgress(kr.id, step)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                        kr.progress === step
                          ? 'bg-peak-accent border-peak-accent text-white'
                          : 'border-peak-border text-peak-muted hover:border-peak-accent hover:text-peak-accent'
                      }`}
                    >
                      {step}%
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onDeleteKR(kr.id)}
                className="text-peak-muted hover:text-[#DC2626] text-xs shrink-0 mt-0.5 transition-colors"
                aria-label="Delete key result"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add KR inline */}
      {addingKR ? (
        <div className="flex items-center gap-2 mt-2">
          <input
            autoFocus
            value={newKRTitle}
            onChange={e => setNewKRTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddKR(); if (e.key === 'Escape') setAddingKR(false) }}
            placeholder="Key result title..."
            className="flex-1 text-xs border border-peak-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
          />
          <button
            onClick={handleAddKR}
            disabled={savingKR || !newKRTitle.trim()}
            className="text-xs font-semibold bg-peak-accent text-white px-3 py-1.5 rounded-lg hover:bg-amber-500 disabled:opacity-50"
          >
            {savingKR ? '…' : 'Add'}
          </button>
          <button onClick={() => setAddingKR(false)} className="text-xs text-peak-muted hover:text-peak-text">Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setAddingKR(true)}
          className="text-xs text-peak-muted hover:text-peak-accent transition-colors mt-1"
        >
          + Add Key Result
        </button>
      )}
    </div>
  )
}

function AddOKRModal({ onClose, onSave }) {
  const [title, setTitle] = useState('')
  const [why, setWhy] = useState('')
  const [period, setPeriod] = useState('H1 2026')
  const [keyResults, setKeyResults] = useState([''])
  const [submitting, setSubmitting] = useState(false)

  function addKRField() {
    if (keyResults.length < 5) setKeyResults(prev => [...prev, ''])
  }

  function updateKR(i, val) {
    setKeyResults(prev => prev.map((v, idx) => idx === i ? val : v))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      await onSave({ title: title.trim(), why: why.trim(), period: period.trim() || 'H1 2026', keyResults })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Add Objective" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-peak-muted mb-1">Objective</label>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What do you want to achieve?"
            className="w-full text-sm border border-peak-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-peak-muted mb-1">Why it matters <span className="normal-case font-normal">(optional)</span></label>
          <textarea
            value={why}
            onChange={e => setWhy(e.target.value)}
            placeholder="Why is this important to you?"
            className="w-full text-sm border border-peak-border rounded-lg px-3 py-2 resize-none h-16 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-peak-muted mb-1">Period</label>
          <input
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="w-full text-sm border border-peak-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-peak-muted mb-2">Key Results</label>
          <div className="space-y-2">
            {keyResults.map((kr, i) => (
              <input
                key={i}
                value={kr}
                onChange={e => updateKR(i, e.target.value)}
                placeholder={`Key result ${i + 1}`}
                className="w-full text-sm border border-peak-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
              />
            ))}
          </div>
          {keyResults.length < 5 && (
            <button
              type="button"
              onClick={addKRField}
              className="mt-2 text-xs text-peak-accent hover:underline"
            >
              + Add another
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="w-full bg-peak-accent text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save Objective'}
        </button>
      </form>
    </Modal>
  )
}
