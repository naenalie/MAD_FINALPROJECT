import React, {useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {Button,Card,Field,styles} from './ui';
import type {State} from '../services/api';

type Action = (path:string, body:object, done?:()=>void)=>void;
type Props = {data:State;action:Action};
const labels:Record<string,string>={open:'Buka',paused:'Jeda',closed:'Tutup'};
function Events({data,action}:Props){
 const [id,setId]=useState(''),[name,setName]=useState(''),[prefix,setPrefix]=useState(''),[quota,setQuota]=useState(''),[description,setDescription]=useState(''),[status,setStatus]=useState('open');
 const reset=()=>{setId('');setName('');setPrefix('');setQuota('');setDescription('');setStatus('open');};
 return <><Card><Text style={styles.heading}>{id?'Ubah event':'Tambah event'}</Text><Field label="Nama layanan" value={name} onChangeText={setName}/><Field label="Prefix nomor" value={prefix} onChangeText={setPrefix} autoCapitalize="characters"/><Field label="Kuota per hari" value={quota} onChangeText={setQuota} keyboardType="number-pad"/><Field label="Deskripsi" value={description} onChangeText={setDescription}/><Text style={styles.label}>Status: {labels[status]}</Text><View style={styles.row}>{['open','paused','closed'].map(s=><Button key={s} label={labels[s]} secondary onPress={()=>setStatus(s)}/>)}</View><Button label="Simpan event" onPress={()=>action('/admin/event',{id:id||undefined,name,prefix,quotaPerDay:Number(quota),description,status},reset)}/>{!!id&&<Button label="Batal ubah" secondary onPress={reset}/>}</Card><Card><Text style={styles.heading}>Semua event</Text>{data.events.map(e=><Pressable key={e.id} accessibilityRole="button" style={styles.listButton} onPress={()=>{setId(e.id);setName(e.name);setPrefix(e.prefix);setQuota(String(e.quotaPerDay));setDescription(e.description);setStatus(e.status);}}><Text style={styles.body}>{e.name} · {labels[e.status]}</Text><Text style={styles.small}>Ketuk untuk mengubah</Text></Pressable>)}</Card></>;
}
function Officers({data,action}:Props){
 const [id,setId]=useState(''),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const reset=()=>{setId('');setName('');setEmail('');setPassword('');};
 return <><Card><Text style={styles.heading}>{id?'Ubah petugas':'Tambah petugas'}</Text><Field label="Nama" value={name} onChangeText={setName}/><Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none"/><Field label={id?'Password baru (opsional)':'Password awal'} value={password} onChangeText={setPassword} secureTextEntry/><Button label="Simpan petugas" onPress={()=>action('/admin/user',{id:id||undefined,name,email,password},reset)}/>{!!id&&<Button label="Batal ubah" secondary onPress={reset}/>}</Card><Card><Text style={styles.heading}>Akun petugas</Text>{data.users.filter(u=>u.role==='petugas').map(u=><Pressable key={u.id} accessibilityRole="button" style={styles.listButton} onPress={()=>{setId(u.id);setName(u.name);setEmail(u.email);setPassword('');}}><Text style={styles.body}>{u.name} · {u.email}</Text><Text style={styles.small}>Ketuk untuk mengubah</Text></Pressable>)}</Card></>;
}
function Counters({data,action}:Props){
 const [id,setId]=useState(''),[name,setName]=useState(''),[eventId,setEventId]=useState(''),[petugasId,setPetugasId]=useState('');
 const reset=()=>{setId('');setName('');setEventId('');setPetugasId('');};
 return <><Card><Text style={styles.heading}>{id?'Ubah loket':'Tambah loket'}</Text><Field label="Nama loket" value={name} onChangeText={setName}/><Text style={styles.label}>Pilih event</Text>{data.events.map(e=><Button key={e.id} label={`${eventId===e.id?'✓ ':''}${e.name}`} secondary onPress={()=>setEventId(e.id)}/>)}<Text style={styles.label}>Pilih petugas</Text>{data.users.filter(u=>u.role==='petugas').map(u=><Button key={u.id} label={`${petugasId===u.id?'✓ ':''}${u.name}`} secondary onPress={()=>setPetugasId(u.id)}/>)}<Button label="Simpan loket" onPress={()=>action('/admin/counter',{id:id||undefined,name,eventId,petugasId},reset)}/>{!!id&&<Button label="Batal ubah" secondary onPress={reset}/>}</Card><Card><Text style={styles.heading}>Loket</Text>{data.counters.map(c=><Pressable key={c.id} accessibilityRole="button" style={styles.listButton} onPress={()=>{setId(c.id);setName(c.name);setEventId(c.eventId);setPetugasId(c.petugasId);}}><Text style={styles.body}>{c.name} · {data.events.find(e=>e.id===c.eventId)?.name}</Text><Text style={styles.small}>Ketuk untuk mengubah penugasan</Text></Pressable>)}</Card></>;
}
export function Manage(props:Props){
 const [section,setSection]=useState<'events'|'users'|'counters'>('events');
 return <><View style={styles.row}><Button label="Event" secondary onPress={()=>setSection('events')}/><Button label="Petugas" secondary onPress={()=>setSection('users')}/><Button label="Loket" secondary onPress={()=>setSection('counters')}/></View>{section==='events'?<Events {...props}/>:section==='users'?<Officers {...props}/>:<Counters {...props}/>}</>;
}
