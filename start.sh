#!/bin/bash

PORT=4000

echo "🔍 Checking for processes on port $PORT..."

# Find process using the port
PID=$(lsof -ti:$PORT 2>/dev/null)

if [ -n "$PID" ]; then
  echo "⚠️  Port $PORT is in use by process $PID"
  echo "🔪 Killing process $PID..."
  kill -9 $PID
  sleep 1
  echo "✅ Port $PORT is now free"
else
  echo "✅ Port $PORT is already free"
fi

echo "🚀 Starting NestJS application..."
npm run start:dev
