import { createHash } from 'node:crypto';
import { readFile, readdir, rm, mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const EXPECTED_ARCHIVE_SHA256 = '79ddcfc202355783a3f45fd0e4871a8c2aeeeca287d4fc420d421bd215aad1fd';
const EXPECTED_ARCHIVE_BYTES = 32877;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chunksDir = path.join(repoRoot, 'verification', 'v10.3', 'chunks');
const buildDir = path.join(repoRoot, 'build');
const distDir = path.join(repoRoot, 'dist');
const archivePath = path.join(buildDir, 'v10.3-portal.tar.gz');

const chunkNames = (await readdir(chunksDir))
  .filter((name) => name.endsWith('.bin'))
  .sort((a, b) => a.localeCompare(b));

if (chunkNames.length === 0) {
  throw new Error('No sealed V10.3 chunk files found.');
}

const chunks = [];
for (const name of chunkNames) {
  chunks.push(await readFile(path.join(chunksDir, name)));
}

const archive = Buffer.concat(chunks);
const actualSha256 = createHash('sha256').update(archive).digest('hex');

if (archive.length !== EXPECTED_ARCHIVE_BYTES) {
  throw new Error(`Sealed archive byte length mismatch: expected ${EXPECTED_ARCHIVE_BYTES}, got ${archive.length}`);
}

if (actualSha256 !== EXPECTED_ARCHIVE_SHA256) {
  throw new Error(`Sealed archive SHA-256 mismatch: expected ${EXPECTED_ARCHIVE_SHA256}, got ${actualSha256}`);
}

await rm(buildDir, { recursive: true, force: true });
await rm(distDir, { recursive: true, force: true });
await mkdir(buildDir, { recursive: true });
await mkdir(distDir, { recursive: true });
await writeFile(archivePath, archive);

const tar = spawnSync('tar', ['-xzf', archivePath, '-C', distDir], {
  cwd: repoRoot,
  encoding: 'utf8'
});

if (tar.status !== 0) {
  throw new Error(`Failed to extract sealed V10.3 archive: ${tar.stderr || tar.stdout || 'tar exited non-zero'}`);
}

console.log(`Prepared sealed V10.3 portal: ${archive.length} bytes, SHA-256 ${actualSha256}`);
console.log(`Static deployment directory: ${path.relative(repoRoot, distDir)}`);
