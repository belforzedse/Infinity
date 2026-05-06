@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv" (
  echo Creating virtual environment...
  py -3 -m venv .venv 2>nul || python -m venv .venv
  if errorlevel 1 (
    echo Failed to create venv. Ensure Python 3.9+ is installed.
    exit /b 1
  )
)

echo Installing dependencies...
.venv\Scripts\pip install -q -r requirements.txt
if errorlevel 1 (
  echo Failed to install dependencies.
  exit /b 1
)

.venv\Scripts\python.exe orders-to-pdf.py %*
exit /b %errorlevel%
