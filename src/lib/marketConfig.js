export const MARKET_CONFIG_VERSION = 1
export const AGE_ASSURANCE_VERSION = 1

export const COUNTRY_OPTIONS = [
  { code: 'US', label: 'United States', requiresRegion: true },
  { code: 'NL', label: 'Netherlands', requiresRegion: false },
  { code: 'DE', label: 'Germany', requiresRegion: false },
  { code: 'GB', label: 'United Kingdom', requiresRegion: false },
  { code: 'OTHER', label: 'Other', requiresRegion: false },
]

export const US_REGION_OPTIONS = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'],
  ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
  ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
  ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'],
  ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
  ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
  ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'],
  ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
  ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
].map(([code, label]) => ({ code, label }))

const REVIEWED_US_MARKETS = {
  PA: {
    id: 'US-PA',
    country: 'US',
    region: 'PA',
    label: 'Pennsylvania',
    marketType: 'medical_adult_patient',
    accessStatus: 'private_test',
    ageThreshold: 18,
    ageAssuranceMode: 'confirmation',
    ageHeadline: 'Confirm that you are an adult.',
    ageBody: 'This private-test configuration is for adults participating in Pennsylvania’s Medical Marijuana Program. My420Journal does not verify program enrollment.',
    ageConfirmLabel: 'I confirm I am 18 or older',
  },
  NY: {
    id: 'US-NY',
    country: 'US',
    region: 'NY',
    label: 'New York',
    marketType: 'adult_use',
    accessStatus: 'private_test',
    ageThreshold: 21,
    ageAssuranceMode: 'confirmation',
    ageHeadline: 'Confirm that you are 21 or older.',
    ageBody: 'New York adult-use cannabis is for adults 21 and older. This confirmation is an age gate, not government-ID verification.',
    ageConfirmLabel: 'I confirm I am 21 or older',
  },
  NJ: {
    id: 'US-NJ',
    country: 'US',
    region: 'NJ',
    label: 'New Jersey',
    marketType: 'adult_use',
    accessStatus: 'private_test',
    ageThreshold: 21,
    ageAssuranceMode: 'confirmation',
    ageHeadline: 'Confirm that you are 21 or older.',
    ageBody: 'New Jersey adult-use cannabis is for adults 21 and older. This confirmation is an age gate, not government-ID verification.',
    ageConfirmLabel: 'I confirm I am 21 or older',
  },
  MA: {
    id: 'US-MA',
    country: 'US',
    region: 'MA',
    label: 'Massachusetts',
    marketType: 'adult_use',
    accessStatus: 'private_test',
    ageThreshold: 21,
    ageAssuranceMode: 'confirmation',
    ageHeadline: 'Confirm that you are 21 or older.',
    ageBody: 'Massachusetts adult-use cannabis is for adults 21 and older. This confirmation is an age gate, not government-ID verification.',
    ageConfirmLabel: 'I confirm I am 21 or older',
  },
  CT: {
    id: 'US-CT',
    country: 'US',
    region: 'CT',
    label: 'Connecticut',
    marketType: 'adult_use',
    accessStatus: 'hold',
    ageThreshold: 21,
    ageAssuranceMode: null,
    holdReason: 'Connecticut is not enabled in this private-test build while the My420Journal market classification is under review.',
  },
}

const RESERVED_COUNTRIES = {
  NL: {
    id: 'NL-RESERVED',
    country: 'NL',
    region: null,
    label: 'Netherlands',
    marketType: 'reserved',
    accessStatus: 'reserved',
    ageThreshold: null,
    ageAssuranceMode: null,
    holdReason: 'The Netherlands configuration is reserved for a later reviewed release.',
  },
  DE: {
    id: 'DE-RESERVED',
    country: 'DE',
    region: null,
    label: 'Germany',
    marketType: 'reserved',
    accessStatus: 'reserved',
    ageThreshold: null,
    ageAssuranceMode: null,
    holdReason: 'The Germany configuration is reserved for a later reviewed release.',
  },
  GB: {
    id: 'GB-RESERVED',
    country: 'GB',
    region: null,
    label: 'United Kingdom',
    marketType: 'reserved',
    accessStatus: 'reserved',
    ageThreshold: null,
    ageAssuranceMode: null,
    holdReason: 'The United Kingdom configuration is reserved for a later reviewed release.',
  },
  OTHER: {
    id: 'OTHER-UNREVIEWED',
    country: 'OTHER',
    region: null,
    label: 'Other',
    marketType: 'unreviewed',
    accessStatus: 'not_reviewed',
    ageThreshold: null,
    ageAssuranceMode: null,
    holdReason: 'This market is not configured for the current private test.',
  },
}

export function getConfiguredMarketConfigById(marketId) {
  if (typeof marketId !== 'string' || !marketId) return null

  for (const config of Object.values(REVIEWED_US_MARKETS)) {
    if (config.id === marketId) return { ...config }
  }

  for (const config of Object.values(RESERVED_COUNTRIES)) {
    if (config.id === marketId) return { ...config }
  }

  return null
}

export function getCountryOption(countryCode) {
  return COUNTRY_OPTIONS.find((item) => item.code === countryCode) || null
}

export function getUsRegionOption(regionCode) {
  return US_REGION_OPTIONS.find((item) => item.code === regionCode) || null
}

export function getMarketConfig(countryCode, regionCode = null) {
  if (countryCode === 'US') {
    if (REVIEWED_US_MARKETS[regionCode]) return { ...REVIEWED_US_MARKETS[regionCode] }

    const region = getUsRegionOption(regionCode)
    return {
      id: regionCode ? `US-${regionCode}` : 'US-UNSELECTED',
      country: 'US',
      region: regionCode || null,
      label: region?.label || 'United States',
      marketType: 'unreviewed',
      accessStatus: 'not_reviewed',
      ageThreshold: null,
      ageAssuranceMode: null,
      holdReason: region
        ? `${region.label} is not configured for the current private test.`
        : 'Choose your state before continuing.',
    }
  }

  if (RESERVED_COUNTRIES[countryCode]) return { ...RESERVED_COUNTRIES[countryCode] }

  return { ...RESERVED_COUNTRIES.OTHER }
}

export function isMarketEnabled(config) {
  return config?.accessStatus === 'private_test'
}
