// Design tokens taken from the CampusQueue Figma file (frames U-01 … A-09).
import type {TextStyle} from 'react-native';

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;
export type Weight = keyof typeof font;

export const c = {
  // light surfaces
  ink: '#172449',
  ink2: '#253661',
  body: '#3e527f',
  muted: '#53628c',
  eyebrow: '#495a90',
  link: '#4f61a8',
  label: '#354571',
  placeholder: '#5e6c98',
  faint: '#7685ac',
  brand: '#2635a3',
  indigo: '#4f46e5',
  // dark surfaces
  dEyebrow: '#a4b7e8',
  dSub: '#aabbe5',
  dMuted: '#8498c4',
  dBody: '#bfcdf0',
  dLabel: '#b2c4f0',
  dText: '#e7edff',
  // accents
  lime: '#d4ffae',
  limeText: '#d2f9ab',
  limeBtn: '#d1f89d',
  limeInk: '#21352d',
  violetBtn: '#5967d9',
  danger: '#b04a64',
  nav: 'rgba(16,24,47,0.94)',
  navIdle: '#a4aec8',
  white: '#ffffff',
} as const;

export const grad = {
  light: ['#dce2ff', '#f1eeff'] as const,
  login: ['#a5b4fc', '#daddfd'] as const,
  dark: ['#0f172a', '#080c1b'] as const,
  primary: ['#2944d4', '#6960eb'] as const,
  ticket: ['#2149bc', '#162c68', '#111b38'] as const,
  limeCta: ['#e4ffa6', '#bbef71'] as const,
  ticketLight: ['#ece8ff', '#e0ffc4'] as const,
};

// Service card palettes, used by Ambil Antrean (U-03) and Beranda folders (U-02).
export const servicePalettes = [
  {grad: ['#e4ffa6', '#bbef71'] as const, ink: '#1a3326', sub: '#3e571c', folder: 'rgba(225,244,200,0.5)', tab: 'rgba(225,244,200,0.6)', stat: 'rgba(225,244,200,0.55)', icon: 'award' as const},
  {grad: ['#ffbaaf', '#ff8eaa'] as const, ink: '#512937', sub: '#512937', folder: 'rgba(255,224,221,0.5)', tab: 'rgba(255,224,221,0.6)', stat: 'rgba(255,224,221,0.55)', icon: 'book-open' as const},
  {grad: ['#bba0f5', '#a38ceb'] as const, ink: '#252048', sub: '#252048', folder: 'rgba(221,213,252,0.5)', tab: 'rgba(221,213,252,0.6)', stat: 'rgba(221,213,252,0.55)', icon: 'star' as const},
  {grad: ['#287bfe', '#1648c9'] as const, ink: '#ffffff', sub: '#ffffff', folder: 'rgba(214,226,255,0.5)', tab: 'rgba(214,226,255,0.6)', stat: 'rgba(214,226,255,0.55)', icon: 'file-text' as const},
];

/** Text style helper: Figma uses -2% letter spacing on almost every text layer. */
export function t(size: number, weight: Weight, color: string, opts: {ls?: number; lh?: number} = {}): TextStyle {
  return {
    fontSize: size,
    fontFamily: font[weight],
    color,
    letterSpacing: size * (opts.ls ?? -0.02),
    ...(opts.lh ? {lineHeight: Math.round(size * opts.lh)} : {}),
  };
}

export const statusTone: Record<string, {bg: string; fg: string; label: string}> = {
  waiting: {bg: 'rgba(222,230,255,0.6)', fg: '#4255a6', label: 'Menunggu'},
  called: {bg: 'rgba(209,248,157,0.55)', fg: '#36522e', label: 'Dipanggil'},
  serving: {bg: 'rgba(214,224,255,0.7)', fg: '#3446a8', label: 'Dilayani'},
  completed: {bg: '#d6f2c4', fg: '#36522e', label: 'Selesai'},
  skipped: {bg: '#f6e7b8', fg: '#7a5a14', label: 'Dilewati'},
  cancelled: {bg: '#f6d6dc', fg: '#9c3a50', label: 'Dibatalkan'},
  open: {bg: 'rgba(209,248,157,0.7)', fg: '#25452b', label: 'Buka'},
  ready: {bg: 'rgba(209,248,157,0.7)', fg: '#25452b', label: 'Siap'},
  paused: {bg: '#f6e7b8', fg: '#7a5a14', label: 'Jeda'},
  closed: {bg: '#f6d6dc', fg: '#9c3a50', label: 'Tutup'},
};
