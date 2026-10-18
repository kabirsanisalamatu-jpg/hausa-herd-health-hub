import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { careDate,careHead,careService } from '@/lib/care';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/common/LoadingState';
export const Route=createFileRoute('/veterinarians/$vetId')({ head:()=>careHead('Veterinary professional profile','Published professional qualifications, specialties and consultation availability on AgriVet OS.'),component:ProfessionalPage });
function ProfessionalPage(){
 const { vetId }=Route.useParams(); const { t,language }=useTranslation(); const { role }=useAuth();
 const q=useQuery({queryKey:['care','public',vetId],queryFn:()=>careService.professional(vetId)});
 const slots=useQuery({queryKey:['care','slots',vetId],queryFn:()=>careService.slots(vetId)});
 if(q.isPending) return <LoadingState/>;
 if(q.isError||!q.data?.published) return <div className="p-8">{t('care.directory.empty')}<Button asChild variant="outline"><Link to="/veterinarians">{t('care.directory')}</Link></Button></div>;
 const p=q.data;
 return <section className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-8"><Button asChild variant="outline" className="w-fit"><Link to="/veterinarians">{t('care.directory')}</Link></Button><h1 className="text-3xl font-semibold">{p.display_name}</h1><dl className="grid gap-4 sm:grid-cols-2">{[['care.qualifications',p.qualifications],['care.licence',p.licence],['care.location',p.location],['care.languages',p.languages.join(', ')],['care.species',p.species.join(', ')],['care.specialties',p.specialties.join(', ')]].map(([k,v])=><div key={k}><dt className="text-sm text-muted-foreground">{t(k)}</dt><dd className="break-words">{v}</dd></div>)}</dl><p className="whitespace-pre-wrap">{p.biography}</p>{p.fee!=null&&<p>{t('care.fee')}: {new Intl.NumberFormat(language==='ha'?'ha-NG':'en-NG',{style:'currency',currency:p.currency??'NGN'}).format(p.fee)}</p>}<h2 className="text-xl font-semibold">{t('care.availability')}</h2><p className="text-sm text-muted-foreground">{t('care.timezone')}</p>{slots.isPending?<LoadingState/>:slots.isError?<Button onClick={()=>void slots.refetch()}>{t('common.retry')}</Button>:slots.data.length?slots.data.map(s=><div key={s.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4"><div><p>{careDate(s.starts_at,language)} – {careDate(s.ends_at,language)}</p><p className="text-sm text-muted-foreground">{t(`care.${s.consultation_type}`)} {s.location}</p></div><Button asChild><Link to={role==='farmer'?'/farmer/care':'/sign-in'}>{t(role==='farmer'?'care.book':'nav.signIn')}</Link></Button></div>):<p>{t('care.empty')}</p>}</section>;
}