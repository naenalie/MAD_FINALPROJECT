const jsonServer = require('json-server');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dbPath = process.env.DB_PATH || path.join(__dirname, 'db.json');
const seedPath = path.join(__dirname, 'seed.json');
if (!fs.existsSync(dbPath)) fs.copyFileSync(seedPath, dbPath);
const server = jsonServer.create();
server.use(jsonServer.defaults({ logger: false }));
server.use(jsonServer.bodyParser);
const active = ['waiting', 'called', 'serving'];
const today = () => new Intl.DateTimeFormat('en-CA', {timeZone: process.env.QUEUE_TIMEZONE || 'Asia/Makassar', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
const load = () => JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const save = db => { const temp = dbPath + '.tmp'; fs.writeFileSync(temp, JSON.stringify(db, null, 2)); fs.renameSync(temp, dbPath); };
const fail = (status, message, code) => { const e = new Error(message); e.status = status; e.code = code; throw e; };
const find = (list, id, label) => list.find(x => x.id === id) || fail(404, `${label} tidak ditemukan`);
const publicUser = ({ password, ...user }) => user;
const now = () => new Date().toISOString();
// Demo identity is supplied by the client. It is not a secure authentication mechanism.
server.use((req, res, next) => {
  try {
    if (req.path === '/health') return res.json({ok:true});
    const db = load();
    // End-of-day cleanup is applied on the first request after midnight in the configured timezone.
    let cleaned = false;
    for (const q of db.queues) {
      if (q.status === 'waiting' && q.date < today() && db.events.some(e => e.id === q.eventId && e.status === 'closed')) { q.status = 'cancelled'; cleaned = true; }
    }
    if (cleaned) save(db);
    if (req.path === '/login' && req.method === 'POST') {
      const user = db.users.find(u => u.email.toLowerCase() === String(req.body.email || '').trim().toLowerCase() && u.password === req.body.password);
      if (!user) fail(401, 'Email atau password salah');
      return res.json(publicUser(user));
    }
    const actor = find(db.users, req.get('x-user-id'), 'Akun');
    const staff = () => { if (!['petugas','admin'].includes(actor.role)) fail(403,'Akses ditolak'); };
    const admin = () => { if (actor.role !== 'admin') fail(403,'Akses ditolak'); };
    const counterFor = id => { staff(); const c = find(db.counters, id, 'Loket'); if (actor.role === 'petugas' && c.petugasId !== actor.id) fail(403,'Loket bukan tugas Anda'); return c; };
    const countersFree = c => { if (db.queues.some(q => q.counterId === c.id && ['called','serving'].includes(q.status))) fail(409,'Loket masih menangani antrean'); };
    const ensureToday = q => { if (q.date !== today()) fail(409,'Antrean bukan untuk hari ini'); };
    let result;
    if (req.method === 'GET' && req.path === '/state') {
      const queues = actor.role === 'user' ? db.queues.filter(q => q.userId === actor.id || q.date === today()) : db.queues;
      return res.json({ users: actor.role === 'admin' ? db.users.map(publicUser) : [publicUser(actor)], events:db.events, counters:db.counters, queues, today:today() });
    }
    if (req.method === 'POST' && req.path === '/take-queue') {
      if (actor.role === 'petugas') fail(403,'Petugas tidak dapat mengambil antrean');
      const e = find(db.events, req.body.eventId, 'Event');
      if (e.status !== 'open') fail(409,'Event tidak sedang buka');
      if (db.queues.some(q => q.userId === actor.id && active.includes(q.status))) fail(409,'Anda masih memiliki antrean aktif','ACTIVE_QUEUE');
      const list = db.queues.filter(q => q.eventId === e.id && q.date === today());
      if (list.length >= e.quotaPerDay) fail(409,'Kuota hari ini habis');
      const sequence = Math.max(0,...list.map(q=>q.sequence)) + 1;
      result = {id:crypto.randomUUID(),userId:actor.id,eventId:e.id,counterId:null,queueNumber:`${e.prefix}-${String(sequence).padStart(3,'0')}`,sequence,date:today(),status:'waiting',createdAt:now(),calledAt:null,servedAt:null,completedAt:null};
      db.queues.push(result);
    } else if (req.method === 'POST' && req.path === '/cancel') {
      const q = find(db.queues,req.body.queueId,'Antrean');
      if (q.userId !== actor.id || q.status !== 'waiting') fail(409,'Antrean tidak dapat dibatalkan'); q.status='cancelled'; result=q;
    } else if (req.method === 'POST' && req.path === '/call-next') {
      const c = counterFor(req.body.counterId); countersFree(c);
      const q = db.queues.filter(q=>q.eventId===c.eventId && q.date===today() && q.status==='waiting').sort((a,b)=>a.sequence-b.sequence)[0];
      if (!q) fail(409,'Tidak ada antrean menunggu'); q.status='called'; q.counterId=c.id; q.calledAt=now(); result=q;
    } else if (req.method === 'POST' && req.path === '/transition') {
      const c=counterFor(req.body.counterId), q=find(db.queues,req.body.queueId,'Antrean');
      const action=req.body.action;
      if(action==='late-recall') { ensureToday(q); if(q.status!=='skipped' || q.eventId!==c.eventId) fail(409,'Antrean tidak dapat dipanggil kembali'); countersFree(c); if(db.queues.some(x=>x.id!==q.id && x.userId===q.userId && active.includes(x.status))) fail(409,'Pengguna memiliki antrean aktif lain'); q.counterId=c.id; q.status='called'; q.calledAt=now(); }
      else { if(q.counterId!==c.id) fail(403,'Antrean bukan di loket ini');
        if(action==='recall' && q.status==='called') q.calledAt=now();
        else if(action==='serve' && q.status==='called') {q.status='serving';q.servedAt=now();}
        else if(action==='skip' && q.status==='called') q.status='skipped';
        else if(action==='complete' && q.status==='serving') {q.status='completed';q.completedAt=now();}
        else fail(409,'Perubahan status tidak diizinkan');
      } result=q;
    } else if(req.method==='POST' && req.path==='/admin/event') {
      admin(); const b=req.body; const name=String(b.name||'').trim(), prefix=String(b.prefix||'').trim().toUpperCase(), quota=Number(b.quotaPerDay);
      if(!name || !/^[A-Z]{1,4}$/.test(prefix) || !Number.isInteger(quota) || quota<1 || !['open','paused','closed'].includes(b.status)) fail(400,'Data event tidak valid');
      let e=b.id ? find(db.events,b.id,'Event') : null;
      if(e && e.prefix!==prefix && db.queues.some(q=>q.eventId===e.id && q.date===today())) fail(409,'Prefix tidak dapat diubah setelah ada antrean hari ini');
      if(!e) {e={id:crypto.randomUUID()};db.events.push(e);} Object.assign(e,{name,prefix,quotaPerDay:quota,status:b.status,description:String(b.description||'').trim()}); result=e;
    } else if(req.method==='POST' && req.path==='/admin/user') {
      admin(); const b=req.body, name=String(b.name||'').trim(), email=String(b.email||'').trim().toLowerCase();
      let officer=b.id ? find(db.users,b.id,'Petugas') : null;
      if(officer && officer.role!=='petugas') fail(400,'Akun bukan petugas');
      if(!name || !email.includes('@') || (!officer && !b.password) || db.users.some(u=>u.id!==b.id && u.email.toLowerCase()===email)) fail(400,'Nama, email unik, dan password awal wajib diisi');
      if(!officer) {officer={id:crypto.randomUUID(),role:'petugas',counterId:null};db.users.push(officer);}
      Object.assign(officer,{name,email}); if(b.password) officer.password=b.password; result=publicUser(officer);
    } else if(req.method==='POST' && req.path==='/admin/counter') {
      admin(); const b=req.body; const name=String(b.name||'').trim(); if(!name) fail(400,'Nama loket wajib diisi'); find(db.events,b.eventId,'Event'); const officer=find(db.users,b.petugasId,'Petugas'); if(officer.role!=='petugas') fail(400,'Pilih akun petugas');
      let c=b.id ? find(db.counters,b.id,'Loket') : null;
      if (c && db.queues.some(q=>q.counterId===c.id && ['called','serving'].includes(q.status))) fail(409,'Loket sedang melayani');
      if(db.counters.some(x=>x.id!==b.id && x.petugasId===officer.id)) fail(409,'Petugas sudah ditugaskan ke loket lain');
      if(!c) {c={id:crypto.randomUUID()};db.counters.push(c);} const old=db.users.find(u=>u.id===c.petugasId); if(old) old.counterId=null;
      Object.assign(c,{name,eventId:b.eventId,petugasId:officer.id});officer.counterId=c.id;result=c;
    } else return res.status(404).json({error:'Endpoint tidak ditemukan'});
    save(db); return res.json(result);
  } catch(e) { return res.status(e.status || 500).json({error:e.status ? e.message : 'Kesalahan server', ...(e.status && e.code ? {code:e.code} : {})}); }
});
if(require.main===module) server.listen(Number(process.env.PORT || 3000),'0.0.0.0',()=>console.log('CampusQueue API running'));
module.exports=server;
