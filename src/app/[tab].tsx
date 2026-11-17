import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Redirect, useLocalSearchParams, useRouter} from 'expo-router';
import {ActivityIndicator, Text, Vibration, View} from 'react-native';
import {BottomNav, Btn, Dialog, Glass, Screen, Background} from '../components/ui';
import {Login} from '../components/Login';
import {Ambil, AntreanSaya, Beranda, HistoryCard, Profil, Riwayat, TicketModal, queueInfo} from '../components/UserScreens';
import {Daftar, Kontrol} from '../components/StaffScreens';
import {Kelola, Statistik} from '../components/Manage';
import {ApiError, prefs, request, session, type Queue, type State, type User} from '../services/api';
import {c, t} from '../theme';

const active = ['waiting', 'called', 'serving'];
const darkTabs = ['Antrean', 'Kontrol', 'Daftar'];
const navTabs = {user: ['Beranda', 'Ambil', 'Antrean', 'Riwayat', 'Profil'], petugas: ['Kontrol', 'Daftar', 'Profil'], admin: ['Ambil', 'Kontrol', 'Kelola', 'Statistik', 'Profil']} as const;
const extraTabs = {user: [], petugas: [], admin: ['Antrean', 'Daftar']} as const;
const homeTab = {user: 'Beranda', petugas: 'Kontrol', admin: 'Kelola'} as const;

export default function Index() {
  const [user, setUser] = useState<User | null>(null), [ready, setReady] = useState(false), [data, setData] = useState<State | null>(null);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [vibrate, setVibrateState] = useState(true);
  const [notice, setNotice] = useState<{title: string; message: string} | null>(null), [ticket, setTicket] = useState<Queue | null>(null), [counterId, setCounterId] = useState('');
  const notified = useRef('');
  const router = useRouter();
  const params = useLocalSearchParams<{tab: string}>();
  const tab = params.tab || 'Beranda';
  const setTab = useCallback((next: string) => router.replace({pathname: '/[tab]', params: {tab: next}}), [router]);

  useEffect(() => {
    Promise.all([session.load(), prefs.loadVibrate()]).then(([u, v]) => {setUser(u); setVibrateState(v);}).catch(() => setError('Sesi tidak dapat dibaca.')).finally(() => setReady(true));
  }, []);
  const refresh = useCallback(async () => {
    if (!user) return null;
    try {const next = await request<State>('/state', user); setData(next); setError(''); return next;}
    catch (e) {setError((e as Error).message); return null;}
  }, [user]);
  useEffect(() => {
    if (!user) return;
    const initial = setTimeout(refresh, 0), timer = setInterval(refresh, 5000);
    return () => {clearTimeout(initial); clearInterval(timer);};
  }, [user, refresh]);

  const mine = data?.queues.find(q => q.userId === user?.id && active.includes(q.status));
  useEffect(() => {
    if (!mine || !data || mine.status !== 'waiting' || !vibrate) return;
    if (queueInfo(mine, data).ahead <= 3 && notified.current !== mine.id) {notified.current = mine.id; Vibration.vibrate(300);}
  }, [data, mine, vibrate]);

  async function action(path: string, body: object, done?: () => void) {
    if (!user || busy) return false;
    setBusy(true);
    try {
      const result = await request<Queue>(path, user, body);
      await refresh(); done?.();
      if (path === '/take-queue') setTicket(result);
      return true;
    } catch (e) {
      if (path === '/take-queue' && e instanceof ApiError && e.code === 'ACTIVE_QUEUE') {await refresh(); setTab('Antrean');}
      setNotice({title: 'Tidak dapat melanjutkan', message: (e as Error).message});
      return false;
    } finally {setBusy(false);}
  }
  async function logout() {await session.clear(); setUser(null); setData(null); setTicket(null); setTab('Beranda');}
  const setVibrate = (v: boolean) => {setVibrateState(v); prefs.saveVibrate(v);};

  if (!ready) return <View style={{flex: 1}}><Background /><ActivityIndicator style={{flex: 1}} color={c.brand} /></View>;
  if (!user) return <Login onLogin={u => {setUser(u); setTab(homeTab[u.role]);}} />;

  const nav: readonly string[] = navTabs[user.role];
  if (![...nav, ...extraTabs[user.role]].includes(tab)) return <Redirect href={{pathname: '/[tab]', params: {tab: homeTab[user.role]}}} />;
  const dark = darkTabs.includes(tab);
  const history = data?.queues.filter(q => q.userId === user.id && !active.includes(q.status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) ?? [];
  const staffProps = data ? {data, user, action, selected: counterId, setSelected: setCounterId} : null;

  return <Screen key={tab} variant={dark ? 'dark' : 'light'} padH={tab === 'Kontrol' || tab === 'Daftar' ? 24 : 32} onRefresh={refresh}
    nav={<BottomNav tabs={[...nav]} active={nav.includes(tab) ? tab : tab === 'Daftar' ? 'Kontrol' : 'Ambil'} onPress={setTab} />}>
    {!!error && <Glass dark={dark} style={{padding: 18, gap: 12, marginBottom: 18}}>
      <Text accessibilityRole="alert" style={t(14, 'semibold', dark ? '#ffb4c4' : c.danger)}>{error}</Text>
      <Btn label="Coba lagi" variant={dark ? 'ghostDark' : 'ghost'} height={44} onPress={refresh} />
    </Glass>}
    {!data && !error && <ActivityIndicator style={{marginTop: 80}} color={dark ? '#fff' : c.brand} />}
    {data && <>
      {tab === 'Beranda' && <Beranda user={user} data={data} mine={mine} go={setTab} />}
      {tab === 'Ambil' && <Ambil user={user} data={data} mine={mine} go={setTab} take={e => action('/take-queue', {eventId: e.id})} />}
      {tab === 'Antrean' && <AntreanSaya data={data} mine={mine} go={setTab} cancel={q => action('/cancel', {queueId: q.id})} />}
      {tab === 'Riwayat' && <Riwayat history={history} data={data} refresh={refresh} />}
      {tab === 'Kontrol' && staffProps && <Kontrol {...staffProps} />}
      {tab === 'Daftar' && staffProps && <Daftar {...staffProps} />}
      {tab === 'Kelola' && <Kelola data={data} action={action} />}
      {tab === 'Statistik' && <Statistik data={data} />}
      {tab === 'Profil' && <Profil user={user} vibrate={vibrate} setVibrate={setVibrate} logout={logout}>
        {user.role === 'admin' && history.length > 0 && <View style={{marginTop: 30}}>
          <Text style={[t(21, 'bold', c.ink), {marginBottom: 16}]}>Riwayat saya</Text>
          {history.slice(0, 5).map(q => <HistoryCard key={q.id} q={q} data={data} />)}
        </View>}
      </Profil>}
    </>}
    <TicketModal queue={ticket} data={data} onClose={() => setTicket(null)} onTrack={() => {setTicket(null); setTab('Antrean');}} />
    <Dialog visible={!!notice} onClose={() => setNotice(null)} title={notice?.title ?? ''} message={notice?.message ?? ''} actions={[{label: 'Mengerti'}]} />
  </Screen>;
}
