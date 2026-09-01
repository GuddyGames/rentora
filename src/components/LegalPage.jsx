import BackButton from './BackButton'

export default function LegalPage({ title, updated, children }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <BackButton to="/" />
      <h1 className="font-display text-3xl font-semibold text-midnight">{title}</h1>
      <p className="mt-1 text-xs text-midnight/40">Last updated: {updated}</p>

      <div className="mt-4 rounded-xl border border-gold/30 bg-gold/10 p-4 text-sm text-midnight">
        <strong>This is a draft, not a lawyer-reviewed legal document.</strong> It's a genuine starting point,
        not filler text — but before real money or real users' data depends on it, have it reviewed by a
        lawyer familiar with Nigerian consumer and data-protection law (NDPR).
      </div>

      <div className="prose prose-sm mt-6 max-w-none text-midnight/80 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-midnight [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1">
        {children}
      </div>
    </div>
  )
}
