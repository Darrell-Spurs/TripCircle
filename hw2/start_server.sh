#!/bin/bash
echo "Starting Brick Breaker Game Server..."
echo ""
echo "The game will be available at: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    python -m http.server 8000
else
    echo "Error: Python is not installed. Please install Python to run the server."
    exit 1
fi
