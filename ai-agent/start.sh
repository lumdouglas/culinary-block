#!/bin/bash
echo "Starting Culinary Block AI Agent..."

# Start the FastAPI Backend
echo "Starting FastAPI Backend on port 8000..."
cd /Users/doug/culinary-block/ai-agent
source venv/bin/activate
uvicorn main:app --reload &
BACKEND_PID=$!

# Start the Vite Frontend
echo "Starting React Frontend on port 5173..."
cd /Users/doug/culinary-block/ai-agent/dashboard
npm run dev &
FRONTEND_PID=$!

echo "Agent is running! Press Ctrl+C to stop."

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
