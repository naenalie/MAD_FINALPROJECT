const {test, before, after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'campusqueue-test-'));
process.env.DB_PATH=path.join(dir,'db.json');
const app=require('../backend/server');
let server,base;
before(async()=>{server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));base=`http://127.0.0.1:${server.address().port}`;});
after(async()=>{await new Promise(resolve=>server.close(resolve));fs.rmSync(dir,{recursive:true,force:true});});
async function api(endpoint,actor,body){const r=await fetch(base+endpoint,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(actor?{'x-user-id':actor}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};}
test('login, role and queue lifecycle are validated server-side',async()=>{
 assert.equal((await api('/login',null,{email:'user@campusqueue.test',password:'bad'})).status,401);
 assert.equal((await api('/login',null,{email:'user@campusqueue.test',password:'demo123'})).data.role,'user');
 assert.equal((await api('/admin/user','u1',{name:'X',email:'x@x.test',password:'x'})).status,403);
 assert.equal((await api('/take-queue','u2',{eventId:'e1'})).status,403);
 const [a,b]=await Promise.all([api('/take-queue','u1',{eventId:'e1'}),api('/take-queue','u4',{eventId:'e1'})]);
 assert.deepEqual([a.data.sequence,b.data.sequence].sort(),[1,2]);
 const duplicate=await api('/take-queue','u1',{eventId:'e1'});assert.equal(duplicate.status,409);assert.equal(duplicate.data.code,'ACTIVE_QUEUE');
 assert.equal((await api('/take-queue','u3',{eventId:'e2'})).status,409);
 const first=(await api('/call-next','u2',{counterId:'c1'})).data;assert.equal(first.sequence,1);assert.equal(first.status,'called');
 assert.equal((await api('/call-next','u2',{counterId:'c1'})).status,409);
 assert.equal((await api('/cancel',first.userId,{queueId:first.id})).status,409);
 assert.equal((await api('/transition','u2',{counterId:'c1',queueId:first.id,action:'complete'})).status,409);
 assert.equal((await api('/transition','u2',{counterId:'c1',queueId:first.id,action:'skip'})).data.status,'skipped');
 assert.equal((await api('/transition','u2',{counterId:'c1',queueId:first.id,action:'late-recall'})).data.status,'called');
 assert.equal((await api('/transition','u2',{counterId:'c1',queueId:first.id,action:'serve'})).data.status,'serving');
 assert.equal((await api('/transition','u2',{counterId:'c1',queueId:first.id,action:'complete'})).data.status,'completed');
 assert.equal((await api('/call-next','u2',{counterId:'c1'})).data.sequence,2);
 const saved=JSON.parse(fs.readFileSync(process.env.DB_PATH,'utf8'));assert.equal(saved.queues.length,2);assert.equal(saved.queues.find(q=>q.id===first.id).status,'completed');
});
test('quota and prefix changes are enforced',async()=>{
 const edit={id:'e1',name:'Administrasi Akademik',prefix:'A',quotaPerDay:2,status:'open',description:''};
 assert.equal((await api('/admin/event','u3',edit)).status,200);
 assert.equal((await api('/take-queue','u3',{eventId:'e1'})).status,409);
 assert.equal((await api('/admin/event','u3',{...edit,prefix:'Z'})).status,409);
});
test('sequence resets on a new date and closed-event cleanup cancels old waiting tickets',async()=>{
 const db=JSON.parse(fs.readFileSync(process.env.DB_PATH,'utf8'));
 db.queues.forEach(q=>{q.date='2001-01-01';q.status='waiting';});
 db.events.find(e=>e.id==='e1').status='closed';fs.writeFileSync(process.env.DB_PATH,JSON.stringify(db));
 let state=(await api('/state','u3')).data;
 assert.ok(state.queues.every(q=>q.status==='cancelled'));
 assert.equal((await api('/admin/event','u3',{id:'e1',name:'Administrasi Akademik',prefix:'A',quotaPerDay:2,status:'open',description:''})).status,200);
 const fresh=await api('/take-queue','u1',{eventId:'e1'});assert.equal(fresh.data.sequence,1);assert.equal(fresh.data.queueNumber,'A-001');
});
test('previous-day called and serving tickets can be resolved to free a counter',async()=>{
 const db=JSON.parse(fs.readFileSync(process.env.DB_PATH,'utf8'));
 const q=db.queues.find(x=>x.status==='waiting'); q.date='2001-01-01';q.status='called';q.counterId='c1';
 fs.writeFileSync(process.env.DB_PATH,JSON.stringify(db));
 assert.equal((await api('/transition','u2',{counterId:'c1',queueId:q.id,action:'serve'})).data.status,'serving');
 assert.equal((await api('/transition','u2',{counterId:'c1',queueId:q.id,action:'complete'})).data.status,'completed');
 const fresh=await api('/take-queue','u4',{eventId:'e1'});assert.equal(fresh.status,200);
 const next=await api('/call-next','u2',{counterId:'c1'});assert.equal(next.status,200);assert.equal(next.data.id,fresh.data.id);
});
