#!/bin/bash

# Cursor AI Clone Startup Script
echo "🚀 Starting Cursor AI Clone..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Build the application if dist doesn't exist
if [ ! -d "dist" ]; then
    echo "🏗️ Building application..."
    npm run build
fi

# Create necessary directories
mkdir -p logs uploads workspace

# Set default environment variables if not set
export PORT=${PORT:-5000}
export NODE_ENV=${NODE_ENV:-production}
export PROJECT_PATH=${PROJECT_PATH:-$(pwd)/workspace}

echo "✅ Setup complete!"
echo "📁 Project path: $PROJECT_PATH"
echo "🌐 Server will run on port: $PORT"
echo ""
echo "🚀 Starting servers..."

# Start the application
npm run dev