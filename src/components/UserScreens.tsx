import React, {useMemo, useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {StatusBar} from 'expo-status-bar';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Avatar, Background, Btn, Chips, Dialog, Folder, Glass, Header, Icon, IconBtn, Orb, Pill, SectionTitle, StatusPill, Toggle, type IconName} from './ui';
import {c, grad, servicePalettes, statusTone, t} from '../theme';
import type {Event, Queue, State, User} from '../services/api';

export type Action = (path: string, body: object, done?: () => void) => Promise<boolean>;
export const timeText = (s: string | null | undefined) => s ? new Date(s).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}).replace(':', '.') : '–';
const dayText = (s: string) => new Date(s).toLocaleDateString('id-ID', {day: '2-digit', month: 'short'}).toUpperCase().replace('.', '');
const monthText = (s: string) => new Date(s).toLocaleDateString('id-ID', {month: 'long', year: 'numeric'});
export const paletteFor = (data: State, eventId: string) => servicePalettes[Math.max(0, data.events.findIndex(e => e.id === eventId)) % servicePalettes.length]!;
export const firstName = (u: User) => u.name.split(' ')[0] ?? u.name;

export function queueInfo(q: Queue, data: State) {
  const sameDay = data.queues.filter(x => x.eventId === q.eventId && x.date === q.date);
  const ahead = sameDay.filter(x => x.status === 'waiting' && x.sequence < q.sequence).length;
  const calling = sameDay.filter(x => x.status === 'called' || x.status === 'serving').sort((a, b) => (b.calledAt ?? '').localeCompare(a.calledAt ?? ''))[0];
  const counter = data.counters.find(x => x.id === (q.counterId ?? calling?.counterId)) ?? data.counters.find(x => x.eventId === q.eventId);
  const times = sameDay.filter(x => x.servedAt && x.completedAt).map(x => (Date.parse(x.completedAt!) - Date.parse(x.servedAt!)) / 60000);
  const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 3;
  return {ahead, calling, counter, event: data.events.find(e => e.id === q.eventId), eta: Math.max(1, Math.round(ahead * avg))};
}
export function eventStats(e: Event, data: State) {
  const today = data.queues.filter(q => q.eventId === e.id && q.date === data.today);
  return {today, waiting: today.filter(q => q.status === 'waiting').length, left: Math.max(0, e.quotaPerDay - today.length)};
}

// ---------------- Beranda (U-02) ----------------
export function Beranda({user, data, mine, go}: {user: User; data: State; mine?: Queue; go: (tab: string) => void}) {
  const info = mine ? queueInfo(mine, data) : null;
  const popular = (data.events.filter(e => e.status === 'open').length ? data.events.filter(e => e.status === 'open') : data.events).slice(0, 3);
  return <>
    <Header eyebrow="Beranda" title={`Halo, ${firstName(user)}`} subtitle="Semua urusan kampus, dalam genggaman."
      right={<View style={{flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: -40}}>
        <View><IconBtn icon="bell" label="Notifikasi" onPress={() => go('Antrean')} />{!!mine && <View style={st.dot} />}</View>
        <Avatar name={user.name} />
      </View>} />
    {mine && info ? <Glass radius={28} style={{padding: 20, paddingTop: 22}} onPress={() => go('Antrean')}>
      <View style={st.between}><Text style={t(10, 'semibold', '#4f5f93')}>ANTREAN AKTIF</Text><Text style={t(10, 'medium', 'rgba(96,120,220,0.55)')}>● {statusTone[mine.status]?.label}</Text></View>
      <View style={[st.between, {alignItems: 'center'}]}>
        <View>
          <Text style={t(44, 'bold', '#23335b', {ls: -0.03})}>{mine.queueNumber}</Text>
          <Text style={t(15, 'semibold', '#3e527f')}>{mine.status === 'waiting' ? `${info.ahead} antrean di depan` : `Menuju ${info.counter?.name ?? 'loket'}`}</Text>
        </View>
        <Orb size={58} />
      </View>
      <View style={st.trackBtn}><Text style={t(13, 'semibold', '#3a4c86')}>Pantau Antrean Saya</Text><Icon name="arrow-right" size={18} color="#3a4c86" /></View>
    </Glass> : <Glass radius={28} style={{padding: 22, gap: 8}}>
      <Text style={t(10, 'semibold', '#4f5f93')}>ANTREAN AKTIF</Text>
      <Text style={t(20, 'semibold', c.ink2)}>Belum ada antrean aktif</Text>
      <Text style={[t(13, 'regular', c.muted), {marginBottom: 10}]}>Pilih layanan yang buka untuk mengambil nomor.</Text>
      <Btn label="Ambil Antrean" height={46} onPress={() => go('Ambil')} iconRight="arrow-right" />
    </Glass>}
    <View style={{height: 34}} />
    <SectionTitle title="Layanan Populer" right="Lihat semua" onRight={() => go('Ambil')} />
    <View style={{flexDirection: 'row', gap: 14}}>
      {popular.map(e => {const p = paletteFor(data, e.id); return <Folder key={e.id} style={{flex: 1, maxWidth: '33%'}} tabWidth={69} tint={p.folder} tabTint={p.tab} onPress={() => go('Ambil')}>
        <View style={{height: 131, padding: 14, paddingTop: 18}}>
          <Icon name={p.icon} size={21} color="#3a4a7a" />
          <Text style={[t(14, 'medium', '#2a3b68'), {marginTop: 14}]} numberOfLines={2}>{e.name}</Text>
          <View style={{flex: 1}} />
          <View style={st.between}><Text style={t(10, 'regular', '#5a6a95')}>Lihat layanan</Text><Icon name="chevron-right" size={14} color="#5a6a95" /></View>
        </View>
      </Folder>;})}
    </View>
    <Text style={[t(21, 'bold', c.ink), {marginTop: 34, marginBottom: 16}]}>Pengumuman Kampus</Text>
    <Glass radius={24} style={{padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 88}}>
      <View style={st.iconTile}><Icon name="volume-2" size={20} color="#4a5a8c" /></View>
      <View style={{flex: 1, gap: 6}}>
        <Text style={t(15, 'semibold', c.ink2)}>{mine ? 'Pantau nomormu secara langsung' : 'Antre dari mana saja'}</Text>
        <Text style={t(11, 'regular', c.muted)}>Status antrean diperbarui otomatis setiap 5 detik.</Text>
      </View>
    </Glass>
  </>;
}

// ---------------- Ambil Antrean (U-03 a–d) ----------------
export function Ambil({user, data, take, go, mine}: {user: User; data: State; take: (e: Event) => void; go: (tab: string) => void; mine?: Queue}) {
  const [selected, setSelected] = useState<string>('');
  const open = data.events.filter(e => e.status === 'open');
  const list = data.events; // paused/closed services stay visible in the stack, with a disabled CTA
  const front = list.find(e => e.id === selected) ?? open[0] ?? list[0];
  const back = list.filter(e => e.id !== front?.id).slice(0, 3).reverse();
  const doneThisWeek = data.queues.filter(q => q.userId === user.id && q.status === 'completed' && Date.parse(data.today) - Date.parse(q.date) < 7 * 864e5).length;
  return <>
    <Header eyebrow="CampusQueue" title={`Halo, ${firstName(user)}`} subtitle="Urusan kampus, tanpa antre panjang." right={<View style={{marginTop: -30}}><Avatar name={user.name} size={54} /></View>} />
    <View style={[st.between, {alignItems: 'center', marginBottom: 20}]}>
      <Text style={t(22, 'bold', c.ink)}>Ambil antrean</Text>
      <Pill label={`${open.length} layanan buka`} bg="rgba(255,255,255,0.4)" fg="#3e527f" />
    </View>
    {!front ? <Glass style={{padding: 22}}><Text style={t(15, 'medium', c.body)}>Belum ada layanan tersedia.</Text></Glass> : <View>
      {back.map((e, i) => {const p = paletteFor(data, e.id), st2 = eventStats(e, data), inset = (back.length - i) * 4 + 0; return <Pressable key={e.id} accessibilityRole="button" accessibilityLabel={`Pilih ${e.name}`} onPress={() => setSelected(e.id)}
        style={{marginHorizontal: inset, height: 104, marginBottom: -37, borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)'}}>
        <LinearGradient colors={p.grad} start={{x: 0.5, y: 0}} end={{x: 0.5, y: 1}} style={StyleSheet.absoluteFill} />
        <View style={[st.between, {padding: 20, paddingTop: 15}]}>
          <View style={{flex: 1}}><Text style={t(17, 'semibold', p.ink)} numberOfLines={1}>{e.name}</Text><Text style={[t(11, 'medium', p.ink), {marginTop: 6}]}>{st2.waiting} menunggu  ·  Sisa kuota {st2.left}</Text></View>
          <View style={st.prefix}><Text style={t(15, 'bold', p.ink)}>{e.prefix}</Text></View>
        </View>
      </Pressable>;})}
      <FrontCard e={front} data={data} onTake={() => take(front)} blocked={!!mine} />
    </View>}
    <Folder style={{marginTop: 30}} onPress={() => go(mine ? 'Antrean' : 'Riwayat')}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, minHeight: 66}}>
        <Icon name={mine ? 'ticket' : 'history'} size={23} color="#3d4d7e" />
        <View style={{flex: 1, gap: 4}}>
          <Text style={t(14, 'semibold', c.ink2)}>{mine ? `Antrean aktif ${mine.queueNumber}` : 'Riwayat antrean'}</Text>
          <Text style={t(11, 'regular', '#52628d')}>{mine ? 'Satu akun hanya dapat memiliki satu antrean aktif.' : `${doneThisWeek} layanan selesai minggu ini`}</Text>
        </View>
        <Icon name="chevron-right" size={19} color="#3d4d7e" />
      </View>
    </Folder>
  </>;
}
function FrontCard({e, data, onTake, blocked}: {e: Event; data: State; onTake: () => void; blocked: boolean}) {
  const p = paletteFor(data, e.id), stt = eventStats(e, data);
  const light = p.ink !== '#ffffff';
  const tone = statusTone[e.status]!;
  return <View style={{borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', padding: 20, paddingTop: 22}}>
    <LinearGradient colors={p.grad} start={{x: 0.5, y: 0}} end={{x: 0.5, y: 1}} style={StyleSheet.absoluteFill} />
    <View style={[st.between, {alignItems: 'center'}]}>
      <Text style={[t(11, 'bold', p.sub), {flex: 1}]} numberOfLines={1}>{e.name.toUpperCase()}</Text>
      <Pill label={tone.label} dot bg={light ? 'rgba(23,58,41,0.10)' : 'rgba(255,255,255,0.2)'} fg={light ? p.ink : '#fff'} />
    </View>
    <View style={[st.between, {marginTop: 12}]}>
      <Text style={[t(27, 'bold', p.ink, {lh: 1.2}), {flex: 1}]} numberOfLines={2}>{e.description || e.name}</Text>
      <View style={{opacity: 0.55, paddingTop: 16}}><Icon name="school" size={46} color={p.ink} /></View>
    </View>
    <View style={[st.between, {alignItems: 'center', marginTop: 10}]}>
      <View style={{gap: 6}}><Text style={t(14, 'semibold', p.ink)}>{stt.waiting} menunggu</Text><Text style={t(11, 'medium', p.sub)}>Prefiks {e.prefix}</Text></View>
      <View style={{height: 34, borderRadius: 17, paddingHorizontal: 20, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.45)'}}><Text style={t(12, 'semibold', p.ink)}>Sisa kuota {stt.left}</Text></View>
    </View>
    <Btn style={{marginTop: 18}} variant="forest" height={46} textSize={15} iconRight="arrow-right"
      label={e.status !== 'open' ? `Layanan ${tone.label.toLowerCase()}` : stt.left === 0 ? 'Kuota habis' : blocked ? 'Sudah punya antrean aktif' : 'Ambil Nomor'}
      disabled={e.status !== 'open' || stt.left === 0 || blocked} onPress={onTake} />
  </View>;
}

// ---------------- Antrean Saya (U-07, U-08, U-12) ----------------
export function AntreanSaya({data, mine, cancel, go}: {data: State; mine?: Queue; cancel: (q: Queue) => void; go: (tab: string) => void}) {
  const [confirm, setConfirm] = useState(false);
  if (!mine) return <>
    <Header dark eyebrow="Antrean Saya" title="Antrean Saya" subtitle="Belum ada nomor untuk dipantau." />
    <Glass dark radius={26} style={{padding: 20, marginTop: 20, gap: 14}}>
      <Text style={t(20, 'semibold', '#dfe6ff')}>Belum ada antrean aktif</Text>
      <Text style={[t(13, 'semibold', '#c5d0ee'), {marginBottom: 22}]}>Ambil nomor untuk memulai.</Text>
      <Btn variant="violet" style={{backgroundColor: '#4a5bd6'}} height={48} textSize={15} label="Ambil Antrean" onPress={() => go('Ambil')} />
    </Glass>
  </>;
  const info = queueInfo(mine, data);
  if (mine.status !== 'waiting') return <>
    <Header dark eyebrow="Antrean Saya" title="Panggilan Loket" subtitle={info.event?.name} live="Langsung" />
    <View>
      <View style={[st.ghostTicket, {marginHorizontal: 20, height: 40, marginBottom: -28}]} />
      <View style={[st.ghostTicket, {marginHorizontal: 10, height: 40, marginBottom: -28}]} />
      <View style={st.ticketShell}>
        <LinearGradient colors={['#2a49c6', '#1a2f74', '#151f45']} start={{x: 0.2, y: 0}} end={{x: 0.8, y: 1}} style={StyleSheet.absoluteFill} />
        <View style={{position: 'absolute', alignSelf: 'center', top: 60, opacity: 0.4}}><Orb kind="glow" size={180} /></View>
        <View style={{alignSelf: 'center', backgroundColor: '#d4f8a4', borderRadius: 16, paddingHorizontal: 50, height: 32, justifyContent: 'center'}}><Text style={t(13, 'bold', '#21401f')}>{mine.status === 'serving' ? 'SEDANG DILAYANI' : 'GILIRAN ANDA'}</Text></View>
        <Text style={[t(84, 'bold', c.white, {ls: -0.06}), {textAlign: 'center', marginTop: 10}]} adjustsFontSizeToFit numberOfLines={1}>{mine.queueNumber}</Text>
        <Text style={[t(12, 'regular', '#c4d1f3'), {textAlign: 'center', marginTop: 14}]}>Dipanggil pukul {timeText(mine.calledAt)}</Text>
      </View>
    </View>
    <Text style={[t(24, 'semibold', '#eef2ff', {lh: 1.25}), {textAlign: 'center', marginTop: 34}]}>{mine.status === 'serving' ? 'Anda sedang dilayani di' : 'Silakan menuju ke'}{'\n'}<Text style={{color: c.lime}}>{info.counter?.name ?? 'loket'} sekarang</Text></Text>
    <Text style={[t(11, 'regular', '#879ccb'), {textAlign: 'center', marginTop: 28}]}>Diperbarui otomatis setiap 5 detik</Text>
  </>;
  return <>
    <Header dark eyebrow="Antrean Aktif" title="Antrean Saya" subtitle={info.event?.name} live="Langsung" />
    <View style={st.ticketShell}>
      <LinearGradient colors={grad.ticket} locations={[0, 0.55, 1]} start={{x: 0.3, y: 0}} end={{x: 0.7, y: 1}} style={StyleSheet.absoluteFill} />
      <View style={{position: 'absolute', left: '28%', top: 30, opacity: 0.42}}><Orb kind="glow" size={146} /></View>
      <View style={[st.between, {alignItems: 'center'}]}>
        <Text style={t(10, 'semibold', '#bdcff9')}>NOMOR ANTREANMU</Text>
        <View style={st.darkStatus}><Text style={t(11, 'semibold', '#b7cbff', {ls: 0})}>Menunggu</Text></View>
      </View>
      <Text style={[t(88, 'bold', c.white, {ls: -0.06}), {textAlign: 'center', marginTop: 6}]} adjustsFontSizeToFit numberOfLines={1}>{mine.queueNumber}</Text>
      <Text style={t(12, 'regular', '#b3c5f0')}>Diambil pukul {timeText(mine.createdAt)}</Text>
      <Perforation notch="#11214b" />
      <View style={{flexDirection: 'row'}}>
        <View style={{flex: 1, gap: 8}}><Text style={t(12, 'medium', c.dLabel)}>Sedang dipanggil</Text><Text style={t(30, 'semibold', c.white)}>{info.calling?.queueNumber ?? '—'}</Text></View>
        <View style={{flex: 1, gap: 8, paddingLeft: 24}}><Text style={t(12, 'medium', c.dLabel)}>Tujuan layanan</Text><Text style={t(30, 'semibold', c.white)} numberOfLines={1} adjustsFontSizeToFit>{info.counter?.name ?? '—'}</Text></View>
      </View>
      <View style={st.aheadBar}><Icon name="list" size={18} color="#d9fbb7" /><Text style={t(16, 'semibold', '#e1fac7')}>{info.ahead} antrean di depan</Text></View>
    </View>
    {info.ahead <= 3 && <View style={st.notice}>
      <Orb size={43} />
      <View style={{flex: 1, gap: 6}}>
        <Text style={t(17, 'semibold', '#edf1ff')}>{info.ahead === 0 ? 'Giliranmu berikutnya' : 'Giliranmu hampir tiba'}</Text>
        <Text style={t(12, 'regular', c.dBody, {lh: 1.25})}>Silakan bersiap ke {info.counter?.name ?? 'loket'}.{'\n'}Estimasi giliran ± {info.eta} menit.</Text>
      </View>
    </View>}
    <Btn style={{marginTop: 24}} variant="ghostDark" height={50} textSize={14} icon="x-circle" label="Batalkan Antrean" onPress={() => setConfirm(true)} />
    <Text style={[t(11, 'regular', '#879ccb'), {textAlign: 'center', marginTop: 14}]}>Diperbarui otomatis setiap 5 detik</Text>
    <Dialog visible={confirm} onClose={() => setConfirm(false)} title="Batalkan antrean?" message="Nomor antrean aktif akan dibatalkan dan dipindahkan ke Riwayat." actions={[{label: 'Ya, batalkan', onPress: () => cancel(mine)}, {label: 'Tetap menunggu'}]} />
  </>;
}
function Perforation({notch}: {notch: string}) {
  return <View style={{height: 40, justifyContent: 'center', marginHorizontal: -24}}>
    <View style={{marginHorizontal: 20, borderTopWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(180,204,255,0.32)'}} />
    <View style={[st.notch, {left: -8, backgroundColor: notch}]} /><View style={[st.notch, {right: -8, backgroundColor: notch}]} />
  </View>;
}

// ---------------- Modal Tiket (U-05) ----------------
export function TicketModal({queue, data, onClose, onTrack}: {queue: Queue | null; data: State | null; onClose: () => void; onTrack: () => void}) {
  const insets = useSafeAreaInsets();
  const bars = useMemo(() => (queue?.id ?? '').replace(/-/g, '').split('').map(ch => 2 + (parseInt(ch, 16) % 4) * 2), [queue?.id]);
  if (!queue || !data) return null;
  const event = data.events.find(e => e.id === queue.eventId);
  return <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
    <View style={{flex: 1, backgroundColor: '#0b1020'}}>
      <Background variant="dark" /><StatusBar style="light" />
      <View style={{flex: 1, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16, paddingHorizontal: 32}}>
        <View style={{position: 'absolute', right: 24, top: insets.top + 24}}><IconBtn dark icon="x" label="Tutup" onPress={onClose} /></View>
        <View style={{alignSelf: 'center', width: 52, height: 52, borderRadius: 26, backgroundColor: '#d4f8a4', alignItems: 'center', justifyContent: 'center', marginTop: 20}}><Icon name="check" size={24} color="#21401f" /></View>
        <Text style={[t(30, 'bold', c.white, {lh: 1.15}), {textAlign: 'center', marginTop: 22}]}>Tiket Berhasil{'\n'}Diambil</Text>
        <Text style={[t(12, 'regular', '#b9c6e8'), {textAlign: 'center', marginTop: 16}]}>Nomormu tersimpan. Sekarang, tinggal pantau.</Text>
        <View style={{marginTop: 28}}>
          <View style={{marginHorizontal: 20, height: 40, borderRadius: 26, backgroundColor: '#b8a8f2', marginBottom: -30}} />
          <View style={{marginHorizontal: 10, height: 40, borderRadius: 26, backgroundColor: '#d3f3a8', marginBottom: -28}} />
          <View style={{borderRadius: 26, overflow: 'hidden', padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)'}}>
            <LinearGradient colors={grad.ticketLight} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={StyleSheet.absoluteFill} />
            <View style={st.between}><Text style={t(10, 'semibold', '#4f5f93')}>TIKET ANTREANMU</Text><Text style={t(10, 'medium', 'rgba(96,120,220,0.55)')}>● Menunggu</Text></View>
            <Text style={[t(76, 'bold', '#23335b', {ls: -0.04}), {textAlign: 'center', marginTop: 8}]} adjustsFontSizeToFit numberOfLines={1}>{queue.queueNumber}</Text>
            <Text style={[t(18, 'semibold', '#2c3f78'), {textAlign: 'center', marginTop: 6}]}>{event?.name}</Text>
            <Text style={[t(12, 'regular', '#5c6c98'), {textAlign: 'center', marginTop: 12}]}>Diambil {timeText(queue.createdAt)}</Text>
            <Perforation notch="#0e1426" />
            <View style={{flexDirection: 'row', justifyContent: 'center', gap: 3, height: 42}}>{bars.slice(0, 26).map((w, i) => <View key={i} style={{width: w, backgroundColor: '#3a4a75'}} />)}</View>
            <Text style={[t(9, 'medium', '#5c6c98'), {textAlign: 'center', marginTop: 14}]}>CAMPUSQUEUE  ·  {queue.queueNumber.replace('-', '')}</Text>
          </View>
        </View>
        <View style={{flex: 1}} />
        <Btn variant="limeGrad" height={58} label="Pantau Antrean Saya" iconRight="arrow-right" onPress={onTrack} />
        <Text style={[t(11, 'regular', '#93a2c9'), {textAlign: 'center', marginTop: 18}]}>Satu akun hanya dapat memiliki satu antrean aktif.</Text>
      </View>
    </View>
  </Modal>;
}

// ---------------- Riwayat (U-14 a–d) ----------------
type Filter = 'all' | 'completed' | 'skipped' | 'cancelled';
const reason: Record<string, {icon: IconName; color: string; text: (counter?: string) => string}> = {
  completed: {icon: 'check-circle', color: '#3f7a34', text: cn => `Selesai dilayani · ${cn ?? 'Loket'}`},
  skipped: {icon: 'skip-forward', color: '#9a6d12', text: () => 'Tidak hadir saat dipanggil'},
  cancelled: {icon: 'x-circle', color: '#b04a64', text: () => 'Dibatalkan oleh Anda'},
};
export function HistoryCard({q, data}: {q: Queue; data: State}) {
  const r = reason[q.status] ?? reason.cancelled!;
  const counter = data.counters.find(x => x.id === q.counterId)?.name;
  return <Folder tabWidth={158} style={{marginBottom: 18}}>
    <View style={{padding: 20, paddingTop: 16, gap: 4}}>
      <View style={[st.between, {alignItems: 'flex-start'}]}>
        <Text style={t(30, 'bold', '#23335b')}>{q.queueNumber}</Text>
        <StatusPill status={q.status} style={{paddingHorizontal: 30, marginTop: 4}} />
      </View>
      <Text style={t(14, 'semibold', '#34477a')}>{data.events.find(e => e.id === q.eventId)?.name ?? 'Layanan'}</Text>
      <View style={[st.between, {alignItems: 'center', marginTop: 16}]}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1}}><Icon name={r.icon} size={14} color={r.color} /><Text style={t(11, 'regular', c.muted)} numberOfLines={1}>{r.text(counter)}</Text></View>
        <Icon name="chevron-right" size={18} color="#53628c" />
      </View>
    </View>
  </Folder>;
}
export function Riwayat({history, data, refresh}: {history: Queue[]; data: State; refresh: () => void}) {
  const [f, setF] = useState<Filter>('all');
  const shown = history.filter(q => f === 'all' || q.status === f);
  const groups = shown.reduce<Record<string, Queue[]>>((acc, q) => {(acc[monthText(q.createdAt)] ??= []).push(q); return acc;}, {});
  return <>
    <Header eyebrow="Arsip Layanan" title={'Riwayat\nAntrean'} subtitle="Semua perjalanan layananmu, tersimpan." right={<IconBtn icon="history" label="Muat ulang riwayat" onPress={refresh} />} />
    <Chips value={f} onChange={setF} options={[{key: 'all', label: 'Semua'}, {key: 'completed', label: 'Selesai'}, {key: 'skipped', label: 'Dilewati'}, {key: 'cancelled', label: 'Dibatalkan'}]} />
    <View style={{height: 28}} />
    {!shown.length && <Glass style={{padding: 22, gap: 6}}><Text style={t(16, 'semibold', c.ink2)}>Belum ada riwayat</Text><Text style={t(13, 'regular', c.muted)}>Antrean yang selesai, dilewati, atau dibatalkan akan tampil di sini.</Text></Glass>}
    {Object.entries(groups).map(([month, qs]) => <View key={month}>
      <View style={[st.between, {marginBottom: 14}]}><Text style={t(13, 'semibold', '#3e527f')}>{month}</Text><Text style={t(10, 'regular', c.faint)}>{qs.length} antrean terakhir</Text></View>
      {qs.map(q => <View key={q.id}>
        <Text style={[t(9, 'semibold', '#4f5f93'), {position: 'absolute', left: 14, top: 6, zIndex: 2}]}>{dayText(q.createdAt)} · {timeText(q.createdAt)} WIB</Text>
        <HistoryCard q={q} data={data} />
      </View>)}
    </View>)}
  </>;
}

// ---------------- Profil (U-15, U-15b) ----------------
const roleLabel = {user: 'Mahasiswa', petugas: 'Petugas', admin: 'Admin'} as const;
export function Profil({user, vibrate, setVibrate, logout, children}: {user: User; vibrate: boolean; setVibrate: (v: boolean) => void; logout: () => void; children?: React.ReactNode}) {
  const [help, setHelp] = useState(false), [confirm, setConfirm] = useState(false);
  return <>
    <Header eyebrow="Akun Kampus" title="Profil" subtitle="Akun kampus dan preferensimu." />
    <Glass radius={28} style={{alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20}}>
      <Avatar name={user.name} size={80} />
      <Text style={[t(24, 'bold', '#23335b'), {marginTop: 16, textAlign: 'center'}]}>{user.name}</Text>
      <Text style={[t(15, 'regular', '#53628c'), {marginTop: 10}]}>{user.email}</Text>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, height: 30, paddingHorizontal: 20, borderRadius: 15, backgroundColor: 'rgba(200,210,245,0.6)'}}><Icon name="school" size={17} color="#33468a" /><Text style={t(12, 'semibold', '#33468a')}>{roleLabel[user.role]}</Text></View>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18}}><Icon name="shield" size={13} color="#53628c" /><Text style={t(11, 'regular', '#53628c')}>Akun kampus terverifikasi</Text></View>
    </Glass>
    <Text style={[t(21, 'bold', c.ink), {marginTop: 34, marginBottom: 16}]}>Preferensi & bantuan</Text>
    <Glass radius={22} style={st.prefRow}>
      <View style={st.iconTile}><Icon name="vibrate" size={20} color="#4a5a8c" /></View>
      <View style={{flex: 1, gap: 6}}><Text style={t(13, 'semibold', c.ink2)}>Pengaturan Notifikasi Getar</Text><Text style={t(11, 'regular', c.muted)}>{vibrate ? 'Aktif saat giliran hampir tiba' : 'Nonaktif — tidak ada getaran'}</Text></View>
      <Toggle label="Notifikasi getar" value={vibrate} onChange={setVibrate} />
    </Glass>
    <Glass radius={22} style={[st.prefRow, {marginTop: 14}]} onPress={() => setHelp(true)}>
      <View style={st.iconTile}><Icon name="help-circle" size={20} color="#4a5a8c" /></View>
      <View style={{flex: 1, gap: 6}}><Text style={t(13, 'semibold', c.ink2)}>Bantuan Layanan</Text><Text style={t(11, 'regular', c.muted)}>Panduan & pusat bantuan</Text></View>
      <Icon name="chevron-right" size={20} color="#4a5a8c" />
    </Glass>
    {children}
    <Btn style={{marginTop: 26}} variant="danger" height={50} textSize={14} icon="log-out" label="Keluar (Logout)" onPress={() => setConfirm(true)} />
    <Dialog visible={help} onClose={() => setHelp(false)} title="Bantuan layanan" message="Ambil nomor di menu Ambil, pantau di Antrean, dan datang ke loket saat nomormu dipanggil. Untuk kendala akun, hubungi admin layanan kampus." actions={[{label: 'Mengerti'}]} />
    <Dialog visible={confirm} onClose={() => setConfirm(false)} title="Keluar dari akun?" message="Anda perlu masuk kembali untuk memantau antrean." actions={[{label: 'Ya, keluar', onPress: logout}, {label: 'Batal'}]} />
  </>;
}

const st = StyleSheet.create({
  between: {flexDirection: 'row', justifyContent: 'space-between', gap: 10},
  dot: {position: 'absolute', right: 9, top: 9, width: 6, height: 6, borderRadius: 3, backgroundColor: c.indigo},
  trackBtn: {marginTop: 18, height: 36, borderRadius: 18, backgroundColor: 'rgba(164,180,226,0.22)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16},
  iconTile: {width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(164,180,226,0.18)', alignItems: 'center', justifyContent: 'center'},
  prefix: {width: 32, height: 31, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center'},
  ticketShell: {borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', padding: 24, paddingBottom: 20},
  ghostTicket: {borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(60,90,200,0.35)'},
  darkStatus: {width: 110, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(222,230,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)'},
  notch: {position: 'absolute', width: 16, height: 16, borderRadius: 8},
  aheadBar: {marginTop: 18, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16},
  notice: {marginTop: 23, borderRadius: 26, backgroundColor: 'rgba(108,124,248,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', padding: 19, flexDirection: 'row', alignItems: 'center', gap: 18, minHeight: 98},
  prefRow: {flexDirection: 'row', alignItems: 'center', gap: 16, padding: 14, paddingHorizontal: 16, minHeight: 72},
});
