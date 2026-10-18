import type { ComponentProps, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/locales';

export function CareField({ label,area=false,...props }: ComponentProps<typeof Input> & { label:TranslationKey;area?:boolean }) {
  const { t }=useTranslation();
  const id=props.id ?? String(props.name ?? label);
  return <div className="grid gap-2"><Label htmlFor={id}>{t(label)}</Label>{area ? <Textarea {...props as ComponentProps<typeof Textarea>} id={id} className="min-h-24" /> : <Input {...props} id={id} className="min-h-11" />}</div>;
}
export function CareSelect({ label,value,onChange,options,optional=false }: { label:TranslationKey;value:string;onChange:(v:string)=>void;options:{ value:string;label:string }[];optional?:boolean }) {
  const { t }=useTranslation();
  return <div className="grid min-w-0 gap-2"><Label htmlFor={label}>{t(label)}</Label><Select value={value||'_none'} onValueChange={v=>{ if(v) onChange(v==='_none'?'':v); }}><SelectTrigger id={label} className="min-h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="_none" disabled={!optional}>{t('common.selectPlaceholder')}</SelectItem>{options.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>;
}
export function CareCheck({ label,checked,onChange,id }: { label:TranslationKey;checked:boolean;onChange:(b:boolean)=>void;id?:string }) {
  const { t }=useTranslation();
  return <Label className="flex min-h-11 items-center gap-3 leading-6" htmlFor={id??label}><Checkbox id={id??label} checked={checked} onCheckedChange={v=>onChange(v===true)} />{t(label)}</Label>;
}
export function CareSection({ title,children }: { title:TranslationKey;children:ReactNode }) {
  const { t }=useTranslation();
  return <section className="grid min-w-0 gap-5 border-t border-border pt-6"><h2 className="text-xl font-semibold">{t(title)}</h2>{children}</section>;
}