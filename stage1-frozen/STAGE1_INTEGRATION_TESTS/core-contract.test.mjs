import test from 'node:test';
import assert from 'node:assert/strict';
import { can } from '../STAGE1_SHARED_CORE/source/src/core/authz.js';
import { assertTransition } from '../STAGE1_SHARED_CORE/source/src/core/states.js';
import { requestHandover, acceptHandover } from '../STAGE1_SHARED_CORE/source/src/core/handover.js';
import { hashPassword, verifyPassword, newSessionToken, tokenDigest } from '../STAGE1_SHARED_CORE/source/src/core/security.js';

test('Stage-1 security primitives remain valid',()=>{
  const h=hashPassword('CorrectHorseBattery!42');
  assert.equal(verifyPassword('CorrectHorseBattery!42',h),true);
  assert.equal(verifyPassword('wrong-password',h),false);
  const t=newSessionToken(); assert.ok(t.length>30); assert.equal(tokenDigest(t).length,64);
});

test('all Stage-1 roles enforce server-side grants and agency boundary',()=>{
  const actions=['event:create','event:read','event:ack','event:assign','event:state','handover:request','handover:accept','audit:read','session:revoke','user:manage'];
  const expected={
    RESPONDER:['event:read','event:ack','handover:request','handover:accept'],
    DISPATCHER:['event:create','event:read','event:ack','event:assign','event:state','handover:request','handover:accept'],
    SUPERVISOR:['event:create','event:read','event:ack','event:assign','event:state','handover:request','handover:accept','audit:read','session:revoke'],
    AUDITOR:['event:read','audit:read'],
    ADMIN:actions
  };
  for(const [role,allowed] of Object.entries(expected)){
    const user={id:'u-'+role,role,agencyId:'A',isPlatformAdmin:false};
    for(const action of actions) assert.equal(can(user,action,{agencyId:'A'}),allowed.includes(action),`${role} ${action}`);
    assert.equal(can(user,'event:read',{agencyId:'B'}),false,`${role} cross-agency read denied`);
  }
});

test('state engine keeps GREEN-AMBER-RED-CRITICAL-GOVERNANCE contract',()=>{
  assert.equal(assertTransition('GREEN','AMBER'),true);
  assert.equal(assertTransition('AMBER','RED'),true);
  assert.equal(assertTransition('RED','CRITICAL'),true);
  assert.equal(assertTransition('CRITICAL','GOVERNANCE'),true);
  assert.throws(()=>assertTransition('CRITICAL','GREEN'));
  assert.equal(assertTransition('CRITICAL','GREEN',{governanceOverride:true}),true);
});

test('handover is two-phase and retains old owner until named recipient accepts',()=>{
  const event={id:'e1',ownerUserId:'u1'};
  const h=requestHandover(event,{fromUserId:'u1',toUserId:'u2',note:'test'});
  assert.equal(h.status,'PENDING');
  assert.equal(event.ownerUserId,'u1');
  assert.throws(()=>acceptHandover(event,h,'u3'));
  assert.equal(event.ownerUserId,'u1');
  const accepted=acceptHandover(event,h,'u2');
  assert.equal(accepted.handover.status,'ACCEPTED');
  assert.equal(accepted.event.ownerUserId,'u2');
  assert.equal(event.ownerUserId,'u1','pure function does not mutate original event before persistence layer transaction');
});
