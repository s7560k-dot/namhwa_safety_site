import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDbVG3iL3FBJe6alPLZnhFW_QAGpzeqFoY",
    authDomain: "namhwa-safety-dashboard.firebaseapp.com",
    projectId: "namhwa-safety-dashboard",
    storageBucket: "namhwa-safety-dashboard.firebasestorage.app",
    messagingSenderId: "152864778612",
    appId: "1:152864778612:web:ecc482adce93a1534a2421"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
export const storage = firebase.storage();
export const auth = firebase.auth();
export default firebase;
