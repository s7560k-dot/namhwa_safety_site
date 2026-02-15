import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDbVG3iL3FBJe6alPLZnhFW_QAGpzeqFoY",
  authDomain: "namhwa-safety-dashboard.firebaseapp.com",
  projectId: "namhwa-safety-dashboard",
  storageBucket: "namhwa-safety-dashboard.firebasestorage.app",
  messagingSenderId: "152864778612",
  appId: "1:152864778612:web:ecc482adce93a1534a2421"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
// [추가됨] 앱에 스토리지를 연결하고 내보내기
export const storage = getStorage(app);