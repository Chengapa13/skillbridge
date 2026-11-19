import {sql, mongo, mongoClient, query} from '../server/db.js';

const database = process.env.MYSQL_DATABASE || 'skillbridge';
const expectedTables = [
  'users', 'profiles', 'skills', 'user_skills', 'companies', 'internships',
  'internship_skills', 'applications', 'application_status_history',
  'mentorships', 'mentor_slots', 'mentorship_sessions', 'auth_sessions',
  'schema_migrations'
];

function ensure(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`OK: ${message}`);
}

try {
  const tables = await query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`, [database]
  );
  const names = new Set(tables.map(t => t.TABLE_NAME));
  for (const table of expectedTables) {
    ensure(names.has(table), `MySQL table ${table}`);
  }

  const viewRows = await query(
    `SELECT TABLE_NAME FROM information_schema.VIEWS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'open_internships'`, [database]
  );
  ensure(viewRows.length === 1, 'MySQL open_internships view');

  const columns = await query(
    `SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('users', 'mentorship_sessions')`, [database]
  );
  const hasColumn = (table, column) => columns.some(c => c.TABLE_NAME === table && c.COLUMN_NAME === column);
  for (const column of ['approved']) ensure(hasColumn('users', column), `users.${column} migration`);
  for (const column of ['status', 'feedback_rating', 'active_slot_id']) {
    ensure(hasColumn('mentorship_sessions', column), `mentorship_sessions.${column} migration`);
  }

  const [constraints] = await query(
    `SELECT
       SUM(CONSTRAINT_TYPE = 'FOREIGN KEY') AS foreign_keys,
       SUM(CONSTRAINT_TYPE = 'CHECK') AS checks
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = ?`, [database]
  );
  ensure(Number(constraints.foreign_keys) >= 12, 'At least 12 foreign key constraints');
  ensure(Number(constraints.checks) >= 4, 'At least 4 SQL CHECK constraints');

  const indexes = await query(
    `SELECT INDEX_NAME FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'mentorship_sessions'`, [database]
  );
  ensure(indexes.some(i => i.INDEX_NAME === 'uq_active_slot'), 'Unique active-slot booking index');

  await mongoClient.connect();
  const collections = await mongo.listCollections({}, {nameOnly: false}).toArray();
  for (const collectionName of ['journal_entries', 'session_notes']) {
    const collectionInfo = collections.find(c => c.name === collectionName);
    ensure(Boolean(collectionInfo), `MongoDB ${collectionName} collection`);
    ensure(Boolean(collectionInfo.options?.validator?.$jsonSchema), `${collectionName} JSON schema validator`);
    if (collectionName === 'session_notes') {
      ensure(collectionInfo.options.validator.$jsonSchema.required.includes('session_id'),
        'Session notes require session_id at the MongoDB level');
    }
    const indexes = await mongo.collection(collectionName).indexes();
    ensure(indexes.some(i => i.key?.relationship_id === 1 && i.key?.created_at === -1),
      `${collectionName} relationship/timeline compound index`);
  }

  console.log('\nPASS: MySQL schema, migrations, constraints, indexes, view, and MongoDB models verified.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
  await mongoClient.close();
}
