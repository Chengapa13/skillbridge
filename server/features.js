import {z} from 'zod';
import {ObjectId} from 'mongodb';
import {query,transaction,mongo} from './db.js';
const id=v=>z.coerce.number().int().positive().parse(v);
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
const content=z.object({body:z.string().trim().min(1).max(10000),tasks:z.array(z.object({title:z.string().trim().min(1).max(200),done:z.boolean()})).max(20).default([])});
export function features(app,role){
  app.get('/api/admin/mentors',role('admin'),async(req,res)=>res.json(await query("SELECT id,name,email,approved FROM users WHERE role='mentor' ORDER BY name")));
  app.patch('/api/admin/mentors/:id',role('admin'),async(req,res)=>{const approved=z.boolean().parse(req.body.approved);const r=await query("UPDATE users SET approved=? WHERE id=? AND role='mentor'",[approved,id(req.params.id)]);if(!r.affectedRows)fail(404,'Mentor not found');res.json({ok:true});});
  app.get('/api/admin/internships',role('admin'),async(req,res)=>res.json(await query('SELECT i.*,c.name company FROM internships i JOIN companies c ON c.id=i.company_id ORDER BY i.id DESC')));
  app.patch('/api/admin/internships/:id',role('admin'),async(req,res)=>{const active=z.boolean().parse(req.body.is_active);const r=await query('UPDATE internships SET is_active=? WHERE id=?',[active,id(req.params.id)]);if(!r.affectedRows)fail(404,'Listing not found');res.json({ok:true});});
  app.get('/api/applications/:id/history',async(req,res)=>{const [a]=await query('SELECT * FROM applications WHERE id=?',[id(req.params.id)]);if(!a||!(req.user.role==='admin'||a.student_id===req.user.id))fail(403,'Application is not accessible');res.json(await query('SELECT h.*,u.name actor FROM application_status_history h JOIN users u ON u.id=h.actor_id WHERE h.application_id=? ORDER BY h.id',[a.id]));});
  async function participant(req,sessionId){const [s]=await query('SELECT ms.*,m.student_id,m.mentor_id FROM mentorship_sessions ms JOIN mentorships m ON m.id=ms.mentorship_id WHERE ms.id=? AND (m.student_id=? OR m.mentor_id=?)',[sessionId,req.user.id,req.user.id]);if(!s)fail(403,'Session is not accessible');return s;}
  app.patch('/api/sessions/:id',async(req,res)=>{const sessionId=id(req.params.id);const desired=z.enum(['completed','cancelled']).parse(req.body.status);await transaction(async c=>{const [[s]]=await c.execute('SELECT ms.*,m.student_id,m.mentor_id,sl.ends_at FROM mentorship_sessions ms JOIN mentorships m ON m.id=ms.mentorship_id JOIN mentor_slots sl ON sl.id=ms.slot_id WHERE ms.id=? FOR UPDATE',[sessionId]);if(!s||![s.student_id,s.mentor_id].includes(req.user.id))fail(403,'Session is not accessible');if(s.status!=='scheduled')fail(409,'Session has already ended');if(desired==='completed'&&(req.user.id!==s.mentor_id||new Date(s.ends_at)>new Date()))fail(400,'Only the mentor can complete a session after its end time');await c.execute('UPDATE mentorship_sessions SET status=? WHERE id=?',[desired,sessionId]);});res.json({ok:true});});
  app.put('/api/sessions/:id/rating',role('student'),async(req,res)=>{const s=await participant(req,id(req.params.id));if(s.student_id!==req.user.id||s.status!=='completed')fail(400,'Rate a completed session');await query('UPDATE mentorship_sessions SET feedback_rating=? WHERE id=?',[z.number().int().min(1).max(5).parse(req.body.rating),s.id]);res.json({ok:true});});
  app.get('/api/sessions/:id/notes',async(req,res)=>{const s=await participant(req,id(req.params.id));res.json(await mongo.collection('session_notes').find({session_id:s.id}).sort({created_at:1}).toArray());});
  app.post('/api/sessions/:id/notes',async(req,res)=>{const s=await participant(req,id(req.params.id));if(s.status==='cancelled')fail(400,'Cannot add notes to a cancelled session');const d=content.parse(req.body);const r=await mongo.collection('session_notes').insertOne({...d,session_id:s.id,relationship_id:s.mentorship_id,author_id:req.user.id,author_name:req.user.name,created_at:new Date()});res.status(201).json({id:r.insertedId});});
  // Owners can update or remove their own document; SQL participation is rechecked.
  for(const collection of ['journal_entries','session_notes']) {
    const path=collection==='journal_entries'?'journal':'notes';
    async function owned(req){if(!ObjectId.isValid(req.params.document))fail(400,'Invalid document ID');const document=await mongo.collection(collection).findOne({_id:new ObjectId(req.params.document),author_id:req.user.id});if(!document)fail(404,'Document not found');const [m]=await query('SELECT id FROM mentorships WHERE id=? AND (student_id=? OR mentor_id=?)',[document.relationship_id,req.user.id,req.user.id]);if(!m)fail(403,'Not a participant');return document;}
    app.put(`/api/${path}/:document`,async(req,res)=>{const document=await owned(req);const d=content.parse(req.body);await mongo.collection(collection).updateOne({_id:document._id},{$set:{...d,updated_at:new Date()}});res.json({ok:true});});
    app.delete(`/api/${path}/:document`,async(req,res)=>{const document=await owned(req);await mongo.collection(collection).deleteOne({_id:document._id});res.json({ok:true});});
  }
  app.get('/api/dashboard',async(req,res)=>{
    const admin=req.user.role==='admin';
    const [listing]=await query('SELECT COUNT(*) total FROM open_internships');
    const [applications]=await query('SELECT COUNT(*) total FROM applications'+(admin?'':' WHERE student_id=?'),admin?[]:[req.user.id]);
    const [connections]=await query("SELECT COUNT(*) total FROM mentorships WHERE status='accepted'"+(admin?'':' AND (student_id=? OR mentor_id=?)'),admin?[]:[req.user.id,req.user.id]);
    const [sessions]=await query("SELECT COUNT(*) total FROM mentorship_sessions s JOIN mentorships m ON m.id=s.mentorship_id JOIN mentor_slots sl ON sl.id=s.slot_id WHERE s.status='scheduled' AND sl.starts_at>UTC_TIMESTAMP()"+(admin?'':' AND (m.student_id=? OR m.mentor_id=?)'),admin?[]:[req.user.id,req.user.id]);
    res.json({listings:listing.total,applications:applications.total,connections:connections.total,sessions:sessions.total});
  });
}
