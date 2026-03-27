/**
 * @file main.jsx
 * @description 앱 진입점
 *
 * global.css를 여기서 import하여 모든 컴포넌트에 전역 적용합니다.
 * 기존 suwon.html의 <style> 태그 내용이 global.css로 이동되었습니다.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css"; // 기존 suwon.html의 <style> 전체 내용
import App from "./App";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("❌ #root 엘리먼트를 찾을 수 없습니다. index.html을 확인하세요.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
