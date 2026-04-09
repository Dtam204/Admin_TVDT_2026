const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TARGETS = ['server.js', 'index.js', 'src'];

function collectJsFiles(targetPath, acc) {
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    if (targetPath.endsWith('.js')) acc.push(targetPath);
    return;
  }

  const entries = fs.readdirSync(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const fullPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      collectJsFiles(fullPath, acc);
      continue;
    }
    if (entry.isFile() && fullPath.endsWith('.js')) acc.push(fullPath);
  }
}

function runSyntaxCheck(filePath) {
  const result = spawnSync(process.execPath, ['--check', filePath], {
    stdio: 'inherit',
  });
  return result.status === 0;
}

function main() {
  const files = [];

  for (const target of TARGETS) {
    const targetPath = path.join(ROOT, target);
    if (!fs.existsSync(targetPath)) continue;
    collectJsFiles(targetPath, files);
  }

  const uniqueFiles = Array.from(new Set(files)).sort();
  if (uniqueFiles.length === 0) {
    console.log('No backend JavaScript files found for syntax check.');
    return;
  }

  console.log(`Checking syntax for ${uniqueFiles.length} backend JS files...`);

  const failed = [];
  for (const filePath of uniqueFiles) {
    const ok = runSyntaxCheck(filePath);
    if (!ok) failed.push(path.relative(ROOT, filePath));
  }

  if (failed.length > 0) {
    console.error('\nSyntax check failed in files:');
    for (const file of failed) {
      console.error(`- ${file}`);
    }
    process.exit(1);
  }

  console.log('Backend syntax check passed.');
}

main();
