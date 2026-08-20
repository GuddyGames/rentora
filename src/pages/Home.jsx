import { useAuth } from '../context/AuthContext'
import HomeGuest from './HomeGuest'
import HomeDashboard from './HomeDashboard'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) return null
  return user ? <HomeDashboard /> : <HomeGuest />
}
