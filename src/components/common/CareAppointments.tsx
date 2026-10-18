import type { TranslationKey } from '@/locales';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CareSelect } from '@/components/common/CareFields';
import { useTranslation } from '@/hooks/useTranslation';
import { careDate,careService,type Appointment } from '@/lib/care';

export function CareAppointments({ rows,onOpen,run,farmer }: { rows:Appointment[];onOpen:(a:Appointment)=>void;run:(fn:()=>Promise<unknown>)=>Promise<void>;farmer:boolean }) {
 const {t:translate,language}=useTranslation(); const t=(key:string)=>translate(key as TranslationKey);
 return <div className="grid gap-4">{!rows.length&&<p className="text-muted-foreground">{t('care.empty')}</p>}{rows.map(a=><article className="grid gap-3 rounded-md border border-border p-4" key={a.id}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{farmer?a.vet_name:a.farmer_name}</h3><Badge variant="secondary">{t(`care.status.${a.status}`)}</Badge></div><p>{careDate(a.starts_at,language)} – {careDate(a.ends_at,language)}</p><p className="text-sm text-muted-foreground">{t('care.timezone')} · {t(`care.${a.consultation_type}`)} {a.location}</p><p className="whitespace-pre-wrap break-words">{a.reason}</p><div className="flex flex-wrap gap-2"><Button onClick={()=>onOpen(a)} variant="outline">{t('care.open')}</Button>{['requested','confirmed'].includes(a.status)&&<Button variant="outline" onClick={()=>void run(()=>careService.transition(a.id,'cancelled'))}>{t('common.cancel')}</Button>}{!farmer&&a.status==='requested'&&<><Button onClick={()=>void run(()=>careService.transition(a.id,'confirmed'))}>{t('care.confirm')}</Button><Button variant="outline" onClick={()=>void run(()=>careService.transition(a.id,'declined'))}>{t('care.decline')}</Button></>}{!farmer&&a.status==='confirmed'&&new Date(a.ends_at).getTime()<=Date.now()&&<><Button onClick={()=>void run(()=>careService.transition(a.id,'completed'))}>{t('care.complete')}</Button><Button variant="outline" onClick={()=>void run(()=>careService.transition(a.id,'no_show'))}>{t('care.noShow')}</Button></>}</div>{farmer&&['requested','confirmed'].includes(a.status)&&<Reschedule appointment={a} run={run}/>}</article>)}</div>;
}
function Reschedule({appointment,run}:{appointment:Appointment;run:(fn:()=>Promise<unknown>)=>Promise<void>}){
 const {t:translate,language}=useTranslation(); const t=(key:string)=>translate(key as TranslationKey); const [slot,setSlot]=useState('');
 const q=useQuery({queryKey:['care','slots',appointment.vet_id],queryFn:()=>careService.slots(appointment.vet_id)});
 return <details><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">{t('care.reschedule')}</summary><div className="grid gap-3"><CareSelect label="care.newSlot" value={slot} onChange={setSlot} options={(q.data??[]).filter(s=>s.id!==appointment.slot_id).map(s=>({value:s.id,label:careDate(s.starts_at,language)}))}/><Button disabled={!slot} onClick={()=>void run(()=>careService.reschedule(appointment.id,slot))}>{t('care.reschedule')}</Button></div></details>;
}