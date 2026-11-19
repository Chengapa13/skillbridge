-- Demonstrates CREATE / ALTER / INDEX / DROP on a DISPOSABLE table only.
-- Safe for coursework: does not modify SkillBridge application tables.
DROP TABLE IF EXISTS skillbridge_ddl_demo;
CREATE TABLE skillbridge_ddl_demo (
  id INT PRIMARY KEY AUTO_INCREMENT,
  label VARCHAR(30) NOT NULL
);
ALTER TABLE skillbridge_ddl_demo
  ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX idx_ddl_demo_label ON skillbridge_ddl_demo(label);
DROP INDEX idx_ddl_demo_label ON skillbridge_ddl_demo;
DROP TABLE skillbridge_ddl_demo;
