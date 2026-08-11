export const SESSION_ZERO_WELCOME = Object.freeze([
  'Welcome to the THC Trails.',
  'A bell, or maybe just the idea of a bell, rings three times.',
  'Half a beat later, it rings once more. Very regal.',
  "What's your character's name, and are they human, dwarf, elf, or gnome?",
])

export const SESSION_ZERO_QUESTIONS = Object.freeze({
  nameAndRace: "What's your character's name, and are they human, dwarf, elf, or gnome?",
  weapon: 'What are they carrying when the trail gets ugly?',
  background: 'What kind of trouble have they learned to survive?',
  pronoun: 'A brass trail marker has one small space after the name. What goes there?',
  look: 'What do they look like standing here in the wind?',
})

export const CHAPTER_ONE_STOLEN_ITEM_STATUSES = Object.freeze({
  recoveredIntact: 'recovered-intact',
  recoveredAltered: 'recovered-altered',
  bargainedBack: 'bargained-back',
  stillMissing: 'still-missing',
  voluntarilySurrendered: 'voluntarily-surrendered',
})

export const CHAPTER_ONE_NPCS = Object.freeze({
  goblinKing: Object.freeze({
    id: 'goblin-king',
    name: 'Goblin King',
    role: 'Theatrical ruler of the Highlands who is more frightened than he admits.',
    anchor: 'A living black root is threaded through one side of his brass crown.',
    quirk: 'He treats every threat as a constitutional dispute.',
    goal: 'He wants a feast dish named after him without having to ask for it.',
  }),
  nib: Object.freeze({
    id: 'nib',
    name: 'Nib',
    role: 'Young scout who wants a promotion and does not want anyone hurt.',
    anchor: 'One boot has a brass buckle two sizes too large.',
    quirk: 'He practices promotion speeches under his breath whenever nobody is supposed to be listening.',
    goal: 'He wants to invent a goblin rank that officially comes with a cape.',
  }),
  grubbin: Object.freeze({
    id: 'grubbin',
    name: 'Grubbin',
    role: 'Stash keeper who resents the King for sending the best goods away as tribute.',
    anchor: 'His right thumb is permanently black with ledger ink.',
    quirk: 'He corrects pictures by adding tiny arrows, even when the picture was already clear.',
    goal: 'He wants to reorganize the camp pantry entirely by jar height.',
  }),
  oldTatter: Object.freeze({
    id: 'old-tatter',
    name: 'Old Tatter',
    role: 'Retired raider who recognizes the black-root seal.',
    anchor: 'His left ear is split by an old notch that never healed straight.',
    quirk: 'He turns an object over before answering any serious question.',
    goal: 'He wants one person in Highland Camp to admit that his cloudberry knife is actually a spoon.',
  }),
})

export const CHAPTER_ONE_NPC_LIST = Object.freeze(Object.values(CHAPTER_ONE_NPCS))

export const CHAPTER_ONE_NPC_TOPICS = Object.freeze({
  nib: Object.freeze([
    Object.freeze({ id: 'promotion', gatedBy: null, funnyReward: true, prompt: 'Ask Nib about his promotion', text: 'Nib asks which title sounds senior enough.', choices: Object.freeze(['Assistant Deputy Scout', 'Acting Emergency Bridge Duke']), rewardSecret: 5 }),
    Object.freeze({ id: 'alarms', gatedBy: null, prompt: 'Ask Nib about Rattlebridge', text: 'Everybody cuts the bottle caps. That is why we keep extra bottle caps. The red reset cord is the actual problem.', rewardSecret: 4 }),
    Object.freeze({ id: 'case', gatedBy: null, prompt: 'Ask why the King wanted the case', text: 'He called it tribute inventory. He only says tribute inventory when he is worried.', rewardSecret: 3 }),
    Object.freeze({ id: 'court', gatedBy: 'nib-safe', prompt: 'Ask what the King is afraid of', text: 'The court only gets brave when he tells them they are all being insulted. If it is just him, they watch.', rewardSecret: 10 }),
  ]),
  grubbin: Object.freeze([
    Object.freeze({ id: 'ledger', gatedBy: null, prompt: 'Ask about the picture ledger', text: 'Words invite interpretation. Pictures invite arguments, but shorter ones.', rewardSecret: 6 }),
    Object.freeze({ id: 'goods', gatedBy: null, prompt: 'Ask why the best goods leave', text: 'The King keeps the things with crown marks. Black-root goes out.', rewardSecret: 6 }),
    Object.freeze({ id: 'shortage', gatedBy: 'ledger-seen', prompt: "Ask about the King's shortage", text: 'Last cart was light. Then your case arrived.', rewardSecret: 3 }),
    Object.freeze({ id: 'organized-tree', gatedBy: 'ledger-seen', funnyReward: true, prompt: 'Say the King is feeding a very organized tree', text: 'Ridiculous. Grubbin opens the previous month to prove it.', rewardSecret: 7 }),
  ]),
  oldTatter: Object.freeze([
    Object.freeze({ id: 'seal', gatedBy: null, prompt: 'Ask about the black-root seal', text: 'Older than this King.', rewardSecret: 2 }),
    Object.freeze({ id: 'market', gatedBy: null, prompt: 'Ask where he saw it', text: 'Hollow Market. Different carts. Same root.', rewardSecret: 8 }),
    Object.freeze({ id: 'latch', gatedBy: 'latch-clue', prompt: 'Ask about the carved-face latch', text: "King's doors like worried faces. Most kings do.", rewardSecret: 5 }),
    Object.freeze({ id: 'sad-turnip', gatedBy: null, funnyReward: true, prompt: 'Tell him the seal looks like a sad turnip', text: 'Finally. He produces an old rubbing carrying the same seal beside a Hollow Market cart mark.', rewardSecret: 8 }),
  ]),
  goblinKing: Object.freeze([
    Object.freeze({ id: 'case', gatedBy: null, prompt: 'Ask why he stole the case', text: 'It was requisitioned.', rewardSecret: 3 }),
    Object.freeze({ id: 'deadline', gatedBy: 'tribute-evidence', prompt: 'Ask about the tribute deadline', text: 'The cart leaves before moonrise. The schedule is older than my administration.', rewardSecret: 3 }),
    Object.freeze({ id: 'club', gatedBy: null, prompt: 'Ask about the Root-Crowned Club', text: 'This club has settled six constitutional questions.', rewardSecret: 9 }),
    Object.freeze({ id: 'matching-crown', gatedBy: null, funnyReward: true, prompt: 'Say he stole it because the brass latch matches his crown', text: 'It does match. But the case is tribute. It has to be on the cart before moonrise.', rewardSecret: 3 }),
    Object.freeze({ id: 'court', gatedBy: 'court-clue', prompt: 'Ask whether the court will fight for him', text: 'You are addressing the Crown.', rewardSecret: 10 }),
  ]),
})

export const CHAPTER_ONE_SECRETS = Object.freeze([
  Object.freeze({ id: 1, key: 'case-is-tribute', text: 'The Brass-Latched Research Case is listed with the goods leaving the Highlands.', surfaces: Object.freeze(['Windcut Trail drag evidence', 'Rattlebridge Sneak', 'Nib', 'picture tribute ledger', 'Goblin King', 'Stash Hall tribute crate']) }),
  Object.freeze({ id: 2, key: 'seal-predates-king', text: 'The black-root mark was already being used before the current King had a crown.', surfaces: Object.freeze(["Giant's Cloudberry Press", 'Old Sky-Bell', 'Old Tatter', 'weathered camp crate', 'older Stash Hall timber']) }),
  Object.freeze({ id: 3, key: 'tribute-shortage', text: 'The theft filled a hole in an outgoing tribute shipment.', surfaces: Object.freeze(['Nib rumor', "Grubbin's missing ledger space", 'outgoing crate inspection', "King's tribute deadline", 'matching-crown accusation']) }),
  Object.freeze({ id: 4, key: 'reset-cord', text: 'Cutting one alarm line silences one line. The red reset cord controls the span.', surfaces: Object.freeze(['green twine at Windcut Trail', 'red cord beneath Rattlebridge', 'Highland Sneak', 'Nib', 'bridge repair marks']) }),
  Object.freeze({ id: 5, key: 'worried-face', text: 'The trusted face is the worried face.', surfaces: Object.freeze(["Nib's promotion doodle", 'Old Sky-Bell trail-rune', 'Old Tatter', 'polished latch wear', 'picture-ledger margin']) }),
  Object.freeze({ id: 6, key: 'ledger-key', text: 'Crown means the King keeps it. Black-root means it leaves as tribute.', surfaces: Object.freeze(['Grubbin', 'picture ledger', 'crate sorting pattern', 'Old Tatter', 'correction marks']) }),
  Object.freeze({ id: 7, key: 'grubbin-cheats-ledger', text: 'Grubbin has already been cheating the tribute system.', surfaces: Object.freeze(['organized-tree answer', 'old correction arrows', 'Nib gossip', 'Grubbin trust conversation', 'hidden prior page']) }),
  Object.freeze({ id: 8, key: 'hollow-market', text: 'The tribute route continues beyond the Goblin Highlands to Hollow Market.', surfaces: Object.freeze(['Old Tatter', 'old rubbing', 'Old Sky-Bell route markings', "Giant's Press tribute tag", 'Stash Hall shipping marks']) }),
  Object.freeze({ id: 9, key: 'club-chain', text: "The Root-Crowned Club's root head catches on the hanging tribute chain.", surfaces: Object.freeze(["Nib's description", 'Old Tatter', 'Stash Hall ceiling scuffs', 'Root-Crowned Club', "King's boast"]) }),
  Object.freeze({ id: 10, key: 'court-stays-out', text: 'Pressure the King and the court watches. Challenge all of them and the court joins him.', surfaces: Object.freeze(['Nib after trust', 'Grubbin', 'Old Tatter', 'watching court behavior', 'Goblin King']) }),
])

export const CHAPTER_ONE_SCENE_TEXT = Object.freeze({
  windcutTrail: Object.freeze([
    'Wet thyme smells sharp under your boots. A brass rivet from the Research Case is pressed into the mud beside a narrow drag groove.',
    'A trail post points uphill toward Rattlebridge. Green waxed twine is caught under the rivet.',
    'Above the rise, bottle caps begin to rattle.',
  ]),
  rattlebridgeAlarm: Object.freeze([
    'Rattlebridge hangs over a slate cleft, and pine tar stings the air from the rope rails. Bottle-cap alarm lines cross the first span at knee height.',
    'A red reset cord disappears beneath the planks. A Highland Sneak crouches beside the far winch.',
    'The Sneak lifts one finger toward the nearest alarm line.',
  ]),
  rattlebridgeSneak: Object.freeze([
    'On the far landing, onion smoke drifts from a tin cup. The Highland Sneak\'s red knee-ribbon carries a tiny stitched crown.',
    'The alarm crank sits behind its heel. The path to Cloudberry Shelf starts three steps beyond it.',
    '"Crossing fee," the Sneak says.',
  ]),
  cloudberryShelf: Object.freeze([
    'Cloudberries warm in the sun, and their sharp-sweet smell sits over the stone shelf. Silver grass lies flat where the cliff wind presses it.',
    'Nib is tangled beside a snapped tripwire. A brass highland charm hangs from a peg beside a small bell.',
    'A patrol whistle sounds below, and Nib says, "Please do not let this become the version of me they remember."',
  ]),
  cloudberryExplore: Object.freeze([
    'Deep grooves in the stone lead toward a ruined cloudberry press. Higher on the shelf, the rim of an old bronze bell rises above the grass.',
  ]),
  highlandCamp: Object.freeze([
    '{campSmell} hangs under the cookfire smoke. Thin brass bells tap against the palisade.',
    'Grubbin has one hand on a picture ledger. Old Tatter sits beside a crate stamped with the black-root seal.',
    'Grubbin slaps his palm over the page showing the Brass-Latched Research Case. "Royal business."',
  ]),
  campLedger: Object.freeze([
    'The ledger uses pictures instead of words. A crown marks goods kept for the King; the black-root seal marks goods loaded onto tribute carts.',
    'The Brass-Latched Research Case is drawn under the black-root seal.',
    'Grubbin starts closing the ledger.',
  ]),
  stashLatch: Object.freeze([
    'The Stash Hall door is black oak tall enough for a loaded wagon. Beeswax and damp roots scent the ironwork.',
    'Four carved goblin faces ring the latch. A narrow slot beneath them matches the shape of the highland charm.',
    "Inside, the King's Root-Crowned Club strikes the floor once.",
  ]),
  stashHall: Object.freeze([
    "{campSmell} still clings to your clothes under the hall's cedar smoke. {gearMark} catches once against the threshold.",
    'The Brass-Latched Research Case rests on a low stone table. The Goblin King stands behind it with the Root-Crowned Club across both hands.',
    'The King sets the club across the case. "You came for this. Come take responsibility for that decision."',
  ]),
  wholeCourt: Object.freeze([
    'Every bench scrapes backward at once. The Root-Crowned Club comes up, and the Highland Sneaks along the walls stop pretending to be furniture.',
  ]),
})

export const CHAPTER_ONE_ACTION_SETUPS = Object.freeze({
  'route:quiet': 'The crosswind keeps pulling the alarm line tight.',
  'route:loud': 'The first alarm line is already moving.',
  'sneak:fee-paid': 'The Sneak has already committed to the existence of a fee. You are trying to make it commit just as hard to having collected one.',
  'sneak:move': 'The landing is narrow enough that the Sneak only has to hold one good step. You have to take that step away from it.',
  'sneak:title': 'The stitched crown on its knee is doing most of the work here. Give it a title good enough to make the crossing fee less important.',
  'sneak:mana': 'You are giving the Sneak a problem more interesting than stopping you.',
  'cloudberry:take-charm': 'The charm is tied beside a bell small enough to fit in your palm.',
  'press:climb': 'The old frame shifts under weight, and the Kite has the higher perch.',
  'press:wait': 'The Kite owns the higher perch. You are waiting for the wind to make it move first.',
  'press:distract': 'The Kite watches anything that catches the light.',
  'skybell:runes': 'The oldest carving is nearly worn smooth. Read it before the moving clapper makes this everybody\'s problem.',
  'skybell:brace': 'The clapper is heavier than it looks and already moving with the wind.',
  'camp:expose-tribute': 'The pattern is already on the page. Make Grubbin admit what it means before he closes the book.',
  'camp:protect-tribute': 'Grubbin has been correcting this ledger for years. Change the page in a way he can plausibly blame on himself.',
  'camp:force-ledger': 'The ledger is pegged to the table by one iron binding.',
  'latch:read-face': 'One expression on each face has been handled far more than the others.',
  'latch:force': 'The oak around the mechanism is thick enough to survive the attempt. The latch itself is the part that has to lose.',
  'latch:channel': 'Mana runs through the wear marks instead of the carved expressions.',
  'boss:outlast': 'You are keeping the fight between you and the King. The court has not joined him.',
  'boss:overpower': 'The Root-Crowned Club is between you and the case. The rest of the court is still treating this as the King\'s problem.',
  'boss:spell': 'The theory only has to beat the King, not impress the court.',
  'court:break-line': 'The whole court is moving now. Break one route through before they close it.',
  'court:hold-room': 'The whole court is moving now. Hold your ground until their first rush breaks apart.',
})

export const CHAPTER_ONE_ACTION_OUTCOMES = Object.freeze({
  'windcut:rivet': Object.freeze({ success: 'The rivet matches the latch on the Brass-Latched Research Case. Two sets of narrow goblin heel marks overlap beside it, both headed uphill.' }),
  'windcut:groove': Object.freeze({ success: 'The groove begins deep enough for the case to have been dragged. Twenty paces uphill it becomes a line of short carry-scuffs instead. Whoever stole it got help.' }),
  'windcut:twine': Object.freeze({ success: 'The twine is waxed against rain and smells of pine pitch. One end has been cut through a red knot instead of untied.' }),
  'windcut:listen': Object.freeze({ success: 'The bottle caps answer the wind in uneven bursts. Between them, one goblin coughs from the far side of the bridge.' }),
  'route:quiet': Object.freeze({ success: 'The cut line drops against the railing. Rattlebridge creaks under your weight, but the bottle caps stay quiet.', failure: 'One bottle cap snaps against another. The sound skips across the cleft before you reach the far post.', naturalOne: 'The line jerks free and takes your glove over the edge with it. Two bottle caps ring in perfect time.' }),
  'route:loud': Object.freeze({ success: 'Your boot clears the last line before it pulls tight. The alarm caps rattle behind you instead of around you.', failure: 'The bridge bucks under the second step. The alarm line catches your shin and rings uphill.', naturalOne: 'The bridge pitches at exactly the wrong moment. The alarm line catches both ankles before deciding one was enough.' }),
  'rattlebridge:inspect-reset': Object.freeze({ success: 'Every alarm line feeds into the red cord under the bridge. The individual bottle caps are noise makers; the red knot controls the whole span.' }),
  'rattlebridge:talk': Object.freeze({ success: 'The Sneak cups both hands around its mouth. "Crossing fee." It points to a painted hand on the far post, then scratches its knee under the red ribbon.' }),
  'rattlebridge:look-below': Object.freeze({ success: 'The red reset cord runs through two iron eyes beneath the center planks. One eye is polished from being pulled much more often than the alarm lines themselves.' }),
  'sneak:fee-paid': Object.freeze({ success: 'The Sneak looks at the alarm crank, then at your face. It steps aside and pretends this was a document check.', failure: 'The Sneak rejects your accounting. Its heel lands on the alarm crank.' }),
  'sneak:move': Object.freeze({ success: 'The Sneak lands in the nettles beside the winch. The path to Cloudberry Shelf stays open.', failure: 'The Sneak keeps the useful side of the landing. Its elbow finds the alarm crank on the way past.' }),
  'sneak:title': Object.freeze({ success: 'The Sneak repeats the title under its breath and immediately becomes too busy adjusting the ribbon to stop you. "The King took the brass case straight to tribute inventory," it says.', failure: 'The Sneak likes the title. It also still wants the crossing fee.' }),
  'sneak:ask-case': Object.freeze({ success: '"Two Sneaks and Nib." The Sneak scratches at the crown on its ribbon. "King said tribute inventory. Nib said that sounded bad."' }),
  'sneak:mana': Object.freeze({ success: 'The Sneak becomes occupied with a theory about whether an unpaid fee can be promoted. The path is clear.', failure: 'The Sneak rejects the theory on procedural grounds and keeps the useful side of the path.' }),
  'cloudberry:help-nib': Object.freeze({ success: 'Nib crawls free, coils the snapped wire neatly, and hides it under his coat. "I was testing it."' }),
  'cloudberry:bait-nib': Object.freeze({ success: 'Nib runs downhill shouting about an unauthorized bridge inspection. Two Highland Sneaks go after him in the wrong direction. "I am counting this as field leadership," he calls back.' }),
  'cloudberry:take-charm': Object.freeze({ success: 'The charm comes free. The bell stays still.', failure: 'The bell rings once. Something downhill answers with a whistle.' }),
  'press:climb': Object.freeze({ success: 'The tribute tag comes loose from the nest. Its black-root seal is faded enough that it predates every fresh crown mark in Highland Camp.', failure: 'The Kite keeps the tag. The press frame gives you a loud opinion about climbing it.' }),
  'press:wait': Object.freeze({ success: 'The wind lifts the Kite off the nest long enough to expose the old tribute tag. Its black-root seal has no crown beside it.', failure: 'The Kite settles lower over the tag and starts watching you instead of the wind.' }),
  'press:distract': Object.freeze({ success: 'The Kite goes after the glint. The old tag underneath carries the black-root seal, but no crown.', failure: 'The Kite takes the glint, returns to the nest, and now owns both things.' }),
  'press:inspect-mark': Object.freeze({ success: 'Weather has softened the carving, but not erased it. The mark was cut into the press before the current goblin palisade existed.' }),
  'skybell:runes': Object.freeze({ success: 'The rune says a trusted face opens the King\'s door. A later goblin scratched a worried face beside the line.', failure: 'The clapper hits bronze before the last mark makes sense. The final rune disappears under the sound.' }),
  'skybell:brace': Object.freeze({ success: 'The chain pulls tight without striking the bell. The stone anchor underneath carries an older black-root mark than anything in camp.', failure: 'The clapper slips your hold and the bell rolls one enormous note across the shelf.' }),
  'skybell:inspect-mark': Object.freeze({ success: 'The carving is old enough that moss has grown inside the deepest cut. The King\'s newer crown marks have been scratched over it.' }),
  'skybell:ring': Object.freeze({ success: 'The note rolls across the Highlands. Far below, someone shouts, "That is not the lunch bell."' }),
  'camp:ask-grubbin': Object.freeze({ success: 'Grubbin keeps his palm on the ledger. "Because His Majesty has discovered the ancient royal tradition of giving away everything I inventory properly." He lifts one corner of the page. The Brass-Latched Research Case is drawn beside a black-root seal.' }),
  'camp:ask-tatter': Object.freeze({ success: 'Old Tatter turns the crate around before answering. "Saw that mark before this King had a crown. Crates with it went to Hollow Market."' }),
  'camp:watch-crates': Object.freeze({ success: 'Highland Sneaks load only crates with black-root seals. Crates carrying the King\'s crown mark stay inside the camp.' }),
  'camp:expose-tribute': Object.freeze({ success: 'Grubbin looks at the case drawing, then at the outgoing seal. "Fine. Tribute."', failure: 'Grubbin closes the book. The black-root seal remains visible on the cover.' }),
  'camp:protect-tribute': Object.freeze({ success: 'The new arrow fits among Grubbin\'s old corrections. He notices it, pauses, and closes the ledger over your hand for half a second. "Terrible bookkeeping."', failure: 'Your correction is cleaner than anything Grubbin has ever drawn. He stares at it professionally.' }),
  'camp:force-ledger': Object.freeze({ success: 'The binding tears free from its peg. Grubbin says a word that does not appear anywhere in the ledger. The evidence comes with you.', failure: 'The peg holds. Grubbin gets both hands on the book.' }),
  'camp:ask-collector': Object.freeze({ success: 'Grubbin points at the black-root seal. "Nobody from here. King gets frightened, carts go out, carts come back empty."' }),
  'latch:read-face': Object.freeze({ success: 'The worried expression is polished smooth on every face. The deeper cuts around the other expressions still hold dust. The latch clicks open.', failure: 'The faces settle into the wrong arrangement. A small wooden tongue sticks out from the center of the latch.' }),
  'latch:set-worried': Object.freeze({ success: 'The four worried faces line up. The latch clicks.' }),
  'latch:force': Object.freeze({ success: 'The latch gives way. All four carved faces look personally offended.', failure: 'The latch holds. One carved face bites your glove.' }),
  'latch:channel': Object.freeze({ success: 'Mana traces the polished worried faces in order. The latch clicks open.', failure: 'The faces turn together, stop one notch early, and refuse to explain why.' }),
  'latch:use-charm': Object.freeze({ success: 'The charm slides into the narrow slot. All four faces turn worried at once. The latch opens.' }),
  'boss:outlast': Object.freeze({ success: 'The King\'s grip loosens on the Root-Crowned Club. He pushes the Brass-Latched Research Case across the stone table.', failure: 'The King keeps one hand on the case. The court stays seated, but it is watching now.' }),
  'boss:overpower': Object.freeze({ success: 'The Root-Crowned Club hits the flagstones. The Brass-Latched Research Case is yours again.', failure: 'The club catches your approach and drives you back from the table. The case stays behind the King.' }),
  'boss:spell': Object.freeze({ success: 'The King concedes before the final part of the theory is explained. The case slides across the table.', failure: 'The King finds one missing label in the theory and remains in control of the room.' }),
  'boss:evidence': Object.freeze({ success: 'The King\'s hand leaves the case. "Then this is a negotiated correction."' }),
  'boss:ask-why': Object.freeze({ success: 'The King\'s thumb presses against one root on the club. "It was requisitioned." Behind him, a tribute crate has an empty case-sized space in the straw.' }),
  'boss:matching-crown': Object.freeze({ success: 'The King touches the crown. "It does match. But it is not for me. That cart has to leave before moonrise."' }),
  'court:break-line': Object.freeze({ success: 'The court breaks before the King does. The Brass-Latched Research Case is left alone on the stone table.', failure: 'The court closes every clean path to the case. The side door behind the tribute crates is still open.' }),
  'court:hold-room': Object.freeze({ success: 'The first rush folds into the benches. The King backs away from the table, leaving the Brass-Latched Research Case in reach.', failure: 'The court closes every clean path to the case. The side door behind the tribute crates is still open.' }),
})

export const CHAPTER_ONE_OPTIONAL_SCENES = Object.freeze({
  giantCloudberryPress: Object.freeze({
    id: 'cloudberry-press',
    name: "The Giant's Cloudberry Press",
    aspects: Object.freeze(['A stone screw rises higher than the Highland Camp palisade.', 'The pressing trough is wide enough for a loaded cart.', 'Cliff Kites have built a nest from old tribute tags in the upper frame.']),
    text: Object.freeze([
      'The press screw rises above the shelf like a stone mast. Fermented cloudberry skins sting the nose from a trough wide enough for a cart.',
      'An old tribute tag is woven into a Cliff Kite nest. A faded black-root mark is carved into the press base below it.',
      'A Cliff Kite drops onto the tribute tag and spreads its wings over it.',
    ]),
    actions: Object.freeze(['press:climb', 'press:wait', 'press:distract', 'press:inspect-mark', 'press:return']),
    secrets: Object.freeze([2]),
  }),
  oldSkyBell: Object.freeze({
    id: 'old-sky-bell',
    name: 'The Old Sky-Bell',
    aspects: Object.freeze(['The bronze bell is older than the present Highland Camp.', 'Its cracked lower rim is tall enough to walk beneath.', 'The clapper chain is anchored through a stone carrying the black-root mark.']),
    text: Object.freeze([
      "The bell's cracked rim stands higher than Nib. Cold bronze smells like rain under the sun.",
      'Old trail-runes circle the foundation. The clapper chain passes through a stone carved with the black-root seal.',
      'The wind turns, and the clapper begins to swing.',
    ]),
    actions: Object.freeze(['skybell:runes', 'skybell:brace', 'skybell:inspect-mark', 'skybell:ring', 'skybell:return']),
    secrets: Object.freeze([2, 5]),
  }),
})

export const CHAPTER_ONE_ENDINGS = Object.freeze({
  recoverySpared: Object.freeze({
    id: 'recovery-spared',
    ending: 'recovery',
    lines: Object.freeze(['The brass latch closes under your thumb. Behind you, the King lowers the Root-Crowned Club without another argument.', 'You carry the Brass-Latched Research Case down Windcut Trail.']),
  }),
  recoveryHumiliated: Object.freeze({
    id: 'recovery-humiliated',
    ending: 'recovery',
    lines: Object.freeze(['The Root-Crowned Club stays on the floor. The Brass-Latched Research Case is back in your hands with the latch still working.', 'Nobody in the court volunteers to stop you on the way out.']),
  }),
  bargain: Object.freeze({
    id: 'bargain',
    ending: 'bargain',
    stolenItemStatus: CHAPTER_ONE_STOLEN_ITEM_STATUSES.bargainedBack,
    lines: Object.freeze(['The King removes his hand from the Brass-Latched Research Case. The tribute evidence stays on the table between you.', 'You leave the Highlands with the case and the bargain intact.']),
  }),
  cleanFailure: Object.freeze({
    id: 'clean-failure',
    ending: 'escape',
    stolenItemStatus: CHAPTER_ONE_STOLEN_ITEM_STATUSES.stillMissing,
    lines: Object.freeze(["The west service path puts you back on Windcut Trail before the court can close behind you. The Brass-Latched Research Case remains in the King's Stash Hall.", 'You did not recover it. The run is over.']),
  }),
})

export const CHAPTER_ONE_PUZZLES = Object.freeze({
  rattlebridgeAlarmLines: Object.freeze({ id: 'rattlebridge-alarm-lines', name: 'Rattlebridge alarm lines', roomId: 'rattlebridge' }),
  pictureTributeLedger: Object.freeze({ id: 'picture-tribute-ledger', name: 'picture tribute ledger', roomId: 'highland-camp' }),
  carvedFaceStashLatch: Object.freeze({ id: 'carved-face-stash-latch', name: 'carved-face stash latch', roomId: 'kings-stash-hall' }),
})

export const CHAPTER_ONE_REWARDS = Object.freeze({
  blackRootSeal: 'black-root seal',
  goblinFavor: 'goblin favor',
  highlandCharm: 'highland charm',
})

export const CHAPTER_ONE_REWARD_DETAILS = Object.freeze({
  highlandCharm: Object.freeze({
    relationship: 'additive',
    canonFunction: 'Cancels one alarm or ambush.',
    chapterOneFunction: 'Also acts as a no-roll key for the carved-face Stash Hall latch.',
  }),
})

export const CHAPTER_ONE_BRANCH_VALUES = Object.freeze({
  nibTreatment: Object.freeze(['safe', 'bait', 'ignored']),
  tributeArrangement: Object.freeze(['exposed', 'protected', 'unknown']),
  kingTreatment: Object.freeze(['spared', 'humiliated', 'unresolved']),
  stolenItemCondition: Object.freeze(['intact', 'altered', 'not-recovered']),
  stolenItemStatus: Object.freeze(Object.values(CHAPTER_ONE_STOLEN_ITEM_STATUSES)),
})
