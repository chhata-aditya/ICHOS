@echo off
setlocal
title ICHOS - Start All Services

set "ROOT=%~dp0"
set "CLIENT=%ROOT%client"
set "SERVER=%ROOT%server"
set "GESTURE=%ROOT%gesture-service"

echo ========================================
echo       ICHOS - Start All Services
echo ========================================
echo.

if not exist "%CLIENT%\package.json" (
    echo ERROR: Client project not found at "%CLIENT%".
    pause
    exit /b 1
)
if not exist "%SERVER%\package.json" (
    echo ERROR: API project not found at "%SERVER%".
    pause
    exit /b 1
)
if not exist "%GESTURE%\.venv\Scripts\activate.bat" (
    echo ERROR: Gesture service Python environment is missing.
    echo Set it up using the instructions in gesture-service\README.md.
    pause
    exit /b 1
)

if not exist "%CLIENT%\node_modules" (
    echo Installing client dependencies...
    pushd "%CLIENT%"
    call npm install
    if errorlevel 1 goto :clientInstallFailed
    popd
)
if not exist "%SERVER%\node_modules" (
    echo Installing API dependencies...
    pushd "%SERVER%"
    call npm install
    if errorlevel 1 goto :serverInstallFailed
    popd
)

echo Starting the ICHOS API, gesture service, and web app...
echo.
start "ICHOS API" cmd /k "cd /d "%SERVER%" && npm run dev"
start "ICHOS Gesture Service" cmd /k "cd /d "%GESTURE%" && call .venv\Scripts\activate.bat && python -m uvicorn app:app --host 127.0.0.1 --port 8000"
start "ICHOS Web App" cmd /k "cd /d "%CLIENT%" && npm run dev -- --host 0.0.0.0"

echo Three service windows have been opened.
echo Open the web address shown in the ICHOS Web App window (usually http://localhost:5173).
echo Keep all three windows open while using ICHOS.
exit /b 0

:clientInstallFailed
popd
echo.
echo ERROR: Client dependency installation failed.
pause
exit /b 1

:serverInstallFailed
popd
echo.
echo ERROR: API dependency installation failed.
pause
exit /b 1
