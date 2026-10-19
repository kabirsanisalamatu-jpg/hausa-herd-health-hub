import { test, expect } from 'bun:test';
import postgres from 'postgres';

// All fixtures and assertions run in one rolled-back transaction; no real data is modified.
test('Phase 9 clinical authorization, immutability, booking and sharing rules', async () => {
 const sql=postgres({ max:1 }); let checks=0;
 await sql.begin(async tx=>{
  const ids=Array.from({length:8},()=>crypto.randomUUID());
  const [farmer,other,vet,pending,admin,animal,slot]=ids;
  if(!farmer||!other||!vet||!pending||!admin||!animal||!slot)throw new Error('fixture');
  for(const [id,role] of [[farmer,'farmer'],[other,'farmer'],[vet,'vet'],[pending,'vet'],[admin,'farmer']]){
   await tx`insert into auth.users(id,email,raw_user_meta_data) values(${id},${`care-${id}@example.invalid`},${tx.json({full_name:'Fictional Care Test',user_type:role})})`;
  }
  await tx`insert into public.user_roles(user_id,role) values(${admin},'admin')`;
  await tx`update public.vet_verifications set status='approved' where user_id=${vet}`;
  await tx`insert into public.livestock(id,owner_id,record_type,name,species) values(${animal},${farmer},'individual','Fictional Care Goat','goats')`;
  async function as(id:string|null){await tx`reset role`;await tx`select set_config('request.jwt.claim.sub',${id??''},true)`;await tx.unsafe(id?'set local role authenticated':'set local role anon');}
  async function yes(label:string, query:()=>Promise<unknown>, expected:unknown){expect(await query(),label).toEqual(expected);checks++;}
  async function denied(label:string, query:()=>Promise<unknown>){await tx.savepoint(async sp=>{let failed=false;try{await query();}catch{failed=true;}expect(failed,label).toBe(true);checks++;throw new Error('rollback savepoint');}).catch(e=>{if(e.message!=='rollback savepoint')throw e;});}
  await as(pending); await denied('Pending vets cannot publish profiles',()=>tx`insert into public.vet_public_profiles(user_id,display_name,published) values(${pending},'Pending',true)`);
  await as(vet);await tx`insert into public.vet_public_profiles(user_id,display_name,qualifications,licence,published) values(${vet},'Fictional Veterinarian','Fictional test qualification','TEST-NOT-REAL',true)`;
  await tx`insert into public.care_slots(id,vet_id,starts_at,ends_at,consultation_type) values(${slot},${vet},now()+interval '2 days',now()+interval '2 days 30 minutes','online')`;
  await denied('Overlapping slots blocked',()=>tx`insert into public.care_slots(vet_id,starts_at,ends_at,consultation_type) values(${vet},now()+interval '2 days 10 minutes',now()+interval '2 days 40 minutes','online')`);
  await as(null);await yes('Public approved profile visible',async()=>Number((await tx`select count(*) n from public.vet_public_profiles`)[0]?.n),1);
  await denied('Anonymous cannot read clinical messages',()=>tx`select * from public.care_messages`);
  await as(other);await denied('Other farmer cannot share animal',()=>tx`select public.care_set_share(${vet},${animal},ARRAY['livestock'],NULL,false)`);
  await as(farmer);await denied('Booking requires share',()=>tx`select public.care_book(${slot},${animal},'Fictional problem')`);
  await tx`select public.care_set_share(${vet},${animal},ARRAY['livestock','health'],now()+interval '3 days',false)`;
  const ap=(await tx`select public.care_book(${slot},${animal},'Fictional observation') id`)[0]?.id as string;
  await denied('Duplicate slot booking denied',()=>tx`select public.care_book(${slot},${animal},'Second booking')`);
  await denied('Farmer cannot confirm appointment',()=>tx`select public.care_transition(${ap},'confirmed')`);
  await as(vet);await tx`select public.care_transition(${ap},'confirmed')`;
  await yes('Only granted scopes returned',async()=>Object.keys((await tx`select public.care_shared_records(${animal},${farmer}) data`)[0]?.data).sort(),['health','livestock']);
  await yes('Original livestock table not expanded for vet',async()=>Number((await tx`select count(*) n from public.livestock where id=${animal}`)[0]?.n),0);
  const note=(await tx`select public.care_save_consultation(${ap},'Farmer report','Fictional assessment','Fictional recommendations',public.farm_today()+1,NULL) id`)[0]?.id as string;
  await denied('Explicit prescription confirmation required',()=>tx`select public.care_publish_prescription(${ap},${note},'TEST ONLY','TEST','TEST','TEST','TEST','','',NULL,NULL)`);
  const rx=(await tx`select public.care_publish_prescription(${ap},${note},'TEST ONLY','TEST','TEST','TEST','TEST','','',true,NULL) id`)[0]?.id as string;
  await denied('Vet cannot modify issued prescription',()=>tx`update public.care_prescriptions set dose='forged' where id=${rx}`);
  await as(farmer);await yes('Farmer can read issued prescription',async()=>Number((await tx`select count(*) n from public.care_prescriptions where id=${rx}`)[0]?.n),1);
  await yes('Issuance does not mean administration',async()=>Number((await tx`select count(*) n from public.care_administrations where prescription_id=${rx}`)[0]?.n),0);
  await denied('Tomorrow administration rejected',()=>tx`select public.care_record_administration(${rx},public.farm_today()+1,'Fictional tester','')`);
  await tx`select public.care_record_administration(${rx},public.farm_today(),'Fictional tester','')`;
  await tx`select public.care_send_message(${ap},'Fictional message')`;
  await as(other);for(const table of ['care_appointments','care_messages','care_consultations','care_prescriptions','care_notifications'])await yes(`Other farmer cannot read ${table}`,async()=>Number((await tx.unsafe(`select count(*) n from public.${table}`))[0]?.n),0);
  await denied('Other farmer cannot send messages',()=>tx`select public.care_send_message(${ap},'forged')`);
  await as(admin);for(const table of ['care_appointments','care_messages','care_consultations','care_prescriptions'])await yes(`Admin has no automatic ${table} access`,async()=>Number((await tx.unsafe(`select count(*) n from public.${table}`))[0]?.n),0);
  await as(farmer);await tx`select public.care_followup_notifications()`;await tx`select public.care_followup_notifications()`;
  await yes('Followup notifications deduplicated',async()=>Number((await tx`select count(*) n from public.care_notifications where kind='follow_up'`)[0]?.n),1);
  await tx`insert into public.care_blocks(blocker_id,blocked_id) values(${farmer},${vet})`;
  await as(vet);await denied('Blocked vet cannot message',()=>tx`select public.care_send_message(${ap},'blocked')`);
  await as(farmer);await tx`select public.care_set_share(${vet},${animal},ARRAY['livestock'],NULL,true)`;
  await as(vet);await yes('Revocation removes prescription read immediately',async()=>Number((await tx`select count(*) n from public.care_prescriptions where id=${rx}`)[0]?.n),0);
  await denied('Revoked vet cannot write note',()=>tx`select public.care_save_consultation(${ap},'','forged','',NULL,NULL)`);
  await denied('Revoked scoped read denied',()=>tx`select public.care_shared_records(${animal},${farmer})`);
  await as(farmer);await yes('Farmer retains revoked prescription history',async()=>Number((await tx`select count(*) n from public.care_prescriptions where id=${rx}`)[0]?.n),1);
  await tx`reset role`; await denied('Issued prescription immutable even privileged',()=>tx`update public.care_prescriptions set dose='forged' where id=${rx}`);
  await yes('No client delete grants for clinical records',async()=>Boolean((await tx`select has_table_privilege('authenticated','public.care_prescriptions','DELETE') allowed`)[0]?.allowed),false);
  throw new Error('ROLLBACK_FIXTURES');
 }).catch(e=>{if(e.message!=='ROLLBACK_FIXTURES')throw e;});
 await sql.end();expect(checks).toBeGreaterThan(25);console.log(`Care security checks passed: ${checks}; all fictional fixtures rolled back.`);
},60000);