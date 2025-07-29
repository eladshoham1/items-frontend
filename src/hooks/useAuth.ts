import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { isUserAuthorized } from '../config/allowedUsers';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if the user is still authorized
        if (!isUserAuthorized(user.email)) {
          console.warn('❌ Unauthorized user detected, signing out:', user.email);
          try {
            await signOut(auth);
          } catch (error) {
            console.error('Error signing out unauthorized user:', error);
          }
          setUser(null);
          setError('Your access has been revoked. Please contact your administrator.');
        } else {
          console.log('✅ User authenticated and authorized:', {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            uid: user.uid
          });
          setUser(user);
          setError(null);
        }
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
