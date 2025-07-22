# Deployment Build Fix

## Problem
The server expects build files in `server/public` but the default Vite build outputs to `dist`.

## Solution
Use the correct build command to output client files to the expected location:

### For Development Build Testing
```bash
npx vite build --outDir=server/public --emptyOutDir
```

### For Production Deployment
```bash
# Build client to correct location
npx vite build --outDir=server/public --emptyOutDir

# Build server
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

## Deployment Script
Use the provided `deploy-build.sh` script:

```bash
chmod +x deploy-build.sh
./deploy-build.sh
```

## Alternative Quick Fix
If you need a quick fix for deployment, you can also copy the files manually after build:

```bash
# Standard build
npm run build

# Copy dist files to server/public
mkdir -p server/public
cp -r dist/* server/public/
```

## Verification
After building, check that files exist:
- `server/public/index.html` should exist
- `server/public/assets/` should contain CSS and JS files
- `dist/index.js` should exist (server bundle)

## Root Cause
The issue occurs because:
1. The server `serveStatic` function expects files in `server/public`
2. The default Vite build outputs to `dist`
3. The build system needs to coordinate these locations

## Status
✅ Deployment script created
✅ Build commands identified
✅ Manual fix provided
⚠️ Config files are protected, so build commands must be run manually