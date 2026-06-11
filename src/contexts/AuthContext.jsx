import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';
import { ADMIN_EMAILS } from '../config/app';

// ─── Context ─────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasSeenRules, setHasSeenRules] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Upsert user document in Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data() || {};

        await setDoc(
          userRef,
          {
            displayName: firebaseUser.displayName ?? '',
            email: firebaseUser.email ?? '',
            photoURL: firebaseUser.photoURL ?? '',
            ...(userSnap.exists() ? {} : { totalPoints: 0, hasSeenRules: false }),
            lastLogin: new Date(),
          },
          { merge: true }
        );

        setUser(firebaseUser);
        setIsAdmin(ADMIN_EMAILS.includes(firebaseUser.email));
        setHasSeenRules(userData.hasSeenRules === true);
      } else {
        setUser(null);
        setIsAdmin(false);
        setHasSeenRules(true); // default to true when logged out so it doesn't pop up randomly
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /** Sign in with Google popup */
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  /** Sign out the current user */
  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  };

  /** Mark rules as seen */
  const markRulesSeen = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { hasSeenRules: true }, { merge: true });
      setHasSeenRules(true);
    } catch (error) {
      console.error('Error marking rules as seen:', error);
    }
  };

  const value = {
    user,
    loading,
    isAdmin,
    hasSeenRules,
    signInWithGoogle,
    signOutUser,
    markRulesSeen,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
