@echo off
cd /d "%~dp0"
where git >nul 2>&1
if errorlevel 1 (
  echo Git is not installed. Install it from https://git-scm.com then run this again.
  pause
  exit /b 1
)

echo Before this: create an EMPTY public repo on github.com (no README, no .gitignore).
set /p REPO=Paste the repo URL (https://github.com/USER/REPO.git): 

git init
git branch -M main
git add backend\requirements.txt backend\data .gitignore
git commit -m "Scaffold backend folder and dependencies"
git add backend\app.py
git commit -m "Add Flask API serving /api/network with CORS"
git add frontend\package.json frontend\package-lock.json frontend\vite.config.js frontend\index.html
git commit -m "Scaffold Vite frontend with d3"
git add frontend\src\graph.js frontend\src\main.js frontend\src\style.css
git commit -m "Add D3 force graph with zoom, pan, drag and zoom-to-fit"
git add frontend\src\config.js
git commit -m "Add title configuration (FSU ID and name)"
git add README.md setup.bat git-commits.bat
git commit -m "Add README and helper scripts"
git remote add origin %REPO%
git push -u origin main
echo.
echo Pushed. Refresh your GitHub page to check.
pause
