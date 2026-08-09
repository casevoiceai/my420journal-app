import legacyWorker, * as legacy from './legacyChapterOne.js'
import { handleChapterTwoNarrationWorkerRequest } from './chapterTwo.js'
import { handleChapterThreeNarrationWorkerRequest } from './chapterThree.js'

function parseChapterNumberFromClone(request) {
  if (request.method !== 'POST') return Promise.resolve(null)
  return request.clone().json().then((body) => Number(body?.chapterNumber) || null).catch(() => null)
}

export default {
  async fetch(request, env, ctx) {
    const chapterNumber = await parseChapterNumberFromClone(request)
    if (chapterNumber === 3) return handleChapterThreeNarrationWorkerRequest(request, env)
    if (chapterNumber === 2) return handleChapterTwoNarrationWorkerRequest(request, env)
    return legacyWorker.fetch(request, env, ctx)
  },
}

export * from './legacyChapterOne.js'
