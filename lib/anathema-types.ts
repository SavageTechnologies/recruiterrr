// Shared types for Anathema scan results — used by AnathemaPanel and dashboard page.
// Mirrors the ChainSignal type exported from the API route.

export type ChainSignal = {
  tier: 'HIGH' | 'MED' | 'LOW'
  type: 'domain' | 'name' | 'alias' | 'comention' | 'relationship' | 'association' | 'geographic'
  entity: string
  text: string
  source: 'partner_query' | 'relationship_query' | 'geographic'
}

export type ScanResult = {
  predicted_tree: 'integrity' | 'amerilife' | 'sms' | 'unknown'
  confidence: number
  signals_used: string[]
  reasoning: string
  facebook_profile_url: string | null
  facebook_about: string | null
  // Chain resolver
  predicted_sub_imo: string | null
  predicted_sub_imo_confidence: number | null
  predicted_sub_imo_partner_id: number | null
  predicted_sub_imo_signals: ChainSignal[]
}

export const TREE_LABELS: Record<string, string> = {
  integrity: 'INTEGRITY',
  amerilife: 'AMERILIFE',
  sms: 'SMS',
  unknown: 'UNCLASSIFIED',
}

export const TIER_CONFIG = {
  HIGH: {
    color: '#00e676',
    dimColor: 'rgba(0,230,118,0.06)',
    borderColor: 'rgba(0,230,118,0.4)',
    label: 'HIGH',
  },
  MED: {
    color: '#ff9800',
    dimColor: 'rgba(255,152,0,0.06)',
    borderColor: 'rgba(255,152,0,0.4)',
    label: 'MED',
  },
  LOW: {
    color: '#444',
    dimColor: 'rgba(255,255,255,0.02)',
    borderColor: '#333',
    label: 'LOW',
  },
}

export function getStage(confidence: number, tree: string): { roman: string; label: string } {
  if (tree === 'unknown' || confidence < 35) return { roman: '—', label: 'INDETERMINATE' }
  if (confidence >= 80) return { roman: 'IV', label: 'STAGE IV' }
  if (confidence >= 55) return { roman: 'III', label: 'STAGE III' }
  if (confidence >= 35) return { roman: 'II', label: 'STAGE II' }
  return { roman: 'I', label: 'STAGE I' }
}

export function groupSignals(signals: ChainSignal[]) {
  return {
    high: signals.filter(s => s.tier === 'HIGH'),
    med:  signals.filter(s => s.tier === 'MED'),
    low:  signals.filter(s => s.tier === 'LOW'),
  }
}
