import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('✅ User authenticated:', {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          uid: user.uid
        });
        setUser(user);
        setError(null);
      } else {
        setUser(null);
        setError(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      console.log('User signed out');
    } catch (error: any) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    user,
    isLoading,
    error,
    logout,
    clearError,
    isAuthenticated: !!user
  };
};
