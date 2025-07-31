import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup } from '../../firebase';
import { User } from 'firebase/auth';
import './GoogleAuth.css';

interface GoogleAuthProps {
  onAuthSuccess: (user: User) => void;
  onAuthError: (error: string) => void;
}

const GoogleAuth: React.FC<GoogleAuthProps> = ({ onAuthSuccess, onAuthError }) => {
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    
    try {
      console.log('Attempting Google sign-in...');
      
      // Sign in with Google popup
      const result = await signInWithPopup(auth, googleProvider);
      
      console.log('✅ Google authentication successful!');
      console.log('User signed in:', result.user);
      console.log('User email:', result.user.email);
      console.log('User name:', result.user.displayName);
      console.log('User photo:', result.user.photoURL);
      
      console.log('✅ User signed in successfully:', result.user.email);
      
      // User signed in successfully
      onAuthSuccess(result.user);
      
    } catch (error: any) {
      console.error('❌ Error during Google sign-in:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = 'נכשל בהתחברות עם Google. ';
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage += 'החלון נסגר. אנא נסו שוב.';
          break;
        case 'auth/popup-blocked':
          errorMessage += 'החלון נחסם על ידי הדפדפן. אנא אשרו חלונות קופצים ונסו שוב.';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage += 'חלון התחברות אחר כבר פתוח.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage += 'התחברות עם Google אינה מופעלת. אנא פנו לתמיכה.';
          break;
        case 'auth/invalid-api-key':
          errorMessage += 'מפתח API לא תקין. אנא פנו לתמיכה.';
          break;
        case 'auth/network-request-failed':
          errorMessage += 'שגיאת רשת. אנא בדקו את החיבור ונסו שוב.';
          break;
        case 'auth/too-many-requests':
          errorMessage += 'יותר מדי ניסיונות כושלים. אנא נסו שוב מאוחר יותר.';
          break;
        case 'auth/user-disabled':
          errorMessage += 'החשבון שלכם הושבת. אנא פנו לתמיכה.';
          break;
        case 'auth/unauthorized-domain':
          errorMessage += 'הדומיין הזה אינו מורשה לאימות. אנא פנו למנהל המערכת להוספת הדומיין לרשימת הדומיינים המורשים ב-Firebase.';
          break;
        default:
          errorMessage += error.message || 'אנא נסו שוב או פנו לתמיכה.';
      }
      
      console.log('User-facing error message:', errorMessage);
      onAuthError(errorMessage);
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="google-auth-container">
      <div className="google-auth-card">
        <div className="google-auth-header">
          <h2 className="google-auth-title">ברוכים הבאים</h2>
          <p className="google-auth-subtitle">
            התחברו עם חשבון Google שלכם
          </p>
        </div>

        <div className="google-auth-content">
          <button
            onClick={signInWithGoogle}
            disabled={isLoading}
            className="google-auth-button"
          >
            <div className="google-auth-button-content">
              {!isLoading ? (
                <>
                  <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>המשך עם Google</span>
                </>
              ) : (
                <>
                  <div className="loading-spinner"></div>
                  <span>מתחבר...</span>
                </>
              )}
            </div>
          </button>

          <div className="google-auth-info">
            <p>
              על ידי התחברות, אתם מסכימים לתנאי השירות ולמדיניות הפרטיות שלנו.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuth;
