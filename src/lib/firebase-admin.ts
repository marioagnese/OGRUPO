import "server-only";import {cert,getApps,initializeApp,applicationDefault} from "firebase-admin/app";import {getFirestore} from "firebase-admin/firestore";import {getAuth} from "firebase-admin/auth";
function app(){if(getApps().length)return getApps()[0];const json=process.env.FIREBASE_SERVICE_ACCOUNT_JSON;if(json){const key=JSON.parse(json);return initializeApp({credential:cert(key),projectId:"ogrupo-a29d4"});}return initializeApp({credential:applicationDefault(),projectId:"ogrupo-a29d4"});}
export function db(){return getFirestore(app())}export function adminAuth(){return getAuth(app())}
export function ready(){return process.env.OGRUPO_APPLICATIONS_ENABLED==="true"&&Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON||process.env.GOOGLE_APPLICATION_CREDENTIALS)}
