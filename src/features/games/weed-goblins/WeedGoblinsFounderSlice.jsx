import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  BACKGROUNDS,
  HIGHLAND_SNEAK,
  RACES,
  TROUBLE_LABELS,
  WEAPONS,
  damageDiceLabel,
  healthState,
  weaponById,
} from './weedGoblinsV2Rules.js'
import {
  V2_SCENES,
  appendHistory,
  chooseBackground,
  chooseOpeningRoute,
  chooseWeapon,
  createWeedGoblinsV2State,
  establishIdentity,
} from './weedGoblinsV2State.js'
import {
  commitInitiative,
  commitPendingCheck,
  commitPlayerAttack,
  commitPlayerDamage,
  determineEnemyIntent,
  getCurrentActions,
  interpretLocalFreeform,
  prepareAction,
  randomDie,
  resolveEnemyTurn,
  rollDamageDice,
} from './weedGoblinsV2Runtime.js'
import {
  createMemoryWeedGoblinsV2Persistence,
  deleteWeedGoblinsV2State,
  loadWeedGoblinsV2State,
  saveWeedGoblinsV2State,
} from './weedGoblinsV2Persistence.js'
import {
  FIRST_TIME_ELIZA_INTRO,
  OPENING_NARRATION,
  attackNarration,
  backgroundNarration,
  checkResultNarration,
  cloudberryNarration,
  damageNarration,
  enemyTurnNarration,
  highRouteResultNarration,
  identityNarration,
  rattlebridgeArrival,
  routeNarration,
  weaponNarration,
} from './weedGoblinsV2Narration.js'
import './WeedGoblinsGame.css'

const CAMPAIGN_ID = 'weed-goblins-v2:founder-vertical-slice'

function addEntries(state, entries) {
  return entries.filter((entry) => entry?.text || entry?.type === 'roll').reduce(
    (next, entry) => appendHistory(next, entry),
    state,
  )
}

function freshState() {
  return addEntries(createWeedGoblinsV2State({ campaignId: CAMPAIGN_ID }), [
    { type: 'narration', text: FIRST_TIME_ELIZA_INTRO },
    { type: 'narration', text: OPENING_NARRATION },
  ])
}

function lastPlayerRoll(state) {
  for (let index = state.ledger.length - 1; index >= 0; index -= 1) {
    const event = state.ledger[index]
    if (event.type === 'roll' && event.owner === 'player') return event
  }
  return null
}

function Narration({ text }) {
  return (
    <article className="weed-goblins-v2__narration">
      {String(text || '').split(/\n\n+/).map((paragraph) => paragraph.trim()).filter(Boolean).map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </article>
  )
}

function StoryEntry({ entry }) {
  if (entry.type === 'player-action') {
    return (
      <div className="weed-goblins-v2__player-action">
        <span>You chose</span>
        <strong>{entry.text}</strong>
      </div>
    )
  }
  if (entry.type === 'roll') {
    return (
      <div className={`weed-goblins-v2__roll-record is-${entry.owner || 'player'}`}>
        <div className="weed-goblins-v2__roll-record-label">{entry.label}</div>
        <div className="weed-goblins-v2__roll-record-math">
          {entry.rolls?.length > 1 ? `[${entry.rolls.join(', ')}]` : entry.rolls?.[0]}
          {entry.modifier ? ` ${entry.modifier > 0 ? '+' : '−'} ${Math.abs(entry.modifier)}` : ''}
          {Number.isFinite(entry.total) ? ` = ${entry.total}` : ''}
          {Number.isFinite(entry.target) ? ` vs ${entry.target}` : ''}
        </div>
        {entry.result && <div className="weed-goblins-v2__roll-record-result">{entry.result}</div>}
      </div>
    )
  }
  return <Narration text={entry.text} />
}

function StatusStrip({ state }) {
  if (!state.player.backgroundId) return null
  const encounter = [V2_SCENES.rattlebridge, V2_SCENES.combat].includes(state.sceneId)
  const sneak = state.world.sneak
  return (
    <div className="weed-goblins-v2__status" aria-label="Current game status">
      <div><span>HP</span><strong>{state.player.hp}/{state.player.maxHp}</strong></div>
      <div><span>Mana</span><strong>{state.player.mana}/{state.player.maxMana}</strong></div>
      <div><span>Trouble</span><strong>{TROUBLE_LABELS[state.trouble]}</strong></div>
      {encounter && sneak.status === 'active' && <div><span>Highland Sneak</span><strong>{healthState(sneak.hp, sneak.maxHp)}</strong></div>}
      {encounter && <div><span>Alarm</span><strong>{state.alarm}</strong></div>}
    </div>
  )
}

function SheetSection({ title, children }) {
  return <section><h3>{title}</h3>{children}</section>
}

function CharacterSheet({ state, close, restart }) {
  const race = RACES[state.player.raceId]
  const weapon = weaponById(state.player.weaponId)
  const background = BACKGROUNDS[state.player.backgroundId]
  const relationships = Object.entries(state.relationships || {})
  const factions = Object.entries(state.factions || {})
  return (
    <div className="weed-goblins-v2__sheet-backdrop" onMouseDown={close} role="presentation">
      <section className="weed-goblins-v2__sheet" role="dialog" aria-modal="true" aria-label="Character sheet" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><span className="weed-goblins-v2__eyebrow">Character</span><h2>{state.player.name || 'Unnamed adventurer'}</h2></div>
          <button type="button" onClick={close} aria-label="Close character sheet">×</button>
        </header>
        <div className="weed-goblins-v2__sheet-grid">
          <SheetSection title="Character">
            <dl>
              <div><dt>Race</dt><dd>{race?.label || 'Not established'}</dd></div>
              <div><dt>Level</dt><dd>{state.level}</dd></div>
              <div><dt>Background</dt><dd>{background?.label || 'Not established'}</dd></div>
              <div><dt>Strength</dt><dd>{state.player.backgroundId ? state.player.strength : '—'}</dd></div>
              <div><dt>Defense</dt><dd>{state.player.backgroundId ? state.player.defense : '—'}</dd></div>
              <div><dt>Guard</dt><dd>{state.player.backgroundId ? state.player.guard : '—'}</dd></div>
              <div><dt>HP</dt><dd>{state.player.maxHp ? `${state.player.hp}/${state.player.maxHp}` : '—'}</dd></div>
              <div><dt>Mana</dt><dd>{state.player.maxMana ? `${state.player.mana}/${state.player.maxMana}` : '—'}</dd></div>
              <div><dt>Wound</dt><dd>{state.player.wound}</dd></div>
            </dl>
          </SheetSection>
          <SheetSection title="Gear & Pack">
            <p>{weapon ? `${weapon.label} · ${state.inventory.weaponCondition}` : 'Weapon not established'}</p>
            <p>Pack {state.inventory.pack.length}/6</p>
            {state.inventory.storyItems.length > 0 && <ul>{state.inventory.storyItems.map((item) => <li key={item}>{item}</li>)}</ul>}
          </SheetSection>
          <SheetSection title="Abilities">
            {background ? <><strong>{background.ability}</strong><p>{background.passive}</p></> : <p>Not established yet.</p>}
            {race && <p>{race.traits.join(' · ')}</p>}
          </SheetSection>
          <SheetSection title="Threads">
            <ul>{state.threads.map((thread) => <li key={thread.id}>{thread.label} · {thread.status}</li>)}</ul>
          </SheetSection>
          <SheetSection title="Discoveries">
            {state.discoveries.length ? <ul>{state.discoveries.map((item) => <li key={item.id}>{item.label}</li>)}</ul> : <p>Nothing important recorded yet.</p>}
          </SheetSection>
          <SheetSection title="People & Factions">
            {!relationships.length && !factions.length && <p>No named relationships or faction standing established yet.</p>}
            {!!relationships.length && <ul>{relationships.map(([id, value]) => <li key={id}>{id}: {String(value)}</li>)}</ul>}
            {!!factions.length && <ul>{factions.map(([id, value]) => <li key={id}>{id}: {String(value)}</li>)}</ul>}
          </SheetSection>
          <SheetSection title="Map"><p>{state.map.knownLocations.join(' → ')}</p></SheetSection>
        </div>
        <button className="weed-goblins-v2__restart" type="button" onClick={restart}>Restart founder slice</button>
      </section>
    </div>
  )
}

function ChoiceGrid({ title, items, choose, busy }) {
  return (
    <section className="weed-goblins-v2__selection">
      <h2>{title}</h2>
      <div className="weed-goblins-v2__choice-grid">
        {items.map((item) => (
          <button key={item.id} type="button" onClick={() => choose(item.id)} disabled={busy}>
            <strong>{item.label}</strong>{item.detail && <span>{item.detail}</span>}
          </button>
        ))}
      </div>
    </section>
  )
}

function IdentityPrompt({ submit, busy }) {
  const [name, setName] = useState('')
  const [raceId, setRaceId] = useState('')
  return (
    <form className="weed-goblins-v2__identity" onSubmit={(event) => { event.preventDefault(); submit({ name, raceId }) }}>
      <h2>Who is kneeling there?</h2>
      <label>Character name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} autoComplete="off" /></label>
      <div className="weed-goblins-v2__choice-grid" role="group" aria-label="Choose race">
        {Object.values(RACES).map((race) => (
          <button key={race.id} type="button" className={raceId === race.id ? 'is-selected' : ''} onClick={() => setRaceId(race.id)}>
            <strong>{race.label}</strong><span>{race.traits[0]}</span>
          </button>
        ))}
      </div>
      <button className="weed-goblins-v2__primary" type="submit" disabled={busy || !name.trim() || !raceId}>Continue</button>
    </form>
  )
}

function PendingRoll({ state, roll, busy }) {
  const pending = state.pendingResolution
  if (!pending) return null
  const stat = pending.stat === 'magic' ? 'Magic' : pending.stat ? `${pending.stat[0].toUpperCase()}${pending.stat.slice(1)}` : null
  return (
    <section className="weed-goblins-v2__ruling" aria-live="polite">
      <div className="weed-goblins-v2__eyebrow">Ruling locked</div>
      {pending.type === 'damage' ? <><h2>Roll damage</h2><p>{damageDiceLabel(pending.natural20 ? [...pending.dice, ...pending.dice] : pending.dice)}{pending.force ? ` + ${state.player.strength} Strength` : ''}</p></>
        : pending.type === 'initiative' ? <><h2>Roll initiative</h2><p>d20 + {state.player.defense} Defense. Eliza rolls for the Highland Sneak.</p></>
          : <><h2>{pending.type === 'attack' ? 'Attack roll' : 'D20 check'}</h2><dl>
              {stat && <div><dt>Uses</dt><dd>{stat} {pending.modifier >= 0 ? '+' : ''}{pending.modifier}</dd></div>}
              {Number.isFinite(pending.dc) && <div><dt>Target</dt><dd>{pending.targetKnown === false ? 'Unknown' : pending.dc}</dd></div>}
              {pending.advantage !== 'normal' && <div><dt>Roll</dt><dd>{pending.advantage}</dd></div>}
              {pending.manaCost > 0 && <div><dt>Cost</dt><dd>{pending.manaCost} Mana committed</dd></div>}
              {pending.successText && <div><dt>Success</dt><dd>{pending.successText}</dd></div>}
              {pending.failureText && <div><dt>Failure</dt><dd>{pending.failureText}</dd></div>}
            </dl></>}
      <button className="weed-goblins-v2__roll-button" type="button" onClick={roll} disabled={busy}>{pending.type === 'damage' ? 'Roll damage' : pending.type === 'initiative' ? 'Roll initiative' : 'Roll D20'}</button>
    </section>
  )
}

export default function WeedGoblinsFounderSlice() {
  const navigate = useNavigate()
  const memory = useRef(createMemoryWeedGoblinsV2Persistence())
  const storyEnd = useRef(null)
  const [state, setState] = useState(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [sheet, setSheet] = useState(false)
  const [freeform, setFreeform] = useState('')
  const actions = useMemo(() => state ? getCurrentActions(state) : [], [state])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        let restored = null
        try { restored = await loadWeedGoblinsV2State(CAMPAIGN_ID) } catch { restored = await memory.current.load(CAMPAIGN_ID) }
        const next = restored || freshState()
        if (!restored) {
          try { await saveWeedGoblinsV2State(next) } catch { await memory.current.save(next) }
        }
        if (!cancelled) setState(next)
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Could not open Weed Goblins.')
      } finally {
        if (!cancelled) setBusy(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => { storyEnd.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' }) }, [state?.history?.length, state?.pendingResolution?.id])

  async function persist(next) {
    try { await saveWeedGoblinsV2State(next) } catch { await memory.current.save(next) }
    setState(next)
    return next
  }

  async function commit(next, entries = []) { return persist(addEntries(next, entries)) }

  async function run(work) {
    setBusy(true); setError('')
    try { await work() } catch (actionError) { setError(actionError.message || 'That action could not be resolved.') } finally { setBusy(false) }
  }

  function routeLabel(id) {
    return ({ direct: 'Follow them before they reach the bridge', investigate: 'Check the campsite and tracks first', high: 'Take the high trail above the gorge' })[id] || id
  }

  async function chooseRoute(id) {
    return run(async () => commit(chooseOpeningRoute(state, id), [
      { type: 'player-action', text: routeLabel(id) },
      { type: 'narration', text: routeNarration(id) },
    ]))
  }

  async function identify(identity) {
    return run(async () => commit(establishIdentity(state, identity), [
      { type: 'player-action', text: `${identity.name}, ${RACES[identity.raceId]?.label}` },
      { type: 'narration', text: identityNarration({ raceId: identity.raceId, routeId: state.route }) },
    ]))
  }

  async function chooseWeaponId(id) {
    const weapon = weaponById(id)
    return run(async () => commit(chooseWeapon(state, id), [
      { type: 'player-action', text: weapon?.label || id },
      { type: 'narration', text: weaponNarration(id) },
    ]))
  }

  async function chooseBackgroundId(id) {
    return run(async () => {
      const next = chooseBackground(state, id)
      const entries = [
        { type: 'player-action', text: BACKGROUNDS[id]?.label || id },
        { type: 'narration', text: backgroundNarration(id, state.route) },
      ]
      if (next.sceneId === V2_SCENES.rattlebridge) entries.push({ type: 'narration', text: rattlebridgeArrival(next) })
      await commit(next, entries)
    })
  }

  async function resolveEnemyIfNeeded(next) {
    if (next.sceneId !== V2_SCENES.combat || next.combat?.turn !== 'enemy') return next
    const intent = determineEnemyIntent(next)
    let attackDie = null
    let damageRolls = []
    if (intent?.type === 'attack') {
      attackDie = randomDie(20)
      damageRolls = [randomDie(4)]
    }
    let resolved = resolveEnemyTurn(next, { attackDie, damageRolls })
    const entries = []
    if (intent?.type === 'attack') {
      const hit = attackDie + HIGHLAND_SNEAK.attackModifier >= next.player.guard
      entries.push({ type: 'roll', owner: 'dm', label: 'DM roll · Highland Sneak attack', rolls: [attackDie], modifier: HIGHLAND_SNEAK.attackModifier, total: attackDie + HIGHLAND_SNEAK.attackModifier, target: next.player.guard, result: hit ? 'Hit' : 'Miss' })
      if (hit) entries.push({ type: 'roll', owner: 'dm', label: 'DM roll · Hookknife damage', rolls: damageRolls, modifier: 0, total: damageRolls[0], result: `${damageRolls[0]} Physical damage` })
      entries.push({ type: 'narration', text: enemyTurnNarration({ action: 'attack', hit, damage: hit ? damageRolls[0] : 0 }) })
    } else if (intent?.type) {
      entries.push({ type: 'narration', text: enemyTurnNarration({ action: intent.type }) })
    }
    resolved = addEntries(resolved, entries)
    return resolved
  }

  async function act(action) {
    return run(async () => {
      const before = state.sceneId
      let next = prepareAction(state, action.id)
      const entries = [{ type: 'player-action', text: action.displayText || action.label }]
      if (next.sceneId === V2_SCENES.combat && before !== V2_SCENES.combat) entries.push({ type: 'narration', text: 'The choice closes the distance between argument and violence. The Highland Sneak brings the hookknife up, plants one foot beside the alarm rig, and the fight becomes real enough for initiative.' })
      if (next.sceneId === V2_SCENES.cloudberry) entries.push({ type: 'narration', text: cloudberryNarration(next) })
      await commit(next, entries)
    })
  }

  async function roll() {
    if (!state.pendingResolution) return
    return run(async () => {
      const pending = state.pendingResolution
      let next = state
      const entries = []
      if (pending.type === 'initiative') {
        const playerDie = randomDie(20)
        const enemyDie = randomDie(20)
        next = commitInitiative(state, { playerDie, enemyDie })
        entries.push({ type: 'roll', owner: 'player', label: 'Initiative', rolls: [playerDie], modifier: state.player.defense, total: playerDie + state.player.defense, result: next.combat.turn === 'player' ? 'You act first' : 'Eliza acts first' })
        entries.push({ type: 'roll', owner: 'dm', label: 'DM roll · Highland Sneak initiative', rolls: [enemyDie], modifier: HIGHLAND_SNEAK.initiativeModifier, total: enemyDie + HIGHLAND_SNEAK.initiativeModifier })
        next = addEntries(next, entries)
        next = await resolveEnemyIfNeeded(next)
        await persist(next)
        return
      }
      if (pending.type === 'attack') {
        const count = pending.advantage === 'normal' ? 1 : 2
        next = commitPlayerAttack(state, { rolls: Array.from({ length: count }, () => randomDie(20)) })
        const event = lastPlayerRoll(next)
        next = addEntries(next, [
          { type: 'roll', owner: 'player', label: 'Attack roll', rolls: event.rolls, modifier: event.modifier, total: event.total, target: pending.targetKnown === false ? undefined : event.target, result: event.success ? 'Hit' : 'Miss' },
          { type: 'narration', text: attackNarration({ hit: event.success, weaponId: state.player.weaponId }) },
        ])
        next = await resolveEnemyIfNeeded(next)
        await persist(next)
        return
      }
      if (pending.type === 'damage') {
        next = commitPlayerDamage(state, { rolls: rollDamageDice(pending.dice, { natural20: pending.natural20 }) })
        const event = lastPlayerRoll(next)
        next = addEntries(next, [
          { type: 'roll', owner: 'player', label: 'Damage roll', rolls: event.rolls, modifier: event.modifier, total: event.total, result: `${event.total} damage` },
          { type: 'narration', text: damageNarration({ damage: event.total, enemyHealth: healthState(next.world.sneak.hp, next.world.sneak.maxHp) }) },
        ])
        next = await resolveEnemyIfNeeded(next)
        await persist(next)
        return
      }
      if (pending.type === 'check') {
        const count = pending.advantage === 'normal' ? 1 : 2
        next = commitPendingCheck(state, { rolls: Array.from({ length: count }, () => randomDie(20)) })
        const event = lastPlayerRoll(next)
        const resultEntries = [{ type: 'roll', owner: 'player', label: pending.context === 'combat-maneuver' ? 'Combat check' : 'D20 check', rolls: event.rolls, modifier: event.modifier, total: event.total, target: event.target, result: event.success ? 'Success' : 'Failure' }]
        if (pending.context === 'high-route') {
          resultEntries.push({ type: 'narration', text: highRouteResultNarration({ success: event.success, natural: event.natural }) }, { type: 'narration', text: rattlebridgeArrival(next) })
        } else {
          resultEntries.push({ type: 'narration', text: checkResultNarration({ actionId: pending.actionId, success: event.success, natural: event.natural, state: next }) })
          if (next.sceneId === V2_SCENES.cloudberry) resultEntries.push({ type: 'narration', text: cloudberryNarration(next) })
        }
        next = addEntries(next, resultEntries)
        next = await resolveEnemyIfNeeded(next)
        await persist(next)
      }
    })
  }

  async function submitFreeform(event) {
    event.preventDefault()
    const exactText = freeform.trim()
    if (!exactText || busy) return
    setFreeform('')
    const interpreted = interpretLocalFreeform(state, exactText)
    if (!interpreted.supported) {
      return run(async () => commit(state, [
        { type: 'player-action', text: exactText },
        { type: 'narration', text: 'I can work with the idea, but I need the action a little more concretely. Tell me what you are using, what you are doing with it, and what you want to change about the bridge, the guard, or the alarm.' },
      ]))
    }
    return act({ id: interpreted.actionId, label: exactText, displayText: exactText })
  }

  async function restart() {
    return run(async () => {
      try { await deleteWeedGoblinsV2State(CAMPAIGN_ID) } catch { /* IndexedDB may be unavailable in private/restricted contexts. */ }
      await memory.current.delete(CAMPAIGN_ID)
      await persist(freshState())
      setSheet(false)
    })
  }

  if (!state) return <main className="weed-goblins-v2"><div className="weed-goblins-v2__loading">{error || 'Opening the Goblin Highlands…'}</div></main>

  const weaponItems = Object.values(WEAPONS).map((weapon) => ({ id: weapon.id, label: weapon.label, detail: `${damageDiceLabel(weapon.damage)} · ${weapon.identity}` }))
  const backgroundItems = Object.values(BACKGROUNDS).map((background) => ({ id: background.id, label: background.label, detail: `STR ${background.strength} · DEF ${background.defense} · Mana ${background.maxMana} · HP ${background.maxHp}` }))

  return (
    <main className="weed-goblins-v2">
      <header className="weed-goblins-v2__topbar">
        <button type="button" onClick={() => navigate('/games')}>← Games</button>
        <div><span>Chapter 1</span><strong>{state.currentLocation}</strong></div>
        <button className="weed-goblins-v2__e-button" type="button" onClick={() => setSheet(true)} aria-label="Open character sheet">E</button>
      </header>
      <div className="weed-goblins-v2__page">
        <StatusStrip state={state} />
        <section className="weed-goblins-v2__story" aria-live="polite">
          {state.history.map((entry) => <StoryEntry key={entry.id} entry={entry} />)}
          <div ref={storyEnd} />
        </section>
        {error && <div className="weed-goblins-v2__error" role="alert">{error}</div>}
        {state.sceneId === V2_SCENES.windcut && !state.pendingResolution && <ChoiceGrid title="What do you do?" items={[
          { id: 'direct', label: 'Follow them before they reach the bridge' },
          { id: 'investigate', label: 'Check the campsite and tracks first' },
          { id: 'high', label: 'Take the high trail above the gorge' },
        ]} choose={chooseRoute} busy={busy} />}
        {state.sceneId === V2_SCENES.identity && <IdentityPrompt submit={identify} busy={busy} />}
        {state.sceneId === V2_SCENES.weapon && <ChoiceGrid title="What weapon did you bring into the Highlands?" items={weaponItems} choose={chooseWeaponId} busy={busy} />}
        {state.sceneId === V2_SCENES.background && <ChoiceGrid title={`What kind of adventurer is ${state.player.name}?`} items={backgroundItems} choose={chooseBackgroundId} busy={busy} />}
        <PendingRoll state={state} roll={roll} busy={busy} />
        {!state.pendingResolution && actions.length > 0 && <section className="weed-goblins-v2__actions"><h2>What do you do?</h2><div className="weed-goblins-v2__action-list">{actions.map((action) => <button key={action.id} type="button" onClick={() => act(action)} disabled={busy}><strong>{action.label}</strong>{action.detail && <span>{action.detail}</span>}</button>)}</div></section>}
        {!state.pendingResolution && [V2_SCENES.rattlebridge, V2_SCENES.combat].includes(state.sceneId) && <form className="weed-goblins-v2__freeform" onSubmit={submitFreeform}><label htmlFor="weed-goblins-freeform">Or tell Eliza exactly what you want to do</label><div><input id="weed-goblins-freeform" value={freeform} onChange={(event) => setFreeform(event.target.value)} maxLength={300} autoComplete="off" placeholder="I want to…" /><button type="submit" disabled={busy || !freeform.trim()}>Do it</button></div></form>}
        {state.sceneId === V2_SCENES.cloudberry && <section className="weed-goblins-v2__slice-end"><strong>Founder vertical slice complete</strong><span>No merge or production deploy is triggered from here.</span></section>}
      </div>
      {sheet && <CharacterSheet state={state} close={() => setSheet(false)} restart={restart} />}
    </main>
  )
}
