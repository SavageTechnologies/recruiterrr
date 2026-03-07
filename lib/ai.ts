// ─── lib/ai.ts ────────────────────────────────────────────────────────────────
// Lazy Anthropic client singleton. Avoids re-instantiating on every request.
// Import getAnthropicClient() wherever you need the SDK — never call new Anthropic() directly.

import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}
