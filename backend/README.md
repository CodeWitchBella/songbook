## Developing

```
npm i -g @cloudflare/wrangler
wrangler login
wrangler dev
```

put your DATABASE_URL into .dev.vars file, see .dev.vars.example

## Put secret

Via web interface or `wrangler secret put DATABASE_URL`. But CLI has
stricter length limit.

## Open questions

- does frontend correctly handle expired sessions?
- when renewing session, do we set the cookie as well?
