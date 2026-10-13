import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  deleteUser,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // handle Google redirect result on load (more reliable than popup on flaky mobile data)
    getRedirectResult(auth).catch((err) => console.error('redirect sign-in error', err))

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(true)
      try {
        if (!firebaseUser) {
          setProfile(null)
          return
        }

        const profileRef = doc(db, 'users', firebaseUser.uid)
        const snap = await getDoc(profileRef)
        if (snap.exists()) {
          setProfile(snap.data())
        } else {
          // Google sign-in users may not have a profile document yet. Give
          // them the least-privileged role; they can choose vendor setup later.
          const defaultProfile = {
            name: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            role: 'renter',
            createdAt: serverTimestamp(),
          }
          await setDoc(profileRef, defaultProfile)
          setProfile(defaultProfile)
        }
      } catch (error) {
        console.error('Could not load account profile', error)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })
    return unsub
  }, [])

  // Lightweight presence: while the app is open, ping lastActiveAt every 60s.
  // This gives the admin panel an "active in the last couple minutes" signal
  // — it's an approximation (no instant online/offline via a disconnect
  // hook, which would need Firebase Realtime Database), but it's honest
  // about what it actually measures.
  useEffect(() => {
    if (!user) return
    const ping = () => updateDoc(doc(db, 'users', user.uid), { lastActiveAt: serverTimestamp() }).catch(() => {})
    ping()
    const interval = setInterval(ping, 60000)
    return () => clearInterval(interval)
  }, [user])

  async function signup({ name, email, password, role }) {
    if (!['renter', 'owner'].includes(role)) throw new Error('Choose renter or equipment owner.')
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const userDoc = {
      name,
      email,
      role, // 'renter' | 'owner'
      createdAt: serverTimestamp(),
    }
    await setDoc(doc(db, 'users', cred.user.uid), userDoc)
    setProfile(userDoc)
    sendEmailVerification(cred.user).catch((err) => console.error('verification email failed', err))
    return cred.user
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  function loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    return signInWithRedirect(auth, provider)
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
  }

  // Firebase requires a *recent* login to delete an account — if this
  // throws auth/requires-recent-login, the caller needs to have the user
  // sign in again first, then retry.
  async function deleteAccount() {
    const uid = user.uid
    await updateDoc(doc(db, 'users', uid), { name: 'Deleted user', email: '[deleted]' })
    await deleteUser(user)
  }

  function logout() {
    return signOut(auth)
  }

  const value = { user, profile, loading, signup, login, loginWithGoogle, resetPassword, deleteAccount, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
