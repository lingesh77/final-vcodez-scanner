// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import{ getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBs0k-8TcfEWacYnOMKd4r80SBamcJuymg",
  authDomain: "vcodez-trainer-database.firebaseapp.com",
  projectId: "vcodez-trainer-database",
  storageBucket: "vcodez-trainer-database.firebasestorage.app",
  messagingSenderId: "240637673081",
  appId: "1:240637673081:web:4a54d8bf51170f23f29ea8",
  measurementId: "G-559H5XQDX4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
const analytics = getAnalytics(app);