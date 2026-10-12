@echo off
cd /d "%~dp0"
echo ===== FSU Citation Network: setup and run =====
echo.

set /p FSUID=Enter your FSU ID (example abc23): 
set /p FULLNAME=Enter your full name (example Jane Doe): 
(
echo export const FSUID = "%FSUID%";
echo export const FULL_NAME = "%FULLNAME%";
) > frontend\src\config.js

rem --- find the CSV from Task 5 and copy it into backend\data ---
if not exist "backend\data\paper_citation_links_within_fsu.csv" (
  for %%D in ("%USERPROFILE%\Documents" "%USERPROFILE%\OneDrive" "%USERPROFILE%\Desktop" "%USERPROFILE%\Downloads") do (
    if exist "%%~D" (
      for /f "delims=" %%F in ('dir /s /b "%%~D\paper_citation_links_within_fsu.csv" 2^>nul') do (
        if not exist "backend\data\paper_citation_links_within_fsu.csv" (
          copy "%%F" "backend\data\" >nul
          echo Copied CSV from %%F
        )
      )
    )
  )
)
if not exist "backend\data\paper_citation_links_within_fsu.csv" (
  echo.
  echo Could not find paper_citation_links_within_fsu.csv.
  echo Copy it into the backend\data folder yourself, then run this file again.
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo Node.js is not installed. Install the LTS version from https://nodejs.org then run this again.
  pause
  exit /b 1
)

if not exist "%USERPROFILE%\miniconda3\Scripts\activate.bat" (
  echo.
  echo Could not find Miniconda at %USERPROFILE%\miniconda3
  pause
  exit /b 1
)

echo.
echo Installing backend packages into dvjupyter...
call "%USERPROFILE%\miniconda3\Scripts\activate.bat" dvjupyter
pip install -r backend\requirements.txt
echo.
echo Installing frontend packages...
cd frontend
call npm install
cd ..

echo.
echo Starting backend and frontend in two new windows...
start "Backend (Flask)" cmd /k "call "%USERPROFILE%\miniconda3\Scripts\activate.bat" dvjupyter && cd /d "%~dp0backend" && python app.py"
start "Frontend (Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 8 >nul
start http://localhost:3000
echo.
echo Done. Keep the two new windows open while you use the app.
pause
