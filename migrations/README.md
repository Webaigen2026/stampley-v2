# Database migrations

These SQL files are historical/reference material from the pre-Prisma schema.
The current schema and migrations live under `prisma/schema.prisma` and
`prisma/migrations/`.

To apply a legacy SQL file manually with `psql`:

```bash
psql "$DATABASE_URL" -f migrations/001_create_stampley_chat_sessions.sql
```

Verify:

```bash
psql "$DATABASE_URL" -c '\d stampley_chat_sessions'
```
