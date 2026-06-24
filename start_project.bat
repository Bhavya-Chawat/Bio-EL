@echo off
echo ==============================================
echo Terminating old BioShield processes...
echo ==============================================

echo Cleaning up Port 8000 (Backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    taskkill /F /PID %%a 2>nul
)

echo Cleaning up Port 3000 (Frontend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /F /PID %%a 2>nul
)

timeout /t 2 /nobreak >nul

echo ==============================================
echo Starting BioShield Dashboard Services...
echo ==============================================

echo [1/2] Starting Backend Server on Port 8000...
start "BioShield Backend" cmd /k "cd backend && .\.venv\Scripts\activate && uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo [2/2] Starting Next.js Frontend Server on Port 3000...
start "BioShield Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both services are starting in new terminal windows!
echo.
echo - Frontend UI: http://localhost:3000
echo - Backend API: http://localhost:8000/api/health
echo - API Docs:    http://localhost:8000/docs
echo.
echo To run a manual ingestion cycle, open a new terminal in the backend folder and run:
echo .\.venv\Scripts\activate ^&^& python test_ingestion.py
echo.
pause
