import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {query,sql,mongo,mongoClient} from '../server/db.js';
const port=3119,origin=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['--env-file=.env','server/index.js'],{env:{...process.env,PORT:String(port),APP_ORIGIN:origin},stdio:['ignore','pipe','pipe']});
const suffix=Date.now(),users=[],relationships=[],jobs=[],companies=[];
let checks=0;
async function call(path,method='GET',data,cookie='',expected=200){const r=await fetch(origin+'/api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},...(data?{body:JSON.stringify(data)}:{})});const body=await r.json();assert.equal(r.status,expected,`${method} ${path}: ${JSON.stringify(body)}`);checks++;return {body,cookie:r.headers.get('set-cookie')?.split(';')[0]||cookie};}
async function register(name,role){const email=`integration-${name}-${suffix}@example.test`;const result=await call('/auth/register','POST',{name,email,role,password:'IntegrationPass!26'},'',201);users.push(result.body.id);return result;}
try{
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(origin+'/api/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert(ready,'Both databases and temporary API must be ready');
 const admin=await call('/auth/login','POST',{email:'admin@skillbridge.demo',password:'SkillBridgeDemo!26'});
 const student=await register('student','student'),other=await register('other','student'),mentor=await register('mentor','mentor');
 await call('/admin/mentors','GET',null,student.cookie,403);
 await call('/mentorships','POST',{mentor_id:mentor.body.id},student.cookie,404);
 await call(`/admin/mentors/${mentor.body.id}`,'PATCH',{approved:true},admin.cookie);
 const skills=(await call('/skills','GET',null,student.cookie)).body;
 const skill=skills.find(s=>s.name==='SQL');
 await call('/profile','PUT',{bio:'Integration test',organization:'Test college',skills:[{skill_id:skill.id,level:3}]},student.cookie);
 const company=`Integration Company ${suffix}`;
 const job=await call('/internships','POST',{company,title:'Integration internship',description:'Temporary automated test listing.',location:'Remote',stipend:1000,deadline:new Date(Date.now()+86400000).toISOString(),skills:[{skill_id:skill.id,importance:'critical',min_level:2}]},admin.cookie,201);jobs.push(job.body.id);companies.push(company);
 const listed=(await call('/internships','GET',null,student.cookie)).body.find(j=>j.id===job.body.id);assert.equal(listed.score,100);assert.equal(listed.eligible,true);
 await call(`/internships/${job.body.id}/apply`,'POST',{},other.cookie,400);
 await call(`/internships/${job.body.id}/apply`,'POST',{},student.cookie,201);
 await call(`/internships/${job.body.id}/apply`,'POST',{},student.cookie,409);
 const application=(await call('/applications','GET',null,student.cookie)).body.find(a=>a.internship_id===job.body.id);
 await call(`/applications/${application.id}`,'PATCH',{status:'selected'},admin.cookie,400);
 await call(`/applications/${application.id}`,'PATCH',{status:'shortlisted'},admin.cookie);
 await call(`/applications/${application.id}/history`,'GET',null,other.cookie,403);
 const history=(await call(`/applications/${application.id}/history`,'GET',null,student.cookie)).body;assert.deepEqual(history.map(h=>h.status),['applied','shortlisted']);
 await call('/mentorships','POST',{mentor_id:mentor.body.id},student.cookie,201);
 await call('/mentorships','POST',{mentor_id:mentor.body.id},other.cookie,201);
 const ms=(await call('/mentorships','GET',null,mentor.cookie)).body;relationships.push(...ms.map(m=>m.id));for(const m of ms)await call(`/mentorships/${m.id}`,'PATCH',{status:'accepted'},mentor.cookie);
 const m=ms.find(m=>m.student_id===student.body.id);
 await call(`/mentorships/${m.id}/journal`,'POST',{body:'Integration journal entry'},student.cookie,201);
 await call(`/mentorships/${m.id}/journal`,'GET',null,other.cookie,403);
 const journal=(await call(`/mentorships/${m.id}/journal`,'GET',null,mentor.cookie)).body[0];
 await call(`/journal/${journal._id}`,'PUT',{body:'Updated reflection',tasks:[{title:'Practice joins',done:true}]},student.cookie);
 await call(`/journal/${journal._id}`,'DELETE',{},mentor.cookie,404);
 const starts_at=new Date(Date.now()+5*86400000).toISOString(),ends_at=new Date(Date.now()+5*86400000+3600000).toISOString();
 await call('/slots','POST',{starts_at,ends_at},mentor.cookie,201);
 await call('/slots','POST',{starts_at,ends_at},mentor.cookie,409);
 let slot=(await call('/slots','GET',null,student.cookie)).body.find(s=>s.mentor_id===mentor.body.id);
 const concurrent=await Promise.all([student,other].map(u=>fetch(origin+`/api/slots/${slot.id}/book`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:u.cookie},body:'{}'})));
 assert.deepEqual(concurrent.map(r=>r.status).sort(),[201,409]);checks++;
 const winner=concurrent[0].status===201?student:other;
 let session=(await call('/sessions','GET',null,winner.cookie)).body[0];
 await call(`/sessions/${session.id}/notes`,'POST',{body:'A session plan',tasks:[{title:'Read the schema',done:false}]},mentor.cookie,201);
 const note=(await call(`/sessions/${session.id}/notes`,'GET',null,winner.cookie)).body[0];assert.equal(note.tasks.length,1);
 await call(`/sessions/${session.id}`,'PATCH',{status:'completed'},mentor.cookie,400);
 await call(`/sessions/${session.id}`,'PATCH',{status:'cancelled'},winner.cookie);
 await call(`/slots/${slot.id}/book`,'POST',{},student.cookie,201);
 const sessions=(await call('/sessions','GET',null,student.cookie)).body;
 session=sessions.find(s=>s.status==='scheduled');
 await query('UPDATE mentor_slots SET starts_at=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 2 HOUR),ends_at=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 HOUR) WHERE id=?',[slot.id]);
 await call(`/sessions/${session.id}`,'PATCH',{status:'completed'},mentor.cookie);
 await call(`/sessions/${session.id}/rating`,'PUT',{rating:5},student.cookie);
 await call(`/sessions/${session.id}/rating`,'PUT',{rating:6},student.cookie,400);
 await call(`/admin/internships/${job.body.id}`,'PATCH',{is_active:false},admin.cookie);
 assert(!(await call('/internships','GET',null,student.cookie)).body.some(j=>j.id===job.body.id));
 await call('/reports','GET',null,admin.cookie);
 await call('/dashboard','GET',null,student.cookie);
 await call(`/journal/${journal._id}`,'DELETE',{},student.cookie);
 await call('/auth/logout','POST',{},student.cookie);
 await call('/me','GET',null,student.cookie,401);
 console.log(`PASS: ${checks} API checks including roles, matching, history, MongoDB ownership, concurrent booking, cancellation, completion, ratings and reports.`);
}finally{
 child.kill();await once(child,'exit').catch(()=>{});
 for(const relationship_id of relationships){await mongo.collection('journal_entries').deleteMany({relationship_id});await mongo.collection('session_notes').deleteMany({relationship_id});await query('DELETE FROM mentorship_sessions WHERE mentorship_id=?',[relationship_id]);await query('DELETE FROM mentorships WHERE id=?',[relationship_id]);}
 for(const user of users){await query('DELETE h FROM application_status_history h JOIN applications a ON a.id=h.application_id WHERE a.student_id=?',[user]);await query('DELETE FROM applications WHERE student_id=?',[user]);await query('DELETE FROM mentor_slots WHERE mentor_id=?',[user]);await query('DELETE FROM auth_sessions WHERE user_id=?',[user]);await query('DELETE FROM user_skills WHERE user_id=?',[user]);await query('DELETE FROM profiles WHERE user_id=?',[user]);await query('DELETE FROM users WHERE id=?',[user]);}
 for(const job of jobs){await query('DELETE FROM internship_skills WHERE internship_id=?',[job]);await query('DELETE FROM internships WHERE id=?',[job]);}
 for(const name of companies)await query('DELETE FROM companies WHERE name=?',[name]);
 await sql.end();await mongoClient.close();
}
