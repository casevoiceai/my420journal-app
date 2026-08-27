import { useEffect, useMemo, useState } from 'react'
import './WeedGoblinsV3.css'

import { STARTER_ANCESTRIES, ancestryById } from './content/starterLandsAncestries.js'
import { STARTER_BACKGROUNDS, backgroundById } from './content/starterLandsBackgrounds.js'
import { SABLE_MERROW, STARTER_WEAPONS, weaponById } from './content/starterLandsArmory.js'
import { STARTER_BLOCKS } from './content/starterLandsBlocks.js'
import { STARTER_LANDS_PROLOGUE } from './content/starterLandsPrologue.js'
import { questionById } from './content/starterLandsQuestions.js'
import { departureCallback, sableBanterIndex } from './weedGoblinsNarrativeDirector.js'
import { weedGoblinsV3Persistence } from './weedGoblinsV3Persistence.js'
import {
  answerCharacterQuestion,
  beginStarter,
  commitDeparture,
  confirmAncestry,
  confirmBackground,
  confirmWeapon,
  createWeedGoblinsV3State,
  enterArmory,
  previewAncestry,
  previewBackground,
  previewWeapon,
  setPlayerName,
} from './weedGoblinsV3State.js'
import { createStoryRegistry } from './weedGoblinsStoryRegistry.js'
import { validateV3State } from './weedGoblinsV3Validation.js'

const REGISTRY = createStoryRegistry(STARTER_BLOCKS)

function paragraphs(content) {
  return Array.isArray(content) ? content : [content]
}

function StoryPassage({ title = null, children, content = null }) {
  return (
    <article className="wg3-story">
      {title ? <h2>{title}</h2> : null}
      {content ? paragraphs(content).map((paragraph, index) => <p key={index}>{paragraph}</p>) : children}
    </article>
  )
}

function ElizaAside({ children }) {
  return (
    <aside className="wg3-eliza">
      <div className="wg3-eliza__badge">E</div>
      <div>
        <strong>Eliza</strong>
        <p>{children}</p>
      </div>
    </aside>
  )
}

function ChoiceGrid({ items, previewId, onPreview, inspectedIds = [], noun = 'choice' }) {
  return (
    <div className="wg3-choice-grid" aria-label={`Preview ${noun}`}>
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          className={previewId === item.id ? 'is-selected' : ''}
          onClick={() => onPreview(item.id)}
        >
          <strong>{item.label}</strong>
          <span>{item.hook || item.identity}</span>
          {inspectedIds.includes(item.id) ? <em>Examined</em> : null}
        </button>
      ))}
    </div>
  )
}

function LoreReader({ item, confirmLabel, onConfirm, onBack }) {
  return (
    <section className="wg3-reader">
      <button type="button" className="wg3-text-button" onClick={onBack}>← Back to choices</button>
      <h2>{item.label}</h2>
      <p className="wg3-hook">{item.hook}</p>
      {item.sections.map(([heading, body]) => (
        <section key={heading} className="wg3-lore-section">
          <h3>{heading}</h3>
          <p>{body}</p>
        </section>
      ))}
      <div className="wg3-confirm-zone">
        <p>You can go back and read the others. Nothing is locked until you choose.</p>
        <button type="button" className="wg3-primary" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </section>
  )
}

function MechanicsSummary({ rows }) {
  return (
    <dl className="wg3-mechanics">
      {rows.map(([term, value]) => (
        <div key={term}><dt>{term}</dt><dd>{value}</dd></div>
      ))}
    </dl>
  )
}

function AdventureJournalDrawer({ state, onClose, onReset }) {
  const ancestry = ancestryById(state.player.ancestryId)
  const background = backgroundById(state.player.backgroundId)
  const weapon = weaponById(state.player.weaponId)
  return (
    <div className="wg3-drawer-backdrop" role="presentation" onClick={onClose}>
      <aside className="wg3-drawer" role="dialog" aria-modal="true" aria-label="Adventure journal" onClick={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span className="wg3-eyebrow">Adventure journal</span>
            <h2>{state.player.name || 'Unnamed hero'}</h2>
          </div>
          <button type="button" className="wg3-close" onClick={onClose} aria-label="Close journal">×</button>
        </header>

        <section>
          <h3>Right now</h3>
          <p>{state.sceneId === 'starter:theft-threshold'
            ? 'Your stash has just been stolen in the Goblin Highlands.'
            : `You are building your character at ${state.currentLocation}.`}</p>
        </section>

        <section>
          <h3>Your character</h3>
          <p><strong>Ancestry:</strong> {ancestry?.label || 'Not chosen yet'}</p>
          <p><strong>Background:</strong> {background?.label || 'Not chosen yet'}</p>
          <p><strong>Weapon:</strong> {weapon?.label || 'Not chosen yet'}</p>
        </section>

        {state.player.characterFacts.length > 0 ? (
          <section>
            <h3>Things we established</h3>
            <ul>
              {state.player.characterFacts.map((fact) => <li key={fact.key}>{fact.label}</li>)}
            </ul>
          </section>
        ) : null}

        {state.npcMemory['sable-merrow']?.encountered ? (
          <section>
            <h3>People</h3>
            <p><strong>Sable Merrow:</strong> outfitter at Merrow's Field Goods, Fine Errors & Sundries.</p>
          </section>
        ) : null}

        <button type="button" className="wg3-danger-link" onClick={onReset}>Restart this V3 founder preview</button>
      </aside>
    </div>
  )
}

function CharacterQuestions({ state, apply }) {
  const currentId = state.selectedQuestionIds.find((id) => !(id in state.questionAnswers))
  const question = questionById(currentId)
  const answered = Object.keys(state.questionAnswers).length
  if (!question) return null
  return (
    <>
      <ElizaAside>
        I am not building a personality sheet behind your back. I am asking you for a few facts the world is allowed to remember.
      </ElizaAside>
      <section className="wg3-question">
        <span className="wg3-eyebrow">Character question {answered + 1} of {state.selectedQuestionIds.length}</span>
        <h2>{question.prompt}</h2>
        <div className="wg3-answer-list">
          {question.answers.map(([answerId, label]) => (
            <button type="button" key={answerId} onClick={() => apply((current) => answerCharacterQuestion(current, question.id, answerId))}>
              {label}
            </button>
          ))}
        </div>
      </section>
    </>
  )
}

function ArmoryBrowser({ state, apply }) {
  const preview = weaponById(state.previewing.weaponId)
  const inspectedCount = state.inspected.weaponIds.length
  return (
    <>
      <StoryPassage>
        <h2>{SABLE_MERROW.shop}</h2>
        <p>Sable rests both hands on the counter. “Pick things up. Ask questions. Change your mind. I would rather watch you reconsider six weapons here than discover your first opinion was stupid halfway across a bridge.”</p>
      </StoryPassage>

      {!preview ? (
        <>
          <p className="wg3-instruction">Choose a weapon below to examine it. Examining does not equip it.</p>
          <ChoiceGrid
            items={STARTER_WEAPONS}
            previewId={null}
            inspectedIds={state.inspected.weaponIds}
            onPreview={(id) => apply((current) => previewWeapon(current, id))}
            noun="weapons"
          />
        </>
      ) : (
        <section className="wg3-reader">
          <button type="button" className="wg3-text-button" onClick={() => apply((current) => ({ ...current, previewing: { ...current.previewing, weaponId: null } }))}>← Back to weapon racks</button>
          <h2>{preview.label}</h2>
          <StoryPassage content={preview.story} />
          <ElizaAside>{preview.sable[sableBanterIndex({ seed: state.seed, weaponId: preview.id, inspectedCount, variantCount: preview.sable.length })]}</ElizaAside>
          <MechanicsSummary rows={[
            ['Damage', preview.damage],
            ['Combat identity', preview.identity],
            ['Tradeoff', preview.tradeoff],
          ]} />
          <div className="wg3-confirm-zone">
            <p>{SABLE_MERROW.confirmation}</p>
            <button type="button" className="wg3-primary" onClick={() => apply((current) => confirmWeapon(current, preview.id))}>Choose {preview.label}</button>
          </div>
        </section>
      )}
    </>
  )
}

function BackgroundBrowser({ state, apply }) {
  const preview = backgroundById(state.previewing.backgroundId)
  if (preview) {
    return (
      <section className="wg3-reader">
        <button type="button" className="wg3-text-button" onClick={() => apply((current) => ({ ...current, previewing: { ...current.previewing, backgroundId: null } }))}>← Back to backgrounds</button>
        <h2>{preview.label}</h2>
        <p className="wg3-hook">{preview.hook}</p>
        <StoryPassage content={preview.story} />
        <section className="wg3-lore-section">
          <h3>What you notice</h3>
          <p>{preview.notice}</p>
        </section>
        <section className="wg3-lore-section">
          <h3>{preview.ability}</h3>
          <p>{preview.abilityText}</p>
        </section>
        <MechanicsSummary rows={[
          ['Strength', preview.stats.strength],
          ['Defense', preview.stats.defense],
          ['Mana', preview.stats.maxMana],
          ['HP', preview.stats.maxHp],
          ['Guard', preview.stats.guard],
        ]} />
        <div className="wg3-confirm-zone">
          <p>This is training and experience, not your personality. You can still go back and inspect the others.</p>
          <button type="button" className="wg3-primary" onClick={() => apply((current) => confirmBackground(current, preview.id))}>Choose {preview.label}</button>
        </div>
      </section>
    )
  }

  return (
    <>
      <ElizaAside>
        Your ancestry tells us some of the world you came from. Your background tells us what kind of problems taught you how to survive it.
      </ElizaAside>
      <p className="wg3-instruction">Preview all three if you want. Nothing is committed until you choose.</p>
      <ChoiceGrid
        items={STARTER_BACKGROUNDS}
        previewId={null}
        inspectedIds={state.inspected.backgroundIds}
        onPreview={(id) => apply((current) => previewBackground(current, id))}
        noun="backgrounds"
      />
    </>
  )
}

function TheftThreshold({ state }) {
  const ancestry = ancestryById(state.player.ancestryId)
  const weapon = weaponById(state.player.weaponId)
  const goblinAttitude = state.player.characterFacts.find((fact) => fact.key === 'goblin_preconception')
  return (
    <>
      <StoryPassage title="The Goblin Highlands">
        <p>By late afternoon the road has narrowed into a shelf of green above a gray gorge. Mossgate is gone behind the hills. The air smells of wet stone, cloudberries, and the remains of somebody's campfire doing an extremely poor job of pretending it is out.</p>
        <p>{ancestry?.id === 'dwarf'
          ? 'The stone under the turf tells a longer story than the trail sign does: old repairs, older footings, and ground that has been carrying travelers longer than Mossgate has had a name.'
          : ancestry?.id === 'elf'
            ? 'Far ahead, movement flashes between the scrub and disappears. Too small to identify at this distance, but not too small for you to notice.'
            : ancestry?.id === 'gnome'
              ? 'A crooked warning frame beside the trail contains three kinds of repair, two respectable ideas, and one solution that appears to involve a spoon.'
              : 'The road has changed character. People still use it, but nobody is pretending the Highlands were built for convenience.'}</p>
        <p>You make camp at Windcut because the light is failing and because every sensible guide in Mossgate agreed that continuing in the dark would be “educational in the expensive way.” Your pack settles beside you. {weapon ? `Your ${weapon.label.toLowerCase()} is within reach.` : ''}</p>
        {goblinAttitude ? <p>Whatever you believed about goblins before today, you have not actually met the Highlands on its own terms yet.</p> : null}
        <p>The theft itself takes less than ten seconds.</p>
        <p>One moment your green enamel stash tin is beside your pack, dented lid, exactly where you left it. The next, something small and barefoot rockets out from beneath the scrub with the tin clutched against its chest.</p>
        <p>Four more goblins burst after it in a confusion of elbows, rope, and equipment apparently assigned by drawing lots. One is wearing a helmet backward. Another has somehow lost a shoe without slowing down. The smallest keeps pointing urgently toward the ridge as if the others might otherwise forget where they are escaping to.</p>
        <p>They are heading toward the gorge.</p>
        <p>And they have your stash.</p>
      </StoryPassage>
      <div className="wg3-founder-stop">
        <strong>Founder preview stop</strong>
        <p>This V3 build intentionally stops at the Chapter 1 theft threshold. No Rattlebridge or production game code has been changed.</p>
      </div>
    </>
  )
}

export default function WeedGoblinsGameV3() {
  const [state, setState] = useState(null)
  const [nameDraft, setNameDraft] = useState('')
  const [error, setError] = useState('')
  const [journalOpen, setJournalOpen] = useState(false)

  useEffect(() => {
    let live = true
    weedGoblinsV3Persistence.load()
      .then((saved) => {
        if (!live) return
        if (saved) {
          validateV3State(saved)
          setState(saved)
          setNameDraft(saved.player.name || '')
        } else {
          setState(createWeedGoblinsV3State())
        }
      })
      .catch(() => {
        if (live) setState(createWeedGoblinsV3State())
      })
    return () => { live = false }
  }, [])

  const apply = (recipe) => {
    setError('')
    setState((current) => {
      try {
        const next = recipe(current)
        validateV3State(next)
        weedGoblinsV3Persistence.save(next).catch(() => {})
        return next
      } catch (caught) {
        setError(caught?.message || 'That did not work.')
        return current
      }
    })
  }

  const reset = async () => {
    await weedGoblinsV3Persistence.clear().catch(() => {})
    const fresh = createWeedGoblinsV3State()
    setNameDraft('')
    setJournalOpen(false)
    setError('')
    setState(fresh)
  }

  const currentAncestry = useMemo(() => ancestryById(state?.previewing?.ancestryId), [state?.previewing?.ancestryId])
  const departureBlock = REGISTRY.get('starter:departure:road')

  if (!state) return <main className="wg3-loading">Opening the book…</main>

  return (
    <main className="wg3">
      <header className="wg3-topbar">
        <div>
          <span>Weed Goblins</span>
          <strong>Starter Lands</strong>
        </div>
        <div className="wg3-topbar__location">
          <span>Location</span>
          <strong>{state.currentLocation}</strong>
        </div>
        <button type="button" onClick={() => setJournalOpen(true)}>Journal</button>
      </header>

      <div className="wg3-page">
        <div className="wg3-orientation">
          <span>Right now</span>
          <strong>{state.sceneId === 'starter:welcome'
            ? 'Meet Eliza and enter the Reach.'
            : state.sceneId === 'starter:name'
              ? 'Give your hero a name.'
              : state.sceneId === 'starter:ancestry-browse'
                ? 'Browse ancestries before choosing.'
                : state.sceneId === 'starter:identity-questions'
                  ? 'Establish a few facts about your hero.'
                  : state.sceneId.includes('armory') || state.sceneId.includes('weapon')
                    ? 'Explore Sable Merrow’s armory.'
                    : state.sceneId.includes('background')
                      ? 'Choose the experience that shaped you.'
                      : state.sceneId === 'starter:departure'
                        ? 'Leave Mossgate for the Highlands.'
                        : 'Your stash has just disappeared with five goblins.'}</strong>
        </div>

        {state.sceneId === 'starter:welcome' ? (
          <>
            <StoryPassage title={STARTER_LANDS_PROLOGUE.title} content={STARTER_LANDS_PROLOGUE.paragraphs} />
            <button type="button" className="wg3-primary" onClick={() => apply(beginStarter)}>Tell Eliza your name</button>
          </>
        ) : null}

        {state.sceneId === 'starter:name' ? (
          <>
            <ElizaAside>What does the world call you?</ElizaAside>
            <section className="wg3-name">
              <label htmlFor="wg3-name">Character name</label>
              <input id="wg3-name" value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} maxLength={80} />
              <button type="button" className="wg3-primary" onClick={() => apply((current) => setPlayerName(current, nameDraft))}>That’s my name</button>
            </section>
          </>
        ) : null}

        {state.sceneId === 'starter:ancestry-browse' && !currentAncestry ? (
          <>
            <ElizaAside>
              Read around before you commit. These are cultures and histories your character can stand inside, not personality presets.
            </ElizaAside>
            <p className="wg3-instruction">Choose an ancestry to open its full preview. You can read all four.</p>
            <ChoiceGrid
              items={STARTER_ANCESTRIES}
              previewId={null}
              inspectedIds={state.inspected.ancestryIds}
              onPreview={(id) => apply((current) => previewAncestry(current, id))}
              noun="ancestries"
            />
          </>
        ) : null}

        {state.sceneId === 'starter:ancestry-browse' && currentAncestry ? (
          <LoreReader
            item={currentAncestry}
            confirmLabel={`Choose ${currentAncestry.label}`}
            onBack={() => apply((current) => ({ ...current, previewing: { ...current.previewing, ancestryId: null } }))}
            onConfirm={() => apply((current) => confirmAncestry(current, currentAncestry.id))}
          />
        ) : null}

        {state.sceneId === 'starter:identity-questions' ? <CharacterQuestions state={state} apply={apply} /> : null}

        {state.sceneId === 'starter:armory-intro' ? (
          <>
            <StoryPassage title={SABLE_MERROW.shop} content={SABLE_MERROW.introduction} />
            <button type="button" className="wg3-primary" onClick={() => apply(enterArmory)}>Look around the armory</button>
          </>
        ) : null}

        {state.sceneId === 'starter:weapon-browse' ? <ArmoryBrowser state={state} apply={apply} /> : null}
        {state.sceneId === 'starter:background-browse' ? <BackgroundBrowser state={state} apply={apply} /> : null}

        {state.sceneId === 'starter:departure' ? (
          <>
            <StoryPassage title="Before you leave">
              {departureCallback({ state }).map((line, index) => <p key={index}>{line}</p>)}
            </StoryPassage>
            <StoryPassage content={departureBlock?.content} />
            <button type="button" className="wg3-primary" onClick={() => apply(commitDeparture)}>Head north into the Goblin Highlands</button>
          </>
        ) : null}

        {state.sceneId === 'starter:theft-threshold' ? <TheftThreshold state={state} /> : null}

        {error ? <div className="wg3-error" role="alert">{error}</div> : null}
      </div>

      {journalOpen ? <AdventureJournalDrawer state={state} onClose={() => setJournalOpen(false)} onReset={reset} /> : null}
    </main>
  )
}
