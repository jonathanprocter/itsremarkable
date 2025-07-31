#!/usr/bin/env node

/**
 * Build Fix Script
 * This script builds the client and moves files to the correct location for deployment
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverPublicDir = path.join(__dirname, 'server', 'public');
const distDir = path.join(__dirname, 'dist');

console.log('🔧 Building client and server...');

// Step 1: Build client to server/public
exec('npx vite build --outDir=server/public --emptyOutDir', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Client build failed:', error);
    process.exit(1);
  }
  
  console.log('✅ Client built successfully to server/public');
  console.log(stdout);
  
  // Step 2: Build server
  exec('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', (buildError, buildStdout, buildStderr) => {
    if (buildError) {
      console.error('❌ Server build failed:', buildError);
      process.exit(1);
    }
    
    console.log('✅ Server built successfully to dist/');
    console.log(buildStdout);
    
    // Step 3: Verify files exist
    if (fs.existsSync(serverPublicDir)) {
      console.log('✅ Client files available in server/public');
      const files = fs.readdirSync(serverPublicDir);
      console.log('📁 Client files:', files);
    } else {
      console.error('❌ server/public directory not found');
      process.exit(1);
    }
    
    if (fs.existsSync(path.join(distDir, 'index.js'))) {
      console.log('✅ Server files available in dist/');
    } else {
      console.error('❌ dist/index.js not found');
      process.exit(1);
    }
    
    console.log('🚀 Build complete! Ready for deployment.');
  });
});