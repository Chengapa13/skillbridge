# SkillBridge

SkillBridge helps students explore internships and mentoring relationships. The web app uses React, Express, MySQL and MongoDB. Internship matching uses transparent skill rules; no AI or vector database is used.

## Run the presentation demo

Install Node.js LTS, MySQL Server 8 and MongoDB Community Server. Start MySQL on port 3306 and MongoDB on port 27017.

```powershell
npm ci
Copy-Item .env.example .env
```

Set the local MySQL username and password in `.env`, then run:

```powershell
npm run demo:setup
npm run build
npm start
```

Open http://127.0.0.1:3001. Three fictional demo accounts are seeded: `student@skillbridge.demo`, `mentor@skillbridge.demo`, and `admin@skillbridge.demo`. Each uses `SkillBridgeDemo!26`. The sign-in page has buttons to populate these accounts. Seed setup is repeatable and leaves user-created data in place.

Use `npm run dev` for development at http://127.0.0.1:5173. Keep `APP_ORIGIN` in `.env` aligned with the address in use. Do not expose this local app to a public network.

## Presentation walkthrough

The suggested 7 minute demo is in [docs/PRESENTATION.md](docs/PRESENTATION.md). The ER model, data dictionary, database operations and example queries are in [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md). [docs/MOVING.md](docs/MOVING.md) explains how to move just the app or transfer both databases.

## Data model

MySQL holds users, profiles, skills, listings, application decisions and history, mentor relationships, availability, bookings, feedback and login sessions. Foreign keys, uniqueness rules, checked values and transactions preserve integrity.

MongoDB holds flexible journal entries and session notes. SQL relationships and participant access are checked by the API before MongoDB records are read or changed. MongoDB IDs are not foreign keys into MySQL.

The local `.env` file holds credentials and is excluded by Git. The sample database configuration is intended for local coursework. Use HTTPS and least-privilege database users for public deployment.

## Commands

- `npm run demo:setup` — create or upgrade schemas and seed fictional demonstration records
- `npm run db:setup` — initialize MySQL and MongoDB
- `npm run db:seed` — add missing demo data
- `npm run build` — build the frontend
- `npm start` — serve the production build and API together
- `npm test` — matching and workflow unit checks
- `npm run test:integration` — exercise the API and remove temporary test records

Integration tests use the databases configured in `.env`, so point them at a local development database.
