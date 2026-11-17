import AsyncStorage from '@react-native-async-storage/async-storage';
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000').replace(/\/$/, '');
export type User = { id:string; name:string; email:string; role:'user'|'petugas'|'admin'; counterId:string|null };
export type Event = { id:string; name:string; prefix:string; quotaPerDay:number; status:'open'|'paused'|'closed'; description:string };
export type Counter = { id:string; name:string; eventId:string; petugasId:string };
export type Queue = { id:string; userId:string; eventId:string; counterId:string|null; queueNumber:string; sequence:number; date:string; status:string; createdAt:string; calledAt:string|null; servedAt:string|null; completedAt:string|null };
export type State = {users:User[]; events:Event[]; counters:Counter[]; queues:Queue[]; today:string};
export class ApiError extends Error { constructor(message:string, public code?:string) { super(message); } }
export async function request<T>(path:string,user?:User|null,body?:object):Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let response:Response;
  try { response=await fetch(`${API_URL}${path}`,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(user?{'x-user-id':user.id}:{})},signal:controller.signal,...(body?{body:JSON.stringify(body)}:{})}); }
  catch { throw new Error(`Tidak dapat terhubung ke server (${API_URL}). Periksa alamat dan jaringan.`); }
  finally { clearTimeout(timeout); }
  const data=await response.json(); if(!response.ok) throw new ApiError(data.error||'Permintaan gagal', data.code); return data as T;
}
export const session={load:async()=>{const v=await AsyncStorage.getItem('campusqueue.session');return v?JSON.parse(v) as User:null;},save:(u:User)=>AsyncStorage.setItem('campusqueue.session',JSON.stringify(u)),clear:()=>AsyncStorage.removeItem('campusqueue.session')};
