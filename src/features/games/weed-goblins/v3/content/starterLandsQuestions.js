export const STARTER_QUESTIONS = Object.freeze([
  { id: 'q:upbringing', tags: ['universal', 'grounding'], prompt: 'When somebody asks where home is, what place comes to mind first?', factKey: 'upbringing_type', answers: [
    ['city', 'A crowded city or market district.'], ['village', 'A small village where everyone knew everyone.'], ['road', 'On the road, moving often.'], ['ancestry-community', 'A community mostly made up of my ancestry.'], ['mixed-community', 'A mixed community where ancestry mattered less.'], ['closed', 'Somewhere I do not want to talk about yet.'],
  ]},
  { id: 'q:goblins', tags: ['universal', 'attitude'], prompt: 'Before you meet the Highlands on its own terms, what did the word goblin mean to you?', factKey: 'goblin_preconception', answers: [
    ['dangerous', 'Dangerous thieves.'], ['neighbors', 'Traders and neighbors like anyone else.'], ['funny', 'Funny until they have your property.'], ['neutral', 'I barely thought about goblins at all.'], ['distrust', 'My family taught me not to trust them.'], ['personal', 'I have known goblins personally.'],
  ]},
  { id: 'q:pride', tags: ['universal', 'personality'], prompt: 'Not the grand heroic answer. What is something your character is quietly pleased they can do?', factKey: 'pride_fact', answers: [
    ['word', 'I keep my word.'], ['fix', 'I can fix things.'], ['laugh', 'I can make people laugh.'], ['calm', 'I stay calm when other people panic.'], ['leave', 'I know when to leave.'], ['survived', 'I survived something people assumed would break me.'],
  ]},
  { id: 'q:secret', tags: ['universal', 'later-sensitive'], prompt: 'Everyone arriving at Mossgate is carrying something they did not put in their pack. What subject makes your character change the conversation?', factKey: 'secret_domain', answers: [
    ['family', 'Family.'], ['debt', 'Debt.'], ['failure', 'A failure.'], ['person', 'A person I left behind.'], ['stolen', 'Something I stole.'], ['not-yet', 'I am not telling Eliza that yet.'],
  ]},
  { id: 'q:trouble', tags: ['universal', 'personality'], prompt: 'What kind of trouble gets your attention?', factKey: 'trouble_instinct', answers: [
    ['bully', 'Somebody weaker being pushed around.'], ['door', 'A locked door everyone says to ignore.'], ['mystery', 'A mystery that does not add up.'], ['money', 'Somebody offering money.'], ['challenge', 'Somebody saying “you cannot.”'], ['bad-idea', 'The exact kind I should probably avoid.'],
  ]},
  { id: 'q:promise', tags: ['universal', 'grounding'], prompt: 'What promise did you make before leaving?', factKey: 'departure_promise', answers: [
    ['alive', 'Come back alive.'], ['bring-home', 'Bring something home.'], ['find', 'Find somebody.'], ['clean', 'Keep my hands clean.'], ['different', 'Do not become like someone I know.'], ['none', 'I promised nothing. That was deliberate.'],
  ]},
  { id: 'q:keepsake', tags: ['universal', 'personality'], prompt: 'What do you always carry that is not useful in a fight?', factKey: 'keepsake_type', answers: [
    ['coin', 'A bent coin.'], ['drawing', 'A terrible drawing somebody made of me.'], ['spoon', 'A spoon I refuse to explain.'], ['letter', 'An old letter.'], ['animal', 'A tiny carved animal.'], ['button', 'A button from clothing I no longer own.'],
  ]},
  { id: 'q:argument', tags: ['universal', 'attitude'], prompt: 'How do you handle an argument?', factKey: 'conflict_style', answers: [
    ['calm', 'Talk until everyone calms down.'], ['joke', 'Make a joke and change the temperature.'], ['direct', 'Say exactly what I mean.'], ['listen', 'Listen until I find the weak point.'], ['leave', 'Leave if nobody is listening.'], ['more', 'Become unfortunately more interested.'],
  ]},
  { id: 'q:dwarf-expectation', ancestryId: 'dwarf', tags: ['ancestry', 'grounding'], prompt: 'What did your family expect you to build or preserve?', factKey: 'dwarf_inherited_expectation', answers: [
    ['trade', 'A craft or family trade.'], ['reputation', 'The family reputation.'], ['home', 'A home or piece of land.'], ['promise', 'A promise made before I was born.'], ['nothing', 'Nothing. My family was not traditional.'], ['left', 'I left before anyone could decide for me.'],
  ]},
  { id: 'q:elf-history', ancestryId: 'elf', tags: ['ancestry', 'attitude'], prompt: 'Which version of the past do you trust first?', factKey: 'elf_history_instinct', answers: [
    ['records', 'Written records.'], ['witnesses', 'People who were there.'], ['places', 'Places themselves.'], ['family', 'Family stories.'], ['compare', 'None without comparing contradictions.'], ['present', 'The past is useful, but I refuse to live in it.'],
  ]},
  { id: 'q:gnome-curiosity', ancestryId: 'gnome', tags: ['ancestry', 'attitude'], prompt: 'What question do you have trouble leaving alone?', factKey: 'gnome_curiosity_domain', answers: [
    ['how', 'How things work.'], ['lies', 'Why people lie.'], ['magic', 'What magic is doing when nobody is looking.'], ['roads', 'Where roads actually lead.'], ['benefits', 'Who benefits from the official explanation.'], ['weird', 'Why nobody else seems bothered by the obvious weird thing.'],
  ]},
  { id: 'q:human-belonging', ancestryId: 'human', tags: ['ancestry', 'grounding'], prompt: 'Where do you feel like you belong?', factKey: 'human_belonging', answers: [
    ['people', 'Anywhere I know somebody.'], ['crowd', 'Crowded places.'], ['quiet', 'Quiet places.'], ['road', 'On the road.'], ['useful', 'Wherever I can be useful.'], ['not-yet', 'I have not found it yet.'],
  ]},
  { id: 'q:authority', tags: ['universal', 'later-pool'], prompt: 'What is your relationship with authority?', factKey: 'authority_attitude', answers: [
    ['rules', 'Rules usually exist for a reason.'], ['suggestions', 'Rules are suggestions with uniforms.'], ['competence', 'I respect competence, not titles.'], ['abuse', 'I behave until somebody abuses power.'], ['unnoticed', 'I have learned not to be noticed.'], ['history', 'Authority and I have met before.'],
  ]},
  { id: 'q:word', tags: ['universal', 'later-pool'], prompt: 'What would make you break your word?', factKey: 'promise_break_boundary', answers: [
    ['protect', 'Protecting someone.'], ['wrong-person', 'Discovering I promised the wrong person.'], ['nothing', 'Nothing.'], ['survival', 'Survival.'], ['greater', 'A greater obligation.'], ['unknown', 'I do not know yet.'],
  ]},
  { id: 'q:humor', tags: ['universal', 'personality'], prompt: 'What makes you laugh when you should not?', factKey: 'humor_instinct', answers: [
    ['timing', 'Bad timing.'], ['serious', 'People being overly serious.'], ['physical', 'Physical absurdity.'], ['insults', 'Extremely specific insults.'], ['wrong', 'Somebody confidently being wrong.'], ['me', 'I am usually the reason other people laugh at the wrong time.'],
  ]},
  { id: 'q:not-doing', tags: ['universal', 'foreshadowing'], prompt: 'What is one thing you are absolutely not doing on this trip?', factKey: 'famous_last_words_boundary', answers: [
    ['arrested', 'Getting arrested.'], ['cult', 'Joining a cult.'], ['dragon', 'Fighting a dragon.'], ['adopt', 'Adopting anything.'], ['goblin-debt', 'Owing a goblin money.'], ['terrible-plan', "Falling in love with anybody's terrible plan."],
  ]},
].map((question) => Object.freeze({ ...question, tags: Object.freeze(question.tags), answers: Object.freeze(question.answers.map(Object.freeze)) })))

export function questionById(id) {
  return STARTER_QUESTIONS.find((item) => item.id === id) || null
}
