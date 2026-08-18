# my420journal local-first buildttt

This source build keeps journal, profile, guide, and entry data on the device through browser localStorage.

What changed:

- Journal entries are stored locally.
- User profile and guide settings are stored locally.
- Local sign up and sign in are handled on the device.
- External app data calls are disabled.
- Old external backend folders, migrations, and hosted function files were removed.
- The stale prebuilt output folder was removed so it cannot ship old generated code.

Important:

- This is a local-first source build, not a production privacy audit.
- Browser localStorage can be cleared by the user or the browser.
- No backup or sync is included in this build.
