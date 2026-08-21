@echo off
setlocal

cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is required to run Pulse Studio.
  echo Install it from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)

if not exist "node_modules\express" (
  echo Installing project dependencies...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

for /f "delims=" %%P in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$p=3000; while($true){$c=New-Object Net.Sockets.TcpClient; try{$a=$c.BeginConnect('127.0.0.1',$p,$null,$null); if($a.AsyncWaitHandle.WaitOne(100)){$c.EndConnect($a);$p++;continue}}catch{}finally{$c.Close()};break};$p"') do set "PORT=%%P"

echo Starting Pulse Studio locally on http://127.0.0.1:%PORT%/
start "Pulse Studio Server" /min cmd /c "set HOST=127.0.0.1&& set PORT=%PORT%&& node server.js"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:%PORT%/"

echo Pulse Studio is running at http://127.0.0.1:%PORT%/
echo Close the Pulse Studio Server window to stop the app.
endlocal