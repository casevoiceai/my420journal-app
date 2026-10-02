const SOURCES = Object.freeze({
  nccih: 'NCCIH cannabis and cannabinoids overview',
  healthCanadaConsumer: 'Health Canada consumer information: cannabis',
  healthCanadaEffects: 'Health Canada health effects of cannabis',
  plosChemistry: 'PLOS ONE 2022 commercial Cannabis phytochemical diversity',
  entourageReview: 'Simei et al. 2024 entourage-effect scoping review',
  terpeneReview: 'Sommano et al. 2020 The Cannabis Terpenes',
  leaflyBlueDreamHistory: 'Leafly Blue Dream origin history',
  leaflyCultivars: 'Leafly cultivar reference pages, used only for lineage, aliases, reported profile, and history',
})

const RECORDS = Object.freeze({
  cannabis: {
    confidence: 'documented',
    sources: ['nccih'],
    text: 'Cannabis is the broad term for products derived from Cannabis sativa. Marijuana is commonly used for cannabis material containing substantial THC. The plant contains many cannabinoids and terpenes, and products can differ a lot in chemistry.',
  },
  cannabinoids: {
    confidence: 'documented',
    sources: ['nccih'],
    text: 'Cannabinoids are compounds found in cannabis. THC and CBD are the two most studied, while many minor cannabinoids have much less human evidence behind them.',
  },
  thc: {
    confidence: 'documented',
    sources: ['nccih', 'healthCanadaEffects'],
    text: 'THC is the main cannabinoid responsible for cannabis intoxication. Products vary widely in THC concentration, and higher THC exposure can increase impairment and the chance of unpleasant effects.',
  },
  cbd: {
    confidence: 'documented',
    sources: ['nccih'],
    text: 'CBD does not produce the same intoxicating high as THC, but that does not make it harmless. CBD can have side effects and drug interactions, and nonprescription products may not contain exactly what their labels claim.',
  },
  minorCannabinoids: {
    confidence: 'documented-with-limits',
    sources: ['nccih'],
    text: 'Cannabis contains many minor cannabinoids, including compounds commonly labeled CBG, CBN, CBC, THCA, CBDA, and THCV. Compared with THC and CBD, human evidence for many of them is still limited, so I would not assign them guaranteed effects.',
  },
  terpenes: {
    confidence: 'documented-with-limits',
    sources: ['nccih', 'terpeneReview', 'entourageReview'],
    text: 'Terpenes are aromatic compounds found in cannabis and many other plants. They help shape aroma and sensory profile. They are real chemistry, but a terpene name by itself does not reliably predict how a specific cannabis product will make a specific person feel.',
  },
  entourage: {
    confidence: 'uncertain',
    sources: ['entourageReview', 'terpeneReview'],
    text: 'The entourage effect is the idea that cannabis compounds may interact in ways that change the overall effect. It is an active research area, but current reviews do not support treating it as a stable, clinically predictable rule.',
  },
  indicaSativa: {
    confidence: 'documented',
    sources: ['plosChemistry'],
    text: 'Indica, sativa, and hybrid are common commercial and cultural labels, but large chemical analyses show they do not reliably map to cannabinoid and terpene chemistry. They should not be treated as dependable effect predictions.',
  },
  inhalation: {
    confidence: 'documented',
    sources: ['healthCanadaConsumer', 'healthCanadaEffects'],
    text: 'Smoking, vaping, or dabbing cannabis can produce effects within seconds to minutes. The main effects commonly last a few hours, with lingering effects possible beyond that.',
  },
  ingestion: {
    confidence: 'documented',
    sources: ['healthCanadaConsumer', 'healthCanadaEffects'],
    text: 'Edible or drinkable cannabis has a slower onset than inhaled cannabis. Initial effects may take about 30 minutes to 2 hours, full effects can take longer, and the experience can last substantially longer than inhalation.',
  },
  flower: {
    confidence: 'documented',
    sources: ['nccih'],
    text: 'Flower is dried cannabis plant material. Its cannabinoid and terpene composition can vary by cultivar, grow, harvest, storage, and batch.',
  },
  vape: {
    confidence: 'documented-with-limits',
    sources: ['healthCanadaConsumer'],
    text: 'Cannabis vape products heat oils or extracts for inhalation. Formulations vary widely, and a vape sold under a strain name is not guaranteed to match flower sold under the same name.',
  },
  concentrates: {
    confidence: 'documented',
    sources: ['healthCanadaConsumer'],
    text: 'Cannabis concentrates include products such as wax, shatter, resin, rosin, hash, and distillates. Depending on the product, they can contain much higher cannabinoid concentrations than flower.',
  },
  edibles: {
    confidence: 'documented',
    sources: ['healthCanadaConsumer', 'healthCanadaEffects'],
    text: 'Edibles deliver cannabinoids through digestion and metabolism, so onset is slower and duration is longer than inhalation. That delay is one reason accidental overconsumption can happen.',
  },
  tinctures: {
    confidence: 'documented-with-limits',
    sources: ['healthCanadaConsumer'],
    text: 'Cannabis tincture and oral-liquid products vary in formulation and route. Some are swallowed and some are intended to sit in the mouth before swallowing, so the word tincture alone does not tell you exactly how fast a product will act.',
  },
  topicals: {
    confidence: 'documented-with-limits',
    sources: ['healthCanadaConsumer'],
    text: 'Topical cannabis products are applied to the skin. Their formulations and intended uses vary, and they should not be assumed to produce the same systemic effects as inhaled or ingested THC.',
  },
  driving: {
    confidence: 'documented',
    sources: ['nccih', 'healthCanadaEffects'],
    text: 'Cannabis can impair attention, coordination, judgment, and reaction time. Do not drive while impaired. There is no single waiting-time rule that guarantees every person is safe to drive after cannabis use.',
  },
  safety: {
    confidence: 'documented',
    sources: ['nccih', 'healthCanadaEffects'],
    text: 'Cannabis can cause unwanted effects such as anxiety, panic, paranoia, dizziness, confusion, or excessive sedation. Reactions differ between people and can differ for the same person from one occasion to another.',
  },
})
const CULTIVARS = Object.freeze({
  'blue dream': {
    name: 'Blue Dream',
    confidence: 'documented-with-disputed-origin',
    label: 'hybrid',
    sources: ['leaflyBlueDreamHistory', 'plosChemistry'],
    history: 'Blue Dream is strongly associated with California cannabis culture and is widely reported as emerging from the Santa Cruz medical-cannabis scene in the early 2000s. Blueberry crossed with Haze is the best-supported lineage, but no single original breeder is universally documented.',
    profile: 'Commercial references commonly label Blue Dream a hybrid and commonly describe berry or blueberry aroma and flavor. Those descriptions are reported profile information, not a prediction of how a specific batch will affect a specific person.',
    caution: 'A product sold as Blue Dream does not have one guaranteed THC percentage or terpene profile. Grower and batch chemistry can vary, so a tested label and your own journal entry are more specific evidence than the strain name alone.',
  },
  'sour diesel': {
    name: 'Sour Diesel', confidence: 'reported-lineage', label: 'hybrid', sources: ['leaflyCultivars', 'plosChemistry'],
    history: 'Leafly currently lists Sour Diesel, also called Sour D, as a hybrid associated with Chemdawg and Super Skunk lineage.',
    profile: 'Commercial references commonly describe diesel, chemical, and skunk aroma language.',
    caution: 'The name does not guarantee one chemical profile or one effect. Producer and batch chemistry can vary.',
  },
  'northern lights': {
    name: 'Northern Lights', confidence: 'reported-with-folklore', label: 'indica', sources: ['leaflyCultivars', 'plosChemistry'],
    history: 'Northern Lights is commonly listed as Afghani and Thai lineage. Its early origin story is less certain; a Seattle origin followed by propagation in the Netherlands is commonly repeated as cannabis history.',
    profile: 'Commercial references commonly describe pine, earthy, and woody aroma language.',
    caution: 'Its famous name is not a guarantee of a specific batch chemistry or effect.',
  },
  'gelato': {
    name: 'Gelato', confidence: 'reported-lineage', label: 'hybrid', sources: ['leaflyCultivars', 'plosChemistry'],
    history: 'Leafly commonly lists Gelato as a hybrid from Sunset Sherbet and Thin Mint GSC lineage.',
    profile: 'Commercial references commonly describe sweet, floral, and peppery aroma or flavor language.',
    caution: 'Different Gelato-labeled products and phenotypes can vary. The name alone is not a chemical specification.',
  },
  'gsc': {
    name: 'GSC', confidence: 'reported-lineage', label: 'hybrid', sources: ['leaflyCultivars', 'plosChemistry'],
    history: 'GSC, also called Girl Scout Cookies or Cookies, is widely associated with OG Kush and Durban-derived lineage; exact descriptions vary by source and breeding account.',
    profile: 'Commercial references commonly describe mint, sweet, earthy, grape, fuel, or cookie-like aroma language.',
    caution: 'Products sold as GSC can differ by producer and batch, so the name does not guarantee chemistry or effect.',
  },
  'girl scout cookies': {
    name: 'GSC', confidence: 'reported-lineage', label: 'hybrid', sources: ['leaflyCultivars', 'plosChemistry'],
    history: 'GSC, also called Girl Scout Cookies or Cookies, is widely associated with OG Kush and Durban-derived lineage; exact descriptions vary by source and breeding account.',
    profile: 'Commercial references commonly describe mint, sweet, earthy, grape, fuel, or cookie-like aroma language.',
    caution: 'Products sold as GSC can differ by producer and batch, so the name does not guarantee chemistry or effect.',
  },
  'pineapple express': {
    name: 'Pineapple Express', confidence: 'reported-lineage', label: 'hybrid', sources: ['leaflyCultivars', 'plosChemistry'],
    history: 'Leafly commonly lists Pineapple Express as a hybrid from Trainwreck and Hawaiian lineage.',
    profile: 'Commercial references commonly describe pineapple, tropical, citrus, and pine aroma or flavor language.',
    caution: 'The strain name does not guarantee a single terpene profile, THC level, or effect across producers.',
  },
  'jack herer': {
    name: 'Jack Herer', confidence: 'reported-lineage', label: 'sativa-dominant', sources: ['leaflyCultivars', 'plosChemistry'],
    history: 'Jack Herer is associated with Sensi Seeds and is commonly described as combining Haze-related genetics with Northern Lights #5 and Shiva Skunk lineage.',
    profile: 'Commercial references commonly describe pine, woody, earthy, or spicy aroma language.',
    caution: 'Different Jack Herer phenotypes and producers can vary, so the name is not a fixed chemical profile.',
  },
  'og kush': {
    name: 'OG Kush', confidence: 'disputed-lineage', label: 'hybrid', sources: ['leaflyCultivars', 'plosChemistry'],
    history: 'OG Kush is an influential cultivar with a murky origin story. Commercial references connect it to early-1990s Florida and California cannabis, but lineage accounts vary and should be treated as disputed rather than settled.',
    profile: 'Commercial references commonly describe woody, pine, earthy, fuel, lemon, or spice aroma language.',
    caution: 'OG Kush is a strong example of a famous name that does not guarantee one exact chemistry or origin story.',
  },
})

const GUIDE_PREFIX = Object.freeze({
  bud: 'Short version: ',
  sunny: 'Here is the useful part: ',
  larry: '',
  herb: 'Chemistry version: ',
  mary: 'The important part: ',
  stoner: '',
})

function normalize(value = '') {
  return String(value).toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim()
}
function cultivarMatch(text) {
  const t = normalize(text)
  return Object.entries(CULTIVARS).find(([key]) => t.includes(key))?.[1] || null
}

function recordForText(text) {
  const t = normalize(text)
  if (!t) return null
  if (/\bwhat is cannabis\b|\bwhat is marijuana\b|\bcannabis vs marijuana\b/.test(t)) return RECORDS.cannabis
  if (/\bwhat (?:are|is) cannabinoids?\b/.test(t)) return RECORDS.cannabinoids
  if (/\bwhat is thc\b|\bwhat does thc do\b/.test(t)) return RECORDS.thc
  if (/\bwhat is cbd\b|\bwhat does cbd do\b|\bis cbd intoxicating\b/.test(t)) return RECORDS.cbd
  if (/\b(cbg|cbn|cbc|thca|cbda|thcv)\b/.test(t)) return RECORDS.minorCannabinoids
  if (/\bwhat (?:are|is) terpenes?\b|\bwhat does (myrcene|limonene|linalool|caryophyllene|pinene|terpinolene|humulene|ocimene) do\b/.test(t)) return RECORDS.terpenes
  if (/\bentourage effect\b/.test(t)) return RECORDS.entourage
  if (/\b(indica|sativa|hybrid)\b/.test(t) && /(difference|mean|better|effect|sedat|energ|what is|what's)/.test(t)) return RECORDS.indicaSativa
  if (/\b(smok|smoking|vape|vaping|dab|dabbing|inhal)/.test(t) && /(how long|kick in|start|onset|last|effect)/.test(t)) return RECORDS.inhalation
  if (/\b(edible|edibles|eat|eating|drink|drinking|ingest)/.test(t) && /(how long|kick in|start|onset|last|effect)/.test(t)) return RECORDS.ingestion
  return null
}
function formRecord(text) {
  const t = normalize(text)
  if (/\bwhat is (?:cannabis )?flower\b|\bwhat is bud\b/.test(t)) return RECORDS.flower
  if (/\bwhat is (?:a )?(?:cannabis )?vape\b|\bvape product\b/.test(t)) return RECORDS.vape
  if (/\bwhat (?:is|are) (?:a )?(?:cannabis )?(concentrate|concentrates|extract|extracts|wax|shatter|rosin|resin|hash|distillate)\b/.test(t)) return RECORDS.concentrates
  if (/\bwhat (?:is|are) (?:an )?edible\b|\bwhat are edibles\b/.test(t)) return RECORDS.edibles
  if (/\bwhat is (?:a )?(?:cannabis )?tincture\b/.test(t)) return RECORDS.tinctures
  if (/\bwhat (?:is|are) (?:a )?(?:cannabis )?topical\b|\btopical cannabis\b/.test(t)) return RECORDS.topicals
  if (/\bcan i drive\b|\bdrive after cannabis\b|\bdrive after weed\b|\bhow long.*drive\b/.test(t)) return RECORDS.driving
  if (/\bside effects\b|\badverse effects\b|\bcan cannabis make.*anxious\b|\bcan weed make.*anxious\b/.test(t)) return RECORDS.safety
  return null
}

function cultivarAnswer(profile, guide, text = '') {
  const prefix = GUIDE_PREFIX[guide] ?? ''
  const t = normalize(text)
  let core = `${profile.history} ${profile.profile} ${profile.caution}`
  if (/\b(lineage|parent|parents|origin|history|bred|breeder)\b/.test(t)) core = `${profile.history} ${profile.caution}`
  else if (/\b(smell|aroma|flavor|flavour|taste)\b/.test(t)) core = `${profile.profile} ${profile.caution}`
  else if (/\b(kind|type|indica|sativa|hybrid)\b/.test(t) && profile.label) core = `${profile.name} is commonly labeled ${profile.label}. That is a commercial or cultural label, not a reliable effect prediction. ${profile.caution}`
  if (guide === 'bud') return `${prefix}${core} Treat the name like a folder label, not the whole file.`
  if (guide === 'sunny') return `${prefix}${core}`
  if (guide === 'herb') return `Chemistry version: ${core}`
  if (guide === 'mary') return `${prefix}${core}`
  if (guide === 'larry') return core
  return core
}
export function lookupCannabisKnowledge(text) {
  const cultivar = cultivarMatch(text)
  if (cultivar) return { kind: 'cultivar', confidence: cultivar.confidence, sources: cultivar.sources, cultivar }
  const record = recordForText(text) || formRecord(text)
  if (!record) return null
  return { kind: 'topic', confidence: record.confidence, sources: record.sources, record }
}

export function answerCannabisKnowledge({ text = '', guide = 'bud', topic = '' } = {}) {
  let hit = lookupCannabisKnowledge(text)
  if (!hit && topic && /\b(it|its|that|this|strain|cultivar|lineage|history|kind|type)\b/i.test(text)) {
    const cultivar = cultivarMatch(topic)
    if (cultivar) hit = { kind: 'cultivar', confidence: cultivar.confidence, sources: cultivar.sources, cultivar }
  }
  if (!hit) return null
  if (hit.kind === 'cultivar') return cultivarAnswer(hit.cultivar, guide, text)
  const prefix = GUIDE_PREFIX[guide] ?? ''
  return `${prefix}${hit.record.text}`
}

export const cannabisKnowledgeInternals = {
  SOURCES,
  RECORDS,
  CULTIVARS,
  cultivarMatch,
  recordForText,
  formRecord,
}
