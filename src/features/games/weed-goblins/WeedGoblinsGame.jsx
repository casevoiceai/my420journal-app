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
} from './weedGoblinsV2Engine.js'
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

const FOUNDER_CAMPAIGN_ID = 'weed-goblins-v2:founder-vertical-slice'

function addHistoryEntries(state, entries) {
  return entries.reduce((next, entry) => appendHistory(next, entry), state)
}

function initialState() {
  let state = createWeedGoblinsV2State({ campaignId: FOUNDER_CAMPAIGN_ID })
  state = addHistoryEntries(state, [
    { type: 'narration', text: FIRST_TIME_ELIZA_INTRO },
    { type: 'narration', text: OPENING_NARRATION },
  ])
  return state
}

function latestRoll(state, owner = null) {
  for (let index = state.ledger.length - 1; index >= 0; index -= 1) {
    const event = state.ledger[index]
    if (event.type !== 'roll') continue
    if (owner && event.owner !== owner) continue
    return event
  }
  return null
}

function paragraphNodes(text) {
  return String(text ?? '')
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => <p key={index}>{paragraph}</p>)
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
          {Number.isFinite(entry.modifier) && entry.modifier !== 0 ? ` ${entry.modifier > 0 ? '+' : '−'} ${Math.abs(entry.modifier)}` : ''}
          {Number.isFinite(entry.total) ? ` = ${entry.total}` : ''}
          {Number.isFinite(entry.target) ? ` vs ${entry.target}` : ''}
        </div>
        {entry.result && <div className="weed-goblins-v2__roll-record-result">{entry.result}</div>}
      </div>
    )
  }

  return (
    <article className="weed-goblins-v2__narration">
      {paragraphNodes(entry.text)}
    </article>
  )
}

function StatusStrip({ state }) {
  if (!state.player.backgroundId) return null
  const enemy = state.world.sneak
  const inEncounter = [V2_SCENES.rattlebridge, V2_SCENES.combat].includes(state.sceneId)
  return (
    <div className="weed-goblins-v2__status" aria-label="Current game status">
      <div>
        <span>HP</span>
        <strong>{state.player.hp}/{state.player.maxHp}</strong>
      </div>
      <div>
        <span>Mana</span>
        <strong>{state.player.mana}/{state.player.maxMana}</strong>
      </div>
      <div>
        <span>Trouble</span>
        <strong>{TROUBLE_LABELS[state.trouble]}</strong>
      </div>
      {inEncounter && enemy.status === 'active' && (
        <div>
          <span>Highland Sneak</span>
          <strong>{healthState(enemy.hp, enemy.maxHp)}</strong>
        </div>
      )}
      {inEncounter && (
        <div>
          <span>Alarm</span>
          <strong>{state.alarm}</strong>
        </div>
      )}
    </div>
  )
}

function CharacterSheet({ state, onClose, onRestart }) {
  const race = RACES[state.player.raceId]
  const weapon = weaponById(state.player.weaponId)
  const background = BACKGROUNDS[state.player.backgroundId]
  return (
    <div className="weed-goblins-v2__sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="weed-goblins-v2__sheet" role="dialog" aria-modal="true" aria-label="Character sheet" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span className="weed-goblins-v2__eyebrow">Character</span>
            <h2>{state.player.name || 'Unnamed adventurer'}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close character sheet">×</button>
        </header>

        <div className="weed-goblins-v2__sheet-grid">
          <section>
            <h3>Character</h3>
            <dl>
              <div><dt>Race</dt><dd>{race?.label || 'Not established'}</dd></div>
              <div><dt>Level</dt><dd>{state.level}</dd></div>
              <div><dt>Background</dt><dd>{background?.label || 'Not established'}</dd></div>
              <div><dt>Strength</dt><dd>{state.player.strength || '—'}</dd></div>
              <div><dt>Defense</dt><dd>{state.player.defense || '—'}</dd></div>
              <div><dt>Guard</dt><dd>{state.player.guard || '—'}</dd></div>
              <div><dt>HP</dt><dd>{state.player.maxHp ? `${state.player.hp}/${state.player.maxHp}` : '—'}</dd></div>
              <div><dt>Mana</dt><dd>{state.player.maxMana ? `${state.player.mana}/${state.player.maxMana}` : '—'}</dd></div>
              <div><dt>Wound</dt><dd>{state.player.wound}</dd></div>
            </dl>
          </section>

          <section>
            <h3>Gear & Pack</h3>
            <p>{weapon ? `${weapon.label} · ${state.inventory.weaponCondition}` : 'Weapon not established'}</p>
            <p>Pack {state.inventory.pack.length}/6</p>
            {state.inventory.storyItems.length > 0 && (
              <ul>{state.inventory.storyItems.map((item) => <li key={item}>{item}</li>)}</ul>
            )}
          </section>

          <section>
            <h3>Abilities</h3>
            {background ? (
              <>
                <strong>{background.ability}</strong>
                <p>{background.passive}</p>
              </>
            ) : <p>Not established yet.</p>}
            {race && <p>{race.traits.join(' · ')}</p>}
          </section>

          <section>
            <h3>Threads</h3>
            <ul>{state.threads.map((thread) => <li key={thread.id}>{thread.label} · {thread.status}</li>)}</ul>
          </section>

          <section>
            <h3>Discoveries</h3>
            {state.discoveries.length > 0
              ? <ul>{state.discoveries.map((item) => <li key={item.id}>{item.label}</li>)}</ul>
              : <p>Nothing important recorded yet.</p>}
          </section>

          <section>
            <h3>Map</h3>
            <p>{state.map.knownLocations.join(' → ')}</p>
          </section>
        </div>

        <button className="weed-goblins-v2__restart" type="button" onClick={onRestart}>Restart founder slice</button>
      </section>
    </div>
  )
}

function IdentityPrompt({ state, onSubmit, busy }) {
  const [name, setName] = useState(state.player.name || '')
  const [raceId, setRaceId] = useState(state.player.raceId || '')
  return (
    <form className="weed-goblins-v2__identity" onSubmit={(event) => {
      event.preventDefault()
      onSubmit({ name, raceId })
    }}>
      <h2>Who is kneeling there?</h2>
      <label>
        Character name
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} autoComplete="off" />
      </label>
      <div className="weed-goblins-v2__choice-grid" role="group" aria-label="Choose race">
        {Object.values(RACES).map((race) => (
          <button
            key={race.id}
            type="button"
            className={raceId === race.id ? 'is-selected' : ''}
            onClick={() => setRaceId(race.id)}
          >
            <strong>{race.label}</strong>
            <span>{race.traits[0]}</span>
          </button>
        ))}
      </div>
      <button className="weed-goblins-v2__primary" type="submit" disabled={busy || !name.trim() || !raceId}>Continue</button>
    </form>
  )
}

function SelectionPrompt({ title, items, selectedId, onSelect, busy }) {
  return (
    <section className="weed-goblins-v2__selection">
      <h2>{title}</h2>
      <div className="weed-goblins-v2__choice-grid">
        {items.map((item) => (
          <button key={item.id} type="button" className={selectedId === item.id ? 'is-selected' : ''} onClick={() => onSelect(item.id)} disabled={busy}>
            <strong>{item.label}</strong>
            {item.detail && <span>{item.detail}</span>}
          </button>
        ))}
      </div>
    </section>
  )
}

function PendingRoll({ state, onRoll, busy }) {
  const pending = state.pendingResolution
  if (!pending) return null
  const statLabel = pending.stat === 'magic' ? 'Magic' : pending.stat ? pending.stat[0].toUpperCase() + pending.stat.slice(1) : null
  const targetKnown = pending.targetKnown !== false
  return (
    <section className="weed-goblins-v2__ruling" aria-live="polite">
      <div className="weed-goblins-v2__eyebrow">Ruling locked</div>
      {pending.type === 'damage' ? (
        <>
          <h2>Roll damage</h2>
          <p>{damageDiceLabel(pending.natural20 ? [...pending.dice, ...pending.dice] : pending.dice)}{pending.force ? ` + ${state.player.strength} Strength` : ''}</p>
        </>
      ) : pending.type === 'initiative' ? (
        <>
          <h2>Roll initiative</h2>
          <p>d20 + {state.player.defense} Defense. Eliza rolls for the Highland Sneak.</p>
        </>
      ) : (
        <>
          <h2>{pending.actionId.startsWith('combat:attack') ? 'Attack roll' : 'D20 check'}</h2>
          <dl>
            {statLabel && <div><dt>Uses</dt><dd>{statLabel} {pending.modifier >= 0 ? '+' : ''}{pending.modifier}</dd></div>}
            {Number.isFinite(pending.dc) && <div><dt>Target</dt><dd>{targetKnown ? pending.dc : 'Unknown'}</dd></div>}
            {pending.advantage && pending.advantage !== 'normal' && <div><dt>Roll</dt><dd>{pending.advantage}</dd></div>}
            {pending.manaCost > 0 && <div><dt>Cost</dt><dd>{pending.manaCost} Mana committed</dd></div>}
            {pending.successText && <div><dt>Success</dt><dd>{pending.successText}</dd></div>}
            {pending.failureText && <div><dt>Failure</dt><dd>{pending.failureText}</dd></div>}
          </dl>
        </>
      )}
      <button className="weed-goblins-v2__roll-button" type="button" onClick={onRoll} disabled={busy}>
        {pending.type === 'damage' ? 'Roll damage' : pending.type === 'initiative' ? 'Roll initiative' : 'Roll D20'}
      </button>
    </section>
  )
}

export default function WeedGoblinsGame() {
  const navigate = useNavigate()
  const memoryPersistence = useRef(createMemoryWeedGoblinsV2Persistence())
  const storyEndRef = useRef(null)
  const [state, setState] = useState(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [freeform, setFreeform] = useState('')

  const actions = useMemo(() => state ? getCurrentActions(state) : [], [state])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        let restored = null
        try {
          restored = await loadWeedGoblinsV2State(FOUNDER_CAMPAIGN_ID)
        } catch {
          restored = await memoryPersistence.current.load(FOUNDER_CAMPAIGN_ID)
        }
        const next = restored || initialState()
        if (!restored) {
          try { await saveWeedGoblinsV2State(next) } catch { await memoryPersistence.current.save(next) }
        }
        if (!cancelled) setState(next)
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Could not open Weed Goblins.')
      } finally {
        if (!cancelled) setBusy(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [state?.history?.length, state?.pendingResolution?.id])

  async function persist(next) {
    try {
      await saveWeedGoblinsV2State(next)
    } catch {
      await memoryPersistence.current.save(next)
    }
    setState(next)
    return next
  }

  async function commit(next, entries = []) {
    return persist(addHistoryEntries(next, entries))
  }

  async function handleRoute(routeId) {
    setBusy(true)
    setError('')
    try {
      const route = Object.values({ direct: { id: 'direct', label: 'Follow them before they reach the bridge' }, investigate: { id: 'investigate', label: 'Check the campsite and tracks first' }, high: { id: 'high', label: 'Take the high trail above the gorge' } }).find((item) => item.id === routeId)
      let next = chooseOpeningRoute(state, routeId)
      await commit(next, [
        { type: 'player-action', text: route?.label || routeId },
        { type: 'narration', text: routeNarration(routeId) },
      ])
    } catch (actionError) {
      setError(actionError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleIdentity(identity) {
    setBusy(true)
    setError('')
    try {
      const next = establishIdentity(state, identity)
      await commit(next, [
        { type: 'player-action', text: `${identity.name}, ${RACES[identity.raceId]?.label}` },
        { type: 'narration', text: identityNarration({ raceId: identity.raceId, routeId: state.route }) },
      ])
    } catch (actionError) {
      setError(actionError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleWeapon(weaponId) {
    setBusy(true)
    setError('')
    try {
      const weapon = weaponById(weaponId)
      const next = chooseWeapon(state, weaponId)
      await commit(next, [
        { type: 'player-action', text: weapon?.label || weaponId },
        { type: 'narration', text: weaponNarration(weaponId) },
      ])
    } catch (actionError) {
      setError(actionError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleBackground(backgroundId) {
    setBusy(true)
    setError('')
    try {
      const background = BACKGROUNDS[backgroundId]
      const next = chooseBackground(state, backgroundId)
      const entries = [
        { type: 'player-action', text: background?.label || backgroundId },
        { type: 'narration', text: backgroundNarration(backgroundId, state.route) },
      ]
      if (next.sceneId === V2_SCENES.rattlebridge) entries.push({ type: 'narration', text: rattlebridgeArrival(next) })
      await commit(next, entries)
    } catch (actionError) {
      setError(actionError.message)
    } finally {
      setBusy(false)
    }
  }

  async function resolveEnemy(next) {
    if (next.sceneId !== V2_SCENES.combat || next.combat?.turn !== 'enemy') return next
    const intent = determineEnemyIntent(next)
    let attackDie = null
    let damageRolls = []
    if (intent?.type === 'attack') {
      attackDie = randomDie(20)
      damageRolls = [randomDie(4)]
    }
    const resolved = resolveEnemyTurn(next, { attackDie, damageRolls })
    const entries = []
    if (intent?.type === 'attack') {
      const hit = attackDie + HIGHLAND_SNEAK.attackModifier >= next.player.guard
      entries.push({
        type: 'roll',
        owner: 'dm',
        label: 'DM roll · Highland Sneak attack',
        rolls: [attackDie],
        modifier: HIGHLAND_SNEAK.attackModifier,
        total: attackDie + HIGHLAND_SNEAK.attackModifier,
        target: next.player.guard,
        result: hit ? 'Hit' : 'Miss',
      })
      if (hit) {
        entries.push({
          type: 'roll',
          owner: 'dm',
          label: 'DM roll · Hookknife damage',
          rolls: damageRolls,
          modifier: 0,
          total: damageRolls[0],
          result: `${damageRolls[0]} Physical damage`,
        })
      }
      entries.push({ type: 'narration', text: enemyTurnNarration({ action: 'attack', hit, damage: hit ? damageRolls[0] : 0 }) })
    } else if (intent?.type) {
      entries.push({ type: 'narration', text: enemyTurnNarration({ action: intent.type }) })
    }
    return addHistoryEntries(resolved, entries.filter((entry) => entry.text !== ''))
  }

  async function handlePreparedAction(action) {
    setBusy(true)
    setError('')
    try {
      const beforeScene = state.sceneId
      let next = prepareAction(state, action.id)
      const entries = [{ type: 'player-action', text: action.label }]
      if (next.sceneId === V2_SCENES.combat && beforeScene !== V2_SCENES.combat) {
        entries.push({
          type: 'narration',
          text: `The choice closes the distance between argument and violence. The Highland Sneak brings the hookknife up, plants one foot beside the alarm rig, and the fight becomes real enough for initiative.`,
        })
      }
      if (next.sceneId === V2_SCENES.cloudberry) entries.push({ type: 'narration', text: cloudberryNarration(next) })
      await commit(next, entries)
    } catch (actionError) {
      setError(actionError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleRoll() {
    if (!state?.pendingResolution) return
    setBusy(true)
    setError('')
    try {
      const pending = state.pendingResolution
      let next = state
      let entries = []

      if (pending.type === 'initiative') {
        const playerDie = randomDie(20)
        const enemyDie = randomDie(20)
        next = commitInitiative(state, { playerDie, enemyDie })
        entries.push({
          type: 'roll', owner: 'player', label: 'Initiative', rolls: [playerDie], modifier: state.player.defense,
          total: playerDie + state.player.defense, result: next.combat.turn === 'player' ? 'You act first' : 'Eliza acts first',
        })
        entries.push({
          type: 'roll', owner: 'dm', label: 'DM roll · Highland Sneak initiative', rolls: [enemyDie], modifier: HIGHLAND_SNEAK.initiativeModifier,
          total: enemyDie + HIGHLAND_SNEAK.initiativeModifier,
        })
        next = addHistoryEntries(next, entries)
        next = await resolveEnemy(next)
        await persist(next)
        return
      }

      if (pending.type === 'attack') {
        const count = pending.advantage === 'normal' ? 1 : 2
        const rolls = Array.from({ length: count }, () => randomDie(20))
        next = commitPlayerAttack(state, { rolls })
        const rollEvent = latestRoll(next, 'player')
        entries.push({
          type: 'roll', owner: 'player', label: 'Attack roll', rolls: rollEvent.rolls, modifier: rollEvent.modifier,
          total: rollEvent.total, target: pending.targetKnown === false ? undefined : rollEvent.target, result: rollEvent.success ? 'Hit' : 'Miss',
        })
        entries.push({ type: 'narration', text: attackNarration({ hit: rollEvent.success, weaponId: state.player.weaponId }) })
        next = addHistoryEntries(next, entries)
        if (!next.pendingResolution && next.combat?.turn === 'enemy') next = await resolveEnemy(next)
        await persist(next)
        return
      }

      if (pending.type === 'damage') {
        const rolls = rollDamageDice(pending.dice, { natural20: pending.natural20 })
        next = commitPlayerDamage(state, { rolls })
        const rollEvent = latestRoll(next, 'player')
        entries.push({
          type: 'roll', owner: 'player', label: 'Damage roll', rolls: rollEvent.rolls, modifier: rollEvent.modifier,
          total: rollEvent.total, result: `${rollEvent.total} damage`,
        })
        entries.push({
          type: 'narration',
          text: damageNarration({ damage: rollEvent.total, enemyHealth: healthState(next.world.sneak.hp, next.world.sneak.maxHp) }),
        })
        next = addHistoryEntries(next, entries)
        if (next.combat?.turn === 'enemy') next = await resolveEnemy(next)
        await persist(next)
        return
      }

      if (pending.type === 'check') {
        const count = pending.advantage === 'normal' ? 1 : 2
        const rolls = Array.from({ length: count }, () => randomDie(20))
        const before = state
        next = commitPendingCheck(state, { rolls })
        const rollEvent = latestRoll(next, 'player')
        entries.push({
          type: 'roll', owner: 'player', label: pending.context === 'combat-maneuver' ? 'Combat check' : 'D20 check',
          rolls: rollEvent.rolls, modifier: rollEvent.modifier, total: rollEvent.total, target: rollEvent.target,
          result: rollEvent.success ? 'Success' : 'Failure',
        })
        if (pending.context === 'high-route') {
          entries.push({ type: 'narration', text: highRouteResultNarration({ success: rollEvent.success, natural: rollEvent.natural }) })
          entries.push({ type: 'narration', text: rattlebridgeArrival(next) })
        } else {
          entries.push({ type: 'narration', text: checkResultNarration({ actionId: pending.actionId, success: rollEvent.success, natural: rollEvent.natural, state: next }) })
          if (next.sceneId === V2_SCENES.cloudberry && before.sceneId !== V2_SCENES.cloudberry) entries.push({ type: 'narration', text: cloudberryNarration(next) })
        }
        next = addHistoryEntries(next, entries)
        if (next.combat?.turn === 'enemy') next = await resolveEnemy(next)
        await persist(next)
      }
    } catch (rollError) {
      setError(rollError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleFreeform(event) {
    event.preventDefault()
    const text = freeform.trim()
    if (!text || busy) return
    const interpretation = interpretLocalFreeform(state, text)
    setFreeform('')
    if (!interpretation.supported) {
      await commit(state, [
        { type: 'player-action', text },
        { type: 'narration', text: `I can work with the idea, but I need the action a little more concretely. Tell me what you are using, what you are doing with it, and what you want to change about the bridge, the guard, or the alarm.` },
      ])
      return
    }
    const matching = [...actions, { id: interpretation.actionId, label: text }].find((item) => item.id === interpretation.actionId)
    await handlePreparedAction({ id: interpretation.actionId, label: matching?.label || text })
  }

  async function handleRestart() {
    setBusy(true)
    setError('')
    try {
      try { await deleteWeedGoblinsV2State(FOUNDER_CAMPAIGN_ID) } catch { /* memory fallback below */ }
      await memoryPersistence.current.delete(FOUNDER_CAMPAIGN_ID)
      const next = initialState()
      await persist(next)
      setSheetOpen(false)
    } catch (restartError) {
      setError(restartError.message)
    } finally {
      setBusy(false)
    }
  }

  if (!state) {
    return <main className="weed-goblins-v2"><div className="weed-goblins-v2__loading">{error || 'Opening the Goblin Highlands…'}</div></main>
  }

  const weaponItems = Object.values(WEAPONS).map((weapon) => ({
    id: weapon.id,
    label: weapon.label,
    detail: `${damageDiceLabel(weapon.damage)} · ${weapon.identity}`,
  }))
  const backgroundItems = Object.values(BACKGROUNDS).map((background) => ({
    id: background.id,
    label: background.label,
    detail: `STR ${background.strength} · DEF ${background.defense} · Mana ${background.maxMana} · HP ${background.maxHp}`,
  }))

  return (
    <main className="weed-goblins-v2">
      <header className="weed-goblins-v2__topbar">
        <button type="button" onClick={() => navigate('/games')}>← Games</button>
        <div>
          <span>Chapter 1</span>
          <strong>{state.currentLocation}</strong>
        </div>
        <button className="weed-goblins-v2__e-button" type="button" onClick={() => setSheetOpen(true)} aria-label="Open character sheet">E</button>
      </header>

      <div className="weed-goblins-v2__page">
        <StatusStrip state={state} />

        <section className="weed-goblins-v2__story" aria-live="polite">
          {state.history.map((entry) => <StoryEntry key={entry.id} entry={entry} />)}
          <div ref={storyEndRef} />
        </section>

        {error && <div className="weed-goblins-v2__error" role="alert">{error}</div>}

        {state.sceneId === V2_SCENES.windcut && !state.pendingResolution && (
          <SelectionPrompt
            title="What do you do?"
            items={[
              { id: 'direct', label: 'Follow them before they reach the bridge' },
              { id: 'investigate', label: 'Check the campsite and tracks first' },
              { id: 'high', label: 'Take the high trail above the gorge' },
            ]}
            onSelect={handleRoute}
            busy={busy}
          />
        )}

        {state.sceneId === V2_SCENES.identity && <IdentityPrompt state={state} onSubmit={handleIdentity} busy={busy} />}

        {state.sceneId === V2_SCENES.weapon && (
          <SelectionPrompt title="What weapon did you bring into the Highlands?" items={weaponItems} onSelect={handleWeapon} busy={busy} />
        )}

        {state.sceneId === V2_SCENES.background && (
          <SelectionPrompt title={`What kind of adventurer is ${state.player.name}?`} items={backgroundItems} onSelect={handleBackground} busy={busy} />
        )}

        <PendingRoll state={state} onRoll={handleRoll} busy={busy} />

        {!state.pendingResolution && actions.length > 0 && (
          <section className="weed-goblins-v2__actions">
            <h2>What do you do?</h2>
            <div className="weed-goblins-v2__action-list">
              {actions.map((action) => (
                <button key={action.id} type="button" onClick={() => handlePreparedAction(action)} disabled={busy}>
                  <strong>{action.label}</strong>
                  {action.detail && <span>{action.detail}</span>}
                </button>
              ))}
            </div>
          </section>
        )}

        {!state.pendingResolution && [V2_SCENES.rattlebridge, V2_SCENES.combat].includes(state.sceneId) && (
          <form className="weed-goblins-v2__freeform" onSubmit={handleFreeform}>
            <label htmlFor="weed-goblins-freeform">Or tell Eliza exactly what you want to do</label>
            <div>
              <input id="weed-goblins-freeform" value={freeform} onChange={(event) => setFreeform(event.target.value)} maxLength={300} autoComplete="off" placeholder="I want to…" />
              <button type="submit" disabled={busy || !freeform.trim()}>Do it</button>
            </div>
          </form>
        )}

        {state.sceneId === V2_SCENES.cloudberry && (
          <section className="weed-goblins-v2__slice-end">
            <strong>Founder vertical slice complete</strong>
            <span>No merge or production deploy is triggered from here.</span>
          </section>
        )}
      </div>

      {sheetOpen && <CharacterSheet state={state} onClose={() => setSheetOpen(false)} onRestart={handleRestart} />}
    </main>
  )
}
