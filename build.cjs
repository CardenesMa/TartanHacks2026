// build.js — Minifies dist/ source files into dist/build/
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist');
const BUILD = path.join(DIST, 'build');

// Create build output dir
if (!fs.existsSync(BUILD)) fs.mkdirSync(BUILD, { recursive: true });

// 1. Minify JS files with esbuild
console.log('Minifying JS...');
execSync(`npx esbuild dist/mosaicGen.js --minify --outfile=dist/build/mosaicGen.js`, { stdio: 'inherit' });
execSync(`npx esbuild dist/app.js --minify --outfile=dist/build/app.js`, { stdio: 'inherit' });

// 2. Minify HTML+CSS (simple regex-based minification)
console.log('Minifying HTML...');
let html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
// Remove HTML comments
html = html.replace(/<!--[\s\S]*?-->/g, '');
// Collapse whitespace between tags
html = html.replace(/>\s+</g, '><');
// Collapse runs of whitespace
html = html.replace(/\s{2,}/g, ' ');
// Trim lines
html = html.split('\n').map(l => l.trim()).filter(Boolean).join('');
fs.writeFileSync(path.join(BUILD, 'index.html'), html);

// 3. Report sizes
console.log('\n--- Build sizes ---');
let total = 0;
['index.html', 'mosaicGen.js', 'app.js'].forEach(f => {
  const size = fs.statSync(path.join(BUILD, f)).size;
  total += size;
  console.log(`  ${f}: ${size} bytes`);
});
console.log(`  TOTAL: ${total} bytes (${(total / 1024).toFixed(1)} KB)`);
if (total > 15000) {
  console.log('  ⚠️  Over 15KB budget!');
} else {
  console.log('  ✅ Under 15KB budget!');
}
