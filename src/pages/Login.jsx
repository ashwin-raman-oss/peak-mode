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
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-widest text-white uppercase">
            PEAK <span className="text-peak-accent">MODE</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 tracking-wide">Elite performance tracking</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-peak-surface border border-peak-border rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-peak-accent transition-colors placeholder-slate-600"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-1.5">
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
              className="w-full bg-peak-surface border border-peak-border rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-peak-accent transition-colors placeholder-slate-600"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="text-red-400 text-xs font-medium bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-peak-accent text-peak-bg font-black text-sm tracking-widest uppercase py-3.5 rounded-lg hover:bg-sky-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : mode === 'login' ? 'ENTER PEAK MODE' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <button
          onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(null) }}
          className="w-full mt-4 text-slate-500 text-xs hover:text-slate-400 transition-colors"
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  )
}
