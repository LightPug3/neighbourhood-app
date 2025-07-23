#!/bin/bash

# Start backend in background
cd backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!

# Start frontend in development mode
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop both services"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
