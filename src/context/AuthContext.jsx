import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

import { callApi } from '../firebase/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up action
  const signup = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Trigger user profile & wallet creation on Express backend
    try {
      await callApi('onUserCreated');
    } catch (error) {
      console.error('Error triggering user creation profile:', error);
    }
    
    return userCredential;
  };

  // Sign in action
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Sign out action
  const logout = () => {
    setProfile(null);
    return signOut(auth);
  };

  // Reset password email action
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  useEffect(() => {
    let unsubscribeProfile = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      if (user) {
        // Subscribe to user profile document in Firestore for real-time updates (e.g. role changes)
        const profileRef = doc(db, 'users', user.uid);
        unsubscribeProfile = onSnapshot(
          profileRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setProfile(docSnap.data());
            } else {
              // Fallback while Cloud Function is running/creating the document
              setProfile({
                uid: user.uid,
                email: user.email || '',
                displayName: user.email ? user.email.split('@')[0] : 'Player',
                role: 'user'
              });
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error fetching user profile snapshot:', error);
            setLoading(false);
          }
        );
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  const value = {
    currentUser,
    profile,
    loading,
    signup,
    login,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
