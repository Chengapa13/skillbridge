# SkillBridge

Local internship and mentorship application. React + Vite, Express, MySQL and MongoDB. Matching is deterministic and uses skill requirements; there is no AI integration.

## Setup

1. Run MySQL Server (port 3306) and MongoDB (port 27017).
2. Copy `.env.example` to `.env` if it does not already exist. Enter your MySQL username and password there. Do not commit this file.
3. Run `npm install`.
4. Run `npm run db:setup` to create the schema, seed the skill catalog, and initialize MongoDB collections.
5. Run `npm run dev` and open http://127.0.0.1:5173. Use that exact hostname because mutation requests validate the origin.
6. Register student and mentor accounts through the interface.

For an administrator, register a normal account first, then use a trusted MySQL session to update its role to `admin` in the `users` table. Public registration deliberately cannot grant administrator permissions. Administrators can publish internship listings and review applications.

## Commands

- `npm run dev`: frontend and API development servers
- `npm run build`: production frontend build
- `npm start`: API and built frontend; change APP_ORIGIN to http://127.0.0.1:3001 when serving this way
- `npm test`: skill scoring and workflow unit tests
- `npm run db:setup`: idempotent initial schema setup (not a migration system)

## Implemented workflows

Registration and cookie sessions; role-based authorization; profiles and proficiency; internship publishing, weighted matching, applications, decision history; mentor requests and acceptance; availability and transactional booking; shared MongoDB journals; aggregate reports.

SQL owns users, skills, applications and scheduling. MongoDB owns journal documents. Journal access requires an accepted SQL mentorship and participant ownership. Booking locks the student and slot records; a unique slot constraint prevents duplicate booking and overlap checks prevent student conflicts. Availability creation locks the mentor account to serialize overlap checks.

Dates are stored as UTC and displayed in local time. Skill matching weights critical/required/preferred skills 3/2/1; matching requires sufficient proficiency. Missing critical skills prevent application submission.

## Current limits

The first implementation uses JavaScript rather than TypeScript. Mentors can register directly; admin approval, archival, booking cancellation, private journals, structured milestones, password recovery, pagination beyond the most recent 100 journal entries, and session-note editing remain future work. The session_notes collection is initialized but has no interface yet. No sample companies or fake opportunities are inserted.

Unit tests do not replace live integration testing against both databases. For a manual end-to-end check, create admin, student, and mentor accounts; publish an internship; set student skills; apply and shortlist; request and accept mentorship; create and book availability; add a journal entry. Attempt duplicate applications, duplicate booking, unauthorized journal reads, and overlapping slots.

For production, configure HTTPS, a least-privilege database account, database backups, and a stable supported Node.js release. Secure cookies require HTTPS when NODE_ENV=production.
