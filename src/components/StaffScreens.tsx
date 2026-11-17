import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Glass, Header, Icon, Orb, Pill, SectionTitle, Segment, StatusPill, type IconName} from './ui';
import {c, statusTone, t} from '../theme';
import type {Counter, Queue, State, User} from '../services/api';
import {timeText, type Action} from './UserScreens';

export function useCounter(data: State, user: User, selected: string) {
  const available = user.role === 'admin' ? data.counters : data.counters.filter(x => x.petugasId === user.id);
  const counter = available.find(x => x.id === selected) ?? available[0];
  if (!counter) return {available, counter: undefined, current: undefined, waiting: [] as Queue[], skipped: [] as Queue[]};
  const current = data.queues.find(q => q.counterId === counter.id && (q.status === 'called' || q.status === 'serving'));
  const list = data.queues.filter(q => q.eventId === counter.eventId && q.date === data.today).sort((a, b) => a.sequence - b.sequence);
  return {available, counter, current, waiting: list.filter(q => q.status === 'waiting'), skipped: list.filter(q => q.status === 'skipped')};
}
const nameOf = (data: State, q: Queue) => data.users.find(u => u.id === q.userId)?.name ?? 'Mahasiswa';
const officerOf = (data: State, cn: Counter, user: User) => (data.users.find(u => u.id === cn.petugasId) ?? (cn.petugasId === user.id ? user : undefined))?.name.split(' ')[0];

function CounterPicker({available, counter, onPick}: {available: Counter[]; counter: Counter; onPick: (id: string) => void}) {
  if (available.length < 2) return null;
  return <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -12, marginBottom: 18}}>
    {available.map(x => {const on = x.id === counter.id; return <Pressable key={x.id} accessibilityRole="button" accessibilityState={{selected: on}} onPress={() => onPick(x.id)}
      style={{height: 32, paddingHorizontal: 14, borderRadius: 16, justifyContent: 'center', borderWidth: 1, borderColor: on ? 'rgba(212,255,174,0.6)' : 'rgba(255,255,255,0.2)', backgroundColor: on ? 'rgba(201,248,152,0.14)' : 'rgba(255,255,255,0.05)'}}>
      <Text style={t(12, 'semibold', on ? c.lime : c.dMuted)}>{x.name}</Text>
    </Pressable>;})}
  </View>;
}
function NoCounter() {
  return <>
    <Header dark eyebrow="Kontrol Antrean" title="Belum ada loket" subtitle="Minta admin menugaskan Anda ke loket." size={36} />
    <Glass dark style={{padding: 22}}><Text style={t(14, 'medium', c.dBody)}>Setelah ditugaskan, kontrol panggilan antrean akan tampil di sini.</Text></Glass>
  </>;
}

// ---------------- Kontrol Loket (P-01 a–f) ----------------
export function Kontrol({data, user, action, selected, setSelected}: {data: State; user: User; action: Action; selected: string; setSelected: (id: string) => void}) {
  const {available, counter, current, waiting} = useCounter(data, user, selected);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id);}, []);
  if (!counter) return <NoCounter />;
  const event = data.events.find(e => e.id === counter.eventId);
  const tone = statusTone[event?.status ?? 'open']!;
  const state: 'empty' | 'called' | 'serving' = !current ? 'empty' : current.status === 'serving' ? 'serving' : 'called';
  const trans = (act: string) => current && action('/transition', {counterId: counter.id, queueId: current.id, action: act});
  const secs = current?.servedAt ? Math.max(0, Math.floor((now - Date.parse(current.servedAt)) / 1000)) : 0;
  const duration = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  const officer = officerOf(data, counter, user);
  return <>
    <Header dark eyebrow="Kontrol Antrean" title={counter.name} size={44} subtitle={`${event?.name ?? 'Layanan'}${officer ? ` · Petugas ${officer}` : ''}`}
      right={<Pill label={tone.label} dot bg="rgba(207,255,158,0.13)" fg={event?.status === 'open' ? '#d5ffb0' : '#f2cf86'} style={{height: 30, paddingHorizontal: 20}} />} />
    <CounterPicker available={available} counter={counter} onPick={setSelected} />
    <Glass dark radius={30} style={{padding: 22, paddingTop: 20}}>
      <Text style={t(10, 'semibold', '#a9bfef')}>{state === 'serving' ? 'SEDANG DILAYANI' : state === 'called' ? 'SEDANG DIPANGGIL' : 'LOKET TERSEDIA'}</Text>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <View style={{flex: 1}}>
          {current ? <Text style={t(62, 'bold', c.white)} adjustsFontSizeToFit numberOfLines={1}>{current.queueNumber}</Text> : <View style={{height: 75, justifyContent: 'center'}}><View style={{width: 62, height: 6, backgroundColor: c.white}} /></View>}
          <Text style={[t(15, 'medium', '#d4ddf3'), {marginTop: 2}]}>{current ? nameOf(data, current) : 'Loket siap memanggil'}</Text>
          <StatusPill dark status={state === 'empty' ? 'ready' : state} style={{marginTop: 12, minWidth: 100}} />
        </View>
        <View style={{opacity: state === 'empty' ? 0.45 : 1}}><Orb kind="voice" size={106} /></View>
      </View>
      <View style={{height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 16, marginBottom: 12}} />
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
        <Icon name="clock" size={15} color="#bac9eb" />
        <Text style={[t(12, 'medium', '#bac9eb'), {flex: 1}]}>{state === 'serving' ? `Durasi ${duration}` : state === 'called' ? 'Menunggu kedatangan' : 'Belum ada layanan aktif'}</Text>
        <Text style={t(11, 'medium', '#a1b2d9')}>{current ? 1 : 0} layanan aktif</Text>
      </View>
    </Glass>
    <ActionBtn style={{marginTop: 20, height: 56, borderRadius: 28}} big label="Panggil Berikutnya" icon={state === 'empty' ? 'chevron-right' : 'lock'} mode={state === 'empty' && waiting.length ? 'violet' : 'ghost'}
      onPress={() => action('/call-next', {counterId: counter.id})} />
    <Text style={[t(11, 'regular', '#94a8d3'), {textAlign: 'center', marginTop: 12, marginBottom: 14}]}>
      {state === 'serving' ? `Selesaikan ${current!.queueNumber} sebelum panggilan berikutnya.` : state === 'called' ? 'Panggilan aktif. Tunggu mahasiswa tiba.' : waiting.length ? 'Loket siap. Panggil antrean berikutnya.' : 'Belum ada antrean menunggu.'}
    </Text>
    <View style={{flexDirection: 'row', gap: 12}}>
      <ActionBtn label="Mulai Layani" icon="play" mode={state === 'called' ? 'violet' : 'ghost'} onPress={() => trans('serve')} />
      <ActionBtn label="Panggil Ulang" icon="rotate-ccw" mode={state === 'called' ? 'violet' : 'ghost'} onPress={() => trans('recall')} />
    </View>
    <View style={{flexDirection: 'row', gap: 12, marginTop: 10}}>
      <ActionBtn label="Lewati" icon="skip-forward" mode={state === 'called' ? 'violet' : 'ghost'} onPress={() => trans('skip')} />
      <ActionBtn label="Selesai" icon="check" mode={state === 'serving' ? 'lime' : 'outline'} onPress={() => trans('complete')} />
    </View>
    <Glass dark radius={26} tint="rgba(255,255,255,0.08)" style={{marginTop: 26, padding: 18, paddingTop: 8}}>
      <View style={{alignSelf: 'center', width: 42, height: 3, borderRadius: 2, backgroundColor: 'rgba(140,157,197,0.5)', marginBottom: 14}} />
      <View style={[st.between, {marginBottom: 16, paddingHorizontal: 2}]}><Text style={t(16, 'semibold', c.dText)}>Berikutnya</Text><Text style={t(11, 'medium', '#a1b4df')}>{waiting.length} menunggu</Text></View>
      <View style={{flexDirection: 'row', gap: 7}}>
        {[0, 1, 2].map(i => <View key={i} style={[st.chip, {backgroundColor: i === 0 && waiting[0] ? 'rgba(125,141,251,0.25)' : 'rgba(255,255,255,0.05)'}]}>
          <Text style={t(14, 'semibold', i === 0 ? '#e1e7ff' : '#a1b4df')}>{waiting[i]?.queueNumber ?? '—'}</Text>
        </View>)}
      </View>
    </Glass>
  </>;
}

function ActionBtn({label, icon, mode, onPress, style, big}: {label: string; icon: IconName; mode: 'violet' | 'ghost' | 'lime' | 'outline'; onPress: () => void; style?: object; big?: boolean}) {
  const disabled = mode === 'ghost' || mode === 'outline';
  const look = {
    violet: {bg: '#5f6ff0', border: 'rgba(255,255,255,0.25)', fg: c.white, ic: big ? c.white : '#9aa6ff'},
    ghost: {bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)', fg: c.dMuted, ic: c.dMuted},
    lime: {bg: c.limeBtn, border: 'rgba(255,255,255,0.7)', fg: c.limeInk, ic: c.limeInk},
    outline: {bg: 'transparent', border: 'rgba(255,255,255,0.7)', fg: c.dMuted, ic: '#43507a'},
  }[mode];
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress}
    style={({pressed}) => [{flex: 1, height: 49, borderRadius: 24, borderWidth: 1, borderColor: look.border, backgroundColor: look.bg, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 16, justifyContent: big ? 'center' : 'flex-start'}, pressed && {opacity: 0.8}, style]}>
    <Icon name={icon} size={big ? 20 : 18} color={look.ic} />
    <Text style={[t(big ? 16 : 13, 'semibold', look.fg), {flexShrink: 1}]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
  </Pressable>;
}

// ---------------- Daftar Antrean (P-02, P-02b) ----------------
export function Daftar({data, user, action, selected, setSelected}: {data: State; user: User; action: Action; selected: string; setSelected: (id: string) => void}) {
  const {available, counter, current, waiting, skipped} = useCounter(data, user, selected);
  const [tab, setTab] = useState<'waiting' | 'skipped'>('waiting');
  if (!counter) return <NoCounter />;
  const event = data.events.find(e => e.id === counter.eventId);
  const recall = (q: Queue) => action('/transition', {counterId: counter.id, queueId: q.id, action: 'late-recall'});
  return <>
    <Header dark eyebrow="Antrean Petugas" title="Daftar Antrean" subtitle={`${counter.name} · ${event?.name ?? ''}`} live={current ? 'Melayani' : 'Siap'} />
    <CounterPicker available={available} counter={counter} onPick={setSelected} />
    <Segment dark value={tab} onChange={setTab} options={[{key: 'waiting', label: `Menunggu (${waiting.length})`}, {key: 'skipped', label: `Dilewati (${skipped.length})`}]} />
    <View style={{height: 30}} />
    {tab === 'waiting' ? <>
      <SectionTitle dark title="Urutan berikutnya" right={`${waiting.length} tiket`} />
      {!waiting.length && <Glass dark radius={24} style={{padding: 20}}><Text style={t(14, 'medium', c.dBody)}>Belum ada antrean menunggu.</Text></Glass>}
      {waiting.slice(0, 20).map(q => <Glass key={q.id} dark radius={24} style={st.row}>
        <View style={{width: 126}}><Text style={t(30, 'bold', c.white)}>{q.queueNumber}</Text><Text style={[t(10, 'medium', '#a1b4df'), {marginTop: 2}]}>Menunggu</Text></View>
        <View style={{flex: 1, gap: 8}}><Text style={t(14, 'semibold', c.dText)} numberOfLines={1}>{nameOf(data, q)}</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 7}}><Icon name="clock" size={13} color="#a1b4df" /><Text style={t(11, 'regular', '#a1b4df')}>Tiba {timeText(q.createdAt)} WIB</Text></View></View>
        <Icon name="chevron-right" size={20} color="#a1b4df" />
      </Glass>)}
      {skipped.length > 0 && <View style={{marginTop: 22}}>
        <SectionTitle dark title="Perlu dipanggil kembali" right={`Lihat ${skipped.length} tiket`} onRight={() => setTab('skipped')} />
        <SkippedCard q={skipped[0]!} data={data} disabled={!!current} onRecall={recall} />
      </View>}
    </> : <>
      <SectionTitle dark title="Perlu dipanggil kembali" right={`${skipped.length} tiket`} />
      {!skipped.length && <Glass dark radius={24} style={{padding: 20}}><Text style={t(14, 'medium', c.dBody)}>Tidak ada antrean yang dilewati.</Text></Glass>}
      {skipped.map(q => <SkippedCard key={q.id} q={q} data={data} disabled={!!current} onRecall={recall} />)}
    </>}
  </>;
}
function SkippedCard({q, data, disabled, onRecall}: {q: Queue; data: State; disabled: boolean; onRecall: (q: Queue) => void}) {
  return <Glass dark radius={26} tint="rgba(255,255,255,0.06)" style={{padding: 16, paddingTop: 14, marginBottom: 14}}>
    <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4}}>
      <Text style={[t(30, 'bold', '#f2cf86'), {width: 126}]}>{q.queueNumber}</Text>
      <View style={{flex: 1, gap: 8}}><Text style={t(14, 'semibold', c.dText)}>{nameOf(data, q)}</Text><Text style={t(11, 'regular', '#a1b4df')}>Dilewati {timeText(q.calledAt)} WIB</Text></View>
    </View>
    <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={() => onRecall(q)}
      style={({pressed}) => [{marginTop: 14, height: 34, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8}, disabled && {opacity: 0.45}, pressed && {opacity: 0.8}]}>
      <Icon name="rotate-ccw" size={15} color={c.dText} /><Text style={t(12, 'semibold', c.dText)}>{disabled ? 'Selesaikan panggilan aktif dulu' : 'Panggil Kembali'}</Text>
    </Pressable>
  </Glass>;
}

const st = StyleSheet.create({
  between: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  row: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, minHeight: 82, marginBottom: 14},
  chip: {flex: 1, height: 36, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
});
