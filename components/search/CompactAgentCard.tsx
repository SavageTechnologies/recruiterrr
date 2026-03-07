'use client'

import { useState } from 'react'
import type { Agent } from './types'
import { ScoreCircle, FlagBadge } from './AgentBadges'

export function CompactAgentCard({ agent, index, isSelected, onSelect }: {
  agent: Agent; index: number; isSelected: boolean; onSelect: () => void
}) {
  const borderColor = agent.flag === 'hot' ? 'var(--sig-green)' : agent.flag === 'warm' ? 'var(--sig-yellow)' : 'var(--border-strong)'
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isSelected || hovered ? 'var(--bg-hover)' : 'transparent',
        borderLeft: `3px solid ${isSelected ? borderColor : 'transparent'}`,
        padding: '12px 14px', cursor: 'pointer',
        transition: 'background 0.1s, border-left-color 0.12s',
        borderBottom: '1px solid var(--border)',
        animation: `slideIn 0.2s ease ${index * 0.025}s both`,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-1)',
            marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {agent.name}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
            {agent.rating > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                ★ {agent.rating} <span style={{ color: 'var(--text-3)' }}>({agent.reviews})</span>
              </div>
            )}
            {agent.phone && (
              <a href={`tel:${agent.phone}`} onClick={e => e.stopPropagation()}
                style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: "'DM Sans', sans-serif", textDecoration: 'none' }}>
                {agent.phone}
              </a>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {agent.hiring && (
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 6px',
                border: '1px solid var(--sig-green-border)', color: 'var(--sig-green)',
                background: 'var(--sig-green-dim)', borderRadius: 3, letterSpacing: 0.5,
              }}>HIRING</span>
            )}
            {agent.youtube_channel && (
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 6px',
                border: '1px solid var(--sig-red-border)', color: 'var(--sig-red)',
                background: 'var(--sig-red-dim)', borderRadius: 3, letterSpacing: 0.5,
              }}>YT</span>
            )}
            {agent.website && (
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 6px',
                border: '1px solid var(--border)', color: 'var(--text-3)', borderRadius: 3, letterSpacing: 0.5,
              }}>WEB</span>
            )}
            {agent.captive && (
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9, padding: '2px 6px',
                border: '1px solid var(--sig-red-border)', color: 'var(--sig-red)',
                background: 'var(--sig-red-dim)', borderRadius: 3, letterSpacing: 0.5,
              }}>CAPTIVE</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
          <ScoreCircle score={agent.score} size={42} />
          <FlagBadge flag={agent.flag} />
        </div>
      </div>
    </div>
  )
}
