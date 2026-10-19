import { test,expect } from 'bun:test';
import { readFileSync } from 'node:fs';
// Uses dedicated fictional users created by the test setup, never a real account.
const fixtures=JSON.parse(readFileSync('/tmp/browser/care/fixtures.json','utf8')) as {id:string;email:string;password:string;role:string}[];
const url=process.env['SUPABASE_URL'];const key=process.env['VITE_SUPABASE_PUBLISHABLE_KEY']??process.env['SUPABASE_ANON_KEY'];
if(!url||!key)throw new Error('Public test configuration missing');
const sessions:string[]=[];
async function call(index:number|null,path:string,method='GET',body?:unknown){const h:Record<string,string>={apikey:key,'Content-Type':'application/json',Prefer:'return=representation'};const token=index===null?null:sessions[index];if(token)h.Authorization=`Bearer ${token}`;const r=await fetch(`${url}${path}`,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)});return {ok:r.ok,status:r.status,data:await r.json().catch(()=>null)};}
async function rpc(index:number,name:string,body:unknown){return call(index,`/rest/v1/rpc/${name}`,'POST',body);}
test('Signed-in veterinary care privacy, booking, messaging, prescriptions, dates and revocation',async()=>{
 for(const f of fixtures){const r=await fetch(`${url}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email:f.email,password:f.password})});const d=await r.json();if(!r.ok)throw new Error('Fictional login failed');sessions.push(d.access_token);}
 const farmer=fixtures[0];const vet=fixtures[2];const pending=fixtures[3];if(!farmer||!vet||!pending)throw new Error();
 let checks=0;const check=(condition:unknown,label:string)=>{expect(condition,label).toBeTruthy();checks++;};
 let r=await call(0,'/rest/v1/livestock','POST',{record_type:'individual',name:'Fictional Phase 9 Goat',species:'goats'});check(r.ok,'Farmer registers own livestock');const animal=r.data[0].id;
 r=await call(3,'/rest/v1/vet_public_profiles','POST',{user_id:pending.id,display_name:'Fictional Pending Vet',published:true});check(!r.ok,'Pending vet cannot publish');
 r=await call(2,'/rest/v1/vet_public_profiles','POST',{user_id:vet.id,display_name:'Fictional Care Veterinarian',qualifications:'TEST ONLY – fictional qualification',licence:'TEST-NOT-REAL',specialties:['Fictional test'],species:['goats'],languages:['en','ha'],published:true});check(r.ok,'Approved vet publishes own profile');
 const start=new Date(Date.now()+2*86400000).toISOString();const end=new Date(Date.now()+2*86400000+1800000).toISOString();
 r=await call(2,'/rest/v1/care_slots','POST',{vet_id:vet.id,starts_at:start,ends_at:end,consultation_type:'online'});check(r.ok,'Approved vet publishes future availability');const slot=r.data[0].id;
 r=await call(2,'/rest/v1/care_slots','POST',{vet_id:vet.id,starts_at:new Date(new Date(start).getTime()+60000).toISOString(),ends_at:end,consultation_type:'online'});check(!r.ok,'Overlapping availability blocked');
 r=await call(null,`/rest/v1/vet_public_profiles?user_id=eq.${vet.id}`);check(r.ok&&r.data.length===1,'Signed-out public approved profile');
 r=await call(null,'/rest/v1/care_messages');check(!r.ok,'Anonymous clinical message read denied');
 r=await rpc(1,'care_set_share',{_vet:vet.id,_livestock:animal,_scopes:['livestock']});check(!r.ok,'Other farmer cannot grant share');
 r=await rpc(0,'care_book',{_slot:slot,_livestock:animal,_reason:'Fictional consultation request'});check(!r.ok,'Booking without share denied');
 r=await rpc(0,'care_set_share',{_vet:vet.id,_livestock:animal,_scopes:['livestock','health'],_expires:new Date(Date.now()+4*86400000).toISOString()});check(r.ok,'Farmer creates exact scoped share');
 const bookings=await Promise.all([rpc(0,'care_book',{_slot:slot,_livestock:animal,_reason:'Fictional consultation request'}),rpc(0,'care_book',{_slot:slot,_livestock:animal,_reason:'Fictional duplicate request'})]);check(bookings.filter(x=>x.ok).length===1,'Concurrent requests reserve slot only once');const appointment=bookings.find(x=>x.ok)?.data;
 r=await rpc(0,'care_transition',{_id:appointment,_status:'confirmed'});check(!r.ok,'Farmer cannot confirm vet appointment');
 r=await rpc(2,'care_transition',{_id:appointment,_status:'confirmed'});check(r.ok,'Assigned approved vet confirms');
 r=await rpc(2,'care_shared_records',{_livestock:animal,_farmer:farmer.id});check(r.ok&&Object.keys(r.data).sort().join(',')==='health,livestock','Only granted scopes returned');
 r=await call(2,`/rest/v1/livestock?id=eq.${animal}`);check(r.ok&&r.data.length===0,'Shared RPC does not widen original livestock RLS');
 r=await rpc(1,'care_send_message',{_appointment:appointment,_body:'Forged message'});check(!r.ok,'Unassigned sender denied');
 r=await rpc(0,'care_send_message',{_appointment:appointment,_body:'Fictional farmer message'});check(r.ok,'Farmer message saved');
 r=await call(2,`/rest/v1/care_messages?appointment_id=eq.${appointment}`);check(r.ok&&r.data[0].sender_id===farmer.id,'Message ownership comes from authenticated sender');
 r=await rpc(2,'care_read_messages',{_appointment:appointment});check(r.ok,'Recipient marks received messages read');
 r=await call(0,`/rest/v1/care_messages?appointment_id=eq.${appointment}`);check(r.ok&&r.data[0].read_at,'Read state persisted');
 r=await rpc(3,'care_save_consultation',{_appointment:appointment,_report:'','_assessment':'forged',_recommendations:''});check(!r.ok,'Pending vet clinical authorship denied');
 r=await rpc(2,'care_save_consultation',{_appointment:appointment,_report:'Fictional farmer report',_assessment:'Fictional assessment – test only',_recommendations:'Fictional recommendations',_follow_up:new Date(Date.now()+86400000).toISOString().slice(0,10)});check(r.ok,'Assigned approved veterinarian saves note');const note=r.data;
 r=await rpc(0,'care_save_consultation',{_appointment:appointment,_report:'','_assessment':'forged',_recommendations:''});check(!r.ok,'Farmer cannot issue professional note');
 const prescription={_appointment:appointment,_consultation:note,_medicine:'FICTIONAL TEST ONLY',_dose:'TEST ONLY',_route:'TEST ONLY',_frequency:'TEST ONLY',_duration:'TEST ONLY',_instructions:'Not a real prescription',_withdrawal:'TEST ONLY'};
 r=await rpc(2,'care_publish_prescription',{...prescription,_confirmed:false});check(!r.ok,'Issuance requires explicit confirmation');
 r=await rpc(2,'care_publish_prescription',{...prescription,_confirmed:null});check(!r.ok,'Null cannot bypass explicit confirmation');
 r=await rpc(2,'care_publish_prescription',{...prescription,_confirmed:true});check(r.ok,'Confirmed authenticated vet issuance');const rx=r.data;
 r=await call(2,`/rest/v1/care_prescriptions?id=eq.${rx}`,'PATCH',{dose:'forged'});check(!r.ok,'Issued prescription mutation denied');
 r=await call(0,`/rest/v1/care_prescriptions?id=eq.${rx}`);check(r.ok&&r.data.length===1,'Farmer reads issued prescription');
 r=await call(0,`/rest/v1/care_administrations?prescription_id=eq.${rx}`);check(r.ok&&r.data.length===0,'Prescription never auto-records administration');
 const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos'}).format(new Date());const tomorrow=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos'}).format(new Date(Date.now()+86400000));
 r=await rpc(0,'care_record_administration',{_prescription:rx,_date:tomorrow,_by:'Fictional tester',_notes:''});check(!r.ok,'Tomorrow actual administration rejected');
 r=await rpc(0,'care_record_administration',{_prescription:rx,_date:date,_by:'Fictional tester',_notes:''});check(r.ok,'Today explicit administration accepted');
 for(const table of ['care_appointments','care_messages','care_consultations','care_prescriptions']){r=await call(1,`/rest/v1/${table}`);check(r.ok&&r.data.length===0,`Other farmer cannot read ${table}`);}
 r=await call(0,'/rest/v1/care_blocks','POST',{blocker_id:farmer.id,blocked_id:vet.id});check(r.ok,'Farmer blocks assigned vet messages');
 r=await rpc(2,'care_send_message',{_appointment:appointment,_body:'Blocked message'});check(!r.ok,'Block enforced on message action');
 r=await call(0,`/rest/v1/care_blocks?blocker_id=eq.${farmer.id}&blocked_id=eq.${vet.id}`,'DELETE');check(r.ok,'Farmer can unblock');
 r=await rpc(0,'care_followup_notifications',{});check(r.ok,'Saved clinical followup notifications created');await rpc(0,'care_followup_notifications',{});
 r=await call(0,'/rest/v1/care_notifications?kind=eq.follow_up');check(r.ok&&r.data.length===1,'Followup notification deduplicated');
 // Keep the active appointment for the following UI test; revocation is tested after the UI flow.
 await Bun.write('/tmp/browser/care/records.json',JSON.stringify({animal,slot,appointment,note,rx}));
 console.log(`Passed ${checks} real signed-in care security checks.`);
},90000);
