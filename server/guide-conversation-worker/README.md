# my420journal Guide conversation Worker

Dedicated Cloudflare Workers AI service for Bud, Sunny, Larry, Herb, and Mary.

## Privacy contract

- The private journal remains browser-local.
- The Worker receives only the current/recent Guide conversation plus an optional small context-facts array selected by My420Journal.
- The Worker never receives the journal database and has no ability to browse browser storage.
- The Worker does not save journal entries or durable user memories.
- Controlled journal answers, reviewed cannabis facts, and safety boundaries remain authoritative in the browser-side My420Journal engine.
- S.T.O.N.E.R. does not use this service.

## Worker name

`my420journal-guide-conversation`

## AI binding

Wrangler binds Cloudflare Workers AI as `AI`. The Worker uses `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.

## Required Worker secret

- `GUIDE_CONVERSATION_PROXY_SECRET`

Never place the secret in browser code, source control, logs, Pages build output, or test fixtures.

## Pages Function bindings

The Pages Function at `/api/guide-conversation` requires:

- `GUIDE_CONVERSATION_WORKER_URL`
- `GUIDE_CONVERSATION_PROXY_SECRET`
- the existing `JOURNAL_ACCESS_CODE` private-testing binding

The direct Worker URL is server-side only. The Worker returns no browser CORS headers.
