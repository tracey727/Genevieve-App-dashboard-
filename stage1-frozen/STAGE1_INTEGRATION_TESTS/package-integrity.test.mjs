import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
const root=path.resolve(new URL('..',import.meta.url).pathname);
function sha(p){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}

test('sealed Stage-1 runtime zip remains exact historical artifact',()=>{
  const p=path.join(root,'STAGE1_SHARED_CORE','ORIGINAL_STAGE1_CORE_V1_0_2_RUNTIME_VERIFIED.zip');
  assert.equal(sha(p),'eb06962db3cef39753c7c4a16ee993c913b7a8060ca5bc110492aabf915a77c3');
});

test('all nine agency pages load the Stage-1 adapter before the portal framework',()=>{
  const dir=path.join(root,'WORKING_DASHBOARD','dashboards');
  const pages=fs.readdirSync(dir).filter(x=>x.endsWith('.html')).sort();
  assert.equal(pages.length,9);
  for(const page of pages){
    const s=fs.readFileSync(path.join(dir,page),'utf8');
    const a=s.indexOf('../shared/stage1-core-adapter.js');
    const f=s.indexOf('../shared/portal-framework.js');
    assert.ok(a>=0,`${page} adapter missing`); assert.ok(f>a,`${page} framework must load after adapter`);
  }
});

test('runtime wrapper mounts static portal after the unmodified Stage-1 app is created',()=>{
  const s=fs.readFileSync(path.join(root,'RUNTIME_STAGE1_PORTAL','server.js'),'utf8');
  assert.ok(s.includes("createApp(repo)"));
  assert.ok(s.includes("app.use(express.static"));
  assert.ok(s.indexOf('createApp(repo)')<s.indexOf('app.use(express.static'));
  assert.ok(!s.includes("app.post('/auth"));
  assert.ok(!s.includes("app.get('/events"));
});
