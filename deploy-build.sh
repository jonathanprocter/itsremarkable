#!/bin/bash

# Deployment Build Script
# This script fixes the deployment issue by building client files to server/public

echo "🚀 Starting deployment build process..."

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p server/public
mkdir -p dist

# Build client to server/public (where server expects files)
echo "📦 Building client application..."
npx vite build --outDir=server/public --emptyOutDir

if [ $? -ne 0 ]; then
    echo "❌ Client build failed"
    exit 1
fi

# Build server to dist
echo "📦 Building server application..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

if [ $? -ne 0 ]; then
    echo "❌ Server build failed"
    exit 1
fi

# Verify build output
echo "🔍 Verifying build output..."

if [ -f "server/public/index.html" ]; then
    echo "✅ Client build found in server/public"
else
    echo "❌ Client build not found in server/public"
    exit 1
fi

if [ -f "dist/index.js" ]; then
    echo "✅ Server build found in dist"
else
    echo "❌ Server build not found in dist"
    exit 1
fi

echo "🎉 Deployment build completed successfully!"
echo "📋 Build Summary:"
echo "   Client files: server/public/"
echo "   Server files: dist/"
echo "💡 To start the production server, run: npm start"