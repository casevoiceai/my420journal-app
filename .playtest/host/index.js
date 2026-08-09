import { onRequest as handleNarrationProxy } from '../../functions/api/weed-goblins-narration.js'

const PLAYTEST_USER_ID = 'weed-goblins-playtest-user'

function playtestHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex,nofollow,noarchive" />
  <title>Weed Goblins Playtest</title>
  <style>
    :root { font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #f3f4f6; background: #101511; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100dvh; display: grid; place-items: center; padding: 24px 16px; background: radial-gradient(circle at top, #263428 0, #101511 52%); }
    main { width: min(100%, 620px); padding: 28px 22px; border: 1px solid #3c4b3e; border-radius: 22px; background: rgba(17, 25, 18, .96); box-shadow: 0 20px 70px rgba(0,0,0,.35); }
    .eyebrow { margin: 0 0 8px; color: #a7c2aa; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0; font-size: clamp(28px, 8vw, 42px); line-height: 1.02; }
    .intro { margin: 14px 0 22px; color: #c8d2ca; font-size: 16px; line-height: 1.5; }
    .notice { margin: 0 0 22px; padding: 12px 14px; border-radius: 14px; background: #1e2b20; color: #dce8de; font-size: 14px; line-height: 1.45; }
    .chapters { display: grid; gap: 10px; }
    button { width: 100%; min-height: 62px; padding: 12px 15px; border: 1px solid #526655; border-radius: 15px; background: #f5f7f5; color: #162019; text-align: left; cursor: pointer; }
    button strong { display: block; font-size: 17px; }
    button span { display: block; margin-top: 4px; color: #546057; font-size: 13px; }
    button:hover, button:focus-visible { border-color: #a9c5ad; outline: 3px solid rgba(169,197,173,.22); }
    .reset { margin-top: 16px; min-height: 46px; background: transparent; color: #c9d4cb; border-color: #465648; text-align: center; }
    .reset span { color: inherit; margin: 0; }
    footer { margin-top: 20px; color: #819184; font-size: 12px; line-height: 1.45; }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Private development playtest</p>
    <h1>Weed Goblins</h1>
    <p class="intro">Choose where you want to begin. This test site is separate from the live my420journal app and uses the staging Eliza narrator.</p>
    <p class="notice"><strong>Test shortcut only:</strong> Chapters 2 and 3 are unlocked here without requiring five earlier completed runs. The game itself is otherwise the current Chapter 1–3 feature-branch build.</p>
    <div class="chapters">
      <button type="button" data-chapter="1"><strong>Chapter 1</strong><span>The Goblin Highlands</span></button>
      <button type="button" data-chapter="2"><strong>Chapter 2</strong><span>The Hollow Market</span></button>
      <button type="button" data-chapter="3"><strong>Chapter 3</strong><span>The Withered Grove</span></button>
    </div>
    <button class="reset" type="button" id="reset"><span>Clear all playtest saves</span></button>
    <footer>Use Eliza's back arrow to return here after entering a chapter. Reloading during a run should restore the test-site save so save/resume can be tested normally.</footer>
  </main>
  <script>
    const USER_ID = ${JSON.stringify(PLAYTEST_USER_ID)};
    const PREFIX = 'my420journal_local_v1';
    const ACTIVE_USER_KEY = PREFIX + ':active_user';
    const USERS_KEY = PREFIX + ':users';
    const RUNS_KEY = PREFIX + ':weed_goblins_runs:' + USER_ID;

    function chapterOneRuns() {
      return Array.from({ length: 5 }, (_, index) => ({
        adventureId: 'goblin-highlands-session-1',
        seed: 'playtest-ch1-' + (index + 1),
        gameId: 'weed-goblins',
        chapterId: 'chapter-1',
        chapterNumber: 1,
        chapterTitle: 'The Goblin Highlands',
        questId: 'quest-1',
        questNumber: 1,
        questTitle: 'Weed Goblins',
        ending: 'recovery',
        outcomeSummary: 'Playtest progression fixture',
        trouble: 0,
        manaRemaining: 1,
        complicationCount: 0,
        narrationTier: 'normal'
      }));
    }

    function chapterTwoRuns() {
      return Array.from({ length: 5 }, (_, index) => ({
        adventureId: 'hollow-market-session-1',
        seed: 'playtest-ch2-' + (index + 1),
        gameId: 'weed-goblins',
        chapterId: 'chapter-2',
        chapterNumber: 2,
        chapterTitle: 'The Hollow Market',
        questId: 'quest-2',
        questNumber: 1,
        questTitle: 'The Hollow Market',
        ending: 'market-operational',
        outcomeSummary: 'Playtest progression fixture',
        trouble: 0,
        manaRemaining: 1,
        complicationCount: 0,
        narrationTier: 'normal'
      }));
    }

    function clearPlaytestStorage() {
      for (let index = localStorage.length - 1; index >= 0; index -= 1) {
        const key = localStorage.key(index);
        if (key && key.startsWith(PREFIX)) localStorage.removeItem(key);
      }
    }

    function createPlaytestUser() {
      const createdAt = new Date().toISOString();
      localStorage.setItem(ACTIVE_USER_KEY, USER_ID);
      localStorage.setItem(USERS_KEY, JSON.stringify([{ id: USER_ID, email: 'weed-goblins-playtest@local.invalid', created_at: createdAt }]));
    }

    function beginChapter(chapter) {
      clearPlaytestStorage();
      createPlaytestUser();
      let runs = [];
      if (chapter >= 2) runs = chapterOneRuns();
      if (chapter >= 3) runs = [...chapterOneRuns(), ...chapterTwoRuns()];
      localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
      sessionStorage.setItem('weed_goblins_playtest_chapter', String(chapter));
      window.location.assign('/games/weed-goblins');
    }

    document.querySelectorAll('[data-chapter]').forEach((button) => {
      button.addEventListener('click', () => beginChapter(Number(button.dataset.chapter)));
    });

    document.getElementById('reset').addEventListener('click', () => {
      clearPlaytestStorage();
      sessionStorage.removeItem('weed_goblins_playtest_chapter');
      window.location.reload();
    });
  </script>
</body>
</html>`
}

function playtestResponse() {
  return new Response(playtestHtml(), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'Referrer-Policy': 'no-referrer',
    },
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/' || url.pathname === '/playtest') return playtestResponse()
    if (url.pathname === '/robots.txt') {
      return new Response('User-agent: *\nDisallow: /\n', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    }
    if (url.pathname === '/api/weed-goblins-narration') {
      return handleNarrationProxy({ request, env })
    }
    return env.ASSETS.fetch(request)
  },
}
