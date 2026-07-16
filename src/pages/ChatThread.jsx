import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getConversation, listenToMessages, sendMessage } from '../services/chat'

export default function ChatThread() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    getConversation(id).then(setConversation)
    const unsub = listenToMessages(id, setMessages)
    return unsub
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim()) return
    await sendMessage(id, { senderId: user.uid, senderName: profile?.name || user.email, text: text.trim() })
    setText('')
  }

  const otherName = conversation && (user.uid === conversation.ownerId ? conversation.renterName : conversation.ownerName)

  return (
    <div className="mx-auto flex h-[calc(100vh-73px)] max-w-2xl flex-col px-5 py-6">
      <div className="flex items-center gap-3 border-b border-black/10 pb-3">
        <Link to="/messages" className="text-sm text-midnight/50 hover:text-gold">← Back</Link>
        <div>
          <p className="font-display font-semibold text-midnight">{otherName || '…'}</p>
          {conversation && <p className="text-xs text-midnight/50">{conversation.listingTitle}</p>}
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                m.senderId === user.uid ? 'bg-gold text-midnightdeep' : 'bg-white text-midnight'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-black/10 pt-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          className="flex-1 rounded-full border border-black/10 bg-white px-4 py-2.5 text-midnight placeholder:text-midnight/40"
        />
        <button type="submit" className="rounded-full bg-gold px-5 py-2.5 font-medium text-midnightdeep hover:brightness-110 transition-colors">
          Send
        </button>
      </form>
    </div>
  )
}
