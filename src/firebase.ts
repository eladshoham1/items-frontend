// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBDqpw6UuQKXfB-dp7z2sFQ-uiLkGRkyzs",
  authDomain: "items-ad9c4.firebaseapp.com",
  projectId: "items-ad9c4",
  storageBucket: "items-ad9c4.firebasestorage.app",
  messagingSenderId: "274430427975",
  appId: "1:274430427975:web:52a745c2528ac605270262",
  measurementId: "G-QM4YKJNXRB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Set language for authentication
auth.languageCode = 'en';

export { auth, googleProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut };