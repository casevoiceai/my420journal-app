export const STARTER_BACKGROUNDS = Object.freeze([
  Object.freeze({
    id: 'tracker',
    label: 'Highland Tracker',
    hook: 'You learned to read what happened after everybody else stopped looking.',
    story: `Highland Trackers are not simply hunters and they are not automatically wilderness hermits. The tradition began with people who moved between settlements where roads were unreliable, maps became suggestions after bad weather, and somebody still had to find lost travelers, stolen livestock, collapsed routes, missing caravans, and the occasional official who had confidently gone the wrong direction. A Tracker studies ordinary evidence until ordinary evidence stops being ordinary: bent grass, disturbed gravel, mud on the wrong side of a boot, the silence of birds where birds should be arguing, or a campsite that looks untouched except one person definitely moved the cookpot and is lying about it. Trackers build a story from physical sequence without pretending the story is certain until the evidence supports it.`,
    notice: 'Terrain, pursuit signs, obvious tracks, practical route changes, and signs that an ordinary environment has been disturbed.',
    ability: 'Push Through',
    abilityText: 'Spend Mana when terrain, pursuit, or physical pressure tries to close the route, turning what you know about movement and ground into a better chance to keep going.',
    stats: Object.freeze({ strength: 3, defense: 1, maxMana: 2, maxHp: 14, guard: 11 }),
  }),
  Object.freeze({
    id: 'warden',
    label: 'Trail Warden',
    hook: "You were trained to notice where danger becomes somebody's responsibility.",
    story: `Trail Wardens began as protectors of roads, crossings, wayhouses, flood paths, mountain cuts, and dangerous stretches between places too small to maintain their own guards. A Warden learns to see space as a problem before the problem starts moving. Where does a crowd bottleneck? Which doorway becomes deadly in a panic? Where would an ambush have to stand? What has to remain open if people need to get out? This can make Wardens excellent defenders and terrible dinner guests in restaurants with badly placed furniture. Some work under town charters. Others belong to road companies, temple networks, mutual-aid groups, caravan alliances, or old family traditions. Some left after discovering the people issuing orders cared more about protecting tolls than travelers. The background describes training in protection and position, not obedience.`,
    notice: 'Cover, chokepoints, defensive weaknesses, escape routes, crowd movement, and obvious threats to people or positions.',
    ability: 'Hold the Line',
    abilityText: 'Spend Mana to turn positioning, protection, and refusal to yield into control over a dangerous situation.',
    stats: Object.freeze({ strength: 1, defense: 3, maxMana: 2, maxHp: 16, guard: 13 }),
  }),
  Object.freeze({
    id: 'diviner',
    label: 'Fen Diviner',
    hook: 'You learned that maps can be wrong in useful ways.',
    story: `The fens south and east of the Reach are full of places where ordinary direction behaves badly. Paths shift after fog. Lights appear over water where nobody is standing. Old stones hum on certain nights. Reflections occasionally show weather that has not arrived yet. Most sensible people respond by leaving. Fen Diviners responded by taking notes. Diviners study magical irregularity, pattern, omen, sympathetic objects, broken maps, impossible coincidence, and the subtle difference between “this is enchanted,” “this is haunted,” “this is dangerous,” and “this is a perfectly normal frog and you need sleep.” They are not prophets in the simple sense. Their skill is noticing when reality has stopped behaving like the ordinary version of itself and finding a useful question to ask before everybody decides the answer must be ghosts. Sometimes it is ghosts.`,
    notice: 'Obvious magical irregularities, patterns that do not fit the physical explanation, and places where routes, symbols, and ordinary reality disagree.',
    ability: 'Read the Wrong Map Right',
    abilityText: 'Spend Mana to use magical pattern sense where ordinary navigation or logic has stopped being enough.',
    stats: Object.freeze({ strength: 1, defense: 2, maxMana: 4, maxHp: 12, guard: 12, magicalSkill: 2 }),
  }),
])

export function backgroundById(id) {
  return STARTER_BACKGROUNDS.find((item) => item.id === id) || null
}
