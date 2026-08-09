import legacyWorker from './legacyChapterOne.js'
import { handleChapterTwoNarrationWorkerRequest } from './chapterTwo.js'

export * from './legacyChapterOne.js'
export { CHAPTER_TWO_SYSTEM_PROMPT, handleChapterTwoNarrationWorkerRequest } from './chapterTwo.js'

export default {
  async fetch(request, env) {
    let parsed = null
    try {
      parsed = await request.clone().json()
    } catch {
      // Legacy handler retains the existing invalid-JSON behavior for non-Chapter-2 requests.
    }
    if (Number(parsed?.chapterNumber) === 2) {
      return handleChapterTwoNarrationWorkerRequest(request, env)
    }
    return legacyWorker.fetch(request, env)
  },
}
