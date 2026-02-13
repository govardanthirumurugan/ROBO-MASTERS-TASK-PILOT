#!/bin/bash

# TaskPilot Local Server Launcher
# This script sets up and starts the TaskPilot application

echo "╔════════════════════════════════════════╗"
echo "║        TaskPilot Local Server          ║"
echo "║           Initialization               ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Navigate to the Node backend directory
cd "$(dirname "$0")/TaskPilot-Node" || exit 1

echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🚀 Starting TaskPilot Server..."
echo ""

npm start
