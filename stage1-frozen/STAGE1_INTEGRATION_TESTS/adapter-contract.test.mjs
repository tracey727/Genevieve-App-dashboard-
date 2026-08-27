import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../WORKING_DASHBOARD/shared/stage1-core-adapter.js',import.meta.url),'utf8');
function storage(){const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}}
function make(protocol='https:'){
  const calls=[]; const sessionStorage=storage();
  const ctx={console,location:{protocol},sessionStorage,fetch:async (url,opts={})=>{
    calls.push({url,opts});
    const response=(status,body)=>({ok:status>=200&&status<300,status,async text(){return body==null?'':JSON.stringify(body)}});
    if(url==='/health') return response(200,{ok:true,version:'1.0.2'});
    if(url==='/auth/login') return response(200,{user:{id:'u1',displayName:'Alex Core',role:'SUPERVISOR',agencyId:'A'}});
    if(url==='/auth/logout') return response(204,null);
    if(url==='/events') return response(200,{events:[]});
    if(url==='/audit') return response(200,{entries:[]});
    if(/\/state$/.test(url)) return response(200,{id:'e1',state:'AMBER'});
    if(/\/handovers$/.test(url)) return response(201,{id:'h1',status:'PENDING'});
    if(/\/accept$/.test(url)) return response(200,{handover:{status:'ACCEPTED'}});
    if(/\/acknowledge$/.test(url)) return response(200,{id:'e1'});
    if(/\/assign$/.test(url)) return response(200,{id:'e1'});
    return response(404,{error:'Not found'});
  }};
  ctx.window=ctx;ctx.globalThis=ctx;
  vm.createContext(ctx); vm.runInContext(source,ctx);
  return {core:ctx.GENEVIEVE_STAGE1_CORE,calls,sessionStorage};
}

test('adapter preserves existing Stage-1 route contract with same-origin credentials',async()=>{
  const {core,calls}=make();
  assert.equal((await core.health()).version,'1.0.2');
  const login=await core.login('a@example.invalid','not-stored-here');
  assert.equal(login.user.displayName,'Alex Core');
  assert.equal(core.snapshot().user.role,'SUPERVISOR');
  const v=await core.validateSession(); assert.equal(v.authenticated,true);
  await core.acknowledge('e1');
  await core.assign('e1','u1','u2');
  await core.setState('e1','AMBER');
  await core.requestHandover('e1','u2','handover');
  await core.acceptHandover('h1');
  await core.audit();
  await core.logout();
  assert.equal(core.snapshot().user,null);
  assert.ok(calls.every(c=>c.opts.credentials==='same-origin'));
  assert.deepEqual(calls.map(c=>c.url).slice(0,4),['/health','/auth/login','/health','/events']);
  assert.ok(calls.some(c=>c.url==='/events/e1/state'&&c.opts.method==='POST'));
  assert.ok(calls.some(c=>c.url==='/events/e1/handovers'&&c.opts.method==='POST'));
  assert.ok(calls.some(c=>c.url==='/handovers/h1/accept'&&c.opts.method==='POST'));
});

test('file mode is explicit offline packaging and never makes a network request',async()=>{
  const {core,calls}=make('file:');
  const v=await core.validateSession();
  assert.equal(v.mode,'LOCAL_PACKAGE');
  assert.equal(v.authenticated,false);
  assert.equal(calls.length,0);
  await assert.rejects(()=>core.health(),/unavailable in file:\/\/ mode/);
  assert.equal(calls.length,0);
});
