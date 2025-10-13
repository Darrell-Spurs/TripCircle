#!/usr/bin/env node

import chokidar from 'chokidar';
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const srcDataDir = join(rootDir, 'src', 'public', 'data');
const publicDataDir = join(rootDir, 'public', 'data');

// Ensure target directory exists
function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
}

// Copy all CSV files from src to public
function copyAllCsvFiles() {
  ensureDir(publicDataDir);

  if (!existsSync(srcDataDir)) {
    console.warn('⚠️  Source data directory does not exist:', srcDataDir);
    return;
  }

  const files = readdirSync(srcDataDir);
  const csvFiles = files.filter((f) => f.endsWith('.csv'));

  if (csvFiles.length === 0) {
    console.log('ℹ️  No CSV files found in source directory.');
    return;
  }

  csvFiles.forEach((file) => {
    const srcPath = join(srcDataDir, file);
    const destPath = join(publicDataDir, file);
    try {
      copyFileSync(srcPath, destPath);
      console.log(`✅ Copied: ${file}`);
    } catch (err) {
      console.error(`❌ Failed to copy ${file}:`, err.message);
    }
  });
}

// Watch mode
const isWatchMode = process.argv.includes('--watch');

if (isWatchMode) {
  console.log('👀 Watching for CSV changes...');
  const watcher = chokidar.watch(srcDataDir, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
  });

  watcher.on('change', (path) => {
    if (path.endsWith('.csv')) {
      console.log(`🔄 File changed: ${path}`);
      copyAllCsvFiles();
    }
  });

  watcher.on('add', (path) => {
    if (path.endsWith('.csv')) {
      console.log(`➕ File added: ${path}`);
      copyAllCsvFiles();
    }
  });
} else {
  // One-time copy
  console.log('📋 Copying CSV files...');
  copyAllCsvFiles();
  console.log('✨ Done!');
}

