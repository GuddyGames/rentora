import { createContext, useContext, useEffect, useState } from "react";
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
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // handle Google redirect result on load (more reliable than popup on flaky mobile data)
    getRedirectResult(auth).catch((err) =>
      console.error("redirect sign-in error", err),
    );

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        setProfile(snap.exists() ? snap.data() : null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signup({ name, email, password, role }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const userDoc = {
      name,
      email,
      role, // 'renter' | 'owner'
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "users", cred.user.uid), userDoc);
    setProfile(userDoc);
    sendEmailVerification(cred.user).catch((err) =>
      console.error("verification email failed", err),
    );
    return cred.user;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithRedirect(auth, provider);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  function logout() {
    return signOut(auth);
  }

  const value = {
    user,
    profile,
    loading,
    signup,
    login,
    loginWithGoogle,
    resetPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
