import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, loginWithGoogle, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetBusy, setResetBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError('Could not log in — check your email and password.')
    } finally {
      setBusy(false)
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Type your email above first, then tap "Forgot password?"')
      return
    }
    setError('')
    setResetBusy(true)
    try {
      await resetPassword(email.trim())
      setResetSent(true)
    } catch (err) {
      // Firebase deliberately doesn't reveal whether the email exists —
      // show the same success message either way so this can't be used to
      // check which emails are registered
      setResetSent(true)
    } finally {
      setResetBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-16">
      <h1 className="font-display text-3xl font-semibold text-midnight">Log in</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-midnight placeholder:text-midnight/40"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-midnight placeholder:text-midnight/40"
        />
        <div className="flex items-center justify-between">
          <span />
          <button type="button" onClick={handleForgotPassword} disabled={resetBusy} className="text-sm text-royal hover:underline disabled:opacity-60">
            {resetBusy ? 'Sending…' : 'Forgot password?'}
          </button>
        </div>
        {resetSent && (
          <p className="text-sm text-emerald">
            If an account exists for that email, a reset link is on its way — check your inbox (and spam folder).
          </p>
        )}
        {error && <p className="text-sm text-ruby">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-gold px-5 py-2.5 font-medium text-midnightdeep transition-colors hover:brightness-110 disabled:opacity-60"
        >
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <button
        onClick={loginWithGoogle}
        className="mt-3 w-full rounded-full border border-black/15 px-5 py-2.5 font-medium text-midnight transition-colors hover:border-gold hover:text-gold"
      >
        Continue with Google
      </button>

      <p className="mt-6 text-sm text-midnight/60">
        No account? <Link to="/signup" className="text-gold hover:underline">Sign up</Link>
      </p>
    </div>
  )
}
