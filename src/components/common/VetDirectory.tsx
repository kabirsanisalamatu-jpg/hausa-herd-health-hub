import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { MapPin, Stethoscope } from 'lucide-react';
import { careService } from '@/lib/care';
import { useTranslation } from '@/hooks/useTranslation';
import { LoadingState } from '@/components/common/LoadingState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function VetDirectory() {
  const { t }=useTranslation();
  const [search,setSearch]=useState('');
  const q=useQuery({ queryKey:['care','directory'],queryFn:careService.directory,retry:1 });
  return <div className="grid gap-6"><Input aria-label={t('common.search')} placeholder={t('common.searchPlaceholder')} className="min-h-11" value={search} onChange={e=>setSearch(e.target.value)} />{q.isPending?<LoadingState />:q.isError?<div role="alert">{t('care.error.generic')}<Button variant="outline" onClick={()=>void q.refetch()}>{t('common.retry')}</Button></div>:<div className="grid gap-4 sm:grid-cols-2">{q.data.filter(p=>[p.display_name,p.location,...p.specialties,...p.species,...p.languages].join(' ').toLowerCase().includes(search.toLowerCase())).map(p=><article className="grid gap-3 rounded-md border border-border p-5" key={p.user_id}><div className="flex items-center gap-3"><Stethoscope className="size-7 shrink-0 text-primary" aria-hidden="true"/><h2 className="text-lg font-semibold">{p.display_name}</h2></div><p className="text-sm">{p.qualifications}</p>{p.location&&<p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4" aria-hidden="true"/>{p.location}</p>}<div className="flex flex-wrap gap-2">{p.specialties.map(s=><Badge key={s} variant="secondary">{s}</Badge>)}</div><p className="text-sm text-muted-foreground">{p.languages.join(' · ')}</p><Button asChild variant="outline"><Link to="/veterinarians/$vetId" params={{vetId:p.user_id}}>{t('care.professional')}</Link></Button></article>)}{!q.data.length&&<p className="text-muted-foreground">{t('care.directory.empty')}</p>}</div>}</div>;
}