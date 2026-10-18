import { useQuery,useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { careDate,careService,type Appointment } from '@/lib/care';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/common/LoadingState';
export function CareNotifications({appointments,onOpen}:{appointments:Appointment[];onOpen:(a:Appointment)=>void}){
 const {role}=useAuth();const {t,language}=useTranslation();const qc=useQueryClient();const q=useQuery({queryKey:['care','notifications'],queryFn:()=>careService.notifications(role==='farmer'),refetchInterval:15000,retry:1});
 return <div className="grid gap-3">{q.isPending?<LoadingState/>:q.isError?<Button onClick={()=>void q.refetch()}>{t('common.retry')}</Button>:q.data.length?q.data.map(n=><article key={n.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3"><div className="flex items-start gap-3"><Bell className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true"/><div><p className={n.read_at?'text-muted-foreground':'font-medium'}>{t(`care.notification.${n.kind}`)}</p><p className="text-xs text-muted-foreground">{careDate(n.created_at,language)}</p></div></div><div className="flex gap-2">{n.appointment_id&&appointments.some(a=>a.id===n.appointment_id)&&<Button variant="outline" onClick={()=>{const a=appointments.find(a=>a.id===n.appointment_id);if(a)onOpen(a);}}>{t('care.open')}</Button>}{!n.read_at&&<Button variant="ghost" onClick={()=>void careService.readNotification(n.id).then(()=>qc.invalidateQueries({queryKey:['care','notifications']}))}>{t('care.markRead')}</Button>}</div></article>):<p>{t('care.empty')}</p>}</div>;
}