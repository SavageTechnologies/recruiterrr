// ─── config.ts ────────────────────────────────────────────────────────────────
// Mode configuration for each search type.
// THIS IS THE FILE TO EDIT when tuning keywords, captive brands, or queries.
// One section per mode — medicare, life, annuities, financial.

import type { ModeConfig } from './types'

export const MODE_CONFIG: Record<string, ModeConfig> = {
  medicare: {
    analyst: 'Medicare/senior insurance FMO recruiter',
    queries: [
      'Medicare insurance agent',
      'Medicare supplement broker',
      'Medicare advantage agent',
      'senior health insurance agent',
      'health insurance broker',
      'independent insurance agent',
      'Medicare broker',
    ],
    captiveBrands: [
      // P&C / multi-line captives
      'State Farm', 'Farmers', 'Allstate', 'GEICO', 'American Family',
      'Shelter Insurance', 'Shelter Mutual', 'Auto-Owners', 'Erie Insurance',
      'Country Financial', 'Farm Bureau', 'USAA',
      // Life/health captives
      'Bankers Life', 'HealthMarkets', 'New York Life', 'Northwestern Mutual', 'Northwestern',
      'Mass Mutual', 'MassMutual', 'Guardian Life', 'Pacific Life',
      'Mutual of Omaha', 'Transamerica', 'Globe Life', 'Liberty National',
      'Aflac', 'Colonial Life', 'Combined Insurance', 'Primerica',
      // Supplemental/worksite
      'Unum', 'MetLife', 'Principal Financial',
    ],
    independenceKeywords: ['independent', 'broker', 'agency', 'multi-carrier', 'multi carrier'],
    specialtyKeywords: ['medicare', 'supplement', 'advantage', 'medigap', 'pdp', 'senior', 'health'],
    // P&C-focused agencies are not Medicare recruits — penalize at preScore level
    // so Sonnet doesn't have to sort them out after a full crawl.
    negativeKeywords: [
      'auto insurance', 'car insurance', 'home insurance', 'homeowners insurance',
      'property insurance', 'property & casualty', 'property and casualty',
      'commercial insurance', 'business insurance', 'workers comp', 'workers compensation',
      'renters insurance', 'umbrella insurance', 'boat insurance', 'rv insurance',
      'real estate e&o', 'cyber security insurance',
    ],
    typeFallback: 'Insurance Agency',
  },

  life: {
    analyst: 'life and final expense insurance FMO recruiter',
    queries: [
      'life insurance agent',
      'final expense insurance agent',
      'term life insurance broker',
      'burial insurance agent',
      'independent life insurance broker',
      'life insurance agency',
      'whole life insurance agent',
    ],
    captiveBrands: [
      'New York Life', 'Northwestern Mutual', 'Northwestern', 'Mass Mutual', 'MassMutual',
      'Bankers Life', 'HealthMarkets', 'Globe Life', 'Liberty National', 'Aflac', 'Colonial Life',
      'Combined Insurance', 'Primerica', 'Transamerica', 'Guardian Life',
      'Mutual of Omaha', 'Principal Financial', 'State Farm', 'Farmers', 'Allstate',
      'American Family', 'Shelter Insurance', 'Farm Bureau', 'Country Financial',
    ],
    independenceKeywords: ['independent', 'broker', 'agency', 'multi-carrier'],
    // 'life insurance' not just 'life' — prevents false positives from real estate,
    // lifestyle brands, etc. that contain the word 'life'.
    specialtyKeywords: ['life insurance', 'final expense', 'burial insurance', 'legacy', 'term life', 'whole life', 'family protection', 'death benefit', 'income protection'],
    negativeKeywords: [
      'auto insurance', 'car insurance', 'home insurance', 'homeowners insurance',
      'property insurance', 'property & casualty', 'property and casualty',
      'commercial insurance', 'workers comp', 'real estate',
    ],
    typeFallback: 'Insurance Agency',
  },

  annuities: {
    analyst: 'fixed index annuity and MYGA specialist FMO recruiter',
    queries: [
      'fixed index annuity agent',
      'MYGA annuity specialist',
      'safe money advisor',
      'retirement income specialist',
      'independent annuity broker',
      'fixed annuity broker',
      'annuity advisor',
      'insurance and financial services',
    ],
    captiveBrands: [
      // Wirehouses / broker-dealers
      'Edward Jones', 'Ameriprise', 'Raymond James', 'Merrill Lynch', 'Merrill',
      'Morgan Stanley', 'Wells Fargo Advisors', 'Wells Fargo', 'UBS',
      // Custodians / RIA platforms
      'Fidelity', 'Vanguard', 'Schwab', 'Charles Schwab', 'TD Ameritrade',
      // Insurance captives
      'Northwestern Mutual', 'Northwestern', 'New York Life', 'Mass Mutual', 'MassMutual',
      'Guardian Life', 'Principal Financial', 'Transamerica',
      // IBDs often anti-annuity
      'LPL Financial', 'Cetera', 'Commonwealth Financial',
    ],
    independenceKeywords: ['independent', 'fixed annuity', 'fixed index', 'fia', 'myga', 'safe money', 'principal protection', 'guaranteed income', 'insurance and financial'],
    // FIA producers often don't say 'annuity' in their listing — they brand as
    // retirement/income specialists. Expanded to catch how they actually describe themselves.
    specialtyKeywords: [
      'annuity', 'annuities', 'retirement income', 'indexed', 'myga', 'safe money',
      'no market risk', 'retirement specialist', 'income planning', 'protected income',
      'fixed income', 'insurance and financial', 'retirement planning',
    ],
    // Only penalize true anti-annuity signals. 'investment management' alone is too
    // broad — many FIA producers mention it. Fee-only and AUM are the real disqualifiers.
    negativeKeywords: ['fee-only', 'assets under management', 'aum', 'registered investment advisor', 'fiduciary fee'],
    typeFallback: 'Financial Services',
  },

  financial: {
    analyst: 'financial advisory and wealth management recruiter',
    queries: [
      'financial advisor',
      'independent financial advisor',
      'wealth management advisor',
      'financial planner',
      'retirement planning advisor',
    ],
    captiveBrands: [
      'Edward Jones', 'Ameriprise', 'Raymond James', 'Merrill Lynch', 'Merrill',
      'Morgan Stanley', 'Wells Fargo Advisors', 'Wells Fargo', 'UBS',
      'Northwestern Mutual', 'Northwestern', 'New York Life', 'Mass Mutual', 'MassMutual',
      'Fidelity', 'Vanguard', 'Schwab', 'Charles Schwab',
      'LPL Financial', 'Cetera', 'Commonwealth Financial',
    ],
    independenceKeywords: ['independent', 'ria', 'fee-only', 'cfp', 'fiduciary', 'wealth management'],
    specialtyKeywords: ['financial', 'wealth', 'retirement', 'planning', 'investment', 'advisor', 'cfp'],
    typeFallback: 'Financial Advisory',
  },
}
