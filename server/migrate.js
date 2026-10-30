// Additive upgrades for databases created by the initial release.
export async function migrate(c) {
  const [columns] = await c.query('SHOW COLUMNS FROM mentorship_sessions');
  if (!columns.some(x => x.Field === 'status')) {
    await c.query("ALTER TABLE mentorship_sessions ADD status ENUM('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled', ADD feedback_rating INT NULL CHECK(feedback_rating BETWEEN 1 AND 5), ADD active_slot_id INT GENERATED ALWAYS AS (CASE WHEN status <> 'cancelled' THEN slot_id ELSE NULL END) STORED, ADD INDEX idx_session_slot(slot_id), DROP INDEX slot_id, ADD UNIQUE KEY uq_active_slot(active_slot_id)");
  }
  const [users] = await c.query('SHOW COLUMNS FROM users');
  if (!users.some(x => x.Field === 'approved')) await c.query('ALTER TABLE users ADD approved BOOLEAN NOT NULL DEFAULT FALSE');
  await c.query(`CREATE TABLE IF NOT EXISTS schema_migrations (version INT PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  await c.query('INSERT IGNORE INTO schema_migrations(version) VALUES(1)');
}
