import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDbVG3iL3FBJe6alPLZnhFW_QAGpzeqFoY",
    authDomain: "namhwa-safety-dashboard.firebaseapp.com",
    projectId: "namhwa-safety-dashboard",
    storageBucket: "namhwa-safety-dashboard.firebasestorage.app",
    messagingSenderId: "152864778612",
    appId: "1:152864778612:web:ecc482adce93a1534a2421"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
