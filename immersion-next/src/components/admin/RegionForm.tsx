'use client';

import { useCallback, useEffect, useState } from 'react';
import RegionMapPreview from './RegionMapPreview';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RegionFormData {
  period: string;
  countries: string[];
  timeframe: string;
  description: string;
}

interface Props {
  /** When set, the period field is locked (editing an existing entry). */
  initialPeriod?: string;
  initialData?: Omit<RegionFormData, 'period'>;
  onSave: (data: RegionFormData) => void;
  onCancel: () => void;
}

interface AIResult {
  type?: string;
  countries?: string[];
  timeframe?: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseCodes(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z]{2}$/.test(s));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RegionForm({ initialPeriod, initialData, onSave, onCancel }: Props) {
  const [period, setPeriod] = useState(initialPeriod ?? '');
  const [countriesRaw, setCountriesRaw] = useState(initialData?.countries.join(', ') ?? '');
  const [timeframe, setTimeframe] = useState(initialData?.timeframe ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [showPreview, setShowPreview] = useState(false);

  // AI test state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiError, setAiError] = useState('');

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const codes = parseCodes(countriesRaw);

  // Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, countriesRaw, timeframe, description]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!period.trim()) newErrors.period = 'Period name is required';
    if (codes.length === 0) newErrors.countries = 'At least one valid ISO code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [period, codes]);

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({ period: period.trim(), countries: codes, timeframe: timeframe.trim(), description: description.trim() });
  };

  // ── "Test with AI" ────────────────────────────────────────────────────────

  const testWithAI = async () => {
    const p = period.trim();
    if (!p) {
      setAiError('Enter a period name first.');
      return;
    }
    setAiLoading(true);
    setAiResult(null);
    setAiError('');
    try {
      const res = await fetch(`/api/region-lookup?period=${encodeURIComponent(p)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as AIResult;
      setAiResult(data);
      // Auto-fill blank fields from AI suggestion
      if (data.countries?.length && !countriesRaw.trim()) {
        setCountriesRaw(data.countries.join(', '));
      }
      if (data.timeframe && !timeframe.trim()) setTimeframe(data.timeframe);
      if (data.description && !description.trim()) setDescription(data.description);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI lookup failed');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAISuggestion = () => {
    if (!aiResult) return;
    if (aiResult.countries?.length) setCountriesRaw(aiResult.countries.join(', '));
    if (aiResult.timeframe) setTimeframe(aiResult.timeframe);
    if (aiResult.description) setDescription(aiResult.description);
    setAiResult(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Period name */}
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-300">
          Period / Civilization <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          <input
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setErrors((prev) => ({ ...prev, period: '' }));
            }}
            disabled={!!initialPeriod}
            placeholder="e.g. Ottoman Empire, Feudal Japan, Silk Road"
            className={`flex-1 px-3 py-2 bg-gray-800 border text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:opacity-50 ${
              errors.period ? 'border-red-500' : 'border-gray-700'
            }`}
          />
          <button
            type="button"
            onClick={testWithAI}
            disabled={aiLoading || !period.trim()}
            title="Ask the AI what countries map to this period"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition whitespace-nowrap flex items-center gap-2"
          >
            {aiLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Asking AI…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Test with AI
              </>
            )}
          </button>
        </div>
        {errors.period && <p className="text-red-400 text-xs mt-1">{errors.period}</p>}
      </div>

      {/* AI result panel */}
      {aiError && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
          AI error: {aiError}
        </div>
      )}
      {aiResult && (
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-blue-300 text-sm font-semibold">AI Suggestion</p>
            <span className="text-xs text-blue-400 bg-blue-900/40 px-2 py-0.5 rounded-full border border-blue-800/50">
              {aiResult.type ?? 'era'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {(aiResult.countries ?? []).map((c) => (
              <span key={c} className="px-2 py-0.5 bg-blue-900/40 text-teal-300 rounded text-xs font-mono border border-blue-800/50">
                {c}
              </span>
            ))}
            {!aiResult.countries?.length && <span className="text-gray-500 text-xs italic">no countries</span>}
          </div>
          {aiResult.timeframe && (
            <p className="text-gray-400 text-xs">{aiResult.timeframe}</p>
          )}
          {aiResult.description && (
            <p className="text-gray-400 text-xs">{aiResult.description}</p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={applyAISuggestion}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition"
            >
              Apply Suggestion
            </button>
            <button
              type="button"
              onClick={() => setAiResult(null)}
              className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600 transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Country codes */}
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-300">
          Countries <span className="text-gray-500 font-normal">(ISO 3166-1 alpha-2, comma-separated)</span>{' '}
          <span className="text-red-400">*</span>
        </label>
        <input
          value={countriesRaw}
          onChange={(e) => {
            setCountriesRaw(e.target.value);
            setErrors((prev) => ({ ...prev, countries: '' }));
          }}
          placeholder="TR, EG, GR, RS, BG, HU, RO"
          className={`w-full px-3 py-2 bg-gray-800 border text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none font-mono ${
            errors.countries ? 'border-red-500' : 'border-gray-700'
          }`}
        />
        {errors.countries && <p className="text-red-400 text-xs mt-1">{errors.countries}</p>}
        {codes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {codes.map((c) => (
              <span key={c} className="px-2 py-0.5 bg-teal-900/40 text-teal-300 rounded text-xs font-mono border border-teal-800/50">
                {c}
              </span>
            ))}
            <span className="text-gray-600 text-xs ml-1 self-center">{codes.length} code{codes.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Timeframe */}
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-300">
          Timeframe <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <input
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          placeholder="e.g. 1299–1922"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-300">
          Description <span className="text-gray-500 font-normal">(optional, max 100 chars)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 100))}
          rows={2}
          maxLength={100}
          placeholder="Brief description of this period or civilization"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
        />
        <p className="text-gray-600 text-xs mt-0.5 text-right">{description.length}/100</p>
      </div>

      {/* Map preview toggle */}
      {codes.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="text-sm text-purple-400 hover:text-purple-300 transition flex items-center gap-1"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showPreview ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {showPreview ? 'Hide' : 'Show'} map preview
          </button>
          {showPreview && (
            <div className="mt-2">
              <RegionMapPreview countries={codes} height={160} />
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-bold hover:bg-purple-700 transition"
        >
          Save Mapping
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-700 text-gray-200 py-2 rounded-lg font-bold hover:bg-gray-600 transition"
        >
          Cancel
        </button>
      </div>

      <p className="text-gray-600 text-xs text-center">Tip: press Ctrl+S (or ⌘+S) to save</p>
    </div>
  );
}
