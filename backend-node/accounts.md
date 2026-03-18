# Accounts Reference

## Seed Accounts (created by `npm run seed`)

| Email | Name | Role | Password | Project Role |
|-------|------|------|----------|--------------|
| pm@example.com | Project Manager | Project Manager | password123 | Owner on all projects |
| dev@example.com | Developer | Developer | password123 | Member on all projects |

---

## Existing DB Users (Django / PostgreSQL restore)

**Passwords cannot be recovered.** Django uses PBKDF2 (or bcrypt); hashing is one-way. There is no "unhash" function—that's the point of secure password storage. Options for existing users:

1. **Password reset** – Use the app's "Forgot password" flow.
2. **Seed accounts** – Use `pm@example.com` / `dev@example.com` with `password123` if seed was run.
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
