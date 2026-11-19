-- SkillBridge DBMS demonstration queries. READ-ONLY: safe to execute against seeded data.
-- Example: mysql --user=root --password --database=skillbridge < db/demo_queries.sql

-- 1. SELECT + INNER JOIN + LEFT JOIN + GROUP BY + HAVING + COUNT + ORDER BY.
SELECT i.id, i.title, c.name AS company, COUNT(a.id) AS applicant_count
FROM internships AS i
JOIN companies AS c ON c.id = i.company_id
LEFT JOIN applications AS a ON a.internship_id = i.id
GROUP BY i.id, i.title, c.name
HAVING COUNT(a.id) >= 1
ORDER BY applicant_count DESC, i.title;

-- 2. Subquery: internships that have at least one selected applicant.
SELECT i.id, i.title, c.name AS company
FROM internships AS i
JOIN companies AS c ON c.id = i.company_id
WHERE EXISTS (
  SELECT 1 FROM applications AS a
  WHERE a.internship_id = i.id AND a.status = 'selected'
)
ORDER BY i.title;

-- 3. GROUP BY + conditional aggregation on status.
SELECT u.id AS student_id, u.name,
       COUNT(a.id) AS applications,
       SUM(CASE WHEN a.status = 'selected' THEN 1 ELSE 0 END) AS selected_count
FROM users AS u
LEFT JOIN applications AS a ON a.student_id = u.id
WHERE u.role = 'student'
GROUP BY u.id, u.name
HAVING COUNT(a.id) > 0
ORDER BY selected_count DESC, applications DESC;

-- 4. A database view combining open listings with their companies.
SELECT id, title, company, location, stipend, deadline
FROM open_internships
ORDER BY deadline, id
LIMIT 15;

-- 5. Multi-join and AVG for completed mentor sessions with feedback.
SELECT mentor.id, mentor.name AS mentor_name,
       COUNT(ms.id) AS completed_sessions,
       ROUND(AVG(ms.feedback_rating), 2) AS average_rating
FROM users AS mentor
JOIN mentorships AS m ON m.mentor_id = mentor.id
JOIN mentorship_sessions AS ms ON ms.mentorship_id = m.id
WHERE mentor.role = 'mentor' AND ms.status = 'completed'
GROUP BY mentor.id, mentor.name
HAVING COUNT(ms.id) > 0
ORDER BY average_rating DESC, completed_sessions DESC;

-- 6. EXPLAIN shows access paths for indexed mentor availability lookups.
EXPLAIN SELECT s.id, s.starts_at, s.ends_at
FROM mentor_slots AS s
WHERE s.mentor_id = (SELECT u.id FROM users AS u WHERE u.role='mentor' ORDER BY u.id LIMIT 1)
  AND s.starts_at > UTC_TIMESTAMP()
ORDER BY s.starts_at;
