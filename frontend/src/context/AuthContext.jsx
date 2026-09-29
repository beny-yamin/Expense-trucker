/**
 * AuthContext.jsx
 * Provides Firebase Authentication state and actions to the entire app.
 * Supports:
 *   - Email / Password  (signIn + register)
 *   - Google Sign-In    (popup)
 *   - Sign-Out
 *   - Profile updates
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from '../firebase.js';

const AuthContext = createContext();

// Helper – map a Firebase User object to our app's user shape
function mapFirebaseUser(fbUser) {
  if (!fbUser) return null;
  return {
    id:     fbUser.uid,
    name:   fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
    email:  fbUser.email,
    avatar: fbUser.photoURL ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fbUser.email || fbUser.uid)}`,
    // Keep the raw Firebase user handy for token operations
    _fbUser: fbUser,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true while Firebase resolves auth state

  /* ─── Subscribe to Firebase auth state ─────────────────────────────────── */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setUser(mapFirebaseUser(fbUser));
      setLoading(false);
    });
    return unsubscribe; // cleanup on unmount
  }, []);

  /* ─── Email / Password Sign-In ──────────────────────────────────────────── */
  const login = async (email, password) => {
    if (!email || !password) throw new Error('Please enter both email and password.');
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return mapFirebaseUser(credential.user);
  };

  /* ─── Email / Password Registration ────────────────────────────────────── */
  const register = async (name, email, password) => {
    if (!name || !email || !password) throw new Error('Please fill in all registration fields.');
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    // Persist the display name immediately
    await updateProfile(credential.user, { displayName: name });
    // Force state refresh so the user object gets the updated displayName
    setUser(mapFirebaseUser({ ...credential.user, displayName: name }));
    return mapFirebaseUser(credential.user);
  };

  /* ─── Google Popup Sign-In ──────────────────────────────────────────────── */
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return mapFirebaseUser(result.user);
  };

  /* ─── Sign-Out ──────────────────────────────────────────────────────────── */
  const logout = () => signOut(auth);

  /* ─── Profile Update ────────────────────────────────────────────────────── */
  const updateUserProfile = async (data) => {
    if (!auth.currentUser) throw new Error('No authenticated user.');
    const patch = {};
    if (data.name)   patch.displayName = data.name;
    if (data.avatar) patch.photoURL    = data.avatar;
    await updateProfile(auth.currentUser, patch);
    setUser(prev => ({ ...prev, ...data }));
  };

  /* ─── Get Firebase ID Token (for secure API calls) ──────────────────────── */
  const getIdToken = async (forceRefresh = false) => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken(forceRefresh);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      loginWithGoogle,
      logout,
      updateProfile: updateUserProfile,
      getIdToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
