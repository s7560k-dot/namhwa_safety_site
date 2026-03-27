/**
 * @file firebase.js
 * @description Firebase 앱 초기화 모듈
 *
 * 기존 /firebase-modular.js CDN 방식을 npm 패키지 + Vite 환경변수 방식으로 전환합니다.
 * 설정값은 코드에 직접 쓰지 않고 .env 파일의 VITE_ 접두사 변수를 참조합니다.
 */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// ────────────────────────────────────────────────────
// 1. Firebase 설정 (환경변수에서 주입)
//    누락된 환경변수가 있으면 앱 시작 전에 경고합니다.
// ────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 필수 환경변수 유효성 검사 (개발 단계에서 빠르게 오류 감지)
const REQUIRED_KEYS = ["apiKey", "authDomain", "projectId", "storageBucket", "appId"];
REQUIRED_KEYS.forEach((key) => {
  if (!firebaseConfig[key]) {
    console.error(`❌ Firebase 환경변수 누락: VITE_FIREBASE_${key.toUpperCase()}. .env 파일을 확인하세요.`);
  }
});

// ────────────────────────────────────────────────────
// 2. 앱 인스턴스 초기화 및 서비스 export
// ────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);

/** @type {import("firebase/firestore").Firestore} */
export const db = getFirestore(app);

/** @type {import("firebase/storage").FirebaseStorage} */
export const storage = getStorage(app);

/** @type {import("firebase/auth").Auth} */
export const auth = getAuth(app);
