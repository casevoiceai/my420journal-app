import { onRequest as handleNarrationProxy } from '../../functions/api/weed-goblins-narration.js'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/api/weed-goblins-narration') {
      return handleNarrationProxy({ request, env })
    }
    return env.ASSETS.fetch(request)
  },
}
