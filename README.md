# NC API Cloudflare Worker

The Cloudflare Worker behind the NC api used in some applications

---

### WARNING: Do NOT actually use this, this entire repository contians many bugs and issues, since it is mostly just a joke project among some friends.

---

## Running locally

```sh
$ pnpm install
$ pnpm run dev
```

## Deploy

```sh
$ pnpm run deploy
```

## Initializing database schema

```sh
# Replace "nc-api" with your database name
$ pnpx wrangler d1 execute nc-api --local --file=./db/schema.sql
```
