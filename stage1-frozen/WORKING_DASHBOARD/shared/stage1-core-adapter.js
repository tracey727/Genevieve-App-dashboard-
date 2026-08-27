(function(global){
'use strict';
const VERSION='1.0.0';
const USER_KEY='genevieve.stage1.user.v1';
const isFile=()=>!!(global.location&&global.location.protocol==='file:');
const base=()=>String(global.GENEVIEVE_STAGE1_CORE_BASE||'').replace(/\/$/,'');
const url=(p)=>base()+p;
function readUser(){try{return JSON.parse(global.sessionStorage.getItem(USER_KEY)||'null')}catch(e){return null}}
function writeUser(user){try{if(user)global.sessionStorage.setItem(USER_KEY,JSON.stringify(user));else global.sessionStorage.removeItem(USER_KEY)}catch(e){}}
async function request(path,options={}){
 if(isFile()) throw Object.assign(new Error('Stage-1 server is unavailable in file:// mode'),{code:'LOCAL_OFFLINE'});
 const headers={Accept:'application/json',...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})};
 const res=await global.fetch(url(path),{credentials:'same-origin',...options,headers});
 let body=null; if(res.status!==204){const text=await res.text();try{body=text?JSON.parse(text):null}catch(e){body={raw:text}}}
 if(!res.ok){const err=new Error(body&&body.error||('HTTP '+res.status));err.status=res.status;err.body=body;throw err}
 return body;
}
async function health(){return request('/health')}
async function login(email,password){const out=await request('/auth/login',{method:'POST',body:JSON.stringify({email,password})});writeUser(out&&out.user||null);return out}
async function logout(){try{await request('/auth/logout',{method:'POST'})}finally{writeUser(null)}}
async function events(){return request('/events')}
async function audit(){return request('/audit')}
async function acknowledge(eventId){return request('/events/'+encodeURIComponent(eventId)+'/acknowledge',{method:'POST'})}
async function assign(eventId,ownerUserId,backupUserId){return request('/events/'+encodeURIComponent(eventId)+'/assign',{method:'POST',body:JSON.stringify({ownerUserId,backupUserId})})}
async function setState(eventId,state){return request('/events/'+encodeURIComponent(eventId)+'/state',{method:'POST',body:JSON.stringify({state})})}
async function requestHandover(eventId,toUserId,note=''){return request('/events/'+encodeURIComponent(eventId)+'/handovers',{method:'POST',body:JSON.stringify({toUserId,note})})}
async function acceptHandover(handoverId){return request('/handovers/'+encodeURIComponent(handoverId)+'/accept',{method:'POST'})}
async function validateSession(){
 if(isFile()) return {mode:'LOCAL_PACKAGE',authenticated:false,user:readUser(),health:null};
 let h=null;try{h=await health()}catch(e){return {mode:'UNREACHABLE',authenticated:false,user:readUser(),health:null,error:e.message}}
 const user=readUser();
 if(!user) return {mode:'ONLINE',authenticated:false,user:null,health:h};
 try{const eventPayload=await events();return {mode:'ONLINE',authenticated:true,user,health:h,events:Array.isArray(eventPayload&&eventPayload.events)?eventPayload.events:[]}}catch(e){if(e.status===401)writeUser(null);return {mode:'ONLINE',authenticated:false,user:null,health:h,error:e.message}}
}
function snapshot(){return {version:VERSION,mode:isFile()?'LOCAL_PACKAGE':'SAME_ORIGIN',user:readUser(),base:base()}}
global.GENEVIEVE_STAGE1_CORE={VERSION,request,health,login,logout,events,audit,acknowledge,assign,setState,requestHandover,acceptHandover,validateSession,snapshot};
})(typeof window!=='undefined'?window:globalThis);
