@echo off
echo Starting AI Interview App...

echo Starting Backend...
start cmd /k "cd backend && .\venv\Scripts\python.exe app.py"

echo Starting Frontend...
start cmd /k "cd frontend && npm run dev"

echo Both frontend and backend are starting in new windows!
pause
