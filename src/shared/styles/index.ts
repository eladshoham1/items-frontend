// Import order matters for CSS cascade
import './globals.css';
import './components.css';
import './mobile-utils.css';
import './mobile-touch.css'; // Mobile touch optimizations - load last for highest specificity
import './theme-overrides.css'; // Theme overrides - load last for highest specificity
