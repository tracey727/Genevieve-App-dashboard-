import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, newSessionToken, tokenDigest } from '../src/core/security.js';
import { can } from '../src/core/authz.js';
import { assertTransition } from '../src/core/states.js';

test('password hashes verify and reject wrong passwords',()=>{const h=hashPassword('CorrectHorseBattery!42');assert.equal(verifyPassword('CorrectHorseBattery!42',h),true);assert.equal(verifyPassword('wrong-password',h),false)});
test('session tokens are opaque and digestable',()=>{const t=newSessionToken();assert.ok(t.length>30);assert.equal(tokenDigest(t).length,64)});
test('agency boundary denies otherwise permitted action',()=>{const user={id:'u1',role:'SUPERVISOR',agencyId:'A'};assert.equal(can(user,'event:read',{agencyId:'A'}),true);assert.equal(can(user,'event:read',{agencyId:'B'}),false)});
test('role grants are server-side',()=>{assert.equal(can({id:'r',role:'RESPONDER',agencyId:'A'},'event:create',{agencyId:'A'}),false);assert.equal(can({id:'d',role:'DISPATCHER',agencyId:'A'},'event:create',{agencyId:'A'}),true)});
test('state transition engine accepts escalation and rejects invalid state',()=>{assert.equal(assertTransition('GREEN','RED'),true);assert.throws(()=>assertTransition('GREEN','BLUE'))});
