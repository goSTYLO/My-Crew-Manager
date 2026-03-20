# Accounts Reference

## Seed Accounts (created by `npm run seed`)

Primary PM / dev pair (also used by **`npm run smoke:ai-integration`** defaults):

| Email | Name | Role | Password | Notes |
|-------|------|------|----------|--------|
| pm.maya@mycrewmanager.test | Maya Santos | Project Manager | CrewPass!2026 | Owner on multiple `[Seed]` projects |
| dev.alden@mycrewmanager.test | Alden Cruz | Developer | CrewPass!2026 | Member on seed projects |

Other users from the same seed use the same password **`CrewPass!2026`** (`pm.carlos@…`, `pm.nina@…`, `dev.bea@…`, etc.). See [`scripts/seed.js`](scripts/seed.js).

**Live AI smoke test:** `npm run smoke:ai-integration` uses the PM row above unless you set `PM_EMAIL` / `PM_PASSWORD`. See README → “Live AI integration smoke test”.

---

## Master Seed Accounts (created by `npm run seed:master`)

| Email | Name | Role | Password | Project Role |
|-------|------|------|----------|--------------|
| master.pm@mycrewmanager.local | Morgan Avery | Project Manager | MasterSeed!2026 | Owner on all 5 projects |
| master.dev1@mycrewmanager.local | Dev One Patil | Developer | MasterSeed!2026 | Member on all 5 projects |
| master.dev2@mycrewmanager.local | Dev Two Chen | Developer | MasterSeed!2026 | Member on all 5 projects |

**Projects:** [MasterSeed] CityComm, GreenHome, EventEase, MedAssist, EduLearn (from `AI/test_output_backlog_1.json` … `_5.json`). Each project has one team chat room and backlog tasks (some marked done with staggered dates for dashboard graphs).

---

## Existing DB Users (Django / PostgreSQL restore)

**Passwords cannot be recovered.** Django uses PBKDF2 (or bcrypt); hashing is one-way. There is no "unhash" function—that's the point of secure password storage. Options for existing users:

1. **Password reset** – Use the app's "Forgot password" flow.
2. **Seed accounts** – Use `pm.maya@mycrewmanager.test` / `CrewPass!2026` (or any `*.mycrewmanager.test` user from `npm run seed`), or `master.pm@mycrewmanager.local` / `MasterSeed!2026` if master seed was run.
3. **Manual reset** – Update password in DB: `bcrypt.hashSync('newpassword', 10)` then `UPDATE "user" SET password = '...' WHERE email = '...'`.

### List users from existing DB

**Node script (recommended):**

```bash
node scripts/list-users.js
```

**Or raw SQL (psql or any SQL client):**

```sql
SELECT user_id, email, name, role, is_active FROM "user" ORDER BY user_id;
```

### Users from DB (run the script above and paste results here)

| user_id | Email | Name | Role | Password |
|---------|-------|------|------|----------|
| *(run `node scripts/list-users.js` to populate)* | | | | *(hashed, not recoverable)* |

---

**Security:** This file is for dev/seed reference only. Do not add real credentials or hashes.
