# my420journal Weed Goblins narration Worker

Dedicated Anthropic proxy for Weed Goblins narration. It is separate from CASEVOICE and MyStatement infrastructure.

## Worker name

`my420journal-weed-goblins-narration`

## Required Worker secrets

- `WEED_GOBLINS_PROXY_SECRET`
- `WEED_GOBLINS_ANTHROPIC_API_KEY`

Set secrets with Wrangler. Never place their values in source, `wrangler.jsonc`, browser code, Pages build variables, logs, or test fixtures.

## Security contract

1. Every request is checked for `Authorization: Bearer <WEED_GOBLINS_PROXY_SECRET>` before method handling, configuration checks, body parsing, or provider forwarding.
2. Missing or incorrect authorization returns `401`.
3. The Worker exposes no browser CORS headers.
4. Only the `natural-one-complication` request shape is accepted in this first pass.
5. The Worker forwards to Anthropic only after authorization and input validation.
6. The Anthropic API key remains a Worker secret and is never returned.

The Pages Function uses `WEED_GOBLINS_NARRATION_WORKER_URL` and the same `WEED_GOBLINS_PROXY_SECRET` as private server-side bindings. The direct Worker URL must never be included in browser source.
