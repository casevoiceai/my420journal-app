import * as chapterOne from './weedGoblinsDiscoverablesChapterOne.js'
import { CHAPTER_TWO_LOCATIONS } from './weedGoblinsChapterTwo.js'

function discoverable(id, title, terms, body, action = null) {
  return Object.freeze({
    id,
    title,
    terms: Object.freeze(terms.filter(Boolean)),
    body,
    action: action ? Object.freeze({ ...action }) : null,
  })
}

function visited(state, roomId) {
  return state?.roomState?.[roomId]?.visited === true
}

function chapterTwoDiscoverables(state) {
  const items = []
  if (visited(state, CHAPTER_TWO_LOCATIONS.lanternMouth.id)) {
    items.push(
      discoverable('market:lanterns', 'Three Smokeless Lanterns', ['three smokeless lanterns', 'smokeless lanterns'], 'The Hollow Market only appears when these three lanterns are lit in the correct order.'),
      discoverable('market:coin-warden', 'The Coin Warden', ['Coin Warden'], 'The market’s lawkeeper. Fair by the market’s standards, which means the rule will be enforced exactly as written and probably twice.'),
    )
  }
  if (visited(state, CHAPTER_TWO_LOCATIONS.whisperRows.id)) {
    items.push(
      discoverable('market:grintle', 'Grintle Sixfinger', ['Grintle Sixfinger', 'Sixfinger'], 'A favor broker with four natural fingers and two brass replacements. He knows the tithe route and values leverage more than Rootcoin.', { kind: 'engine', id: 'trace:sixfinger', label: 'Ask Grintle who pays the tithe' }),
      discoverable('market:nettle', 'Nettle', ['Nettle'], 'A fast market runner who trades information for food and watches green cloaks with immediate distrust.', { kind: 'engine', id: 'trace:nettle', label: 'Follow Nettle through Whisper Rows' }),
      discoverable('market:auntie-resin', 'Auntie Resin', ['Auntie Resin'], 'A charm seller who can mask item resonance. Her price is a future favor involving her confiscated nephew.', { kind: 'engine', id: 'trace:auntie', label: 'Make a favor deal with Auntie Resin' }),
      discoverable('market:living-receipt', 'Living Black-Root Receipt', ['living receipt', 'black-root receipt', 'living black-root receipt'], 'A receipt grown from black roots. It crawls toward the Root Exchange after a stolen or tithed good changes hands.', { kind: 'engine', id: 'trace:receipt', label: 'Inspect the living receipt' }),
    )
    const stall = state.chapterTwo?.recognizedStall
    if (stall) items.push(discoverable('market:recognized-stall', 'Recognized Stall', [stall], `This ${stall} reacts to the item category patterns the game is allowed to use. It never receives raw journal notes, amounts, dates, prices, or real dispensary names.`))
    const counterfeit = state.chapterTwo?.counterfeitItem
    if (counterfeit) items.push(discoverable('market:counterfeit', 'Counterfeit Version', [counterfeit], 'A fictional counterfeit shaped by the same approved category signal that selected the recognized stall.'))
  }
  if (visited(state, CHAPTER_TWO_LOCATIONS.rootExchange.id)) {
    items.push(
      discoverable('market:ledger', 'Harvest Ledger', ['Harvest Ledger', 'living ledger'], 'The market’s living account book. Its pages rearrange themselves when somebody lies to it, which makes dishonesty unusually useful evidence.', { kind: 'free-text', label: 'Study the ledger', playerAction: 'Study how the living Harvest Ledger rearranges itself' }),
      discoverable('market:collector', 'Root Collector', ['Root Collector'], 'A Wither-tier threat assembled from receipts, masks, and the tithe system itself. It does not negotiate.'),
    )
  }
  if (visited(state, CHAPTER_TWO_LOCATIONS.drainGate.id)) {
    items.push(discoverable('market:drain-gate', 'Drain Gate', ['Drain Gate'], 'The organized way out of the Hollow Market, which is why the Coin Warden is waiting there.'))
  }
  return Object.freeze(items)
}

export function getWeedGoblinsDiscoverables(state) {
  if (state?.chapterNumber === 2) return chapterTwoDiscoverables(state)
  return chapterOne.getWeedGoblinsDiscoverables(state)
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function findWeedGoblinsDiscoverableMatches(text, state) {
  if (state?.chapterNumber !== 2) return chapterOne.findWeedGoblinsDiscoverableMatches(text, state)
  const source = typeof text === 'string' ? text : ''
  if (!source) return Object.freeze([])
  const candidates = getWeedGoblinsDiscoverables(state)
    .flatMap((item) => item.terms.map((term) => ({ item, term })))
    .filter(({ term }) => term)
    .sort((left, right) => right.term.length - left.term.length)
  const claimed = new Array(source.length).fill(false)
  const matches = []
  for (const candidate of candidates) {
    const pattern = new RegExp(escapeRegExp(candidate.term), 'gi')
    for (const match of source.matchAll(pattern)) {
      const start = match.index ?? -1
      const end = start + match[0].length
      if (start < 0 || claimed.slice(start, end).some(Boolean)) continue
      for (let index = start; index < end; index += 1) claimed[index] = true
      matches.push(Object.freeze({ start, end, text: match[0], discoverable: candidate.item }))
    }
  }
  return Object.freeze(matches.sort((left, right) => left.start - right.start))
}
