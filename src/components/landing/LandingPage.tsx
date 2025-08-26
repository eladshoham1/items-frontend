import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { LandingNavigation, HeroSection, FeaturesSection, ContactSection, Footer } from './LandingComponents';
import { apiService } from '../../services';
import { NotificationModal } from '../../shared/components';
import type { NotificationType } from '../../shared/components/NotificationModal';
import './LandingPage.css';

interface LandingPageProps {
  onAuthSuccess?: (user: User) => void;
  onAuthError?: (error: string) => void;
  onSignInClick: () => void;
  isAuthLoading?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onAuthSuccess, 
  onAuthError, 
  onSignInClick,
  isAuthLoading 
}) => {
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: NotificationType;
    message: string;
    title?: string;
  }>({
    isOpen: false,
    type: 'info',
    message: ''
  });

  const showNotification = (type: NotificationType, message: string, title?: string) => {
    setNotification({
      isOpen: true,
      type,
      message,
      title
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  const handleContactSubmit = async (contactForm: {
    name: string;
    email: string;
    subject: string;
    message: string;
    type: string;
  }) => {
    setIsSubmittingForm(true);
    
    try {
      // Using the API service with correct server port 3001 and path api/email/support
      const result = await apiService.post<{ success: boolean; message: string }>('email/support', contactForm);
      
      if (result.success) {
        // Success notification with Hebrew message
        showNotification('success', `${result.message || 'הודעתך נשלחה בהצלחה. נחזור אליך בהקדם.'}\n\nתודה שפנית אלינו!`, 'הצלחה!');
      } else {
        // Handle case where success is false
        showNotification('error', result.message || 'משהו השתבש בשליחת ההודעה. אנא נסו שנית.');
      }
    } catch (error: any) {
      console.error('Error sending contact form:', error);
      
      // Enhanced error handling with better user messages
      let errorMessage = '';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status) {
        switch (error.response.status) {
          case 400:
            errorMessage = 'נתונים לא תקינים. אנא בדקו את הפרטים ונסו שנית.';
            break;
          case 500:
            errorMessage = 'שגיאה פנימית בשרת. אנא נסו שנית מאוחר יותר.';
            break;
          case 503:
            errorMessage = 'השירות אינו זמין כרגע. אנא נסו שנית מאוחר יותר.';
            break;
          default:
            errorMessage = 'שגיאה לא צפויה. אנא נסו שנית או צרו קשר באמצעים אחרים.';
        }
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'בעיית חיבור לאינטרנט. אנא בדקו את החיבור ונסו שנית.';
      } else {
        errorMessage = 'שגיאה לא צפויה. אנא נסו שנית מאוחר יותר.';
      }
      
      showNotification('error', errorMessage, 'שגיאה בחיבור');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  return (
    <div className="landing-container">
      <LandingNavigation onGetStartedClick={onSignInClick} isLoading={isAuthLoading} />
      <HeroSection onGetStartedClick={onSignInClick} isLoading={isAuthLoading} />
      <FeaturesSection />
      <ContactSection onSubmit={handleContactSubmit} isSubmitting={isSubmittingForm} />
      <Footer />
      
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        message={notification.message}
        title={notification.title}
      />
    </div>
  );
};
