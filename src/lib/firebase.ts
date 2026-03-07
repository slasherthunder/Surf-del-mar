/**
 * Firebase client for reading schedule and image overrides.
 * Set PUBLIC_FIREBASE_* in .env and Netlify for this to work.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) return initializeApp(firebaseConfig);
  return getApp();
}

export async function getSchedule(): Promise<{ day: string; events: { title: string; venue: string; time: string; advocacy: boolean }[] }[] | null> {
  if (!import.meta.env.PUBLIC_FIREBASE_PROJECT_ID) return null;
  try {
    const db = getFirestore(getFirebaseApp());
    const snap = await getDoc(doc(db, 'content', 'schedule'));
    const data = snap.data();
    return data?.data ?? null;
  } catch {
    return null;
  }
}

export async function getImageOverrides(): Promise<Record<string, string> | null> {
  if (!import.meta.env.PUBLIC_FIREBASE_PROJECT_ID) return null;
  try {
    const db = getFirestore(getFirebaseApp());
    const snap = await getDoc(doc(db, 'content', 'imageOverrides'));
    const data = snap.data();
    return (data?.overrides as Record<string, string>) ?? null;
  } catch {
    return null;
  }
}
