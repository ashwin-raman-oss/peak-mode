import { useEffect } from 'react'

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title"
        className="relative w-full max-w-md bg-peak-surface border border-peak-border rounded-2xl shadow-xl animate-fade-in max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <h2 id="modal-title" className="text-sm font-bold text-peak-text">{title}</h2>
          <button onClick={onClose} aria-label="Close"
            className="text-peak-muted hover:text-peak-text text-lg leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto flex-1 min-h-0 px-6 pb-6">
          {children}
        </div>
      </div>
    </div>
  )
}
