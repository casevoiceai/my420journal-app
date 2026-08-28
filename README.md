# My420Journal local-first build

This source build keeps journal, profile, guide, and entry data on the device through browser localStorage.

Current private-core architecture:

- Journal entries are stored locally.
- User profile and guide settings are stored locally.
- The private journal does not require a name, email address, or password.
- A random device-local profile ID keeps entries and settings linked together.
- Existing active private-testing profiles preserve their internal user ID while old local email/password fields are removed during migration.
- PIN support remains available as an additional in-app privacy control.
- Shared Journey / Layer 2 is disabled pending redesign and review.
- Local JSON backup export/import is included. No cloud backup or cross-device sync is included.
- Weed Goblins is an optional network feature that uses a same-origin server proxy and Cloudflare Workers AI for narration. Its local adapter excludes raw journal notes and raw dispensary names, but limited structured or game-derived context can be sent when the game is used.
- Voice entry uses browser SpeechRecognition when available. Processing behavior depends on the browser/platform and is not guaranteed to be device-only.

Important:

- This is a local-first source build, not a production privacy audit.
- Browser localStorage can be cleared by the user or the browser.
- Local-first storage reduces server-side exposure but does not make data on a device impossible to access.
