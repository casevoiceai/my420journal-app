import * as chapterOne from './weedGoblinsDiscoverablesChapterOne.js'
import { CHAPTER_TWO_LOCATIONS } from './weedGoblinsChapterTwo.js'
import {
  CHAPTER_THREE_LOCATIONS,
  CHAPTER_THREE_REWARDS,
} from './weedGoblinsChapterThree.js'

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

function chapterThreeDiscoverables(state) {
  const items = []
  if (visited(state, CHAPTER_THREE_LOCATIONS.grayVerge.id)) {
    items.push(
      discoverable('grove:bramblekin', 'Bramblekin', ['Bramblekin'], 'A grove spirit barely holding a shape. Bramblekin can feel that the gray pull comes from underground.', { kind: 'engine', id: 'verge:bramblekin', label: 'Ask Bramblekin where the pull goes' }),
      discoverable('grove:corla', 'Corla the Forager', ['Corla the Forager', 'Corla'], 'Practical and exhausted, Corla keeps one living patch alive by hand and carries one living seed in a locket.', { kind: 'engine', id: 'verge:corla', label: 'Ask Corla what she has tried' }),
      discoverable('grove:kip', 'Kip', ['Kip'], 'A young spriggan who hears schedules and numbers in the roots. Adults dismissed them as fear until the timing started matching the pull.', { kind: 'engine', id: 'verge:kip', label: 'Listen to Kip’s root schedule' }),
      discoverable('grove:gray-verge', 'Gray Verge', ['Gray Verge'], 'The edge of the Withered Grove, where full daylight and running water have not stopped the roots from turning gray.'),
    )
  }
  if (visited(state, CHAPTER_THREE_LOCATIONS.resinChapel.id)) {
    items.push(
      discoverable('grove:resin-chapel', 'Resin Chapel', ['Resin Chapel'], 'A place where the grove stored memories in resin before the gray reached them.'),
      discoverable('grove:memory-rings', 'Grove Memory Rings', ['memory rings', 'grove memory rings'], 'The rings preserve growth memories. They are read by growth order, not by clock time.'),
    )
  }
  if (visited(state, CHAPTER_THREE_LOCATIONS.thirstingRun.id)) {
    items.push(
      discoverable('grove:thirsting-run', 'Thirsting Run', ['Thirsting Run'], 'A divided watercourse where preservation, evacuation, and access compete for the same limited flow.'),
      discoverable('grove:water-stones', 'Three Water Stones', ['three water stones', 'water stones'], 'Three movable stones direct water between preservation, evacuation, and access.'),
      discoverable('grove:stalker', 'Withering Stalker', ['Withering Stalker', 'Stalker'], 'A deer-shaped thing of dead branch and old root. It is silent and visible only when it moves. Stillness and thick resin trunks create blind spots.'),
    )
  }
  if (visited(state, CHAPTER_THREE_LOCATIONS.sleepingNursery.id)) {
    items.push(
      discoverable('grove:sleeping-nursery', 'Sleeping Nursery', ['Sleeping Nursery'], 'Root-beds holding the grove’s sleepers while the underground pull worsens.'),
      discoverable('grove:root-leeches', 'Root Leeches', ['Root Leeches', 'root leeches'], 'They attach beneath major roots and pull toward magic.'),
    )
  }
  if (visited(state, CHAPTER_THREE_LOCATIONS.siphonWell.id)) {
    items.push(
      discoverable('grove:siphon-well', 'Siphon Well', ['Siphon Well'], 'The place where multiple conduits join the Cultivator’s deeper feeding network.'),
      discoverable('grove:nightly-draw', 'Nightly Draw', ['Nightly Draw'], 'The Wither-tier pull when every active conduit tightens at once.'),
    )
  }
  if (state?.inventory?.includes(CHAPTER_THREE_REWARDS.corlasLastSeed)) {
    items.push(discoverable('grove:last-seed', CHAPTER_THREE_REWARDS.corlasLastSeed, [CHAPTER_THREE_REWARDS.corlasLastSeed], 'Corla’s single living seed. It survives this chapter and matters later in the campaign.'))
  }
  if (state?.inventory?.includes(CHAPTER_THREE_REWARDS.greyBarkShard)) {
    items.push(discoverable('grove:grey-bark', CHAPTER_THREE_REWARDS.greyBarkShard, [CHAPTER_THREE_REWARDS.greyBarkShard], 'A shard of gray bark that can identify the same corruption when it appears again.'))
  }
  if (state?.inventory?.includes(CHAPTER_THREE_REWARDS.livingRootMap)) {
    items.push(discoverable('grove:root-map', CHAPTER_THREE_REWARDS.livingRootMap, [CHAPTER_THREE_REWARDS.livingRootMap], 'A living route through the root network pointing toward the Sunken Greenhouse.'))
  }
  return Object.freeze(items)
}

export function getWeedGoblinsDiscoverables(state) {
  if (state?.chapterNumber === 3) return chapterThreeDiscoverables(state)
  if (state?.chapterNumber === 2) return chapterTwoDiscoverables(state)
  return chapterOne.getWeedGoblinsDiscoverables(state)
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function localDiscoverableMatches(text, state) {
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

export function findWeedGoblinsDiscoverableMatches(text, state) {
  if (![2, 3].includes(Number(state?.chapterNumber))) {
    return chapterOne.findWeedGoblinsDiscoverableMatches(text, state)
  }
  return localDiscoverableMatches(text, state)
}
