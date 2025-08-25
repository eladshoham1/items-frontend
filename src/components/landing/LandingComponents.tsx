import React, { useState, useEffect } from 'react';
import './LandingPage.css';

interface LandingNavigationProps {
  onGetStartedClick: () => void;
  isLoading?: boolean;
}

export const LandingNavigation: React.FC<LandingNavigationProps> = ({ onGetStartedClick, isLoading }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`top-navigation ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <div className="nav-brand">
          <div className="brand-logo">
            <span className="logo-icon">📋</span>
            <div className="brand-text">
              <h1 className="brand-name">אחל״ן</h1>
              <p className="brand-subtitle">אמצעי חתימות ללא ניירת</p>
            </div>
          </div>
        </div>

        <div className="nav-links">
          <button className="nav-link" onClick={() => scrollToSection('features')}>
            יכולות
          </button>
          <button className="nav-link" onClick={() => scrollToSection('contact')}>
            צור קשר
          </button>
        </div>
      </div>
    </nav>
  );
};

interface HeroSectionProps {
  onGetStartedClick: () => void;
  isLoading?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStartedClick, isLoading }) => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">ניהול מלאי דיגיטלי</h1>

        <p className="hero-description">
          פתרון פשוט וחכם לניהול מלאי עם חתימות דיגיטליות
        </p>

        <button
          className="cta-button"
          onClick={onGetStartedClick}
          disabled={isLoading}
        >
          {isLoading ? 'מתחבר...' : 'התחילו עכשיו'}
        </button>
      </div>
    </section>
  );
};

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="features-section">
      <div className="container">
        <h2 className="section-title">יכולות המערכת</h2>

        <div className="features-grid">
          <div className="feature-card">
            <h3>ניהול פריטים</h3>
            <p>מעקב פשוט אחר הפריטים במלאי</p>
          </div>

          <div className="feature-card">
            <h3>דוחות</h3>
            <p>דוחות ברורים ומפורטים</p>
          </div>

          <div className="feature-card">
            <h3>חתימות דיגיטליות</h3>
            <p>חתימות מאובטחות למסמכים</p>
          </div>
        </div>
      </div>
    </section>
  );
};

interface ContactSectionProps {
  onSubmit: (formData: {
    name: string;
    email: string;
    subject: string;
    message: string;
    type: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onSubmit, isSubmitting }) => {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'contact'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(contactForm);
    setContactForm({ name: '', email: '', subject: '', message: '', type: 'contact' });
  };

  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <h2 className="section-title">צור קשר</h2>

        <div className="contact-form-card">
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="type">סוג הפנייה</label>
              <select
                id="type"
                value={contactForm.type}
                onChange={(e) => setContactForm({...contactForm, type: e.target.value})}
                required
              >
                <option value="contact">צור קשר כללי</option>
                <option value="support">תמיכה טכנית</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">שם מלא</label>
                <input
                  type="text"
                  id="name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">כתובת אימייל</label>
                <input
                  type="email"
                  id="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="subject">נושא</label>
              <input
                type="text"
                id="subject"
                value={contactForm.subject}
                onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">הודעה</label>
              <textarea
                id="message"
                rows={5}
                value={contactForm.message}
                onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'שולח...' : 'שלח הודעה'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>&copy; 2025 אחל״ן. כל הזכויות שמורות.</p>
            <p className="footer-developer">פותח ע"י סק"ש</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
