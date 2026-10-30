# SkillBridge presentation walkthrough

## Preparation

Start MySQL and MongoDB. From the project directory run `npm run demo:setup`, `npm run build`, and `npm start`. Open `http://127.0.0.1:3001`. The sign-in screen has buttons for fictional student, mentor and administrator accounts; all use `SkillBridgeDemo!26`.

## Seven minute demonstration

1. **Problem and goal (45 seconds):** matching should explain why a role fits and mentorship should have practical follow-through.
2. **Architecture (45 seconds):** use `DATABASE_DESIGN.md` to show MySQL for connected business records and MongoDB for journal text and session notes. The API checks SQL membership before exposing notes.
3. **Student match (75 seconds):** sign in as Aarav. Open Internships; compare skill coverage and proficiency gaps. Missing a critical skill blocks applying. The weight is critical 3, required 2, preferred 1.
4. **Applications and SQL (75 seconds):** show the application list and status history. Explain the transaction that creates a submission and its history record and the uniqueness constraint that prevents duplicate applications.
5. **Mentorship and MongoDB (90 seconds):** open the accepted connection, read the shared journal, add an entry or edit a task. Notes are flexible MongoDB documents, protected by the accepted SQL mentorship.
6. **Scheduling and transactions (75 seconds):** show a completed session with feedback, an upcoming booking and available mentor slots. The API integration check races two students to reserve a single slot; one succeeds.
7. **Admin and close (45 seconds):** use Administration to approve a mentor, manage listings and view reports. Mention foreign keys, constraints, transaction handling, a view, indexes, joins and aggregation.

Use the same fictional demo accounts repeatedly. Seeding is idempotent and preserves project data. To show a new application or journal entry, use the demo UI during the presentation.

## Recovery

If the UI shows a database error, check both database services, `.env`, and `http://127.0.0.1:3001/api/health`. Run `npm run demo:setup` to initialize or reseed. To rebuild the frontend, run `npm ci` then `npm run build`.
