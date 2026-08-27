import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(repoRoot, 'dist');
const manifestPath = path.join(repoRoot, 'verification', 'v10.3', 'EXPECTED_FILES_SHA256.txt');

const manifest = (await readFile(manifestPath, 'utf8'))
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const match = line.match(/^([a-f0-9]{64})\s+\.\/(.+)$/);
    if (!match) throw new Error(`Invalid hash manifest line: ${line}`);
    return { sha256: match[1], relativePath: match[2] };
  });

if (manifest.length !== 15) {
  throw new Error(`Expected 15 V10.3 deployment files, manifest contains ${manifest.length}`);
}

async function collectFiles(directory, prefix = '') {
  const names = (await readdir(directory)).sort((a, b) => a.localeCompare(b));
  const files = [];
  for (const name of names) {
    const absolute = path.join(directory, name);
    const relative = prefix ? `${prefix}/${name}` : name;
    const info = await stat(absolute);
    if (info.isDirectory()) files.push(...await collectFiles(absolute, relative));
    else if (info.isFile()) files.push(relative);
  }
  return files;
}

const expectedPaths = manifest.map((entry) => entry.relativePath).sort();
const actualPaths = (await collectFiles(distDir)).sort();

if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) {
  throw new Error(`Deployment file set mismatch. Expected ${JSON.stringify(expectedPaths)}, got ${JSON.stringify(actualPaths)}`);
}

for (const entry of manifest) {
  const bytes = await readFile(path.join(distDir, entry.relativePath));
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== entry.sha256) {
    throw new Error(`${entry.relativePath}: expected ${entry.sha256}, got ${actual}`);
  }
  console.log(`PASS ${entry.relativePath} ${actual}`);
}

const dashboardPaths = actualPaths.filter((name) => name.startsWith('dashboards/') && name.endsWith('.html'));
if (dashboardPaths.length !== 9) {
  throw new Error(`Expected exactly 9 agency dashboards, found ${dashboardPaths.length}`);
}

console.log('V10.3 deployment integrity gate: 15/15 files exact; 9/9 agency dashboards present.');
