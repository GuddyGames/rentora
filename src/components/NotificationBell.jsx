import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listenToNotifications, markNotificationRead, markAllRead } from '../services/notifications'
import { BellIcon } from './icons'

function timeAgo(date) {
  if (!date) return ''
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!user) return
    return listenToNotifications(user.uid, setNotifications)
  }, [user])

  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (!user) return null
  const unreadCount = notifications.filter((n) => !n.read).length

  async function handleClickNotification(n) {
    if (!n.read) await markNotificationRead(n.id)
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-midnight/70 hover:text-gold"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-ruby text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-2xl border border-black/5 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
            <p className="font-display font-semibold text-midnight">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={() => markAllRead(user.uid)} className="text-xs text-royal hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-midnight/50">Nothing yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClickNotification(n)}
                  className={`block w-full border-b border-black/5 px-4 py-3 text-left last:border-0 hover:bg-black/5 ${
                    n.read ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />}
                    <p className="truncate text-sm font-medium text-midnight">{n.title}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-midnight/60">{n.body}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-midnight/30">
                    {timeAgo(n.createdAt?.toDate?.())}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
