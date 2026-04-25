import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'

export default function Settings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { profile, refetch } = useProfile(user?.id)

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // ── Profile ───────────────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState('')
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState(null)

  useEffect(() => {
    if (profile && !profileLoaded) {
      setDisplayName(profile.display_name ?? '')
      setProfileLoaded(true)
    }
  }, [profile, profileLoaded])

  async function handleSaveProfile(e) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError(null)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() || null })
        .eq('user_id', user.id)
      if (error) throw error
      await refetch()
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 2000)
    } catch (err) {
      setProfileError(err.message)
    } finally {
      setProfileSaving(false)
    }
  }

  // ── Change Password ───────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState(null)

  async function handleChangePassword(e) {
    e.preventDefault()
    if (newPw.length < 6) { setPwError('Password must be at least 6 characters.'); return }
    setPwSaving(true)
    setPwError(null)
    try {
      // Re-authenticate to verify current password
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPw,
      })
      if (signInErr) throw new Error('Current password is incorrect.')
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      setCurrentPw('')
      setNewPw('')
      setPwSuccess(true)
      setTimeout(() => setPwSuccess(false), 2000)
    } catch (err) {
      setPwError(err.message)
    } finally {
      setPwSaving(false)
    }
  }

  // ── Danger Zone ───────────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await supabase.auth.signOut()
      navigate('/login')
    } catch (err) {
      setDeleteError(err.message)
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Settings" subtitle="Account & preferences" />
      <main className="flex-1 overflow-y-auto bg-peak-bg px-4 py-4 lg:px-6">
        <div className="max-w-lg mx-auto space-y-6">

          {/* ── Profile ── */}
          <section className="bg-peak-surface border border-peak-border rounded-xl p-5">
            <h2 className="text-sm font-bold text-peak-text mb-4">Profile</h2>
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-peak-muted mb-1">
                  Display Name
                </label>
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder={user?.email?.split('@')[0] ?? 'Your name'}
                  maxLength={50}
                  className="w-full text-sm border border-peak-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-peak-muted mb-1">
                  Email
                </label>
                <p className="text-sm text-peak-muted">{user?.email}</p>
              </div>
              {profileError && <p className="text-xs text-red-500">{profileError}</p>}
              {profileSuccess && <p className="text-xs text-peak-success font-medium">Saved ✓</p>}
              <button
                type="submit"
                disabled={profileSaving}
                className="text-xs font-semibold bg-peak-accent text-white px-4 py-2 rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50"
              >
                {profileSaving ? 'Saving…' : 'Save Profile'}
              </button>
            </form>
          </section>

          {/* ── Change Password ── */}
          <section className="bg-peak-surface border border-peak-border rounded-xl p-5">
            <h2 className="text-sm font-bold text-peak-text mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-peak-muted mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full text-sm border border-peak-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-peak-muted mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full text-sm border border-peak-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
                />
              </div>
              {pwError && <p className="text-xs text-red-500">{pwError}</p>}
              {pwSuccess && <p className="text-xs text-peak-success font-medium">Password changed ✓</p>}
              <button
                type="submit"
                disabled={pwSaving}
                className="text-xs font-semibold bg-peak-accent text-white px-4 py-2 rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50"
              >
                {pwSaving ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </section>

          {/* ── Preferences ── */}
          <section className="bg-peak-surface border border-peak-border rounded-xl p-5">
            <h2 className="text-sm font-bold text-peak-text mb-4">Preferences</h2>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-peak-muted mb-1">Timezone</p>
              <p className="text-sm text-peak-text">{timezone}</p>
              <p className="text-[10px] text-peak-muted mt-0.5">
                Detected from your browser. Change your system timezone to update.
              </p>
            </div>
          </section>

          {/* ── Danger Zone ── */}
          <section className="bg-peak-surface border border-[#FCA5A5] rounded-xl p-5">
            <h2 className="text-sm font-bold text-[#DC2626] mb-1">Danger Zone</h2>
            <p className="text-xs text-peak-muted mb-4">
              Signing out deactivates your session. Your data is queued for permanent deletion within 30 days — contact support to cancel.
            </p>
            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="text-xs font-semibold text-[#DC2626] border border-[#FCA5A5] hover:bg-[#FEF2F2] px-4 py-2 rounded-lg transition-colors"
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-medium text-peak-text">
                  Type <span className="font-bold">DELETE</span> to confirm:
                </p>
                <input
                  value={deleteInput}
                  onChange={e => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className="w-full text-sm border border-[#FCA5A5] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200"
                />
                {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteInput !== 'DELETE' || deleting}
                    className="text-xs font-semibold bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting…' : 'Confirm Delete'}
                  </button>
                  <button
                    onClick={() => { setDeleteConfirm(false); setDeleteInput('') }}
                    className="text-xs text-peak-muted hover:text-peak-text transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  )
}
