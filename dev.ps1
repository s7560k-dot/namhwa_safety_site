# 남화 안전보건 플랫폼 통합 로컬 개발 환경 실행 스크립트
# 사용법: powershell -ExecutionPolicy Bypass -File .\dev.ps1

Clear-Host
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   남화 안전보건 플랫폼 로컬 개발 서버 시작    " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# 1. 프론트엔드 (메인/채용 대시보드) 실행
Write-Host "[1/2] 메인 대시보드 서버를 시작합니다 (Port: 5173)..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Normal

# 2. 현장용 대시보드 (수원/대광/평택) 실행
Write-Host "[2/2] 현장 대시보드 서버를 시작합니다 (Port: 5174)..." -ForegroundColor Yellow
$suwonPath = Join-Path $PSScriptRoot "suwon-react"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$suwonPath'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "-----------------------------------------------" -ForegroundColor Green
Write-Host "✅ 모든 서버가 새로운 창에서 실행되었습니다." -ForegroundColor Green
Write-Host "-----------------------------------------------" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 관리자/채용 모듈: http://localhost:5173/admin/hiring" -ForegroundColor White
Write-Host "🔗 현장 대시보드:    http://localhost:5174" -ForegroundColor White
Write-Host ""
Write-Host "서버를 종료하려면 실행된 터미널 창들을 닫아주세요." -ForegroundColor Gray
