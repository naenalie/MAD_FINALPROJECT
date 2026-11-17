import React from 'react';
import {Image, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions, type StyleProp, type TextInputProps, type ViewStyle} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {StatusBar} from 'expo-status-bar';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Feather, MaterialCommunityIcons} from '@expo/vector-icons';
import {c, grad, statusTone, t} from '../theme';

const bgImages = {
  light: require('../../assets/figma/bg-light.png'),
  dark: require('../../assets/figma/bg-dark.png'),
  login: require('../../assets/figma/bg-login.png'),
};
const orbImages = {
  orb: require('../../assets/figma/orb.png'),
  glow: require('../../assets/figma/orb-glow.png'),
  voice: require('../../assets/figma/orb-voice.png'),
};

// ---------- Icons ----------
const mci = {ticket: 'ticket-confirmation-outline', history: 'history', school: 'school-outline', vibrate: 'cellphone-message'} as const;
export type IconName = React.ComponentProps<typeof Feather>['name'] | keyof typeof mci;
export function Icon({name, size = 20, color = c.ink}: {name: IconName; size?: number; color?: string}) {
  if (name in mci) return <MaterialCommunityIcons name={mci[name as keyof typeof mci]} size={size} color={color} />;
  return <Feather name={name as React.ComponentProps<typeof Feather>['name']} size={size} color={color} />;
}

// ---------- Screen shell ----------
type Variant = 'light' | 'dark' | 'login';
export function Background({variant = 'light'}: {variant?: Variant}) {
  return <>
    <LinearGradient colors={grad[variant]} start={{x: 0.2, y: 0}} end={{x: 0.8, y: 1}} style={StyleSheet.absoluteFill} />
    <Image source={bgImages[variant]} style={StyleSheet.absoluteFill} resizeMode="cover" />
  </>;
}
export function Screen({variant = 'light', children, nav, padH = 32, onRefresh, footer}: {variant?: Variant; children: React.ReactNode; nav?: React.ReactNode; padH?: number; onRefresh?: () => void; footer?: React.ReactNode}) {
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const dark = variant === 'dark';
  padH = Math.round(padH * Math.min(1, Math.max(0.72, width / 430))); // Figma frames are 430pt wide
  return <View style={[s.page, {backgroundColor: dark ? '#0b1020' : '#e2e5ff'}]}>
    <Background variant={variant} />
    <StatusBar style={dark ? 'light' : 'dark'} />
    <ScrollView
      contentContainerStyle={{paddingTop: insets.top + 26, paddingHorizontal: padH, paddingBottom: (nav ? 112 : 32) + insets.bottom, flexGrow: 1}}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={dark ? '#fff' : c.brand} /> : undefined}>
      {children}
    </ScrollView>
    {footer}
    {nav}
  </View>;
}

export function Header({eyebrow, title, subtitle, right, dark = false, size = 38, live}: {eyebrow: string; title: string; subtitle?: string; right?: React.ReactNode; dark?: boolean; size?: number; live?: string}) {
  return <View style={{marginBottom: 26}}>
    <View style={s.rowBetween}>
      <Text style={t(11, dark ? 'semibold' : 'bold', dark ? c.dEyebrow : c.eyebrow)}>{eyebrow.toUpperCase()}</Text>
      {!!live && <Pill label={live} dot bg="rgba(207,255,158,0.13)" fg={c.limeText} />}
    </View>
    <View style={[s.rowBetween, {alignItems: 'center', marginTop: 12}]}>
      <Text style={[t(size, 'bold', dark ? c.white : c.ink, {ls: -0.04, lh: 1.05}), {flex: 1}]}>{title}</Text>
      {right}
    </View>
    {!!subtitle && <Text style={[t(dark ? 13 : 14, 'regular', dark ? c.dSub : c.muted), {marginTop: 8}]}>{subtitle}</Text>}
  </View>;
}

// ---------- Surfaces ----------
export function Glass({children, dark = false, tint, radius = 28, style, onPress}: {children?: React.ReactNode; dark?: boolean; tint?: string; radius?: number; style?: StyleProp<ViewStyle>; onPress?: () => void}) {
  const base: ViewStyle = {
    backgroundColor: tint ?? (dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.40)'),
    borderColor: dark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderRadius: radius,
    ...(Platform.OS === 'ios' ? {shadowColor: '#1b2358', shadowOpacity: dark ? 0.3 : 0.1, shadowRadius: 24, shadowOffset: {width: 0, height: 12}} : {}),
  };
  if (onPress) return <Pressable accessibilityRole="button" onPress={onPress} style={({pressed}) => [base, style, pressed && {opacity: 0.85}]}>{children}</Pressable>;
  return <View style={[base, style]}>{children}</View>;
}

/** Folder-style glass card with a small tab above it (Beranda, Ambil, Kelola). */
export function Folder({children, tint, tabTint, dark, style, onPress, tabWidth = 130}: {children: React.ReactNode; tint?: string; tabTint?: string; dark?: boolean; style?: StyleProp<ViewStyle>; onPress?: () => void; tabWidth?: number}) {
  return <View style={style}>
    <View style={{width: tabWidth, height: 24, borderRadius: 12, backgroundColor: tabTint ?? 'rgba(255,255,255,0.32)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', marginBottom: -13}} />
    <Glass tint={tint} dark={dark} radius={22} onPress={onPress}>{children}</Glass>
  </View>;
}

export function Orb({size, kind = 'orb'}: {size: number; kind?: keyof typeof orbImages}) {
  // exported images include the glow, so render them a bit larger than the core circle
  // ratios = exported image size / Figma node size (orb 318/174, glow 404/292, voice 426/318)
  const scale = kind === 'voice' ? 1.34 : kind === 'glow' ? 1.38 : 1.83;
  return <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}} pointerEvents="none">
    <Image source={orbImages[kind]} style={{width: size * scale, height: size * scale}} resizeMode="contain" />
  </View>;
}

// ---------- Buttons ----------
type BtnVariant = 'primary' | 'lime' | 'forest' | 'violet' | 'ghost' | 'ghostDark' | 'danger' | 'limeGrad';
export function Btn({label, onPress, variant = 'primary', icon, iconRight, disabled, height = 56, style, textSize}: {label: string; onPress: () => void; variant?: BtnVariant; icon?: IconName; iconRight?: IconName; disabled?: boolean; height?: number; style?: StyleProp<ViewStyle>; textSize?: number}) {
  const v = {
    primary: {bg: undefined, fg: c.white, border: 'rgba(255,255,255,0.35)'},
    limeGrad: {bg: undefined, fg: '#1f3a1d', border: 'rgba(255,255,255,0.7)'},
    lime: {bg: c.limeBtn, fg: c.limeInk, border: 'rgba(255,255,255,0.7)'},
    forest: {bg: '#142a23', fg: '#ecffdb', border: 'transparent'},
    violet: {bg: c.violetBtn, fg: c.white, border: 'transparent'},
    ghost: {bg: 'rgba(255,255,255,0.40)', fg: c.ink2, border: 'rgba(255,255,255,0.7)'},
    ghostDark: {bg: 'rgba(255,255,255,0.05)', fg: '#ced7ef', border: 'rgba(255,255,255,0.17)'},
    danger: {bg: 'rgba(255,214,226,0.45)', fg: c.danger, border: 'rgba(255,255,255,0.75)'},
  }[variant];
  const radius = height / 2;
  const inner = <>
    {!!icon && <Icon name={icon} size={19} color={v.fg} />}
    <Text style={[t(textSize ?? (height >= 56 ? 17 : 15), variant === 'violet' ? 'medium' : 'semibold', v.fg), {textAlign: 'center'}]} numberOfLines={1}>{label}</Text>
    {!!iconRight && <View style={{position: 'absolute', right: 24}}><Icon name={iconRight} size={20} color={v.fg} /></View>}
  </>;
  const box: ViewStyle = {height, borderRadius: radius, borderWidth: 1, borderColor: v.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 18, overflow: 'hidden'};
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress}
    style={({pressed}) => [box, v.bg ? {backgroundColor: v.bg} : null, variant === 'primary' && Platform.OS === 'ios' ? {shadowColor: '#2944d4', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: {width: 0, height: 10}} : null, disabled && {opacity: 0.45}, pressed && {opacity: 0.82}, style]}>
    {(variant === 'primary' || variant === 'limeGrad') && <LinearGradient colors={variant === 'primary' ? grad.primary : ['#e3ffb4', '#b9ec74']} start={{x: 0, y: 0.5}} end={{x: 1, y: 0.5}} style={StyleSheet.absoluteFill} />}
    {inner}
  </Pressable>;
}

export function IconBtn({icon, onPress, dark, size = 42, label}: {icon: IconName; onPress?: () => void; dark?: boolean; size?: number; label: string}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({pressed}) => [{width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.35)', borderColor: dark ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.6)'}, pressed && {opacity: 0.8}]}>
    <Icon name={icon} size={size * 0.48} color={dark ? '#dfe6ff' : '#3e4f8e'} />
  </Pressable>;
}

// ---------- Small pieces ----------
export function Pill({label, dot, bg, fg, style, border}: {label: string; dot?: boolean; bg: string; fg: string; style?: StyleProp<ViewStyle>; border?: string}) {
  return <View style={[{flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, height: 28, borderRadius: 14, backgroundColor: bg, alignSelf: 'flex-start'}, border ? {borderWidth: 1, borderColor: border} : null, style]}>
    {dot && <View style={{width: 7, height: 7, borderRadius: 4, backgroundColor: fg}} />}
    <Text style={t(11, 'semibold', fg)}>{label}</Text>
  </View>;
}
export function StatusPill({status, dark, style}: {status: string; dark?: boolean; style?: StyleProp<ViewStyle>}) {
  const tone = statusTone[status] ?? {bg: 'rgba(255,255,255,.4)', fg: c.body, label: status};
  if (dark) return <Pill label={tone.label} dot bg="rgba(221,233,255,0.14)" fg={status === 'called' || status === 'ready' ? c.limeText : '#abc5ff'} style={style} />;
  return <Pill label={tone.label} bg={tone.bg} fg={tone.fg} style={[{paddingHorizontal: 18}, style]} />;
}

export function Avatar({name, size = 50}: {name: string; size?: number}) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join('');
  return <View style={{width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: 'rgba(255,255,255,0.85)', overflow: 'hidden', alignItems: 'center', justifyContent: 'center'}}>
    <LinearGradient colors={['#6f7cf6', '#2635a3']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={StyleSheet.absoluteFill} />
    <Text style={t(size * 0.36, 'bold', c.white)}>{initials}</Text>
  </View>;
}

export function Field({label, icon, right, multiline, hint, ...props}: TextInputProps & {label: string; icon?: IconName; right?: React.ReactNode; hint?: string}) {
  return <View style={{gap: 10}}>
    <Text style={t(13, 'semibold', c.label)}>{label}</Text>
    <View style={[s.input, multiline && {height: 98, alignItems: 'flex-start', paddingTop: 16}]}>
      {!!icon && <Icon name={icon} size={20} color="#5b6a99" />}
      <TextInput accessibilityLabel={label} placeholderTextColor={c.placeholder} style={[t(15, 'regular', c.ink), {flex: 1, padding: 0}, multiline && {height: '100%', textAlignVertical: 'top'}]} multiline={multiline} {...props} />
      {right}
    </View>
    {!!hint && <Text style={t(11, 'regular', c.faint)}>{hint}</Text>}
  </View>;
}

/** Separate pills (Riwayat filters, login roles). */
export function Chips<K extends string>({options, value, onChange, style}: {options: {key: K; label: string; icon?: IconName}[]; value: K; onChange: (k: K) => void; style?: StyleProp<ViewStyle>}) {
  return <View style={[{flexDirection: 'row', gap: 10}, style]}>
    {options.map(o => {const on = o.key === value; return <Pressable key={o.key} accessibilityRole="button" accessibilityState={{selected: on}} onPress={() => onChange(o.key)}
      style={{flexGrow: 1, flexBasis: 0, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)', backgroundColor: on ? c.brand : 'rgba(255,255,255,0.24)'}}>
      {on && o.icon && <Icon name={o.icon} size={14} color={c.white} />}
      <Text style={[t(13, on ? 'semibold' : 'medium', on ? c.white : '#3d4b77'), {flexShrink: 1}]} numberOfLines={1} adjustsFontSizeToFit>{o.label}</Text>
    </Pressable>;})}
  </View>;
}

/** Segmented control inside a track (event status, Daftar tabs). */
export function Segment<K extends string>({options, value, onChange, dark, limeActive}: {options: {key: K; label: string}[]; value: K; onChange: (k: K) => void; dark?: boolean; limeActive?: boolean}) {
  return <View style={{flexDirection: 'row', padding: 4, borderRadius: 24, borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)', backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.3)'}}>
    {options.map(o => {const on = o.key === value; return <Pressable key={o.key} accessibilityRole="button" accessibilityState={{selected: on}} onPress={() => onChange(o.key)}
      style={[{flex: 1, height: dark ? 38 : 30, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6}, on && (limeActive ? {backgroundColor: '#d4f5b4', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)'} : dark ? {backgroundColor: 'rgba(125,141,251,0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)'} : {backgroundColor: c.white})]}>
      {on && limeActive && <View style={{width: 7, height: 7, borderRadius: 4, backgroundColor: '#25452b'}} />}
      <Text style={t(12, on ? 'semibold' : 'medium', dark ? (on ? c.dText : c.dMuted) : on ? '#25452b' : '#5b6a92')}>{o.label}</Text>
    </Pressable>;})}
  </View>;
}

export function Toggle({value, onChange, label}: {value: boolean; onChange: (v: boolean) => void; label: string}) {
  return <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{checked: value}} onPress={() => onChange(!value)}
    style={{width: 50, height: 30, borderRadius: 15, padding: 3, backgroundColor: value ? '#4f5bd5' : 'rgba(120,134,180,0.35)', alignItems: value ? 'flex-end' : 'flex-start'}}>
    <View style={{width: 24, height: 24, borderRadius: 12, backgroundColor: c.white}} />
  </Pressable>;
}

// ---------- Bottom navigation ----------
const navIcons: Record<string, IconName> = {Beranda: 'home', Ambil: 'plus-circle', Antrean: 'ticket', Riwayat: 'history', Profil: 'user', Kontrol: 'monitor', Daftar: 'list', Kelola: 'grid', Statistik: 'bar-chart-2'};
export function BottomNav({tabs, active, onPress}: {tabs: string[]; active: string; onPress: (t: string) => void}) {
  const insets = useSafeAreaInsets();
  return <View style={[s.nav, {bottom: Math.max(insets.bottom, 10) + 6}]}>
    {tabs.map(tab => {const on = tab === active; return <Pressable key={tab} accessibilityRole="tab" accessibilityLabel={tab} accessibilityState={{selected: on}} onPress={() => onPress(tab)} style={s.navItem}>
      <View style={[s.navInner, on && s.navActive]}>
        <Icon name={navIcons[tab] ?? 'circle'} size={22} color={on ? c.lime : '#949db6'} />
        <Text style={t(10, on ? 'semibold' : 'medium', on ? c.lime : c.navIdle)} numberOfLines={1}>{tab}</Text>
      </View>
    </Pressable>;})}
  </View>;
}

// ---------- Dialogs ----------
export type DialogAction = {label: string; onPress?: () => void; variant?: 'violet' | 'plain'};
export function Dialog({visible, title, message, actions, onClose}: {visible: boolean; title: string; message: string; actions: DialogAction[]; onClose: () => void}) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
    <View style={s.scrim}>
      <View style={s.dialog} accessibilityRole="alert">
        <Text style={t(24, 'bold', c.white, {ls: 0})}>{title}</Text>
        <Text style={[t(14, 'medium', '#bfceee', {ls: 0, lh: 1.45}), {marginTop: 18, marginBottom: 34}]}>{message}</Text>
        <View style={{gap: 10}}>
          {actions.map((a, i) => <Pressable key={a.label} accessibilityRole="button" onPress={() => {onClose(); a.onPress?.();}}
            style={({pressed}) => [{height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: (a.variant ?? (i === 0 ? 'violet' : 'plain')) === 'violet' ? c.violetBtn : 'rgba(255,255,255,0.08)'}, pressed && {opacity: 0.8}]}>
            <Text style={t(14, 'medium', c.white, {ls: 0})}>{a.label}</Text>
          </Pressable>)}
        </View>
      </View>
    </View>
  </Modal>;
}

/** Full-height glass sheet used by the admin forms (A-02, A-05). */
export function Sheet({visible, onClose, eyebrow, title, subtitle, children}: {visible: boolean; onClose: () => void; eyebrow: string; title: string; subtitle: string; children: React.ReactNode}) {
  const insets = useSafeAreaInsets();
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
    <View style={[s.page, {backgroundColor: '#e2e5ff'}]}>
      <Background />
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{paddingTop: insets.top + 12, paddingHorizontal: 12, paddingBottom: insets.bottom + 12, flexGrow: 1}} keyboardShouldPersistTaps="handled">
        <View style={s.sheet}>
          <View style={{alignSelf: 'center', width: 48, height: 4, borderRadius: 2, backgroundColor: 'rgba(120,134,180,0.35)', marginBottom: 18}} />
          <View style={s.rowBetween}>
            <Text style={[t(11, 'bold', c.eyebrow), {marginTop: 10}]}>{eyebrow.toUpperCase()}</Text>
            <IconBtn icon="x" label="Tutup" onPress={onClose} size={40} />
          </View>
          <Text style={[t(36, 'bold', c.ink, {ls: -0.04, lh: 1.05}), {marginTop: 2}]}>{title}</Text>
          <Text style={[t(14, 'regular', c.muted), {marginTop: 12, marginBottom: 26}]}>{subtitle}</Text>
          <View style={{gap: 22}}>{children}</View>
        </View>
      </ScrollView>
    </View>
  </Modal>;
}

export function SectionTitle({title, right, dark, onRight}: {title: string; right?: string; dark?: boolean; onRight?: () => void}) {
  return <View style={[s.rowBetween, {alignItems: 'center', marginBottom: 16}]}>
    <Text style={t(dark ? 16 : 22, dark ? 'semibold' : 'bold', dark ? c.dText : c.ink)}>{title}</Text>
    {!!right && <Text onPress={onRight} style={t(11, onRight ? 'semibold' : 'medium', dark ? c.dMuted : c.link)}>{right}</Text>}
  </View>;
}

export const s = StyleSheet.create({
  page: {flex: 1},
  rowBetween: {flexDirection: 'row', justifyContent: 'space-between', gap: 10},
  row: {flexDirection: 'row', alignItems: 'center', gap: 10},
  input: {height: 58, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)', backgroundColor: 'rgba(255,255,255,0.30)', flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 18},
  nav: {position: 'absolute', left: 24, right: 24, height: 72, borderRadius: 36, backgroundColor: c.nav, borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 5, ...(Platform.OS === 'ios' ? {shadowColor: '#172449', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: {width: 0, height: 12}} : {elevation: 10})},
  navItem: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  navInner: {width: '92%', maxWidth: 74, height: 58, borderRadius: 26, alignItems: 'center', justifyContent: 'center', gap: 5},
  navActive: {backgroundColor: 'rgba(201,248,152,0.12)'},
  scrim: {flex: 1, backgroundColor: 'rgba(5,8,16,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24},
  dialog: {width: '100%', maxWidth: 382, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.27)', backgroundColor: 'rgba(24,35,67,0.97)', padding: 24, paddingTop: 28},
  sheet: {flex: 1, borderRadius: 36, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.32)', padding: 24, paddingTop: 12},
});
