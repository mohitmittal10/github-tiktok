// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDNG5tH4H5k3laWfazCRSzdUZJ745Sk9gU",
  authDomain: "github-tiktok.firebaseapp.com",
  projectId: "github-tiktok",
  storageBucket: "github-tiktok.firebasestorage.app",
  messagingSenderId: "489313725121",
  appId: "1:489313725121:web:3f709fb52ce907a8260240",
  measurementId: "G-WWG2DW6TRT",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
};
