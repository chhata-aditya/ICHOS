@echo off
title ICHOS - Gesture Service
cd /d D:\React\ReactProjects\ichos\gesture-service

echo ========================================
echo        ICHOS Gesture Service
echo ========================================
echo.

if not exist ".venv\Scripts\activate.bat" (
    echo ERROR: Python virtual environment not found.
    echo Expected: %CD%\.venv\Scripts\activate.bat
    echo.
    pause
    exit /b 1
)

call ".venv\Scripts\activate.bat"

echo Virtual environment activated.
python --version
echo.

python -m uvicorn --version >nul 2>&1
if errorlevel 1 (
    echo Uvicorn is not installed. Installing requirements...
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install requirements.
        pause
        exit /b 1
    )
)

echo.
echo Starting ICHOS Gesture Service...
echo WebSocket: ws://127.0.0.1:8000/ws
echo Health:    http://127.0.0.1:8000/health
echo.
echo Keep this window open while using ICHOS.
echo Press CTRL+C to stop the service.
echo.

python -m uvicorn app:app --host 127.0.0.1 --port 8000

echo.
echo Gesture service stopped.
pause
