import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-black/5 px-5 py-6 text-center text-xs text-midnight/40">
      <div className="flex flex-wrap justify-center gap-4">
        <Link to="/privacy" className="hover:text-midnight/70">Privacy Policy</Link>
        <Link to="/terms" className="hover:text-midnight/70">Terms of Service</Link>
        <Link to="/refund-policy" className="hover:text-midnight/70">Cancellation & Refunds</Link>
      </div>
      <p className="mt-2">© {new Date().getFullYear()} Rentora</p>
    </footer>
  )
}
