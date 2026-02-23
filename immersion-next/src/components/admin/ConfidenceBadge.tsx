'use client';

/**
 * ConfidenceBadge
 * Small visual indicator for inference confidence levels.
 *
 * HIGH   → green checkmark  "Auto-detected (high confidence)"
 * MEDIUM → yellow warning   "Suggested (review recommended)"
 * LOW    → red alert        "Uncertain (please verify)"
 */

interface ConfidenceBadgeProps {
  confidence: 'high' | 'medium' | 'low';
  /** Show a longer label alongside the icon. Default true. */
  showLabel?: boolean;
  className?: string;
}

const CONFIG = {
  high: {
    bg: 'bg-green-900/40',
    border: 'border-green-700/50',
    text: 'text-green-300',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Auto-detected (high confidence)',
    dot: 'bg-green-400',
  },
  medium: {
    bg: 'bg-yellow-900/30',
    border: 'border-yellow-700/50',
    text: 'text-yellow-300',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
    label: 'Suggested (review recommended)',
    dot: 'bg-yellow-400',
  },
  low: {
    bg: 'bg-red-900/30',
    border: 'border-red-700/50',
    text: 'text-red-300',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Uncertain (please verify)',
    dot: 'bg-red-400',
  },
} as const;

export default function ConfidenceBadge({
  confidence,
  showLabel = true,
  className = '',
}: ConfidenceBadgeProps) {
  const c = CONFIG[confidence];

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        c.bg, c.border, c.text, className,
      ].join(' ')}
      title={c.label}
    >
      {c.icon}
      {showLabel && <span>{c.label}</span>}
    </span>
  );
}

/** Compact dot-only variant (no text, smaller). */
export function ConfidenceDot({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const c = CONFIG[confidence];
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${c.dot} flex-shrink-0`}
      title={c.label}
    />
  );
}
