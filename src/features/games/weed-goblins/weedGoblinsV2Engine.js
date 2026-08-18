import {
  DC,
  HIGHLAND_SNEAK,
  POSITIONS,
  healthState,
  weaponById,
} from './weedGoblinsV2Rules.js'
import {
  V2_SCENES,
  enterRattlebridge,
  reachCloudberryShelf,
  updateSnapshot,
} from './weedGoblinsV2State.js'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function nextSequence(state) {
  return state.ledger.length + 1
}

function appendLedger(state, event) {
  return {
    ...state,
    ledger: [
      ...state.ledger,
      {
        id: event.id || `event:${nextSequence(state)}`,
        sequence: nextSequence(state),
        irreversible: event.irreversible !== false,
        ...event,
      },
    ],
  }
}

function addDiscovery(state, discovery) {
  if (state.discoveries.some((item) => item.id === discovery.id)) return state
  return {
    ...state,
    discoveries: [...state.discoveries, discovery],
  }
}

function addThread(state, thread) {
  const existing = state.threads.find((item) => item.id === thread.id)
  if (existing) {
    return {
      ...state,
      threads: state.threads.map((item) => item.id === thread.id ? { ...item, ...thread } : item),
    }
  }
  return { ...state, threads: [...state.threads, thread] }
}

function setPending(state, pendingResolution) {
  if (state.pendingResolution) throw new Error('A resolution is already pending.')
  const withPending = {
    ...state,
    pendingResolution: {
      id: `resolution:${state.ledger.length + 1}`,
      ...pendingResolution,
    },
  }
  return appendLedger(withPending, {
    type: 'ruling',
    resolutionId: withPending.pendingResolution.id,
    actionId: pendingResolution.actionId,
    resolutionType: pendingResolution.type,
    stat: pendingResolution.stat || null,
    modifier: pendingResolution.modifier ?? null,
    dc: pendingResolution.dc ?? null,
    advantage: pendingResolution.advantage || 'normal',
    manaCost: pendingResolution.manaCost || 0,
    success: pendingResolution.successText || null,
    failure: pendingResolution.failureText || null,
  })
}

export function randomDie(sides = 20, random = null) {
  if (!Number.isInteger(sides) || sides < 2) throw new Error('Die sides must be at least 2.')
  if (typeof random === 'function') {
    return Math.floor(random() * sides) + 1
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const values = new Uint32Array(1)
    crypto.getRandomValues(values)
    return (values[0] % sides) + 1
  }
  return Math.floor(Math.random() * sides) + 1
}

export function rollForMode({ sides = 20, mode = 'normal', random = null } = {}) {
  if (mode === 'advantage' || mode === 'disadvantage') {
    const rolls = [randomDie(sides, random), randomDie(sides, random)]
    return {
      rolls,
      kept: mode === 'advantage' ? Math.max(...rolls) : Math.min(...rolls),
    }
  }
  const kept = randomDie(sides, random)
  return { rolls: [kept], kept }
}

function playerModifier(state, stat) {
  if (stat === 'magic') return state.player.magicalSkill || 0
  if (stat === 'flat') return 0
  return Number(state.player[stat] || 0)
}

function canSpendMana(state, cost) {
  return (state.player.mana || 0) >= cost
}

function spendMana(state, cost) {
  if (!cost) return state
  if (!canSpendMana(state, cost)) throw new Error('Not enough Mana.')
  return {
    ...state,
    player: {
      ...state.player,
      mana: state.player.mana - cost,
    },
  }
}

export function getHighRouteActions(state) {
  if (state.sceneId !== V2_SCENES.highRouteCheck || state.pendingResolution) return []
  const actions = [
    {
      id: 'high:careful',
      label: 'Pick your way across the high ledge',
      detail: 'Defense · Hard DC 14',
    },
    {
      id: 'high:force',
      label: 'Climb through the roughest section before it shifts',
      detail: 'Strength · Hard DC 14',
    },
  ]
  if (state.player.backgroundId === 'diviner' && state.player.mana >= 1) {
    actions.push({
      id: 'high:divine',
      label: 'Ask the wrong map where the safe ground actually is',
      detail: 'Magic +2 · 1 Mana · Hard DC 14',
    })
  }
  return actions
}

export function prepareHighRouteAction(state, actionId) {
  if (state.sceneId !== V2_SCENES.highRouteCheck) throw new Error('High-route action is not available now.')
  const specs = {
    'high:careful': {
      stat: 'defense',
      manaCost: 0,
      successText: 'Reach Rattlebridge unseen from the elevated side.',
      failureText: 'Reach the bridge, but lose the clean position and pay a physical/time consequence.',
    },
    'high:force': {
      stat: 'strength',
      manaCost: 0,
      successText: 'Force through the unstable high trail and keep the elevated approach.',
      failureText: 'Reach the bridge after a rough slip that costs HP and position.',
    },
    'high:divine': {
      stat: 'magic',
      manaCost: 1,
      successText: 'Read the terrain correctly enough to reach the elevated approach unseen.',
      failureText: 'The map reveals the interference too late; the route still works, but the bridge notices something moving above it.',
    },
  }
  const spec = specs[actionId]
  if (!spec) throw new Error('Unknown high-route action.')
  if (!canSpendMana(state, spec.manaCost)) throw new Error('Not enough Mana.')
  const spent = spendMana(state, spec.manaCost)
  return setPending(spent, {
    type: 'check',
    actionId,
    stat: spec.stat,
    modifier: playerModifier(spent, spec.stat),
    dc: DC.hard,
    advantage: 'normal',
    manaCost: spec.manaCost,
    successText: spec.successText,
    failureText: spec.failureText,
    context: 'high-route',
  })
}

function highRouteOutcome(state, success, natural) {
  if (success) {
    let next = enterRattlebridge(state, {
      stealth: 'unseen',
      alarm: 'quiet',
      world: {
        ...state.world,
        bridge: { ...state.world.bridge, alarm: 'quiet' },
        sneak: {
          ...state.world.sneak,
          awareness: 'unaware',
          position: POSITIONS.near,
        },
      },
    })
    next = addDiscovery(next, {
      id: 'rattlebridge-elevated-approach',
      label: 'A high side approach overlooks Rattlebridge.',
      certainty: 'confirmed',
    })
    return next
  }

  const hpLoss = natural === 1 ? 3 : 2
  return enterRattlebridge(state, {
    stealth: natural === 1 ? 'spotted' : 'suspicious',
    timePressure: 'delayed',
    trouble: state.trouble + (natural === 1 ? 1 : 0),
    player: {
      ...state.player,
      hp: Math.max(1, state.player.hp - hpLoss),
      wound: natural === 1 ? 'Scraped' : state.player.wound,
      injuryDetail: natural === 1 ? 'Shins and palms scraped on the high trail' : state.player.injuryDetail,
    },
    world: {
      ...state.world,
      sneak: {
        ...state.world.sneak,
        awareness: natural === 1 ? 'aware' : 'uncertain',
        position: POSITIONS.sideApproach,
      },
    },
  })
}

export function commitPendingCheck(state, { rolls }) {
  const pending = state.pendingResolution
  if (!pending || pending.type !== 'check') throw new Error('No check is pending.')
  const normalized = Array.isArray(rolls) ? rolls.filter((roll) => Number.isInteger(roll) && roll >= 1 && roll <= 20) : []
  const requiredRolls = pending.advantage === 'normal' ? 1 : 2
  if (normalized.length !== requiredRolls) throw new Error(`Expected ${requiredRolls} D20 roll(s).`)

  const die = pending.advantage === 'advantage'
    ? Math.max(...normalized)
    : pending.advantage === 'disadvantage'
      ? Math.min(...normalized)
      : normalized[0]
  const total = die + Number(pending.modifier || 0)
  const success = total >= pending.dc

  let next = {
    ...state,
    pendingResolution: null,
  }
  next = appendLedger(next, {
    type: 'roll',
    resolutionId: pending.id,
    actionId: pending.actionId,
    owner: 'player',
    dieType: 'd20',
    rolls: normalized,
    kept: die,
    modifier: pending.modifier || 0,
    total,
    target: pending.dc,
    success,
    natural: die,
  })

  if (pending.context === 'high-route') {
    next = highRouteOutcome(next, success, die)
  } else if (pending.context === 'rattlebridge') {
    next = resolveRattlebridgeCheck(next, pending, { success, natural: die, total })
  } else if (pending.context === 'combat-maneuver') {
    next = resolveCombatManeuver(next, pending, { success, natural: die, total })
  } else {
    throw new Error(`Unknown check context: ${pending.context}`)
  }

  return appendLedger(next, {
    type: 'outcome',
    resolutionId: pending.id,
    actionId: pending.actionId,
    success,
    natural: die,
  })
}

function sneakIsActive(state) {
  return ['active', 'bargaining'].includes(state.world.sneak.status) && state.world.sneak.hp > 0
}

function canCrossFreely(state) {
  return !sneakIsActive(state) || state.world.sneak.status === 'surrendered' || state.alarm === 'disabled'
}

export function getRattlebridgeActions(state) {
  if (state.sceneId !== V2_SCENES.rattlebridge || state.pendingResolution) return []
  if (state.player.wound === 'Downed' && !sneakIsActive(state)) {
    return [{ id: 'bridge:continue-after-defeat', label: 'Get back on your feet and keep moving' }]
  }
  if (canCrossFreely(state)) {
    return [{ id: 'bridge:cross', label: 'Cross Rattlebridge and continue toward Cloudberry Shelf' }]
  }

  const actions = []
  const weapon = weaponById(state.player.weaponId)

  if (state.alarm === 'threatened') {
    actions.push({
      id: 'bridge:interrupt-alarm',
      label: weapon?.id === 'bow' ? 'Put an arrow through the alarm line' : 'Stop the alarm before the guard finishes it',
      detail: `${weapon?.id === 'bow' ? 'Defense' : 'Strength'} · Moderate DC 11`,
    })
  } else if (state.alarm === 'quiet') {
    actions.push({
      id: 'bridge:disable-alarm',
      label: weapon?.id === 'battle-axe' ? 'Break the alarm rig before it can be used' : 'Work out how to silence the alarm rig',
      detail: `${weapon?.id === 'battle-axe' ? 'Strength' : 'Defense'} · Moderate DC 11`,
    })
  }

  if (state.stealth !== 'spotted') {
    actions.push({
      id: 'bridge:bypass',
      label: 'Slip past the guard and cross without giving it a clean warning',
      detail: 'Defense · Hard DC 14',
    })
  }

  actions.push({
    id: 'bridge:bargain',
    label: state.discoveries.some((item) => item.id === 'crooked-root-mark')
      ? 'Show the crooked-root evidence and ask what this theft is really about'
      : 'Talk to the guard before this becomes a fight',
    detail: 'Social check · Moderate DC 11',
  })

  actions.push({ id: 'bridge:fight', label: 'Make this a fight' })
  return actions.slice(0, 4)
}

export function prepareRattlebridgeAction(state, actionId) {
  if (state.sceneId !== V2_SCENES.rattlebridge) throw new Error('Rattlebridge action is not available now.')

  if (actionId === 'bridge:cross' || actionId === 'bridge:continue-after-defeat') {
    if (!canCrossFreely(state) && actionId === 'bridge:cross') throw new Error('The crossing is not clear.')
    return reachCloudberryShelf(state)
  }

  if (actionId === 'bridge:fight') {
    return startCombat(state)
  }

  const weapon = weaponById(state.player.weaponId)
  let spec = null

  if (actionId === 'bridge:interrupt-alarm') {
    spec = {
      stat: weapon?.id === 'bow' ? 'defense' : 'strength',
      dc: DC.moderate,
      successText: 'Interrupt the alarm attempt and pull the bridge back from immediate warning.',
      failureText: 'The warning gets through; the encounter continues with the camp alerted.',
    }
  } else if (actionId === 'bridge:disable-alarm') {
    spec = {
      stat: weapon?.id === 'battle-axe' ? 'strength' : 'defense',
      dc: DC.moderate,
      successText: 'Disable the alarm before the guard can use it.',
      failureText: 'The guard realizes exactly what you are doing and starts the alarm process.',
    }
  } else if (actionId === 'bridge:bypass') {
    spec = {
      stat: 'defense',
      dc: DC.hard,
      advantage: state.stealth === 'unseen' ? 'advantage' : 'normal',
      successText: 'Get across without the guard sending a warning.',
      failureText: 'The bypass collapses into a worse position; the guard is now fully aware of you.',
    }
  } else if (actionId === 'bridge:bargain') {
    spec = {
      stat: 'flat',
      dc: DC.moderate,
      advantage: state.discoveries.some((item) => item.id === 'crooked-root-mark') ? 'advantage' : 'normal',
      successText: 'Get the guard talking and create a nonviolent way through.',
      failureText: 'The guard does not accept the approach and uses the conversation to improve its warning position.',
    }
  }

  if (!spec) throw new Error('Unknown Rattlebridge action.')
  return setPending(state, {
    type: 'check',
    actionId,
    stat: spec.stat,
    modifier: playerModifier(state, spec.stat),
    dc: spec.dc,
    advantage: spec.advantage || 'normal',
    manaCost: 0,
    successText: spec.successText,
    failureText: spec.failureText,
    context: 'rattlebridge',
  })
}

function setAlarm(state, alarm) {
  return {
    ...state,
    alarm,
    world: {
      ...state.world,
      bridge: {
        ...state.world.bridge,
        alarm,
      },
    },
  }
}

function resolveRattlebridgeCheck(state, pending, { success, natural }) {
  if (pending.actionId === 'bridge:interrupt-alarm') {
    if (success) return setAlarm(state, 'quiet')
    return setAlarm({
      ...state,
      campAwareness: 'warned',
      trouble: Math.min(3, state.trouble + 1),
      stealth: 'spotted',
      world: {
        ...state.world,
        sneak: { ...state.world.sneak, awareness: 'aware' },
      },
    }, 'raised')
  }

  if (pending.actionId === 'bridge:disable-alarm') {
    if (success) {
      let next = setAlarm(state, 'disabled')
      if (state.player.weaponId === 'battle-axe') {
        next = { ...next, trouble: Math.min(3, next.trouble + 1) }
      }
      return next
    }
    return setAlarm({
      ...state,
      stealth: 'spotted',
      world: {
        ...state.world,
        sneak: { ...state.world.sneak, awareness: 'aware' },
      },
    }, 'threatened')
  }

  if (pending.actionId === 'bridge:bypass') {
    if (success) return reachCloudberryShelf(state)
    return {
      ...state,
      stealth: 'spotted',
      trouble: Math.min(3, state.trouble + (natural === 1 ? 1 : 0)),
      alarm: state.alarm === 'quiet' ? 'threatened' : state.alarm,
      world: {
        ...state.world,
        bridge: {
          ...state.world.bridge,
          alarm: state.alarm === 'quiet' ? 'threatened' : state.alarm,
        },
        sneak: {
          ...state.world.sneak,
          awareness: 'aware',
          position: POSITIONS.near,
        },
      },
    }
  }

  if (pending.actionId === 'bridge:bargain') {
    if (success) {
      let next = {
        ...state,
        world: {
          ...state.world,
          sneak: {
            ...state.world.sneak,
            status: 'bargained',
            morale: 'Shaken',
          },
        },
      }
      next = addThread(next, {
        id: 'sneak-bargain',
        label: 'A Rattlebridge guard let you through after a bargain.',
        status: 'open',
      })
      next = addDiscovery(next, {
        id: 'bridge-guard-can-bargain',
        label: 'The Rattlebridge guard is protecting something, not looking for a pointless death.',
        certainty: 'confirmed',
      })
      return next
    }
    return setAlarm({
      ...state,
      stealth: 'spotted',
      world: {
        ...state.world,
        sneak: {
          ...state.world.sneak,
          awareness: 'aware',
          morale: natural === 1 ? 'Confident' : state.world.sneak.morale,
        },
      },
    }, state.alarm === 'quiet' ? 'threatened' : state.alarm)
  }

  return state
}

export function startCombat(state) {
  if (state.sceneId !== V2_SCENES.rattlebridge) throw new Error('Combat can only start at Rattlebridge in this slice.')
  const combatState = {
    active: true,
    round: 0,
    turn: 'initiative',
    playerPosition: state.player.weaponId === 'bow' ? POSITIONS.far : POSITIONS.near,
    enemyPosition: POSITIONS.near,
    initiative: null,
    intent: 'drive-off',
    lastEnemyIntent: null,
  }
  const next = {
    ...state,
    sceneId: V2_SCENES.combat,
    stealth: 'spotted',
    combat: combatState,
    world: {
      ...state.world,
      sneak: {
        ...state.world.sneak,
        awareness: 'aware',
      },
    },
  }
  return setPending(next, {
    type: 'initiative',
    actionId: 'combat:initiative',
    stat: 'defense',
    modifier: state.player.defense,
    successText: 'Act before the Highland Sneak.',
    failureText: 'The Highland Sneak acts first.',
    context: 'combat-initiative',
  })
}

export function commitInitiative(state, { playerDie, enemyDie }) {
  const pending = state.pendingResolution
  if (!pending || pending.type !== 'initiative') throw new Error('Initiative is not pending.')
  for (const die of [playerDie, enemyDie]) {
    if (!Number.isInteger(die) || die < 1 || die > 20) throw new Error('Initiative requires D20 results.')
  }
  const playerTotal = playerDie + state.player.defense
  const enemyTotal = enemyDie + HIGHLAND_SNEAK.initiativeModifier
  const playerFirst = playerTotal > enemyTotal || (playerTotal === enemyTotal && state.player.defense >= HIGHLAND_SNEAK.defense)

  let next = {
    ...state,
    pendingResolution: null,
    combat: {
      ...state.combat,
      round: 1,
      turn: playerFirst ? 'player' : 'enemy',
      initiative: {
        player: { die: playerDie, modifier: state.player.defense, total: playerTotal },
        enemy: { die: enemyDie, modifier: HIGHLAND_SNEAK.initiativeModifier, total: enemyTotal },
      },
    },
  }
  next = appendLedger(next, {
    type: 'roll',
    resolutionId: pending.id,
    actionId: 'combat:initiative',
    owner: 'player',
    dieType: 'd20',
    rolls: [playerDie],
    kept: playerDie,
    modifier: state.player.defense,
    total: playerTotal,
  })
  next = appendLedger(next, {
    type: 'roll',
    resolutionId: pending.id,
    actionId: 'combat:initiative',
    owner: 'dm',
    dieType: 'd20',
    rolls: [enemyDie],
    kept: enemyDie,
    modifier: HIGHLAND_SNEAK.initiativeModifier,
    total: enemyTotal,
  })
  return next
}

export function getCombatActions(state) {
  if (state.sceneId !== V2_SCENES.combat || !state.combat?.active || state.combat.turn !== 'player' || state.pendingResolution) return []
  const weapon = weaponById(state.player.weaponId)
  if (!weapon) return []
  const labels = {
    sword: ['Drive in with a forceful sword strike', 'Wait for an opening and cut precisely'],
    bow: ['Brace and loose a heavy shot', 'Move for a clean angle and take the precise shot'],
    'battle-axe': ['Commit to the heavy axe swing', 'Hook the axe into the guard’s position and disrupt it'],
    'bo-staff': ['Drive the staff forward with force', 'Use the staff to control the guard’s footing'],
    mace: ['Crash the mace through the guard’s defense', 'Time a shorter strike to disrupt the guard'],
    daggers: ['Close hard and drive a dagger in', 'Move inside the guard and strike with both daggers'],
  }
  const [forceLabel, precisionLabel] = labels[weapon.id] || ['Make a forceful attack', 'Make a precise attack']
  return [
    { id: 'combat:attack-force', label: forceLabel, detail: `Strength +${state.player.strength}` },
    { id: 'combat:attack-precision', label: precisionLabel, detail: `Defense +${state.player.defense}` },
    { id: 'combat:control', label: 'Use position or weapon control instead of pure damage', detail: 'Contextual check' },
    { id: 'combat:retreat', label: 'Break away from the fight and change the situation', detail: 'Defense · Moderate DC 11' },
  ]
}

export function prepareCombatAction(state, actionId) {
  if (state.sceneId !== V2_SCENES.combat || state.combat?.turn !== 'player') throw new Error('It is not the player turn.')
  const weapon = weaponById(state.player.weaponId)
  if (!weapon) throw new Error('A weapon is required.')

  if (actionId === 'combat:attack-force' || actionId === 'combat:attack-precision') {
    const force = actionId === 'combat:attack-force'
    const stat = force ? weapon.forceStat : weapon.precisionStat
    const modifier = playerModifier(state, stat)
    const disadvantaged = weapon.id === 'bow' && state.combat.playerPosition === POSITIONS.engaged
    return setPending(state, {
      type: 'attack',
      actionId,
      stat,
      modifier,
      dc: HIGHLAND_SNEAK.guard,
      targetKnown: state.discoveries.some((item) => item.id === 'sneak-guard'),
      advantage: disadvantaged ? 'disadvantage' : 'normal',
      successText: 'The attack connects; roll weapon damage.',
      failureText: 'The attack misses or is turned aside, and the fight continues.',
      context: 'combat-attack',
      force,
      weaponId: weapon.id,
      damageDice: [...weapon.damage],
    })
  }

  if (actionId === 'combat:control') {
    const stat = weapon.identity === 'breach' ? 'strength' : 'defense'
    return setPending(state, {
      type: 'check',
      actionId,
      stat,
      modifier: playerModifier(state, stat),
      dc: DC.moderate,
      advantage: 'normal',
      successText: 'Improve position, disrupt the guard, or push its morale toward breaking.',
      failureText: 'The control attempt costs position and gives the guard its turn.',
      context: 'combat-maneuver',
      maneuver: 'control',
    })
  }

  if (actionId === 'combat:retreat') {
    return setPending(state, {
      type: 'check',
      actionId,
      stat: 'defense',
      modifier: state.player.defense,
      dc: DC.moderate,
      advantage: 'normal',
      successText: 'Break away without giving the guard an immediate clean warning.',
      failureText: 'Get away, but the guard gains the warning position.',
      context: 'combat-maneuver',
      maneuver: 'retreat',
    })
  }

  throw new Error('Unknown combat action.')
}

export function commitPlayerAttack(state, { rolls }) {
  const pending = state.pendingResolution
  if (!pending || pending.type !== 'attack') throw new Error('No player attack is pending.')
  const normalized = Array.isArray(rolls) ? rolls.filter((roll) => Number.isInteger(roll) && roll >= 1 && roll <= 20) : []
  const required = pending.advantage === 'normal' ? 1 : 2
  if (normalized.length !== required) throw new Error(`Expected ${required} D20 roll(s).`)
  const die = pending.advantage === 'advantage'
    ? Math.max(...normalized)
    : pending.advantage === 'disadvantage'
      ? Math.min(...normalized)
      : normalized[0]
  const total = die + pending.modifier
  const hit = total >= pending.dc

  let next = {
    ...state,
    pendingResolution: null,
  }
  next = appendLedger(next, {
    type: 'roll',
    resolutionId: pending.id,
    actionId: pending.actionId,
    owner: 'player',
    dieType: 'd20',
    rolls: normalized,
    kept: die,
    modifier: pending.modifier,
    total,
    target: pending.dc,
    success: hit,
    natural: die,
  })

  next = addDiscovery(next, {
    id: 'sneak-guard',
    label: 'The Highland Sneak’s baseline Guard is 12.',
    certainty: 'confirmed',
  })

  if (!hit) {
    return {
      ...appendLedger(next, {
        type: 'outcome',
        actionId: pending.actionId,
        success: false,
        natural: die,
      }),
      combat: { ...next.combat, turn: 'enemy' },
    }
  }

  return setPending(next, {
    type: 'damage',
    actionId: `${pending.actionId}:damage`,
    attackActionId: pending.actionId,
    owner: 'player',
    weaponId: pending.weaponId,
    dice: pending.damageDice,
    force: pending.force,
    natural20: die === 20,
    context: 'combat-damage',
  })
}

export function commitPlayerDamage(state, { rolls }) {
  const pending = state.pendingResolution
  if (!pending || pending.type !== 'damage' || pending.owner !== 'player') throw new Error('No player damage roll is pending.')
  const dice = [...pending.dice]
  const expected = pending.natural20 ? [...dice, ...dice] : dice
  const normalized = Array.isArray(rolls) ? rolls.filter(Number.isInteger) : []
  if (normalized.length !== expected.length) throw new Error(`Expected ${expected.length} damage roll(s).`)
  expected.forEach((sides, index) => {
    if (normalized[index] < 1 || normalized[index] > sides) throw new Error(`Damage die ${index + 1} must be d${sides}.`)
  })
  const rolled = normalized.reduce((sum, value) => sum + value, 0)
  const strengthBonus = pending.force ? state.player.strength : 0
  const damage = Math.max(1, rolled + strengthBonus)
  const enemyHp = Math.max(0, state.world.sneak.hp - damage)
  const enemyHealth = healthState(enemyHp, state.world.sneak.maxHp)
  let morale = state.world.sneak.morale
  if (enemyHealth === 'Near Defeat') morale = 'Breaking'
  else if (enemyHealth === 'Badly Wounded' && morale === 'Confident') morale = 'Shaken'

  let next = {
    ...state,
    pendingResolution: null,
    world: {
      ...state.world,
      sneak: {
        ...state.world.sneak,
        hp: enemyHp,
        morale,
        status: enemyHp <= 0 ? 'down' : state.world.sneak.status,
      },
    },
    combat: enemyHp <= 0
      ? null
      : { ...state.combat, turn: 'enemy' },
    sceneId: enemyHp <= 0 ? V2_SCENES.rattlebridge : state.sceneId,
  }
  next = appendLedger(next, {
    type: 'roll',
    resolutionId: pending.id,
    actionId: pending.actionId,
    owner: 'player',
    dieType: 'damage',
    dice: expected,
    rolls: normalized,
    modifier: strengthBonus,
    total: damage,
    targetId: HIGHLAND_SNEAK.id,
  })
  next = appendLedger(next, {
    type: 'damage',
    source: 'player',
    target: HIGHLAND_SNEAK.id,
    amount: damage,
    hpAfter: enemyHp,
  })
  return next
}

function resolveCombatManeuver(state, pending, { success, natural }) {
  if (!state.combat?.active) return state
  if (pending.maneuver === 'retreat') {
    const alarm = success ? state.alarm : state.alarm === 'quiet' ? 'threatened' : state.alarm
    return {
      ...setAlarm(state, alarm),
      sceneId: V2_SCENES.rattlebridge,
      combat: null,
      stealth: success ? 'suspicious' : 'spotted',
      world: {
        ...state.world,
        bridge: { ...state.world.bridge, alarm },
        sneak: {
          ...state.world.sneak,
          morale: state.world.sneak.morale,
          awareness: 'aware',
        },
      },
    }
  }

  if (success) {
    const nextMorale = state.world.sneak.morale === 'Confident' ? 'Shaken' : 'Breaking'
    return {
      ...state,
      combat: {
        ...state.combat,
        playerPosition: POSITIONS.cover,
        turn: 'enemy',
      },
      world: {
        ...state.world,
        sneak: {
          ...state.world.sneak,
          morale: nextMorale,
        },
      },
    }
  }

  return {
    ...state,
    combat: {
      ...state.combat,
      playerPosition: natural === 1 ? POSITIONS.engaged : state.combat.playerPosition,
      turn: 'enemy',
    },
  }
}

export function determineEnemyIntent(state) {
  if (state.sceneId !== V2_SCENES.combat || state.combat?.turn !== 'enemy') return null
  const sneak = state.world.sneak
  if (sneak.hp <= 0 || sneak.status === 'down') return { type: 'none' }
  if (sneak.morale === 'Breaking') return { type: 'retreat-report' }
  if (state.alarm === 'quiet' && state.combat.playerPosition !== POSITIONS.engaged) return { type: 'prepare-alarm' }
  if (state.alarm === 'threatened' && state.combat.playerPosition !== POSITIONS.engaged) return { type: 'raise-alarm' }
  return { type: 'attack' }
}

export function resolveEnemyTurn(state, { attackDie = null, damageRolls = [] } = {}) {
  if (state.sceneId !== V2_SCENES.combat || state.combat?.turn !== 'enemy') throw new Error('It is not the enemy turn.')
  const intent = determineEnemyIntent(state)

  if (intent.type === 'prepare-alarm') {
    let next = setAlarm(state, 'threatened')
    next = {
      ...next,
      combat: {
        ...next.combat,
        turn: 'player',
        round: next.combat.round + 1,
        lastEnemyIntent: 'prepare-alarm',
      },
    }
    return appendLedger(next, { type: 'enemy-action', actionId: 'enemy:prepare-alarm', owner: 'dm' })
  }

  if (intent.type === 'raise-alarm') {
    let next = setAlarm({
      ...state,
      campAwareness: 'warned',
      trouble: Math.min(3, state.trouble + 1),
    }, 'raised')
    next = {
      ...next,
      combat: {
        ...next.combat,
        turn: 'player',
        round: next.combat.round + 1,
        lastEnemyIntent: 'raise-alarm',
      },
    }
    return appendLedger(next, { type: 'enemy-action', actionId: 'enemy:raise-alarm', owner: 'dm' })
  }

  if (intent.type === 'retreat-report') {
    let next = {
      ...state,
      sceneId: V2_SCENES.rattlebridge,
      combat: null,
      world: {
        ...state.world,
        sneak: {
          ...state.world.sneak,
          status: 'escaped',
          reportProcess: {
            status: 'in-progress',
            destination: 'Highland Camp',
          },
        },
      },
    }
    return appendLedger(next, { type: 'enemy-action', actionId: 'enemy:retreat-report', owner: 'dm' })
  }

  if (intent.type !== 'attack') return state
  if (!Number.isInteger(attackDie) || attackDie < 1 || attackDie > 20) throw new Error('Enemy attack requires a D20 roll.')
  const attackTotal = attackDie + HIGHLAND_SNEAK.attackModifier
  const hit = attackTotal >= state.player.guard
  let next = appendLedger(state, {
    type: 'roll',
    actionId: 'enemy:hookknife',
    owner: 'dm',
    dieType: 'd20',
    rolls: [attackDie],
    kept: attackDie,
    modifier: HIGHLAND_SNEAK.attackModifier,
    total: attackTotal,
    target: state.player.guard,
    success: hit,
    natural: attackDie,
  })

  let damage = 0
  if (hit) {
    if (!Array.isArray(damageRolls) || damageRolls.length !== 1 || !Number.isInteger(damageRolls[0]) || damageRolls[0] < 1 || damageRolls[0] > 4) {
      throw new Error('Enemy Hookknife damage requires one d4 roll.')
    }
    damage = damageRolls[0]
    const hpAfter = Math.max(0, next.player.hp - damage)
    next = appendLedger(next, {
      type: 'roll',
      actionId: 'enemy:hookknife:damage',
      owner: 'dm',
      dieType: 'damage',
      dice: [4],
      rolls: [damage],
      modifier: 0,
      total: damage,
      targetId: 'player',
    })
    next = {
      ...next,
      player: {
        ...next.player,
        hp: hpAfter,
      },
    }
    next = appendLedger(next, {
      type: 'damage',
      source: HIGHLAND_SNEAK.id,
      target: 'player',
      amount: damage,
      hpAfter,
    })
  }

  if (next.player.hp <= 0) {
    const alarm = next.alarm === 'disabled' ? 'disabled' : 'raised'
    next = {
      ...setAlarm(next, alarm),
      sceneId: V2_SCENES.rattlebridge,
      combat: null,
      campAwareness: alarm === 'raised' ? 'warned' : next.campAwareness,
      timePressure: 'lost',
      trouble: Math.min(3, next.trouble + 1),
      player: {
        ...next.player,
        hp: 1,
        wound: 'Downed',
        injuryDetail: 'Beaten down at Rattlebridge; movement and fighting are impaired until recovery.',
      },
      world: {
        ...next.world,
        bridge: { ...next.world.bridge, alarm },
        sneak: {
          ...next.world.sneak,
          status: 'escaped',
          reportProcess: {
            status: 'completed',
            destination: 'Highland Camp',
          },
        },
      },
    }
    next = appendLedger(next, {
      type: 'defeat',
      lethal: false,
      consequence: 'Downed at Rattlebridge; guard escapes and warning consequences persist.',
    })
    return next
  }

  return {
    ...next,
    combat: {
      ...next.combat,
      turn: 'player',
      round: next.combat.round + 1,
      lastEnemyIntent: 'attack',
    },
  }
}

export function interpretLocalFreeform(state, text) {
  const normalized = String(text ?? '').trim().toLowerCase()
  if (!normalized) return { supported: false, reason: 'empty' }

  if (state.sceneId === V2_SCENES.rattlebridge) {
    if (/alarm|bell|cord|rope|warning/.test(normalized)) {
      return { supported: true, actionId: state.alarm === 'threatened' ? 'bridge:interrupt-alarm' : 'bridge:disable-alarm' }
    }
    if (/sneak|slip|bypass|crawl|cross quietly|go around/.test(normalized)) {
      return { supported: true, actionId: 'bridge:bypass' }
    }
    if (/talk|ask|tell|bargain|offer|negotiate|crooked.root|symbol/.test(normalized)) {
      return { supported: true, actionId: 'bridge:bargain' }
    }
    if (/attack|fight|shoot|stab|hit|kill|strike/.test(normalized)) {
      return { supported: true, actionId: 'bridge:fight' }
    }
  }

  if (state.sceneId === V2_SCENES.combat && state.combat?.turn === 'player') {
    if (/run|retreat|back away|escape|break away/.test(normalized)) return { supported: true, actionId: 'combat:retreat' }
    if (/push|trip|shove|control|disarm|pin|knock/.test(normalized)) return { supported: true, actionId: 'combat:control' }
    if (/attack|fight|shoot|stab|hit|strike|swing/.test(normalized)) return { supported: true, actionId: 'combat:attack-precision' }
  }

  return { supported: false, reason: 'needs-dm-adjudication' }
}

export function getCurrentActions(state) {
  if (state.pendingResolution) return []
  if (state.sceneId === V2_SCENES.highRouteCheck) return getHighRouteActions(state)
  if (state.sceneId === V2_SCENES.rattlebridge) return getRattlebridgeActions(state)
  if (state.sceneId === V2_SCENES.combat) return getCombatActions(state)
  return []
}

export function prepareAction(state, actionId) {
  if (state.sceneId === V2_SCENES.highRouteCheck) return prepareHighRouteAction(state, actionId)
  if (state.sceneId === V2_SCENES.rattlebridge) return prepareRattlebridgeAction(state, actionId)
  if (state.sceneId === V2_SCENES.combat) return prepareCombatAction(state, actionId)
  throw new Error(`Actions are not available in scene ${state.sceneId}.`)
}

export function rollDamageDice(dice, { natural20 = false, random = null } = {}) {
  const source = Array.isArray(dice) ? [...dice] : []
  const actual = natural20 ? [...source, ...source] : source
  return actual.map((sides) => randomDie(sides, random))
}

export function v2StateForDebug(state) {
  return clone(state)
}
