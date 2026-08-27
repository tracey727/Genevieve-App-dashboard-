import { createRepository } from './db/repository.js';
import { createApp } from './http/app.js';
const port=Number(process.env.PORT||3000);
const repo=createRepository();
const app=createApp(repo);
const server=app.listen(port,()=>console.log(`GENEVIEVE emergency core listening on ${port}`));
for (const signal of ['SIGTERM','SIGINT']) process.on(signal,()=>server.close(async()=>{await repo.close();process.exit(0);}));
