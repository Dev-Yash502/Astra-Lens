@echo off
echo ===================================================
echo               VisionGuard AI v2.0
echo             Starting Project Servers
echo ===================================================
echo.

:: Start FastAPI backend in a new command prompt window
echo Starting FastAPI Backend...
start cmd /k "echo Starting FastAPI Backend... && cd /d D:\coding\Hackathons, Projects and other\ai ml project\Cifake v2\backend && python -m uvicorn app.main:app --reload"

:: Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak >nul

:: Start React frontend in another command prompt window
echo Starting React Frontend...
start cmd /k "echo Starting React Frontend... && cd /d D:\coding\Hackathons, Projects and other\ai ml project\Cifake v2\frontend && npm run dev"

echo.
echo ===================================================
echo Setup complete! Click the link below once open:
echo http://localhost:5174/ (or http://localhost:5173/)
echo ===================================================
pause
