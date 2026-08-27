# my420journal Weed Goblins narration Worker

Dedicated Cloudflare Workers AI narrator for Weed Goblins. It is separate from CASEVOICE and My Written Statement infrastructure.

## Worker name

`my420journal-weed-goblins-narration`

## AI binding

Wrangler binds Cloudflare Workers AI as `AI`. The Worker calls the Cloudflare-hosted model `@cf/meta/llama-3.3-70b-instruct-fp8-fast` through `env.AI.run(...)`.

No third-party provider API key is required for narration.

## Required Worker secrets

- `WEED_GOBLINS_PROXY_SECRET`
- `WEED_GOBLINS_RATE_LIMIT_SALT`

Set secrets with Wrangler. Never place their values in source, `wrangler.jsonc`, browser code, Pages build variables, logs, or test fixtures.

## Security contract

1. Every request is checked for `Authorization: Bearer <WEED_GOBLINS_PROXY_SECRET>` before method handling, configuration checks, body parsing, or model invocation.
2. Missing or incorrect authorization returns `401`.
3. The Worker exposes no browser CORS headers.
4. Only supported authoritative Weed Goblins moment/outcome pairs are accepted.
5. The Worker invokes Workers AI only after authorization and input validation.
6. The two free-text moments share a limit of 30 calls per hour per salted, hashed source address. Raw source addresses are not stored in the rate limiter.

The Pages Function uses `WEED_GOBLINS_NARRATION_WORKER_URL` and the same `WEED_GOBLINS_PROXY_SECRET` as private server-side bindings. The direct Worker URL must never be included in browser source.
