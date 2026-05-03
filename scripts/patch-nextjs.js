#!/usr/bin/env node
/**
 * Patch Next.js for Node.js 24 compatibility
 * Fixes:
 * 1. generateBuildId: TypeError when config.generateBuildId is undefined
 * 2. handleTraceFiles: ENOENT when .nft.json files are missing (Node.js 24 + standalone output)
 */
const fs = require('fs');
const path = require('path');

function patchFile(filePath, oldText, newText) {
  const fullPath = path.join(process.cwd(), filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  if (!content.includes(oldText)) {
    console.log(`  ⚠ Already patched or text not found: ${filePath}`);
    return;
  }
  content = content.replace(oldText, newText);
  fs.writeFileSync(fullPath, content);
  console.log(`  ✓ Patched: ${filePath}`);
}

console.log('Patching Next.js for Node.js 24 compatibility...');

// Patch 1: generate-build-id.js
patchFile(
  'node_modules/next/dist/build/generate-build-id.js',
  `async function generateBuildId(generate, fallback) {
    let buildId = await generate();`,
  `async function generateBuildId(generate, fallback) {
    if (typeof generate !== 'function') {
        let buildId = null;
        while(!buildId || /ad/i.test(buildId)){
            buildId = fallback();
        }
        return buildId.trim();
    }
    let buildId = await generate();`
);

// Patch 2: utils.js - handleTraceFiles
patchFile(
  'node_modules/next/dist/build/utils.js',
  `    async function handleTraceFiles(traceFilePath) {
        const traceData = JSON.parse(await _fs.promises.readFile(traceFilePath, "utf8"));`,
  `    async function handleTraceFiles(traceFilePath) {
        try {
            await _fs.promises.access(traceFilePath);
        } catch (e) {
            return;
        }
        const traceData = JSON.parse(await _fs.promises.readFile(traceFilePath, "utf8"));`
);

console.log('Done!');
