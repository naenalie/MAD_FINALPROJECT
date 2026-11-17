import React, {useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {Btn, Chips, Dialog, Field, Icon, Screen} from './ui';
import {c, t} from '../theme';
import {request, session, type User} from '../services/api';

type Role = 'user' | 'petugas' | 'admin';
// Demo accounts from backend/seed.json; picking a role fills the matching email (Figma P-00 / A-00).
const demoEmail: Record<Role, string> = {user: 'user@campusqueue.test', petugas: 'petugas@campusqueue.test', admin: 'admin@campusqueue.test'};

export function Login({onLogin}: {onLogin: (u: User) => void}) {
  const [role, setRole] = useState<Role>('user');
  const [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [show, setShow] = useState(false), [error, setError] = useState(''), [busy, setBusy] = useState(false), [help, setHelp] = useState(false);
  async function submit() {
    setBusy(true); setError('');
    try {const u = await request<User>('/login', null, {email, password}); await session.save(u); onLogin(u);}
    catch (e) {setError((e as Error).message);}
    finally {setBusy(false);}
  }
  const pick = (r: Role) => {setRole(r); setEmail(demoEmail[r]); setError('');};
  return <Screen variant="login" padH={24}>
    <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
      <View style={{width: 38, height: 38, borderRadius: 12, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center'}}><Icon name="align-left" size={20} color={c.white} /></View>
      <Text style={t(22, 'bold', '#1c2b63')}>CampusQueue</Text>
    </View>
    <Text style={[t(10, 'semibold', '#3d4f8e'), {marginTop: 27}]}>ANTRE CERDAS. KAMPUS TUNTAS.</Text>
    <Text style={[t(42, 'bold', c.ink, {ls: -0.05, lh: 1.05}), {marginTop: 18}]}>Masuk ke{'\n'}layanan kampus.</Text>
    <Text style={[t(16, 'regular', '#465785', {lh: 1.15}), {marginTop: 18}]}>Ambil nomor dari mana saja.{'\n'}Datang saat giliranmu tiba.</Text>
    <Chips style={{marginTop: 34}} value={role} onChange={pick} options={[{key: 'user', label: 'Mahasiswa', icon: 'check'}, {key: 'petugas', label: 'Petugas', icon: 'check'}, {key: 'admin', label: 'Admin', icon: 'check'}]} />
    <View style={{gap: 20, marginTop: 32}}>
      <Field label="Email kampus" icon="mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="nama@kampus.ac.id" />
      <Field label="Kata sandi" icon="lock" value={password} onChangeText={setPassword} secureTextEntry={!show} placeholder="Masukkan kata sandi"
        right={<Pressable accessibilityRole="button" accessibilityLabel={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} onPress={() => setShow(v => !v)} hitSlop={10}><Icon name={show ? 'eye-off' : 'eye'} size={20} color="#5b6a99" /></Pressable>} />
    </View>
    <Text onPress={() => setHelp(true)} style={[t(13, 'semibold', '#273c9e'), {alignSelf: 'flex-end', marginTop: 16, marginRight: 8}]}>Lupa kata sandi?</Text>
    {!!error && <Text accessibilityRole="alert" style={[t(13, 'semibold', c.danger), {marginTop: 12}]}>{error}</Text>}
    <Btn style={{marginTop: 28}} height={60} label={busy ? 'Memproses…' : 'Masuk'} iconRight="arrow-right" onPress={submit} disabled={busy} />
    <Text style={[t(12, 'regular', c.muted), {textAlign: 'center', marginTop: 24}]}>Mode prototipe: pilih peran untuk mencoba alur.</Text>
    <View style={{flex: 1, minHeight: 40}} />
    <View style={{alignItems: 'center', gap: 8, paddingBottom: 8}}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}><Icon name="shield" size={16} color="#3d4f8e" /><Text style={t(12, 'regular', '#3d4f8e')}>Satu akun. Semua layanan kampus.</Text></View>
      <Text style={t(11, 'regular', '#3d4f8e')}>Akses aman sesuai peran akun Anda</Text>
    </View>
    <Dialog visible={help} onClose={() => setHelp(false)} title="Lupa kata sandi?" message="Hubungi admin layanan kampus untuk mengatur ulang kata sandi akun Anda." actions={[{label: 'Mengerti'}]} />
  </Screen>;
}
