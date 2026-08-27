export const SABLE_MERROW = Object.freeze({
  id: 'sable-merrow',
  name: 'Sable Merrow',
  ancestry: 'Human',
  shop: "Merrow's Field Goods, Fine Errors & Sundries",
  introduction: Object.freeze([
    `The armory is not really an armory. It is a shop that has successfully convinced several weapons, three traveling coats, a locked cabinet, two maps, and an alarming brass telescope to coexist in the same room.`,
    `Everything has been arranged as if it is waiting to be noticed. A sword occupies the cleanest section of wall. A battle axe sits on the lowest rack, apparently because gravity has already expressed an opinion. A pair of daggers shares a sheath rig. A bow hangs safely horizontal. A bo staff leans in a corner with the confidence of an object that knows it is going to be underestimated. A mace rests beside a handwritten card that says ONLY ONE OF THESE IS FOR OPENING BOTTLES.`,
    `Behind the counter stands Sable Merrow. Two small brass bells hang from Sable's belt. They do not ring when Sable crosses the room. They give one soft chime when Sable stops perfectly still.`,
    `Sable looks at the racks, then at you. “You are welcome to inspect everything. In fact, please do. People who choose a weapon by pointing from the doorway tend to return with very educational dents.”`,
  ]),
  confirmation: `Sable does not reach for the weapon immediately. “You have inspected the possibilities. You have had every opportunity to make this unnecessarily complicated. Are you choosing this one?”`,
})

export const STARTER_WEAPONS = Object.freeze([
  Object.freeze({
    id: 'sword', label: 'Sword', damage: 'd8', identity: 'Adaptable',
    story: `The sword is not jeweled, glowing, singing, cursed, royal, or currently wanted for questioning. This is considered a strong start. Its blade is broad enough to survive bad decisions and narrow enough not to become one itself. The leather grip has been replaced more than once. A shallow notch near the guard suggests somebody tried to stop something harder than steel and learned a useful lesson about material properties. Weapons like this traveled with wardens, caravans, soldiers, frightened merchants, and people who reached a point where owning a sword felt less strange than not owning one. It does not specialize. It adapts.`,
    tradeoff: 'Flexible in many situations, but has no extreme range, breach, or special control advantage on its own.',
    sable: Object.freeze([
      `“A sword,” Sable says. “The answer people call boring right up until they need an answer that works in more than one sentence.”`,
      `Sable glances at the notch near the guard. “Previous owner learned that stone is not impressed by confidence. The sword survived the lesson.”`,
    ]),
  }),
  Object.freeze({
    id: 'bow', label: 'Bow', damage: 'd8', identity: 'Range',
    story: `The bow hangs horizontally because the last person who stored one upright knocked over a helmet display, a lantern, and a visiting priest. Dark laminated wood bends into pale horn tips. The string is new. The grip is not; somebody wore a thumb-shaped hollow into the leather over years of drawing it the same way. A bow changes the shape of a problem before the problem reaches you. It can threaten distant enemies, cords, mechanisms, hanging objects, and bad ideas that have not yet crossed the room. It loves space and sightlines. It hates being crowded.`,
    tradeoff: 'Excellent when distance and sightlines matter. Close engagement can make it awkward.',
    sable: Object.freeze([
      `Sable taps the rack, not the bow. “People think this is about standing far away. It is really about noticing the fight is larger than whatever is trying to bite you.”`,
      `“Excellent sightlines in the Highlands,” Sable says. “Also several bridges. Those two facts are either useful together or a warning. Depends who is holding the bow.”`,
    ]),
  }),
  Object.freeze({
    id: 'battle-axe', label: 'Battle Axe', damage: 'd10', identity: 'Breach',
    story: `The battle axe is stored on the lowest rack because gravity has already expressed an opinion. Its head is dark steel, wide-bearded, scarred along one edge, and attached to a haft thick enough to make nearby furniture nervous. Somebody carved three tiny flowers beneath the head. Nobody knows why. The axe was built for commitment. It has strong feelings about barriers, shields, timber, doors, defensive structures, and objects whose continued existence has become negotiable. A skilled fighter can use the hooked head for control, but its clearest promise is simple: if force is the answer, this is a very legible sentence.`,
    tradeoff: 'Powerful for breach and force. Large, conspicuous, and less delicate in tight or social situations.',
    sable: Object.freeze([
      `Sable watches you lift it. “Good axe. Terrible apology.”`,
      `At the three carved flowers Sable says, “No, I do not know. I have asked. The axe has remained professionally silent.”`,
    ]),
  }),
  Object.freeze({
    id: 'bo-staff', label: 'Bo Staff', damage: 'd8', identity: 'Control',
    story: `The staff looks almost insultingly simple beside the blades. Straight hardwood. Reinforced ends. Wrapped center grip. No spikes. No secret compartment. No small button that does something regrettable. The simplicity is deceptive. A staff controls space. It reaches without requiring an edge. It catches ankles, redirects hands, blocks passages, braces doors, probes suspicious ground, carries a bundle, pushes something disgusting without using your hand, and becomes remarkably persuasive on a narrow bridge. People who dismiss it as a stick generally improve the demonstration.`,
    tradeoff: 'Strong control and environmental utility, with less emphasis on cutting or breaching.',
    sable: Object.freeze([
      `“The weapon most often mocked immediately before it becomes the most useful object in the room,” Sable says.`,
      `Sable turns it once in hand. “Also useful for poking suspicious things. Adventuring contains more of that than songs admit.”`,
    ]),
  }),
  Object.freeze({
    id: 'mace', label: 'Mace', damage: 'd8', identity: 'Disruption',
    story: `The mace has the personality of a locked door receiving bad news. Its head is flanged steel, its handle short enough for close work, and its weight concentrated where physics becomes somebody else's problem. There is little decoration except a line around the pommel that may once have been a prayer or may be the mark left by somebody using it to open bottles. A mace is useful against things that depend on staying rigid, aligned, intact, or convinced they are structurally important: armor, hinges, mechanisms, locks, shields, and certain ceremonial objects whose owners would strongly prefer you reconsider.`,
    tradeoff: 'Excellent disruption at close range. Short reach and limited ranged options.',
    sable: Object.freeze([
      `Sable lifts an eyebrow. “Subtle in the same way a falling cupboard is subtle.”`,
      `At the pommel mark, Sable says, “Officially a devotional inscription. Unofficially, I have seen what travelers do to bottles.”`,
    ]),
  }),
  Object.freeze({
    id: 'daggers', label: 'Daggers', damage: '2d4', identity: 'Fast-close',
    story: `The pair of daggers sits in one sheath rig because apparently somebody decided one knife was a lack of commitment. They are matched without being identical. One blade is slightly longer; the other broader near the tip. Their grips use different wrapping patterns so the wielder can tell them apart by touch. Daggers are close weapons. Very close. That makes them dangerous in crowded spaces, useful when larger weapons become awkward, and excellent for speed, angles, concealment, climbing utility, rope-cutting, and being inside an opponent's comfortable distance before the opponent has finished objecting.`,
    tradeoff: 'Fast and flexible up close, but demands getting uncomfortably close to the problem.',
    sable: Object.freeze([
      `Sable smiles. “Excellent choice if your preferred combat distance is ‘we are now sharing a personal problem.’”`,
      `“Two blades,” Sable says. “For people who look at one problem and worry it might become lonely.”`,
    ]),
  }),
])

export function weaponById(id) {
  return STARTER_WEAPONS.find((item) => item.id === id) || null
}

export function sableBanterFor(weaponId, seedValue = 0) {
  const weapon = weaponById(weaponId)
  if (!weapon) return ''
  return weapon.sable[Math.abs(Number(seedValue) || 0) % weapon.sable.length]
}
