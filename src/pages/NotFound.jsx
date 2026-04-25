import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-peak-bg flex flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl mb-5">🔍</p>
      <h1 className="text-xl font-bold text-peak-text mb-2">Page not found</h1>
      <p className="text-sm text-peak-muted mb-6">
        This page doesn't exist. Head back to your dashboard to continue.
      </p>
      <Link
        to="/"
        className="text-sm font-semibold text-white bg-peak-accent hover:opacity-90 px-5 py-2.5 rounded-lg transition-opacity"
      >
        Go to Dashboard →
      </Link>
    </div>
  )
}
