@echo off
REM Love Date App - Setup and Run Script
REM Automatically clean, install, and start the app

echo ╔════════════════════════════════════════╗
echo ║   Love Date App - Setup Script        ║
echo ╔════════════════════════════════════════╗
echo.

REM Check if Node.js is installed
echo 🔍 Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed!
    echo    Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js is installed
node --version
echo.

REM Check if npm is installed
echo 🔍 Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed!
    pause
    exit /b 1
)
echo ✅ npm is installed
npm --version
echo.

REM Clean old dependencies
echo 🧹 Cleaning old dependencies...
if exist node_modules (
    echo    Removing node_modules folder...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo    Removing package-lock.json...
    del /q package-lock.json
)
if exist .expo (
    echo    Removing .expo cache...
    rmdir /s /q .expo
)
echo ✅ Cleanup completed
echo.

REM Install dependencies
echo 📦 Installing dependencies...
echo    This may take a few minutes...
echo.
call npm install
if errorlevel 1 (
    echo.
    echo ❌ Installation failed!
    echo    Trying with --legacy-peer-deps...
    echo.
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo ❌ Installation still failed!
        echo    Please check the error messages above
        pause
        exit /b 1
    )
)
echo.
echo ✅ Dependencies installed successfully
echo.

REM Check .env file
echo 🔧 Checking configuration...
if not exist .env (
    echo ⚠️  .env file not found!
    echo    Creating from .env.example...
    if exist .env.example (
        copy .env.example .env
        echo ✅ .env file created
        echo.
        echo ⚠️  IMPORTANT: Please update .env with your computer's IP address!
        echo    Open .env and change:
        echo    REACT_APP_API_DEV_URL=http://YOUR_COMPUTER_IP:3000/api
        echo.
        echo    To find your IP:
        echo    Windows: ipconfig
        echo    Look for "IPv4 Address"
        echo.
        pause
    ) else (
        echo ❌ .env.example not found!
        echo    Please create .env manually
        pause
        exit /b 1
    )
) else (
    echo ✅ .env file exists
)
echo.

REM Show current configuration
echo 📋 Current Configuration:
type .env | findstr "REACT_APP_API_DEV_URL"
echo.

REM Ask user if they want to continue
echo.
set /p CONTINUE="🚀 Ready to start Expo? (Y/n): "
if /i "%CONTINUE%"=="n" (
    echo.
    echo ✅ Setup completed!
    echo    Run 'npm start' when you're ready
    pause
    exit /b 0
)

REM Start Expo
echo.
echo 🚀 Starting Expo...
echo.
echo ╔════════════════════════════════════════╗
echo ║   Instructions:                        ║
echo ╠════════════════════════════════════════╣
echo ║ 1. Wait for QR code to appear         ║
echo ║ 2. Open Expo Go on your phone         ║
echo ║ 3. Scan the QR code                    ║
echo ║ 4. Wait for app to load                ║
echo ║                                        ║
echo ║ Press Ctrl+C to stop the server       ║
echo ╚════════════════════════════════════════╝
echo.
echo.

call npm start

REM If npm start fails
if errorlevel 1 (
    echo.
    echo ❌ Failed to start Expo
    echo    Try running 'npm start' manually
    pause
    exit /b 1
)
