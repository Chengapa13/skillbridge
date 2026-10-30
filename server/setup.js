import mysql from 'mysql2/promise';
import {readFile} from 'node:fs/promises';
import {mongo,mongoClient} from './db.js';
const name=process.env.MYSQL_DATABASE||'skillbridge';
if(!/^[a-zA-Z0-9_]+$/.test(name))throw Error('Invalid database name');
const c=await mysql.createConnection({host:process.env.MYSQL_HOST||'127.0.0.1',port:Number(process.env.MYSQL_PORT||3306),user:process.env.MYSQL_USER||'root',password:process.env.MYSQL_PASSWORD||'',multipleStatements:true});
try {
await c.query('CREATE DATABASE IF NOT EXISTS `'+name+'`');await c.query('USE `'+name+'`');await c.query(await readFile(new URL('../db/schema.sql',import.meta.url),'utf8'));
for(const skill of ['SQL','Python','JavaScript','React','Git','Communication']) await c.execute('INSERT IGNORE INTO skills(name) VALUES(?)',[skill]);
await mongoClient.connect();
for(const collection of ['journal_entries','session_notes']) {
 const validator={$jsonSchema:{bsonType:'object',required:['relationship_id','author_id','body','created_at'],properties:{relationship_id:{bsonType:'int'},author_id:{bsonType:'int'},body:{bsonType:'string',maxLength:10000},created_at:{bsonType:'date'}}}};
 if(!(await mongo.listCollections({name:collection}).toArray()).length)await mongo.createCollection(collection,{validator});
 await mongo.collection(collection).createIndex({relationship_id:1,created_at:-1});
}
console.log('MySQL schema and MongoDB collections initialized. Register an account in the app.');
} finally {await c.end();await mongoClient.close();}
