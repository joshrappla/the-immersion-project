'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  REGION_MAPPINGS,
  getCustomMappings,
  setCustomMapping,
  deleteCustomMapping,
  clearCustomMappings,
  getAllCachedRegions,
  deleteCachedRegion,
  clearAICache,
  type RegionCacheEntry,
} from '@/utils/regionMappings';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SourceType = 'static' | 'custom' | 'ai-cache';
type SourceFilter = 'all' | SourceType;

interface MappingRow {
  period: string;
  countries: string[];
  timeframe: string;
  description: string;
  source: SourceType;
}

interface EditForm {
  period: string;
  countriesRaw: string; // comma-separated ISO codes
  timeframe: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Helpers / constants
// ---------------------------------------------------------------------------

const SOURCE_LABELS: Record<SourceType, string> = {
  static: 'Static',
  custom: 'Custom',
  'ai-cache': 'AI Cache',
};

const SOURCE_BADGE_CLASS: Record<SourceType, string> = {
  static: 'bg-gray-700 text-gray-300 border-gray-600',
  custom: 'bg-purple-900/50 text-purple-300 border-purple-700',
  'ai-cache': 'bg-blue-900/50 text-blue-300 border-blue-700',
};

function parseCodes(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length === 2);
}

function parseImportJSON(
  text: string
): Array<{ period: string; entry: RegionCacheEntry }> | string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    return 'Invalid JSON — please check your input.';
  }

  const entries: Array<{ period: string; entry: RegionCacheEntry }> = [];

  if (Array.isArray(parsed)) {
    for (const item of parsed as Record<string, unknown>[]) {
      if (typeof item.period !== 'string') continue;
      const countries = Array.isArray(item.countries)
        ? (item.countries as unknown[])
            .filter((c): c is string => typeof c === 'string' && c.length === 2)
            .map((c) => c.toUpperCase())
        : typeof item.countries === 'string'
        ? parseCodes(item.countries)
        : [];
      entries.push({
        period: item.period,
        entry: {
          countries,
          timeframe: typeof item.timeframe === 'string' ? item.timeframe : '',
          description: typeof item.description === 'string' ? item.description : '',
        },
      });
    }
  } else if (typeof parsed === 'object' && parsed !== null) {
    for (const [period, val] of Object.entries(parsed as Record<string, unknown>)) {
      const v = val as Record<string, unknown>;
      const countries = Array.isArray(v.countries)
        ? (v.countries as unknown[])
            .filter((c): c is string => typeof c === 'string' && c.length === 2)
            .map((c) => c.toUpperCase())
        : [];
      entries.push({
        period,
        entry: {
          countries,
          timeframe: typeof v.timeframe === 'string' ? v.timeframe : '',
          description: typeof v.description === 'string' ? v.description : '',
        },
      });
    }
  } else {
    return 'Expected a JSON array or object.';
  }

  if (entries.length === 0) return 'No valid entries found in the JSON.';
  return entries;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RegionMappingsPanel() {
  const [customMappings, setCustomState] = useState<Record<string, RegionCacheEntry>>({});
  const [aiCache, setAiCacheState] = useState<Record<string, RegionCacheEntry>>({});
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  // Add/Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    period: '',
    countriesRaw: '',
    timeframe: '',
    description: '',
  });

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<
    Array<{ period: string; entry: RegionCacheEntry }> | null
  >(null);
  const [importError, setImportError] = useState('');

  const refresh = useCallback(() => {
    setCustomState(getCustomMappings());
    setAiCacheState(getAllCachedRegions());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const allRows: MappingRow[] = [
    ...Object.entries(REGION_MAPPINGS).map(([period, countries]) => ({
      period,
      countries,
      timeframe: '',
      description: 'Built-in static mapping',
      source: 'static' as SourceType,
    })),
    ...Object.entries(customMappings).map(([period, entry]) => ({
      period,
      countries: entry.countries,
      timeframe: entry.timeframe,
      description: entry.description,
      source: 'custom' as SourceType,
    })),
    ...Object.entries(aiCache).map(([period, entry]) => ({
      period,
      countries: entry.countries,
      timeframe: entry.timeframe,
      description: entry.description,
      source: 'ai-cache' as SourceType,
    })),
  ];

  const filteredRows =
    sourceFilter === 'all' ? allRows : allRows.filter((r) => r.source === sourceFilter);

  const staticCount = Object.keys(REGION_MAPPINGS).length;
  const customCount = Object.keys(customMappings).length;
  const aiCount = Object.keys(aiCache).length;
  const uniqueCountries = new Set(allRows.flatMap((r) => r.countries)).size;

  const cacheKB = (() => {
    try {
      const a = localStorage.getItem('regionCache') ?? '{}';
      const b = localStorage.getItem('customRegionMappings') ?? '{}';
      return ((a.length + b.length) / 1024).toFixed(1);
    } catch {
      return '?';
    }
  })();

  // -------------------------------------------------------------------------
  // Handlers — add / edit
  // -------------------------------------------------------------------------

  const openAdd = () => {
    setEditingPeriod(null);
    setEditForm({ period: '', countriesRaw: '', timeframe: '', description: '' });
    setShowEditModal(true);
  };

  const openEdit = (row: MappingRow) => {
    setEditingPeriod(row.period);
    setEditForm({
      period: row.period,
      countriesRaw: row.countries.join(', '),
      timeframe: row.timeframe,
      description: row.description,
    });
    setShowEditModal(true);
  };

  const handleSave = () => {
    const period = editForm.period.trim();
    if (!period) return;
    setCustomMapping(period, {
      countries: parseCodes(editForm.countriesRaw),
      timeframe: editForm.timeframe.trim(),
      description: editForm.description.trim(),
    });
    setShowEditModal(false);
    refresh();
  };

  // -------------------------------------------------------------------------
  // Handlers — delete / clear
  // -------------------------------------------------------------------------

  const handleDelete = (row: MappingRow) => {
    if (!confirm(`Delete mapping for "${row.period}"?`)) return;
    if (row.source === 'custom') deleteCustomMapping(row.period);
    else if (row.source === 'ai-cache') deleteCachedRegion(row.period);
    refresh();
  };

  const handleClearAI = () => {
    if (
      !confirm(
        'Clear all AI-resolved cache entries? New API calls will be made next time these periods appear on the map.'
      )
    )
      return;
    clearAICache();
    refresh();
  };

  const handleClearCustom = () => {
    if (!confirm('Delete all custom mappings? This cannot be undone.')) return;
    clearCustomMappings();
    refresh();
  };

  // -------------------------------------------------------------------------
  // Handlers — import
  // -------------------------------------------------------------------------

  const handleParseImport = () => {
    setImportError('');
    setImportPreview(null);
    const result = parseImportJSON(importText);
    if (typeof result === 'string') {
      setImportError(result);
    } else {
      setImportPreview(result);
    }
  };

  const handleImport = () => {
    if (!importPreview) return;
    importPreview.forEach(({ period, entry }) => setCustomMapping(period, entry));
    setShowImportModal(false);
    setImportText('');
    setImportPreview(null);
    refresh();
  };

  const closeImport = () => {
    setShowImportModal(false);
    setImportText('');
    setImportPreview(null);
    setImportError('');
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const livePreviewCodes = parseCodes(editForm.countriesRaw);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Static Mappings" value={staticCount} color="gray" note="Read-only" />
        <StatCard
          label="Custom Overrides"
          value={customCount}
          color="purple"
          note="Highest priority"
        />
        <StatCard
          label="AI Cache Entries"
          value={aiCount}
          color="blue"
          note={`~${cacheKB} KB stored`}
        />
        <StatCard
          label="Unique Countries"
          value={uniqueCountries}
          color="teal"
          note="across all sources"
        />
      </div>

      {/* Filter tabs + action buttons */}
      <div className="flex flex-wrap gap-2 items-center">
        {(['all', 'static', 'custom', 'ai-cache'] as SourceFilter[]).map((f) => {
          const count =
            f === 'all'
              ? allRows.length
              : f === 'static'
              ? staticCount
              : f === 'custom'
              ? customCount
              : aiCount;
          return (
            <button
              key={f}
              onClick={() => setSourceFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                sourceFilter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? 'All' : f === 'ai-cache' ? 'AI Cache' : SOURCE_LABELS[f]}
              <span className="ml-1.5 text-xs opacity-60">({count})</span>
            </button>
          );
        })}

        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={openAdd}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
          >
            + Add Mapping
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-1.5 bg-gray-700 text-gray-200 rounded-lg text-sm border border-gray-600 hover:bg-gray-600 transition"
          >
            Import JSON
          </button>
          {aiCount > 0 && (
            <button
              onClick={handleClearAI}
              className="px-3 py-1.5 bg-gray-800 text-red-400 rounded-lg text-sm border border-red-900/40 hover:bg-red-900/30 transition"
            >
              Clear AI Cache
            </button>
          )}
          {customCount > 0 && (
            <button
              onClick={handleClearCustom}
              className="px-3 py-1.5 bg-gray-800 text-red-400 rounded-lg text-sm border border-red-900/40 hover:bg-red-900/30 transition"
            >
              Clear Custom
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden">
        {filteredRows.length === 0 ? (
          <div className="text-center text-gray-500 py-16 text-sm">
            No mappings in this category.
            {sourceFilter === 'custom' && (
              <>
                {' '}
                <button
                  onClick={openAdd}
                  className="text-purple-400 underline hover:text-purple-300 transition"
                >
                  Add one now.
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700 bg-gray-900/60">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">
                    Period / Civilization
                  </th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Source</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Countries</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium hidden lg:table-cell">
                    Timeframe
                  </th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredRows.map((row) => (
                  <tr
                    key={`${row.source}-${row.period}`}
                    className="hover:bg-white/5 transition"
                  >
                    <td className="px-4 py-3 max-w-[220px]">
                      <div className="font-medium text-white truncate">{row.period}</div>
                      {row.description && (
                        <div className="text-gray-500 text-xs mt-0.5 line-clamp-1">
                          {row.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${SOURCE_BADGE_CLASS[row.source]}`}
                      >
                        {SOURCE_LABELS[row.source]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {row.countries.length > 0 ? (
                          row.countries.map((c) => (
                            <span
                              key={c}
                              className="px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded text-xs border border-gray-700 font-mono"
                            >
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-600 text-xs italic">none</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell whitespace-nowrap">
                      {row.timeframe || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        {row.source === 'static' ? (
                          <button
                            onClick={() => openEdit(row)}
                            title="Save a custom override for this mapping"
                            className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600 transition whitespace-nowrap"
                          >
                            Override
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => openEdit(row)}
                              className="px-2 py-1 bg-blue-600/80 text-white rounded text-xs hover:bg-blue-600 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(row)}
                              className="px-2 py-1 bg-red-600/80 text-white rounded text-xs hover:bg-red-600 transition"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Add / Edit Modal                                                    */}
      {/* ------------------------------------------------------------------ */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-700">
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingPeriod ? `Edit: ${editingPeriod}` : 'Add Custom Mapping'}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Saved as a <span className="text-purple-400 font-medium">custom override</span>{' '}
                  — takes priority over static and AI-resolved mappings.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Period / Civilization
                </label>
                <input
                  value={editForm.period}
                  onChange={(e) => setEditForm((f) => ({ ...f, period: e.target.value }))}
                  disabled={!!editingPeriod}
                  placeholder="e.g. Ottoman Empire"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Countries{' '}
                  <span className="text-gray-500 font-normal">
                    (ISO 3166-1 alpha-2, comma-separated)
                  </span>
                </label>
                <input
                  value={editForm.countriesRaw}
                  onChange={(e) => setEditForm((f) => ({ ...f, countriesRaw: e.target.value }))}
                  placeholder="TR, EG, GR, RS, BG, HU"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none font-mono"
                />
                {livePreviewCodes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {livePreviewCodes.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 bg-teal-900/40 text-teal-300 rounded text-xs font-mono border border-teal-800/50"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Timeframe <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  value={editForm.timeframe}
                  onChange={(e) => setEditForm((f) => ({ ...f, timeframe: e.target.value }))}
                  placeholder="e.g. 1299–1922"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Description <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Brief description of this period or civilization"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={!editForm.period.trim()}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-bold hover:bg-purple-700 transition disabled:opacity-40"
                >
                  Save Custom Mapping
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-700 text-gray-200 py-2 rounded-lg font-bold hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Import Modal                                                         */}
      {/* ------------------------------------------------------------------ */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">Bulk Import Historical Data</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Paste a JSON array or object. All entries are saved as{' '}
                  <span className="text-purple-400">custom mappings</span>.
                </p>
              </div>

              {/* Format reference */}
              <div className="bg-gray-800 rounded-lg p-3 text-xs font-mono text-gray-400 border border-gray-700 space-y-1">
                <p className="text-gray-500">{'// Array format:'}</p>
                <p>
                  {
                    '[{ "period": "Ottoman Empire", "countries": ["TR","EG","GR"], "timeframe": "1299–1922", "description": "..." }]'
                  }
                </p>
                <p className="text-gray-500 mt-2">{'// Object format:'}</p>
                <p>{'{"Ottoman Empire": { "countries": ["TR","EG"], "timeframe": "1299–1922" }}'}</p>
              </div>

              <textarea
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportPreview(null);
                  setImportError('');
                }}
                rows={8}
                placeholder="Paste JSON here…"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none font-mono text-sm"
              />

              {importError && <p className="text-red-400 text-sm">{importError}</p>}

              {!importPreview && (
                <button
                  onClick={handleParseImport}
                  disabled={!importText.trim()}
                  className="w-full bg-gray-700 text-gray-200 py-2 rounded-lg font-semibold hover:bg-gray-600 transition disabled:opacity-40"
                >
                  Preview Import
                </button>
              )}

              {importPreview && (
                <div className="space-y-3">
                  <p className="text-sm text-green-400 font-semibold">
                    {importPreview.length} entr{importPreview.length === 1 ? 'y' : 'ies'} ready
                    to import:
                  </p>

                  <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-700 divide-y divide-gray-800">
                    {importPreview.map(({ period, entry }) => (
                      <div key={period} className="flex items-center gap-3 px-3 py-2 bg-gray-800/60">
                        <span className="text-white text-sm font-medium flex-1 truncate">
                          {period}
                        </span>
                        <div className="flex gap-1 flex-wrap">
                          {entry.countries.map((c) => (
                            <span
                              key={c}
                              className="px-1.5 py-0.5 bg-gray-700 text-teal-300 rounded text-xs font-mono"
                            >
                              {c}
                            </span>
                          ))}
                          {entry.countries.length === 0 && (
                            <span className="text-gray-600 text-xs italic">no codes</span>
                          )}
                        </div>
                        {entry.timeframe && (
                          <span className="text-gray-500 text-xs whitespace-nowrap">
                            {entry.timeframe}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleImport}
                      className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-bold hover:bg-purple-700 transition"
                    >
                      Import {importPreview.length} Entr
                      {importPreview.length === 1 ? 'y' : 'ies'}
                    </button>
                    <button
                      onClick={() => setImportPreview(null)}
                      className="px-4 bg-gray-700 text-gray-300 py-2 rounded-lg hover:bg-gray-600 transition"
                    >
                      Re-edit
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={closeImport}
                className="w-full bg-gray-800 text-gray-400 py-2 rounded-lg hover:bg-gray-700 transition text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  color,
  note,
}: {
  label: string;
  value: number;
  color: 'gray' | 'purple' | 'blue' | 'teal';
  note?: string;
}) {
  const valueColor = {
    gray: 'text-gray-300',
    purple: 'text-purple-300',
    blue: 'text-blue-300',
    teal: 'text-teal-300',
  }[color];

  const cardClass = {
    gray: 'bg-gray-800/60 border-gray-700',
    purple: 'bg-purple-900/20 border-purple-800/40',
    blue: 'bg-blue-900/20 border-blue-800/40',
    teal: 'bg-teal-900/20 border-teal-800/40',
  }[color];

  return (
    <div className={`rounded-lg border p-4 ${cardClass}`}>
      <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
      <p className="text-gray-300 text-sm mt-1 font-medium">{label}</p>
      {note && <p className="text-gray-500 text-xs mt-0.5">{note}</p>}
    </div>
  );
}
