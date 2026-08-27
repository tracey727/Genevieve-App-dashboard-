import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRepository } from '../STAGE1_SHARED_CORE/source/src/db/repository.js';
import { createApp } from '../STAGE1_SHARED_CORE/source/src/http/app.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dashboardRoot = path.resolve(here, '../WORKING_DASHBOARD');
const repo = createRepository();
const app = createApp(repo);

// Integration only: serves the V10.3 portal beneath the unmodified Stage-1 API.
// No Stage-1 route, authorisation rule, database function or migration is replaced here.
app.use(express.static(dashboardRoot, { index: 'START_HERE.html', extensions: ['html'] }));

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => {
  console.log(`GENEVIEVE Stage-1 portal runtime listening on ${port}`);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(async () => {
    await repo.close();
    process.exit(0);
  }));
}
