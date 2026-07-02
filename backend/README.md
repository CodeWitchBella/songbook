## Developing

```
pnpm i
POSTGRESQL_URL=postgresql://localhost/songbook pnpm dev
```

Runs the backend directly under Node.js (`node --watch src/index.ts`),
listening on http://localhost:5512.

## Open questions

- does frontend correctly handle expired sessions?
- when renewing session, do we set the cookie as well?
