import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';
export const sql = mysql.createPool({host:process.env.MYSQL_HOST||'127.0.0.1',port:Number(process.env.MYSQL_PORT||3306),user:process.env.MYSQL_USER||'root',password:process.env.MYSQL_PASSWORD||'',database:process.env.MYSQL_DATABASE||'skillbridge',connectionLimit:10,timezone:'Z'});
export const mongoClient=new MongoClient(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017',{serverSelectionTimeoutMS:3000});
export const mongo=mongoClient.db(process.env.MONGODB_DATABASE||'skillbridge');
export async function query(statement,args=[]) { const [rows]=await sql.execute(statement,args);return rows; }
export async function transaction(fn) {const c=await sql.getConnection();try{await c.beginTransaction();const result=await fn(c);await c.commit();return result;}catch(e){await c.rollback();throw e;}finally{c.release();}}
