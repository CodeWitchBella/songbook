## Developing

```
npm i -g @cloudflare/wrangler
wrangler login
wrangler dev
```

put your FIREBASE_SERVICE_KEY into .dev.vars file

## Put secret

Via web interface or `wrangler secret put FIREBASE_SERVICE_KEY`. But CLI has
stricter length limit.
