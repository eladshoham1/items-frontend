import React, { useState } from 'react';
import { auth } from '../../firebase';
import { signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { LandingPage } from '../../components/landing/LandingPage';

interface GoogleAuthProps {
  onAuthSuccess?: (user: User) => void;
  onAuthError?: (error: string) => void;
}

const GoogleAuth: React.FC<GoogleAuthProps> = ({ onAuthSuccess, onAuthError }) => {
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('משתמש נכנס בהצלחה:', result.user);
      onAuthSuccess?.(result.user);
    } catch (error) {
      console.error('שגיאה בכניסה:', error);
      onAuthError?.(error instanceof Error ? error.message : 'שגיאה לא ידועה');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LandingPage 
      onSignInClick={signInWithGoogle}
      isAuthLoading={isLoading}
      onAuthSuccess={onAuthSuccess}
      onAuthError={onAuthError}
    />
  );
};

export default GoogleAuth;
