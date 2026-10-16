"use client";import {getApps,initializeApp,getApp} from "firebase/app";import {getAuth,GoogleAuthProvider} from "firebase/auth";
const config={apiKey:process.env.NEXT_PUBLIC_FIREBASE_API_KEY||"",authDomain:process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN||"",projectId:process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID||"ogrupo-a29d4",appId:process.env.NEXT_PUBLIC_FIREBASE_APP_ID||"",messagingSenderId:process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID||""};
export function firebaseAuth(){const app=getApps().length?getApp():initializeApp(config);return getAuth(app)}
export const googleProvider=new GoogleAuthProvider();
