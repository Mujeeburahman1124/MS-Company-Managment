#!/bin/bash
set -e

echo ">>> Installing dependencies in ms-management..."
cd ms-management
npm install

echo ">>> Running Next.js build..."
npm run build

echo ">>> Build complete!"
