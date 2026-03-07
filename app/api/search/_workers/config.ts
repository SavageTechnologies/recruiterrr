// ─── config.ts ────────────────────────────────────────────────────────────────
// Mode configuration for each search type.
// THIS IS THE FILE TO EDIT when tuning keywords, captive brands, or queries.
// One section per mode — medicare, life, annuities, financial.
//
// CAPTIVE_BRANDS is a shared master list — carrier-level data that applies
// across all modes. A captive is a captive regardless of what line they sell.
// All modes reference this single array. To add a brand, add it here only.

import type { ModeConfig } from './types'

// ─── MASTER CAPTIVE BRAND LIST ────────────────────────────────────────────────

export const CAPTIVE_BRANDS: string[] = [

  // ── P&C / Multi-Line ──────────────────────────────────────────────────────
  'State Farm',
  'Allstate', 'Allstate Benefits',
  'Farmers', 'Foremost Insurance', 'Bristol West', '21st Century Insurance', 'Toggle',
  'American Family', 'The General', 'Homesite Insurance', 'CONNECT',
  'Nationwide', 'Allied Insurance',
  'Liberty Mutual',
  'Travelers',
  'USAA',
  'Erie Insurance',
  'Auto-Owners Insurance', 'Auto-Owners',
  'Shelter Insurance', 'Shelter Mutual',
  'Country Financial',
  'Farm Bureau',
  'Pekin Insurance',
  'Grinnell Mutual',
  'Sentry Insurance',
  'PEMCO',
  'GEICO',
  'Progressive Direct',
  'Elephant Insurance',
  'Esurance',

  // ── AAA Regional ──────────────────────────────────────────────────────────
  'AAA', 'CSAA Insurance', 'Auto Club Group',

  // ── National Health Carriers ──────────────────────────────────────────────
  'UnitedHealthcare', 'United Healthcare',
  'Optum',
  'Humana', 'Humana At Home',
  'Aetna',
  'Cigna', 'Cigna Healthcare',
  'Molina Healthcare', 'Molina',
  'Kaiser Permanente', 'Kaiser',
  'Oscar Health',
  'Bright Health',
  'Clover Health',
  'Alignment Health', 'Alignment Healthcare',
  'Devoted Health',
  'Zing Health',

  // ── Centene Brands ────────────────────────────────────────────────────────
  'Ambetter',
  'WellCare', 'Well Care',
  'Health Net',
  'Peach State Health Management',
  'Superior HealthPlan',

  // ── Blue Cross Blue Shield Licensees ──────────────────────────────────────
  'Blue Cross Blue Shield', 'BCBS',
  'Anthem', 'Anthem Blue Cross',
  'Florida Blue', 'GuideWell',
  'Premera Blue Cross', 'Premera',
  'Regence', 'Regence BlueShield', 'Regence BlueCross',
  'Blue Shield of California',
  'Excellus BlueCross BlueShield', 'Excellus',
  'Empire BlueCross BlueShield', 'Empire BlueCross',
  'Horizon Blue Cross Blue Shield', 'Horizon BCBS',
  'Independence Blue Cross',
  'Highmark',
  'CareFirst',
  'Wellmark',
  'Hawaii Medical Service Association', 'HMSA',
  'SelectHealth',
  'Dean Health Plan',
  'Medical Mutual of Ohio', 'Medical Mutual',

  // ── Life & Annuity Captives ───────────────────────────────────────────────
  'New York Life',
  'Northwestern Mutual', 'Northwestern',
  'MassMutual', 'Mass Mutual', 'MML Investors Services',
  'Prudential', 'Pruco Securities',
  'MetLife', 'MetLife Premier Client Group',
  'Guardian Life', 'Guardian',
  'Pacific Life',
  'Principal Financial', 'Principal',
  'Lincoln Financial', 'Lincoln Financial Group',

  // ── Supplemental / Worksite / Senior ─────────────────────────────────────
  'Aflac',
  'Colonial Life',
  'Unum',
  'American Income Life',
  'Liberty National', 'Liberty National Life',
  'Family Heritage Life',
  'United American Insurance', 'United American',
  'Globe Life',
  'Bankers Life',
  'Washington National',
  'American Fidelity Assurance', 'American Fidelity',
  'Sun Life Financial', 'Sun Life',
  'Voya Financial', 'Voya',
  'Mutual of Omaha', 'United of Omaha', 'Companion Life',
  'TruStage', 'CUNA Mutual',
  'Stonebridge Life',
  'Transamerica',
  'World Financial Group', 'WFG',
  'Primerica',
  'Combined Insurance',
  'HealthMarkets',

  // ── Wirehouses / Broker-Dealers (annuities / financial modes) ─────────────
  'Edward Jones',
  'Ameriprise',
  'Raymond James',
  'Merrill Lynch', 'Merrill',
  'Morgan Stanley',
  'Wells Fargo Advisors', 'Wells Fargo',
  'UBS',
  'Fidelity',
  'Vanguard',
  'Schwab', 'Charles Schwab',
  'TD Ameritrade',
  'LPL Financial',
  'Cetera',
  'Commonwealth Financial',
]

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
    captiveBrands: CAPTIVE_BRANDS,
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
    captiveBrands: CAPTIVE_BRANDS,
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
    captiveBrands: CAPTIVE_BRANDS,
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
    captiveBrands: CAPTIVE_BRANDS,
    independenceKeywords: ['independent', 'ria', 'fee-only', 'cfp', 'fiduciary', 'wealth management'],
    specialtyKeywords: ['financial', 'wealth', 'retirement', 'planning', 'investment', 'advisor', 'cfp'],
    typeFallback: 'Financial Advisory',
  },
}
