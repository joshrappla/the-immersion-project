'use client';

import { useState } from 'react';
import RegionMapPreview from './RegionMapPreview';
import ConfidenceBadge from './ConfidenceBadge';
import type { InferenceResult } from '@/lib/regionInference';

interface InferencePreviewProps {
  result: InferenceResult;
  /** Called when the user clicks "Edit manually" — parent should open override UI. */
  onEditManually?: () => void;
  /** Called when the user clicks "Use this suggestion". Only shown if suggestions exist. */
  onUseSuggestion?: (countries: string[]) => void;
  /** If true, show a "Accept →" apply button. */
  showApply?: boolean;
  onApply?: (countries: string[]) => void;
}

const SOURCE_LABELS: Record<InferenceResult['source'], string> = {
  temporal:       'Year-aware mapping',
  hardcoded:      'Hardcoded mapping',
  custom:         'Custom mapping',
  ai:             'AI inference',
  'title-analysis': 'Title/description analysis',
  fallback:       'Fallback (no data)',
};

export default function InferencePreview({
  result,
  onEditManually,
  onUseSuggestion,
  showApply = false,
  onApply,
}: InferencePreviewProps) {
  const [showMap, setShowMap] = useState(true);

  const isEmpty = result.countries.length === 0;

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-300">Auto-detected Region</span>
          <ConfidenceBadge confidence={result.confidence} showLabel />
          <span className="text-xs text-gray-500">via {SOURCE_LABELS[result.source]}</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!isEmpty && (
            <button
              type="button"
              onClick={() => setShowMap((v) => !v)}
              className="text-xs text-gray-400 hover:text-gray-200 transition px-1.5 py-0.5 rounded bg-gray-700/50 hover:bg-gray-700"
            >
              {showMap ? 'Hide map' : 'Show map'}
            </button>
          )}
          {onEditManually && (
            <button
              type="button"
              onClick={onEditManually}
              className="text-xs text-teal-400 hover:text-teal-200 transition px-2 py-0.5 rounded bg-teal-900/30 hover:bg-teal-900/60 border border-teal-800/40"
            >
              Edit manually
            </button>
          )}
          {showApply && onApply && !isEmpty && (
            <button
              type="button"
              onClick={() => onApply(result.countries)}
              className="text-xs text-purple-300 hover:text-white transition px-2 py-0.5 rounded bg-purple-700/50 hover:bg-purple-700 border border-purple-600/40 font-semibold"
            >
              Accept →
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-3">
        {/* Reasoning */}
        {result.reasoning && (
          <p className="text-xs text-gray-400 leading-relaxed">{result.reasoning}</p>
        )}

        {/* Country pills */}
        {!isEmpty ? (
          <div className="flex flex-wrap gap-1.5">
            {result.countries.map((code) => (
              <span
                key={code}
                className="px-2 py-0.5 bg-purple-900/50 border border-purple-700/50 text-purple-300 rounded text-xs font-mono font-semibold"
              >
                {code}
              </span>
            ))}
            <span className="px-2 py-0.5 text-gray-500 text-xs">
              {result.countries.length} countr{result.countries.length === 1 ? 'y' : 'ies'}
            </span>
          </div>
        ) : (
          <p className="text-xs text-red-400/80 italic">
            No countries detected — try editing manually or refining the era name.
          </p>
        )}

        {/* Map preview */}
        {showMap && !isEmpty && (
          <RegionMapPreview countries={result.countries} height={130} />
        )}

        {/* Suggestions */}
        {result.suggestions && result.suggestions.length > 0 && (
          <div className="pt-1 border-t border-gray-700/50">
            <p className="text-xs text-gray-500 mb-1.5 font-medium">Alternative interpretations:</p>
            <div className="flex flex-wrap gap-2">
              {result.suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    // Parse suggestion as comma-separated ISO codes if it looks like codes
                    const codes = suggestion
                      .split(/[,\s]+/)
                      .map((s) => s.trim().toUpperCase())
                      .filter((s) => /^[A-Z]{2}$/.test(s));
                    if (codes.length > 0 && onUseSuggestion) {
                      onUseSuggestion(codes);
                    }
                  }}
                  className="text-xs text-blue-400 hover:text-blue-200 bg-blue-900/20 hover:bg-blue-900/40 border border-blue-800/30 rounded px-2 py-0.5 transition max-w-xs text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton / loading state
// ---------------------------------------------------------------------------

export function InferencePreviewSkeleton({ label = 'Analyzing historical context…' }: { label?: string }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 overflow-hidden animate-pulse">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700 bg-gray-800/80">
        <svg
          className="w-4 h-4 text-purple-400 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-700 rounded w-3/4" />
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-5 w-8 bg-gray-700 rounded" />
          ))}
        </div>
        <div className="h-[130px] bg-gray-700 rounded-lg" />
      </div>
    </div>
  );
}
