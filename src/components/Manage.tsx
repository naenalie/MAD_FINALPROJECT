import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Btn, Dialog, Field, Folder, Glass, Header, Icon, IconBtn, Pill, SectionTitle, Segment, Sheet, type DialogAction, type IconName} from './ui';
import {c, servicePalettes, t} from '../theme';
import type {Counter, Event, Queue, State, User} from '../services/api';
import {paletteFor, type Action} from './UserScreens';

type Props = {data: State; action: Action};
const longDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
const num = (n: number) => n.toLocaleString('id-ID', {maximumFractionDigits: 1});
function avgMinutes(qs: Queue[]) {
  const times = qs.filter(x => x.servedAt && x.completedAt).map(x => (Date.parse(x.completedAt!) - Date.parse(x.servedAt!)) / 60000);
  return times.length ? times.reduce((a, b) => a + b, 0) / times.length : null;
}

// ---------------- Kelola (A-01 a–c) ----------------
export function Kelola({data, action}: Props) {
  const [view, setView] = useState<'main' | 'loket'>('main');
  const [eventForm, setEventForm] = useState<Event | 'new' | null>(null);
  const [idx, setIdx] = useState(0);
  if (view === 'loket') return <LoketPetugas data={data} action={action} back={() => setView('main')} />;
  const today = data.queues.filter(q => q.date === data.today);
  const count = (s: string) => today.filter(q => q.status === s).length;
  const avg = avgMinutes(today);
  const event = data.events[idx % Math.max(1, data.events.length)];
  const officers = data.users.filter(u => u.role === 'petugas');
  return <>
    <Header eyebrow="Ruang Admin" title={'Kelola &\nStatistik'} subtitle={longDate(data.today)} right={<IconBtn icon="plus" label="Tambah event" onPress={() => setEventForm('new')} size={46} />} />
    <View style={st.grid}>
      <StatTile label="Total Antrean" icon="ticket" value={String(today.length)} note="nomor diterbitkan" />
      <StatTile label="Selesai" icon="check-circle" value={String(count('completed'))} note="layanan tuntas" tint="rgba(205,236,196,0.55)" />
      <StatTile label="Dilewati" icon="skip-forward" value={String(count('skipped'))} note="nomor hari ini" tint="rgba(255,222,226,0.55)" />
      <StatTile label="Rata-rata Layanan" icon="clock" value={avg == null ? '–' : num(avg)} note="menit per layanan" tint="rgba(222,214,252,0.55)" />
    </View>
    <Text style={[t(12, 'medium', '#3e527f'), {marginTop: 16, marginLeft: 14}]}>{count('waiting')} menunggu · {count('serving') + count('called')} dilayani · {count('cancelled')} dibatalkan</Text>
    <Folder style={{marginTop: 26}} tabWidth={146} tint="rgba(255,255,255,0.42)">
      <View style={{padding: 18, paddingTop: 20}}>
        <View style={[st.between, {alignItems: 'center'}]}>
          <View style={st.row}><Icon name="folder" size={21} color="#34477a" /><Text style={t(18, 'semibold', c.ink2)}>Event hari ini</Text></View>
          <Text onPress={() => setEventForm('new')} style={t(11, 'semibold', '#3e4fb0')}>+ Tambah event</Text>
        </View>
        {event ? <>
          <View style={[st.between, {alignItems: 'center', marginTop: 20}]}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Ubah ${event.name}`} onPress={() => setEventForm(event)} style={{flex: 1, gap: 6}}>
              <Text style={t(15, 'semibold', c.ink2)} numberOfLines={1}>{event.name}</Text>
              <Text style={t(11, 'regular', '#5a6a95')}>Prefiks {event.prefix} · Kuota {event.quotaPerDay}/hari · Ketuk untuk ubah</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Event berikutnya" onPress={() => setIdx(i => (i + 1) % data.events.length)}>
              <Pill label={`${data.events.length} event  ›`} bg="rgba(214,222,250,0.75)" fg="#3a4c86" style={{height: 28, paddingHorizontal: 16}} />
            </Pressable>
          </View>
          <View style={{marginTop: 18}}>
            <Segment limeActive value={event.status} onChange={status => action('/admin/event', {...event, status})} options={[{key: 'open', label: 'Buka'}, {key: 'paused', label: 'Jeda'}, {key: 'closed', label: 'Tutup'}]} />
          </View>
        </> : <Text style={[t(13, 'regular', c.muted), {marginTop: 14}]}>Belum ada event. Tambahkan event pertama.</Text>}
      </View>
    </Folder>
    <Folder style={{marginTop: 26}} tabWidth={146} onPress={() => setView('loket')}>
      <View style={[st.row, {padding: 18, minHeight: 72}]}>
        <Icon name="monitor" size={21} color="#34477a" />
        <View style={{flex: 1, gap: 6}}><Text style={t(17, 'semibold', c.ink2)}>Loket & petugas</Text><Text style={t(11, 'regular', '#5a6a95')}>{data.counters.length} loket · {officers.length} petugas bernama</Text></View>
        <Icon name="chevron-right" size={20} color="#34477a" />
      </View>
    </Folder>
    <EventSheet key={eventForm === 'new' ? 'new' : eventForm?.id ?? 'none'} target={eventForm} onClose={() => setEventForm(null)} action={action} />
  </>;
}
function StatTile({label, icon, value, note, tint}: {label: string; icon: IconName; value: string; note: string; tint?: string}) {
  return <Glass radius={22} tint={tint} style={st.tile}>
    <View style={[st.between, {alignItems: 'center'}]}><Text style={[t(12, 'medium', '#34477a'), {flex: 1}]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text><Icon name={icon} size={16} color="#4a5a8c" /></View>
    <Text style={[t(38, 'bold', '#23335b'), {marginTop: 6}]} adjustsFontSizeToFit numberOfLines={1}>{value}</Text>
    <Text style={t(10, 'regular', '#5a6a95')}>{note}</Text>
  </Glass>;
}

// ---------------- Tambah / Ubah Event (A-02 a–c) ----------------
function EventSheet({target, onClose, action}: {target: Event | 'new' | null; onClose: () => void; action: Action}) {
  const e = target && target !== 'new' ? target : null;
  const [name, setName] = useState(e?.name ?? ''), [prefix, setPrefix] = useState(e?.prefix ?? ''), [quota, setQuota] = useState(e ? String(e.quotaPerDay) : ''), [description, setDescription] = useState(e?.description ?? ''), [status, setStatus] = useState<Event['status']>(e?.status ?? 'open');
  const hint = {open: 'Buka: mahasiswa dapat mengambil nomor.', paused: 'Jeda: pengambilan nomor dihentikan sementara.', closed: 'Tutup: antrean menunggu dibatalkan di akhir hari.'}[status];
  return <Sheet visible={!!target} onClose={onClose} eyebrow="Kelola Layanan" title={e ? 'Ubah Event' : 'Tambah Event\nBaru'} subtitle="Atur layanan dan kuota antrean kampus.">
    <Field label="Nama Layanan / Event" icon="calendar" value={name} onChangeText={setName} placeholder="Contoh: Konsultasi Beasiswa" />
    <View style={{flexDirection: 'row', gap: 20}}>
      <View style={{flex: 1}}><Field label="Prefix Nomor" value={prefix} onChangeText={v => setPrefix(v.toUpperCase())} autoCapitalize="characters" maxLength={4} placeholder="Contoh: A, B, C" /></View>
      <View style={{flex: 1}}><Field label="Kuota per Hari" value={quota} onChangeText={setQuota} keyboardType="number-pad" placeholder="Contoh: 100" /></View>
    </View>
    <Field label="Deskripsi Singkat" value={description} onChangeText={setDescription} multiline placeholder="Tambahkan informasi layanan..." />
    <View style={{gap: 12}}>
      <Text style={t(13, 'semibold', c.label)}>Status Event</Text>
      <View style={{flexDirection: 'row', gap: 13}}>
        {(['open', 'paused', 'closed'] as const).map(s => {const on = s === status; return <Pressable key={s} accessibilityRole="button" accessibilityState={{selected: on}} onPress={() => setStatus(s)}
          style={[st.statusChip, on && {backgroundColor: s === 'open' ? '#d4f5b4' : s === 'paused' ? '#f6e7b8' : '#f6d6dc'}]}>
          {on && <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: '#25452b'}} />}
          <Text style={t(13, on ? 'semibold' : 'medium', on ? '#25452b' : '#5b6a92')}>{{open: 'Buka', paused: 'Jeda', closed: 'Tutup'}[s]}</Text>
        </Pressable>;})}
      </View>
      <View style={st.row}><Icon name="info" size={15} color="#5a6a95" /><Text style={t(11, 'regular', '#5a6a95')}>{hint}</Text></View>
    </View>
    <Btn height={58} label={e ? 'Simpan Perubahan' : 'Simpan Event'} iconRight="check" onPress={() => action('/admin/event', {id: e?.id, name, prefix, quotaPerDay: Number(quota), description, status}, onClose)} />
    <Text style={[t(11, 'regular', c.faint), {textAlign: 'center', marginTop: -6}]}>Prefix 1–4 huruf. Kuota berupa angka bulat.</Text>
  </Sheet>;
}

// ---------------- Loket & Petugas (A-03, A-05, A-07, A-08) ----------------
function LoketPetugas({data, action, back}: Props & {back: () => void}) {
  const officers = data.users.filter(u => u.role === 'petugas');
  const [counterForm, setCounterForm] = useState<Counter | 'new' | null>(null);
  const [officerForm, setOfficerForm] = useState<User | 'new' | null>(null);
  return <>
    <Header eyebrow="Pengelolaan Layanan" title={'Kelola Loket\n& Petugas'} subtitle={`${data.counters.length} loket · ${officers.length} petugas bernama`} right={<IconBtn icon="arrow-left" label="Kembali" onPress={back} size={46} />} />
    {data.counters.map(cn => {const ev = data.events.find(e => e.id === cn.eventId), off = officers.find(u => u.id === cn.petugasId), p = paletteFor(data, cn.eventId); return <View key={cn.id} style={{marginBottom: 22}}>
      <View style={{marginHorizontal: 14, height: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)', marginBottom: -10}} />
      <Glass radius={24} style={{padding: 20, paddingTop: 16}}>
        <View style={[st.between, {alignItems: 'center'}]}>
          <Text style={t(26, 'bold', '#23335b')}>{cn.name}</Text>
          <IconBtn icon="edit-2" label={`Ubah ${cn.name}`} onPress={() => setCounterForm(cn)} size={38} />
        </View>
        <Text style={[t(13, 'medium', '#34477a'), {marginTop: 8}]}>Event: {ev?.name ?? '—'}</Text>
        <View style={[st.between, {alignItems: 'center', marginTop: 16}]}>
          <View style={st.row}><Icon name="user" size={15} color="#4a5a8c" /><Text style={t(12, 'regular', '#4a5a8c')}>Petugas: {off?.name.split(' ')[0] ?? '—'}</Text></View>
          <Pill label="Aktif" dot bg={p.stat} fg="#2d4a30" style={{paddingHorizontal: 18}} />
        </View>
      </Glass>
    </View>;})}
    <SectionTitle title="Akun petugas" right={`${officers.length} akun`} />
    {officers.map(u => <Glass key={u.id} radius={22} style={[st.row, {padding: 14, paddingHorizontal: 18, marginBottom: 12}]} onPress={() => setOfficerForm(u)}>
      <Icon name="user" size={20} color="#34477a" />
      <View style={{flex: 1, gap: 4}}><Text style={t(14, 'semibold', c.ink2)}>{u.name}</Text><Text style={t(11, 'regular', '#5a6a95')}>{u.email} · {data.counters.find(cn => cn.petugasId === u.id)?.name ?? 'Belum ditugaskan'}</Text></View>
      <Icon name="edit-2" size={16} color="#34477a" />
    </Glass>)}
    <View style={{flexDirection: 'row', gap: 12, marginTop: 14}}>
      <Btn style={{flex: 1}} height={52} textSize={15} icon="plus" label="Tambah Loket" onPress={() => setCounterForm('new')} />
      <Btn style={{flex: 1}} variant="ghost" height={52} textSize={15} icon="user-plus" label="Petugas" onPress={() => setOfficerForm('new')} />
    </View>
    <CounterSheet key={counterForm === 'new' ? 'new' : counterForm?.id ?? 'none'} target={counterForm} data={data} onClose={() => setCounterForm(null)} action={action} />
    <OfficerSheet key={officerForm === 'new' ? 'new-o' : officerForm?.id ?? 'none-o'} target={officerForm} onClose={() => setOfficerForm(null)} action={action} />
  </>;
}

function SelectField({label, icon, value, placeholder, onPress}: {label: string; icon: IconName; value?: string; placeholder: string; onPress: () => void}) {
  return <View style={{gap: 10}}>
    <Text style={t(13, 'semibold', c.label)}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={st.select}>
      <Icon name={icon} size={20} color="#5b6a99" />
      <Text style={[t(15, 'regular', value ? c.ink : c.placeholder), {flex: 1}]} numberOfLines={1}>{value ?? placeholder}</Text>
      <Icon name="chevron-down" size={20} color="#5b6a99" />
    </Pressable>
  </View>;
}

function CounterSheet({target, data, onClose, action}: {target: Counter | 'new' | null; data: State; onClose: () => void; action: Action}) {
  const cn = target && target !== 'new' ? target : null;
  const officers = data.users.filter(u => u.role === 'petugas');
  const [name, setName] = useState(cn?.name ?? `Loket ${data.counters.length + 1}`), [eventId, setEventId] = useState(cn?.eventId ?? ''), [petugasId, setPetugasId] = useState(cn?.petugasId ?? '');
  const [picker, setPicker] = useState<null | {title: string; message: string; actions: DialogAction[]}>(null);
  const [confirm, setConfirm] = useState(false);
  const ev = data.events.find(e => e.id === eventId), off = officers.find(u => u.id === petugasId);
  return <Sheet visible={!!target} onClose={onClose} eyebrow="Kelola Loket" title={cn ? `Ubah ${cn.name}` : 'Tambah Loket\nBaru'} subtitle="Hubungkan loket dengan layanan dan petugasnya.">
    <Field label="Nama Loket" icon="monitor" value={name} onChangeText={setName} placeholder="Contoh: Loket 4" />
    <SelectField label="Layanan" icon="calendar" value={ev?.name} placeholder="Pilih layanan" onPress={() => setPicker({title: 'Pilih layanan', message: 'Pilih layanan untuk loket ini.', actions: data.events.map(e => ({label: e.name, variant: 'violet' as const, onPress: () => setEventId(e.id)}))})} />
    <SelectField label="Petugas" icon="user" value={off?.name} placeholder="Pilih petugas" onPress={() => setPicker({title: 'Tugaskan petugas', message: 'Pilih petugas untuk loket ini.', actions: officers.map(u => ({label: `Pilih ${u.name.split(' ')[0]}`, variant: 'violet' as const, onPress: () => setPetugasId(u.id)}))})} />
    <View style={st.row}><Icon name="info" size={15} color="#5a6a95" /><Text style={[t(11, 'regular', '#5a6a95'), {flex: 1}]}>Satu petugas hanya menangani satu loket.</Text></View>
    <Btn height={58} label="Simpan Loket" iconRight="check" onPress={() => setConfirm(true)} />
    <Dialog visible={!!picker} onClose={() => setPicker(null)} title={picker?.title ?? ''} message={picker?.message ?? ''} actions={picker?.actions.length ? picker.actions : [{label: 'Tutup'}]} />
    <Dialog visible={confirm} onClose={() => setConfirm(false)} title={cn ? `Simpan ${name}` : `Tambah ${name}`} message={`Layanan: ${ev?.name ?? '—'}\nPetugas: ${off?.name ?? '—'}\nStatus: Aktif`}
      actions={[{label: 'Simpan Loket', onPress: () => action('/admin/counter', {id: cn?.id, name, eventId, petugasId}, onClose)}, {label: 'Batal'}]} />
  </Sheet>;
}

function OfficerSheet({target, onClose, action}: {target: User | 'new' | null; onClose: () => void; action: Action}) {
  const u = target && target !== 'new' ? target : null;
  const [name, setName] = useState(u?.name ?? ''), [email, setEmail] = useState(u?.email ?? ''), [password, setPassword] = useState(''), [show, setShow] = useState(false);
  return <Sheet visible={!!target} onClose={onClose} eyebrow="Kelola Akun Petugas" title={u ? 'Ubah Akun\nPetugas' : 'Tambah Petugas\nBaru'} subtitle="Siapkan akun untuk tim layanan kampus.">
    <Field label="Nama Lengkap Petugas" icon="user" value={name} onChangeText={setName} placeholder="Contoh: Dimas Pratama" />
    <Field label="Email Kampus" icon="mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="nama@kampus.ac.id" />
    <Field label={u ? 'Password Baru (opsional)' : 'Password Awal'} icon="lock" value={password} onChangeText={setPassword} secureTextEntry={!show} placeholder={u ? 'Kosongkan jika tidak diubah' : 'Masukkan password awal'} hint="Gunakan minimal 8 karakter."
      right={<Pressable accessibilityRole="button" accessibilityLabel="Tampilkan password" onPress={() => setShow(v => !v)} hitSlop={10}><Icon name={show ? 'eye-off' : 'eye'} size={20} color="#5b6a99" /></Pressable>} />
    <View style={st.row}><Icon name="info" size={15} color="#5a6a95" /><Text style={[t(11, 'regular', '#5a6a95'), {flex: 1}]}>Tugaskan petugas ke loket melalui menu Loket & Petugas.</Text></View>
    <Btn height={58} label={u ? 'Simpan Akun' : 'Buat Akun Petugas'} iconRight="check" onPress={() => action('/admin/user', {id: u?.id, name, email, password}, onClose)} />
  </Sheet>;
}

// ---------------- Statistik (A-04, A-09) ----------------
export function Statistik({data}: {data: State}) {
  const dates = [...new Set([data.today, ...data.queues.map(q => q.date)])].sort().reverse();
  const [date, setDate] = useState(data.today), [pick, setPick] = useState(false);
  const narrow = useWindowDimensions().width < 380; // two tiles per row only fit on Figma-sized (430pt) screens
  const qs = data.queues.filter(q => q.date === date);
  const byHour = new Map<number, number>();
  qs.forEach(q => {const h = new Date(q.createdAt).getHours(); byHour.set(h, (byHour.get(h) ?? 0) + 1);});
  const hours = byHour.size ? Array.from({length: Math.min(8, Math.max(...byHour.keys()) - Math.min(...byHour.keys()) + 1)}, (_, i) => Math.min(...byHour.keys()) + i) : [8, 9, 10, 11, 12, 13, 14, 15];
  const max = Math.max(1, ...hours.map(h => byHour.get(h) ?? 0));
  const top = Math.max(4, Math.ceil(max / 4) * 4);
  return <>
    <Header eyebrow="Analitik Kampus" title={'Statistik\nLayanan'} />
    <Pressable accessibilityRole="button" accessibilityLabel="Pilih tanggal" onPress={() => setPick(true)} style={st.datePill}>
      <Icon name="calendar" size={16} color="#3a4c86" /><Text style={[t(13, 'semibold', '#2c3f78'), {flex: 1}]}>{longDate(date)}</Text><Icon name="chevron-down" size={17} color="#3a4c86" />
    </Pressable>
    <Glass radius={28} style={{padding: 16, paddingTop: 18, marginTop: 18}}>
      <View style={[st.between, {alignItems: 'center'}]}><Text style={t(14, 'medium', '#2c3f78')}>Volume antrean per jam</Text><Text style={t(11, 'medium', '#4a5a8c')}>{qs.length} nomor</Text></View>
      <View style={{height: 120, marginTop: 18, flexDirection: 'row'}}>
        <View style={{width: 26, justifyContent: 'space-between', paddingBottom: 26, paddingTop: 14}}>{[top, top / 2, 0].map(v => <Text key={v} style={t(9, 'regular', '#7685ac')}>{num(v)}</Text>)}</View>
        <View style={{flex: 1}}>
          {[0, 0.5, 1].map(f => <View key={f} style={{position: 'absolute', left: 0, right: 0, top: 20 + f * 74, height: 1, backgroundColor: 'rgba(120,134,180,0.2)'}} />)}
          <View style={{flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 26}}>
            {hours.map(h => {const v = byHour.get(h) ?? 0, peak = v === max && v > 0; return <View key={h} style={{alignItems: 'center', width: 28}}>
              <Text style={t(10, peak ? 'bold' : 'medium', peak ? '#4150c9' : '#53628c')}>{v}</Text>
              <View style={{width: 24, height: Math.max(6, (v / top) * 74), borderRadius: 8, marginTop: 4, overflow: 'hidden', opacity: peak ? 1 : 0.7}}>
                <LinearGradient colors={peak ? ['#6d6af3', '#4b49d6'] : ['#bfc9fc', '#8f9feb']} style={StyleSheet.absoluteFill} />
              </View>
              <Text style={[t(10, 'regular', '#53628c'), {position: 'absolute', bottom: -20}]}>{String(h).padStart(2, '0')}</Text>
            </View>;})}
          </View>
        </View>
      </View>
    </Glass>
    <View style={{height: 30}} />
    <SectionTitle title="Rincian per event" right={`${data.events.length} event`} />
    <View style={st.grid}>
      {data.events.map((e, i) => {const q = qs.filter(x => x.eventId === e.id), a = avgMinutes(q), p = servicePalettes[i % servicePalettes.length]!; return <Glass key={e.id} radius={22} tint={p.stat} style={[st.eventTile, narrow && {width: '100%'}]}>
        <Text style={t(13, 'semibold', c.ink2)} numberOfLines={1}>{e.name}</Text>
        <View style={[st.between, {alignItems: 'center', marginTop: 8}]}><Text style={t(11, 'regular', '#4a5a8c')}>Total Antrean</Text><Text style={t(24, 'bold', '#23335b')}>{q.length}</Text></View>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 8}}>
          {([['completed', 'Selesai', '#3f7a34'], ['skipped', 'Dilewati', '#b07d1a'], ['cancelled', 'Dibatalkan', '#b04a64']] as const).map(([s, label, col]) => <View key={s}>
            <Text style={t(18, 'semibold', col)}>{q.filter(x => x.status === s).length}</Text><Text style={t(9, 'regular', '#4a5a8c')}>{label}</Text>
          </View>)}
        </View>
        <View style={{height: 1, backgroundColor: 'rgba(80,96,150,0.15)', marginVertical: 10}} />
        <View style={[st.between, {alignItems: 'center'}]}><Text style={t(9, 'regular', '#4a5a8c')}>Rata-rata waktu layanan</Text><Text style={t(10, 'semibold', '#2c3f78')}>{a == null ? '–' : `${num(a)} mnt`}</Text></View>
      </Glass>;})}
    </View>
    <Dialog visible={pick} onClose={() => setPick(false)} title="Pilih tanggal" message="Tampilkan statistik untuk tanggal berikut." actions={dates.slice(0, 4).map(d => ({label: longDate(d), variant: 'violet' as const, onPress: () => setDate(d)}))} />
  </>;
}

const st = StyleSheet.create({
  between: {flexDirection: 'row', justifyContent: 'space-between', gap: 10},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12},
  grid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14},
  tile: {width: '48%', minHeight: 110, padding: 16, paddingTop: 14},
  eventTile: {width: '48%', padding: 14},
  statusChip: {flex: 1, height: 38, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.3)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8},
  select: {height: 58, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)', backgroundColor: 'rgba(255,255,255,0.30)', flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 18},
  datePill: {height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.4)', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, alignSelf: 'flex-start', minWidth: 248, marginTop: -6},
});
