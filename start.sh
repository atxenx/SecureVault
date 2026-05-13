#!/bin/bash

# Setup and run backend
echo "Starting Backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Run Flask in background
python3 app.py > backend.log 2>&1 &
BACKEND_PID=$!

# Setup and run frontend
echo "Starting Frontend..."
cd ../frontend
npm install
# Run Vite
npm run dev &
FRONTEND_PID=$!

echo "SecureVault is running!"
echo "Backend API: http://localhost:5001"
echo "Frontend UI: http://localhost:5173"
echo "Press Ctrl+C to stop both servers."

# Wait for user interrupt
trap "echo 'Stopping servers...'; kill $BACKEND_PID; kill $FRONTEND_PID; exit" INT
wait
