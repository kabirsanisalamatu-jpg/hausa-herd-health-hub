import { supabase } from '@/integrations/supabase/client';
import type { Database, Tables } from '@/integrations/supabase/types';
import type { TranslationKey } from '@/locales';

export type Appointment = Tables<'care_appointments'>;
export type VetProfile = Tables<'vet_public_profiles'>;
export type Slot = Tables<'care_slots'>;
export const CARE_SCOPES = ['livestock', 'health', 'vaccinations', 'treatments'] as const;
export const CARE_STATUSES = ['requested', 'confirmed', 'declined', 'cancelled', 'completed', 'no_show'] as const;
export class CareError extends Error { constructor(public key: TranslationKey) { super(key); } }
export function careError(error: unknown): TranslationKey {
  if (error instanceof CareError) return error.key;
  const e = error as { code?: string; message?: string };
  if (e?.code === '23505') return 'care.error.conflict';
  if (e?.message?.includes('credentials_required')) return 'care.error.credentials';
  if (e?.code === '42501') return 'care.error.forbidden';
  return 'care.error.generic';
}
function result<T>(r: { data: T; error: { code?: string; message?: string } | null }): T {
  if (r.error) throw new CareError(careError(r.error));
  return r.data;
}
type Functions = Database['public']['Functions'];
export const careService = {
  async directory() { return result(await supabase.from('vet_public_profiles').select('*').eq('published', true).order('display_name')) ?? []; },
  async professional(id: string) { return result(await supabase.from('vet_public_profiles').select('*').eq('user_id', id).maybeSingle()); },
  async slots(vetId?: string) {
    let q = supabase.from('care_slots').select('*').eq('published', true).gt('starts_at', new Date().toISOString()).order('starts_at');
    if (vetId) q = q.eq('vet_id', vetId);
    return result(await q) ?? [];
  },
  async ownSlots(id: string) { return result(await supabase.from('care_slots').select('*').eq('vet_id', id).order('starts_at', { ascending: false })) ?? []; },
  async saveProfile(row: Database['public']['Tables']['vet_public_profiles']['Insert']) { result(await supabase.from('vet_public_profiles').upsert(row)); },
  async addSlot(row: Database['public']['Tables']['care_slots']['Insert']) { result(await supabase.from('care_slots').insert(row)); },
  async publishSlot(id: string, published: boolean) { result(await supabase.from('care_slots').update({ published }).eq('id', id)); },
  async shares() { return result(await supabase.from('care_shares').select('*').order('created_at', { ascending: false })) ?? []; },
  async share(args: Functions['care_set_share']['Args']) { return result(await supabase.rpc('care_set_share', args)); },
  async sharedRecords(livestock: string, farmer: string) { return result(await supabase.rpc('care_shared_records', { _livestock: livestock, _farmer: farmer })); },
  async animals() { return result(await supabase.from('livestock').select('id,name,identification_code,species,status').eq('status','active').order('created_at', { ascending: false })) ?? []; },
  async appointments() { return result(await supabase.from('care_appointments').select('*').order('starts_at', { ascending: false })) ?? []; },
  async book(slot: string, livestock: string, reason: string) { return result(await supabase.rpc('care_book', { _slot: slot, _livestock: livestock, _reason: reason })); },
  async transition(id: string, status: string) { result(await supabase.rpc('care_transition', { _id: id, _status: status })); },
  async reschedule(id: string, slot: string) { return result(await supabase.rpc('care_reschedule', { _id: id, _slot: slot })); },
  async messages(id: string) { return result(await supabase.from('care_messages').select('*').eq('appointment_id',id).order('created_at')) ?? []; },
  async send(id: string, body: string) { return result(await supabase.rpc('care_send_message', { _appointment: id, _body: body })); },
  async readMessages(id: string) { result(await supabase.rpc('care_read_messages', { _appointment: id })); },
  async notes(id: string) { return result(await supabase.from('care_consultations').select('*').eq('appointment_id',id).order('created_at', { ascending: false })) ?? []; },
  async saveNote(args: Functions['care_save_consultation']['Args']) { return result(await supabase.rpc('care_save_consultation', args)); },
  async prescriptions(id: string) { return result(await supabase.from('care_prescriptions').select('*').eq('appointment_id',id).order('issued_at', { ascending: false })) ?? []; },
  async issue(args: Functions['care_publish_prescription']['Args']) { return result(await supabase.rpc('care_publish_prescription', args)); },
  async administrations(ids: string[]) { if (!ids.length) return []; return result(await supabase.from('care_administrations').select('*').in('prescription_id',ids).order('created_at', { ascending: false })) ?? []; },
  async administer(args: Functions['care_record_administration']['Args']) { return result(await supabase.rpc('care_record_administration', args)); },
  async notifications(farmer: boolean) { if (farmer) result(await supabase.rpc('care_followup_notifications')); return result(await supabase.from('care_notifications').select('*').order('created_at', { ascending: false }).limit(100)) ?? []; },
  async readNotification(id: string) { result(await supabase.from('care_notifications').update({ read_at: new Date().toISOString() }).eq('id',id)); },
  async blocks() { return result(await supabase.from('care_blocks').select('*')) ?? []; },
  async block(me: string, other: string, blocked: boolean) { if (blocked) result(await supabase.from('care_blocks').insert({ blocker_id: me, blocked_id: other })); else result(await supabase.from('care_blocks').delete().eq('blocker_id',me).eq('blocked_id',other)); },
  async report(me: string, other: string, appointment: string, reason: string) { result(await supabase.from('care_reports').insert({ reporter_id:me,reported_id:other,appointment_id:appointment,reason })); },
  async aiHistory() { return result(await supabase.from('care_ai_requests').select('*').order('created_at', { ascending:false }).limit(50)) ?? []; },
  async reports() { return result(await supabase.rpc('care_report_metadata')) ?? []; },
  async reviewReport(id: string) { result(await supabase.rpc('care_review_report', { _id:id })); },
};
export function careDate(iso: string, language: string) {
  return new Intl.DateTimeFormat(language === 'ha' ? 'ha-NG' : 'en-NG', { dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Lagos' }).format(new Date(iso));
}
export function lagosTimestamp(local: string) { return new Date(`${local}:00+01:00`).toISOString(); }
export function careHead(title: string, description: string) {
  return { meta: [{ title:`${title} — AgriVet OS` },{ name:'description',content:description },{ property:'og:title',content:`${title} — AgriVet OS` },{ property:'og:description',content:description },{ property:'og:type',content:'website' },{ name:'twitter:card',content:'summary' }] };
}