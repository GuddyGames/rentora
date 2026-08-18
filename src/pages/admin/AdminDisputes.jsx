import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { getAllDisputesAdmin, resolveDispute } from '../../services/disputes'
import Skeleton from '../../components/Skeleton'

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [noteFor, setNoteFor] = useState(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    getAllDisputesAdmin()
      .then(setDisputes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleResolve(id) {
    await resolveDispute(id, note)
    setDisputes((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'resolved', resolutionNote: note } : d)))
    setNoteFor(null)
    setNote('')
  }

  return (
    <AdminLayout>
      {error && <p className="rounded-xl border border-ruby/30 bg-ruby/10 p-4 text-sm text-ruby">{error}</p>}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : disputes.length === 0 ? (
        <p className="text-midnight/50">No disputes filed yet.</p>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <div key={d.id} className="glass space-y-2 rounded-2xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display font-semibold text-midnight">{d.listingTitle}</p>
                  <p className="text-sm text-midnight/50">Filed by {d.filedByName} · {d.reason}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase ${
                  d.status === 'open' ? 'bg-ruby/10 text-ruby' : 'bg-emerald/10 text-emerald'
                }`}>
                  {d.status}
                </span>
              </div>
              {d.details && <p className="text-sm text-midnight/70">{d.details}</p>}
              {d.photoBase64 && (
                <img src={d.photoBase64} alt="Dispute evidence" className="h-40 w-full max-w-xs rounded-lg object-cover" />
              )}
              {d.status === 'resolved' && d.resolutionNote && (
                <p className="text-sm text-emerald">Resolution: {d.resolutionNote}</p>
              )}
              {d.status === 'open' && (
                noteFor === d.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="How was this resolved?"
                      rows={2}
                      className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-midnight"
                    />
                    <button
                      onClick={() => handleResolve(d.id)}
                      className="rounded-full bg-emerald px-4 py-1.5 text-sm font-medium text-white hover:brightness-110"
                    >
                      Mark resolved
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setNoteFor(d.id)} className="text-sm text-royal hover:underline">
                    Resolve this dispute
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
