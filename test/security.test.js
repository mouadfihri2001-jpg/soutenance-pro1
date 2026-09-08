import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import handler,{createChatHandler} from '../api/chat.js';
import config from '../api/config.js';
import {makePrompt,validateInputs} from '../shared/modules.js';

const owner='10000000-0000-4000-8000-000000000001',other='20000000-0000-4000-8000-000000000002',projectId='30000000-0000-4000-8000-000000000003';
function response(){return{code:0,body:null,setHeader(){},status(code){this.code=code;return this;},json(data){this.body=data;return this;}};}
test('unauthenticated generation is rejected before provider access',async()=>{
 const r=response();await handler({method:'POST',headers:{},body:{}},r);assert.equal(r.code,401);
});
test('public configuration never exposes server secrets',()=>{
 process.env.ANTHROPIC_API_KEY='secret-ai-test';process.env.SUPABASE_SERVICE_ROLE_KEY='secret-service-test';
 const r=response();config({method:'GET'},r);assert.doesNotMatch(JSON.stringify(r.body),/secret-/);
});
test('source-based writing requires both the plan and consulted excerpts',()=>{
 const project={title:'Mémoire',profile:{},sources:[]};
 assert.throws(()=>makePrompt('redaction',{chapter:'Chapitre 1'},project),/plan/);
 project.profile.planValidated=true;assert.throws(()=>makePrompt('redaction',{},project,'Plan'),/source/);
 project.sources=[{doi:'10.1234/test',title:'An article',excerpt:'An actual source excerpt sufficiently long to ground an academic claim.'}];
 assert.equal(makePrompt('redaction',{},project,'Plan').messages.length,1);
 assert.throws(()=>validateInputs('constructor',{}),/inconnu/);
 assert.throws(()=>validateInputs('correction',{text:'x'.repeat(24001)}),/maximum/);
});
function sessionMock({quota=true,saveError=false}={}){
 const writes=[],jobUpdates=[];
 const db={from(table){
  const q={select(){return q;},eq(){return q;},order(){return q;},limit(){return Promise.resolve({data:[],error:null});},
   insert(value){writes.push(value);return q;},single(){return Promise.resolve(table==='student_projects'?{data:{id:projectId,title:'Mémoire',profile:{},sources:[]}}:saveError?{error:new Error('write failed')}:{data:{id:'doc',...writes.at(-1)}});}};
  return q;
 }};
 const admin={rpc:async()=>({data:{allowed:quota,id:'job',remaining:2}}),from(){return{update(update){jobUpdates.push(update);return{eq:async()=>({error:null})}}}}};
 return{session:{user:{id:owner},db,admin},writes,jobUpdates};
}
test('server selects the model, bounds tokens and saves the generated document',async()=>{
 const mock=sessionMock();let payload;
 const h=createChatHandler(async()=>mock.session,async(url,opts)=>{payload=JSON.parse(opts.body);return{ok:true,json:async()=>({content:[{type:'text',text:'# Plan\nContenu'}],usage:{input_tokens:20,output_tokens:30}})}});
 const r=response();await h({method:'POST',headers:{},body:{projectId,module:'plan',inputs:{instructions:'Adapté à mon sujet'},model:'attacker-model',max_tokens:100000}},r);
 assert.equal(r.code,200);assert.equal(payload.model,process.env.ANTHROPIC_MODEL||'claude-sonnet-4-6');assert.equal(payload.max_tokens,4096);
 assert.equal(mock.writes[0].user_id,owner);assert.equal(mock.jobUpdates.at(-1).status,'completed');
});
test('quota exhaustion stops generation and upstream failures refund reservations',async()=>{
 const mock=sessionMock({quota:false});let called=false;
 const h=createChatHandler(async()=>mock.session,async()=>{called=true;});const r=response();
 await h({method:'POST',headers:{},body:{projectId,module:'plan',inputs:{}}},r);assert.equal(r.code,429);assert.equal(called,false);
 const failed=sessionMock(),bad=createChatHandler(async()=>failed.session,async()=>({ok:false,status:401}));const r2=response();
 await bad({method:'POST',headers:{},body:{projectId,module:'plan',inputs:{}}},r2);assert.equal(r2.code,502);assert.equal(failed.jobUpdates.at(-1).status,'failed');
});
test('the actual PostgreSQL schema isolates owners and enforces plan and quota limits',async()=>{
 const db=await PGlite.create();
 try{
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
   create schema auth; create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
   grant usage on schema public,auth to anon,authenticated,service_role;
   grant execute on function auth.uid() to authenticated;
   alter default privileges in schema public grant execute on functions to anon,authenticated;`);
  await db.exec("create table public.projects(id integer primary key, legacy_note text); insert into public.projects values (1,'Existing team project');");
  await db.exec(await readFile(new URL('../supabase/migrations/001_platform.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/002_restrict_student_helpers.sql',import.meta.url),'utf8'));
  for(const role of ['anon','authenticated']){
   for(const fn of ['student_new_account()','student_touch_updated_at()','student_invalidate_edited_plan()','student_enforce_project_limit()']){
    assert.equal((await db.query("select has_function_privilege($1,$2,'EXECUTE') as allowed",[role,'public.'+fn])).rows[0].allowed,false);
   }
  }
  assert.equal((await db.query('select legacy_note from public.projects where id=1')).rows[0].legacy_note,'Existing team project');
  await db.query('insert into auth.users(id) values ($1),($2)',[owner,other]);
  await db.query('insert into student_projects(id,user_id,title) values ($1,$2,$3)',[projectId,owner,'Projet propriétaire']);
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${other}',false);`);
  assert.equal((await db.query('select * from student_projects')).rows.length,0);
  assert.equal((await db.query("update student_projects set title='Intrusion' returning id")).rows.length,0);
  await assert.rejects(db.query("update student_accounts set plan='max'"),/permission denied/);
  await assert.rejects(db.query('select student_reserve_ai_job($1,$2,$3)',[other,projectId,'plan']),/permission denied/);
  await assert.rejects(db.query("insert into student_documents(user_id,project_id,module,title,content) values ($1,$2,'plan','Titre','Contenu')",[other,projectId]),/foreign key/);
  await db.exec(`select set_config('request.jwt.claim.sub','${owner}',false);`);
  assert.equal((await db.query('select * from student_projects')).rows.length,1);
  const documentId=(await db.query("insert into student_documents(user_id,project_id,module,title,content) values ($1,$2,'plan','Plan','Version initiale') returning id",[owner,projectId])).rows[0].id;
  await db.query("update student_projects set profile=jsonb_build_object('planValidated',true,'validatedPlanId',$1::text) where id=$2",[documentId,projectId]);
  await db.query("update student_documents set content='Plan modifié' where id=$1",[documentId]);
  assert.equal((await db.query('select profile from student_projects where id=$1',[projectId])).rows[0].profile.planValidated,false);
  await assert.rejects(db.query("insert into student_projects(user_id,title) values ($1,'Deuxième projet')",[owner]),/Limite/);
  await db.exec('reset role;');
  for(let i=0;i<3;i++)assert.equal((await db.query("select student_reserve_ai_job($1,$2,'plan') as job",[owner,projectId])).rows[0].job.allowed,true);
  assert.equal((await db.query("select student_reserve_ai_job($1,$2,'plan') as job",[owner,projectId])).rows[0].job.reason,'rate');
  await db.exec("update student_ai_jobs set created_at=now()-interval '2 minutes';");
  assert.equal((await db.query("select student_reserve_ai_job($1,$2,'plan') as job",[owner,projectId])).rows[0].job.reason,'quota');
  await db.exec("update student_ai_jobs set status='failed' where id=(select id from student_ai_jobs limit 1);");
  assert.equal((await db.query("select student_reserve_ai_job($1,$2,'plan') as job",[owner,projectId])).rows[0].job.allowed,true);
  await db.exec(`update student_accounts set plan='max',subscription_expires_at=now()-interval '1 day' where user_id='${owner}';`);
  await assert.rejects(db.query("insert into student_projects(user_id,title) values ($1,'Abonnement expiré')",[owner]),/Limite/);
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${owner}',false);`);
  await db.query('delete from student_projects where id=$1',[projectId]);
  assert.equal((await db.query('select * from student_ai_jobs')).rows.length,4,'deleting a project must not reset the paid API quota');
  await db.exec('reset role;');
  await db.exec('set role anon;');await assert.rejects(db.query('select * from student_projects'),/permission denied/);
 }finally{await db.close();}
});
