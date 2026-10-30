# Moving SkillBridge to another desktop

The Git repository contains the application source and schema. It intentionally excludes `.env`, dependencies and live database records. Choose a fresh demo setup or transfer existing data.

## Fresh copy for a presentation

Install Git, Node.js LTS, MySQL Server and MongoDB Community Server on the new computer. Start the database services. In PowerShell:

```powershell
git clone https://github.com/Chengapa13/skillbridge.git
Set-Location skillbridge
npm ci
Copy-Item .env.example .env
```

Put the new computer's MySQL username and password in `.env`, then run:

```powershell
npm run demo:setup
npm run build
npm start
```

Open http://127.0.0.1:3001. This makes a new local database with presentation data. It does not carry over additional accounts, applications or journals from the old computer.

## Copy the current databases

Stop the app on the old computer while exporting. Install MongoDB Database Tools on both machines if `mongodump` and `mongorestore` are not available. Use an encrypted private drive. The backups contain password hashes, profiles, applications and private mentoring notes.

On the source computer, run these commands in PowerShell. The password option prompts for the MySQL password rather than putting it in shell history:

```powershell
$backup = 'E:\SkillBridgeBackup'
New-Item -ItemType Directory -Force $backup
mysqldump --host=127.0.0.1 --port=3306 --user=root --password --single-transaction --routines --triggers --databases skillbridge --result-file="$backup\skillbridge.sql"
mongodump --uri="mongodb://127.0.0.1:27017" --db=skillbridge --out="$backup\mongo"
```

Replace the backup path with a private folder on your transfer drive. Do not put the dumps in the project folder or upload them to GitHub.

On the new computer, start the database services, clone the project, install dependencies, copy `.env.example` to `.env`, and set the target MySQL credentials. If the target is fresh, first run `npm run db:setup`, then restore:

```powershell
mysql --host=127.0.0.1 --port=3306 --user=root --password < E:\SkillBridgeBackup\skillbridge.sql
mongorestore --uri="mongodb://127.0.0.1:27017" --drop E:\SkillBridgeBackup\mongo\skillbridge
```

The password flag prompts securely. MongoDB `--drop` replaces matching target collections with the backup. Do not use it if the target MongoDB data should be preserved. The SQL dump replaces the named `skillbridge` database. Confirm the destination before importing.

Finally run `npm run build` and `npm start`. Check `http://127.0.0.1:3001/api/health` returns `{"mysql":true,"mongodb":true}`. Confirm that expected applications and journal entries appear before removing the old database or transfer backup.
