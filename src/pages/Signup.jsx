import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('renter')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signup({ name, email, password, role })
      navigate(role === 'owner' ? '/dashboard' : '/browse')
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use' ? 'That email is already registered.' : 'Could not sign up — try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-8 sm:px-5 sm:py-14 md:py-16">
      <h1 className="break-words font-display text-2xl font-semibold text-midnight sm:text-3xl">Create an account</h1>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setRole('renter')}
          className={`min-w-0 rounded-lg border px-3 py-3 text-sm transition-colors ${
            role === 'renter' ? 'border-gold bg-gold/10 text-gold' : 'border-black/10 text-midnight/70'
          }`}
        >
          I'm renting equipment
        </button>
        <button
          type="button"
          onClick={() => setRole('owner')}
          className={`rounded-lg border px-4 py-2.5 text-sm transition-colors ${
            role === 'owner' ? 'border-gold bg-gold/10 text-gold' : 'border-black/10 text-midnight/70'
          }`}
        >
          I'm listing equipment
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <input
          type="text"
          required
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-midnight placeholder:text-midnight/40"
        />
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
          minLength={6}
          placeholder="Password (min. 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-midnight placeholder:text-midnight/40"
        />
        {error && <p className="text-sm text-ruby">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-gold px-5 py-2.5 font-medium text-midnightdeep transition-colors hover:brightness-110 disabled:opacity-60"
        >
          {busy ? 'Creating account…' : 'Sign up'}
        </button>
      </form>

      <p className="mt-6 text-sm text-midnight/60">
        Already have an account? <Link to="/login" className="text-gold hover:underline">Log in</Link>
      </p>
    </div>
  )
}
