import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getConversationsForUser } from '../services/chat'

export default function Messages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    getConversationsForUser(user.uid)
      .then(setConversations)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="font-display text-3xl font-semibold text-midnight">Messages</h1>

      {loading ? (
        <p className="mt-10 text-midnight/60">Loading…</p>
      ) : error ? (
        <p className="mt-10 text-ruby">Couldn't load messages: {error}</p>
      ) : conversations.length === 0 ? (
        <p className="mt-10 text-midnight/60">No conversations yet — message an owner from a listing page.</p>
      ) : (
        <div className="mt-6 space-y-2">
          {conversations.map((c) => {
            const otherName = user.uid === c.ownerId ? c.renterName : c.ownerName
            return (
              <Link
                key={c.id}
                to={`/messages/${c.id}`}
                className="block rounded-xl border border-black/10 bg-white p-4 hover:border-gold transition-colors"
              >
                <p className="font-display font-semibold text-midnight">{otherName}</p>
                <p className="text-sm text-midnight/50">{c.listingTitle}</p>
                {c.lastMessage && <p className="mt-1 truncate text-sm text-midnight/70">{c.lastMessage}</p>}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
