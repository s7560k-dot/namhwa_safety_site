# 부대토목 수량 산출 시스템 통합 실행 스크립트

Write-Host "--- 부대토목 수량 산출 서버 시작 중 ---" -ForegroundColor Cyan

# 1. 백엔드 서버 (FastAPI) 실행
Write-Host "[1/2] 백엔드 API 서버를 시작합니다..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\Antigravity\my project\civil_api'; python main.py" -WindowStyle Normal

# 2. 프론트엔드 서버 (Vite) 실행
Write-Host "[2/2] 프론트엔드 대시보드를 시작합니다..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\Antigravity\my project\frontend'; npm run dev" -WindowStyle Normal

Write-Host "모든 서버가 실행되었습니다. 브라우저에서 http://localhost:5173/civil-calc 에 접속하세요." -ForegroundColor Green
