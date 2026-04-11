import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login') // 'login' | 'signup'

  if (user) {
    navigate('/', { replace: true })
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      let result
      if (mode === 'login') {
        result = await supabase.auth.signInWithPassword({ email, password })
      } else {
        result = await supabase.auth.signUp({ email, password })
      }

      if (result.error) {
        setError(result.error.message)
      } else {
        if (mode === 'signup' && result.data?.session === null) {
          setError('Check your email to confirm your account before signing in.')
        } else {
          navigate('/')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-peak-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-peak-surface rounded-2xl shadow-sm border border-peak-border p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-widest text-peak-primary uppercase">
            PEAK <span className="text-peak-accent">MODE</span>
          </h1>
          <p className="text-peak-muted text-sm mt-1">Elite performance tracking</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-bold tracking-widest text-peak-muted uppercase mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-peak-elevated border border-peak-border rounded-lg px-4 py-3 text-peak-primary text-sm focus:outline-none focus:border-peak-accent transition-colors placeholder-peak-muted"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold tracking-widest text-peak-muted uppercase mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={mode === 'signup' ? 6 : undefined}
              className="w-full bg-peak-elevated border border-peak-border rounded-lg px-4 py-3 text-peak-primary text-sm focus:outline-none focus:border-peak-accent transition-colors placeholder-peak-muted"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="text-[#DC2626] text-xs font-medium bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-peak-accent text-white font-bold text-sm tracking-widest uppercase py-3.5 rounded-lg hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <button
          onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(null) }}
          className="w-full mt-4 text-peak-muted text-xs hover:text-peak-text transition-colors"
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  )
}
