// ─── lib/domain/prometheus/types.ts ──────────────────────────────────────────
// Shared types for the Prometheus scan pipeline.

export type SerpDebugEntry = {
  query: string
  key: string
  results: { title: string; snippet: string; link: string }[]
  signals_fired: string[]
}
