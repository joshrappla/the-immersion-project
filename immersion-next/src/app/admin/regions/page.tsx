'use client';

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import Link from 'next/link';
import {
  REGION_MAPPINGS,
  REGION_TIMEFRAMES,
  getCustomMappings,
  setCustomMapping,
  deleteCustomMapping,
  clearCustomMappings,
  getAllCachedRegions,
  deleteCachedRegion,
  clearAICache,
  type RegionCacheEntry,
} from '@/utils/regionMappings';
import {
  getCacheStats,
  clearCache as clearPerEntryCache,
  type CacheStats,
} from '@/lib/regionAI';
import RegionForm, { type RegionFormData } from '@/components/admin/RegionForm';
import RegionMapPreview from '@/components/admin/RegionMapPreview';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'hardcoded' | 'cache' | 'add';

interface MappingRow {
  period: string;
  countries: string[];
  timeframe: string;
  description: string;
  source: 'static' | 'custom';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCSV(rows: MappingRow[], filename: string) {
  const header = 'period,countries,timeframe,description';
  const lines = rows.map((r) =>
    [r.period, r.countries.join(' '), r.timeframe, r.description]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminRegionsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('hardcoded');

  // Data
  const [customMappings, setCustomMappings] = useState<Record<string, RegionCacheEntry>>({});
  const [legacyAICache, setLegacyAICache] = useState<Record<string, RegionCacheEntry>>({});
  const [perEntryStats, setPerEntryStats] = useState<CacheStats>({ entries: 0, size: 0, oldest: null, newest: null });

  // Hardcoded tab
  const [hardcodedSearch, setHardcodedSearch] = useState('');
  const [previewPeriod, setPreviewPeriod] = useState<string | null>(null);

  // Cache tab
  const [cacheSearch, setCacheSearch] = useState('');

  // Add/Edit form
  const [editingPeriod, setEditingPeriod] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Omit<RegionFormData, 'period'> | undefined>(undefined);

  // ── Auth check ─────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/admin/session')
      .then((r) => r.json())
      .then((d) => setIsAuthenticated(!!d.authenticated))
      .catch(() => setIsAuthenticated(false));
  }, []);

  // ── Data refresh ───────────────────────────────────────────────────────────

  const refresh = useCallback(() => {
    setCustomMappings(getCustomMappings());
    setLegacyAICache(getAllCachedRegions());
    setPerEntryStats(getCacheStats());
  }, []);

  useEffect(() => {
    if (isAuthenticated) refresh();
  }, [isAuthenticated, refresh]);

  // ── Derived data ───────────────────────────────────────────────────────────

  const hardcodedRows: MappingRow[] = useMemo(() => {
    const q = hardcodedSearch.toLowerCase();
    return Object.entries(REGION_MAPPINGS)
      .map(([period, countries]) => ({
        period,
        countries,
        timeframe: REGION_TIMEFRAMES[period] ?? '',
        description: 'Built-in static mapping',
        source: 'static' as const,
      }))
      .filter(
        (r) =>
          !q ||
          r.period.toLowerCase().includes(q) ||
          r.countries.some((c) => c.toLowerCase().includes(q))
      );
  }, [hardcodedSearch]);

  const customRows: MappingRow[] = useMemo(() =>
    Object.entries(customMappings).map(([period, entry]) => ({
      period,
      countries: entry.countries,
      timeframe: entry.timeframe,
      description: entry.description,
      source: 'custom' as const,
    })),
  [customMappings]);

  // All rows shown in the hardcoded tab (static + custom overrides)
  const allMappingRows: MappingRow[] = useMemo(() => {
    const q = hardcodedSearch.toLowerCase();
    const combined = [...hardcodedRows];
    // Append custom rows not already shown as static
    const staticKeys = new Set(hardcodedRows.map((r) => r.period.toLowerCase()));
    customRows
      .filter((r) => !staticKeys.has(r.period.toLowerCase()))
      .filter(
        (r) =>
          !q ||
          r.period.toLowerCase().includes(q) ||
          r.countries.some((c) => c.toLowerCase().includes(q))
      )
      .forEach((r) => combined.push(r));
    return combined;
  }, [hardcodedRows, customRows, hardcodedSearch]);

  const cacheEntries = useMemo(() => {
    const q = cacheSearch.toLowerCase();
    return Object.entries(legacyAICache).filter(
      ([p]) => !q || p.toLowerCase().includes(q)
    );
  }, [legacyAICache, cacheSearch]);

  const totalCacheEntries = Object.keys(legacyAICache).length + perEntryStats.entries;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingPeriod(null);
    setEditingData(undefined);
    setActiveTab('add');
  };

  const openEdit = (row: MappingRow) => {
    setEditingPeriod(row.period);
    setEditingData({
      countries: row.countries,
      timeframe: row.timeframe,
      description: row.source === 'static' ? '' : row.description,
    });
    setActiveTab('add');
  };

  const handleFormSave = (data: RegionFormData) => {
    setCustomMapping(data.period, {
      countries: data.countries,
      timeframe: data.timeframe,
      description: data.description,
    });
    refresh();
    setActiveTab('hardcoded');
    setEditingPeriod(null);
    setEditingData(undefined);
  };

  const handleFormCancel = () => {
    setEditingPeriod(null);
    setEditingData(undefined);
    setActiveTab('hardcoded');
  };

  const handleDeleteCustom = (period: string) => {
    if (!confirm(`Delete custom mapping for "${period}"?`)) return;
    deleteCustomMapping(period);
    refresh();
  };

  const handleClearAllCustom = () => {
    if (!confirm('Delete ALL custom mappings? This cannot be undone.')) return;
    clearCustomMappings();
    refresh();
  };

  const handleDeleteLegacyCache = (period: string) => {
    deleteCachedRegion(period);
    refresh();
  };

  const handleClearLegacyCache = () => {
    if (!confirm('Clear all AI cache entries?')) return;
    clearAICache();
    clearPerEntryCache();
    refresh();
  };

  const handlePromoteToCustom = (period: string, entry: RegionCacheEntry) => {
    setCustomMapping(period, entry);
    deleteCachedRegion(period);
    refresh();
  };

  const handleExportJSON = () => {
    const data = Object.entries(customMappings).map(([period, entry]) => ({
      period,
      ...entry,
    }));
    downloadJSON(data, 'region-mappings.json');
  };

  const handleExportCSV = () => {
    downloadCSV(customRows, 'region-mappings.csv');
  };

  const handleExportAllJSON = () => {
    downloadJSON(
      { static: REGION_MAPPINGS, custom: customMappings, aiCache: legacyAICache },
      'region-mappings-all.json'
    );
  };

  // ── Unauthenticated / loading ───────────────────────────────────────────────

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-gray-400">
        <p className="text-lg">You must be logged in to access this page.</p>
        <Link href="/admin" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
          Go to Admin Login
        </Link>
      </div>
    );
  }

  // ── Authenticated UI ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 px-6 py-4 sticky top-0 z-20">
        <div className="container mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/admin" className="hover:text-white transition">Admin</Link>
            <span>/</span>
            <span className="text-white font-semibold">Region Mappings</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={openAdd}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
            >
              + Add Mapping
            </button>
            {customRows.length > 0 && (
              <>
                <button
                  onClick={handleExportJSON}
                  className="px-3 py-1.5 bg-gray-700 text-gray-200 rounded-lg text-sm border border-gray-600 hover:bg-gray-600 transition"
                >
                  Export JSON
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-gray-700 text-gray-200 rounded-lg text-sm border border-gray-600 hover:bg-gray-600 transition"
                >
                  Export CSV
                </button>
              </>
            )}
            <button
              onClick={handleExportAllJSON}
              className="px-3 py-1.5 bg-gray-700 text-gray-200 rounded-lg text-sm border border-gray-600 hover:bg-gray-600 transition"
            >
              Export All
            </button>
            <Link
              href="/admin"
              className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm border border-gray-700 hover:bg-gray-700 transition"
            >
              ← Back to Admin
            </Link>
          </div>
        </div>

        {/* Tab nav */}
        <div className="container mx-auto mt-4 flex gap-1">
          {(
            [
              { id: 'hardcoded', label: 'Mappings', count: allMappingRows.length },
              { id: 'cache',     label: 'AI Cache',  count: totalCacheEntries },
              { id: 'add',       label: editingPeriod ? `Editing: ${editingPeriod}` : '+ Add / Edit' },
            ] as { id: Tab; label: string; count?: number }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id !== 'add') {
                  setEditingPeriod(null);
                  setEditingData(undefined);
                }
                setActiveTab(tab.id);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 text-xs opacity-60">({tab.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto p-6">

        {/* ================================================================ */}
        {/* Tab A — Mappings (hardcoded + custom)                            */}
        {/* ================================================================ */}
        {activeTab === 'hardcoded' && (
          <div className="space-y-5">

            {/* Stat bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Static Periods" value={Object.keys(REGION_MAPPINGS).length} color="gray" note="Read-only (built-in)" />
              <StatCard label="Custom Overrides" value={Object.keys(customMappings).length} color="purple" note="Highest priority" />
              <StatCard label="Total Shown" value={allMappingRows.length} color="teal" note={hardcodedSearch ? 'filtered' : 'all sources'} />
              <StatCard label="Unique Countries" value={new Set(allMappingRows.flatMap((r) => r.countries)).size} color="blue" note="across all mappings" />
            </div>

            {/* Search + bulk actions */}
            <div className="flex flex-wrap gap-3 items-center">
              <input
                type="text"
                placeholder="Search period name or country code…"
                value={hardcodedSearch}
                onChange={(e) => setHardcodedSearch(e.target.value)}
                className="flex-1 min-w-[240px] px-3 py-2 bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
              />
              {customRows.length > 0 && (
                <button
                  onClick={handleClearAllCustom}
                  className="px-3 py-2 bg-gray-800 text-red-400 rounded-lg text-sm border border-red-900/40 hover:bg-red-900/20 transition"
                >
                  Clear Custom ({customRows.length})
                </button>
              )}
            </div>

            {/* Table */}
            <div className="bg-gray-900/80 rounded-lg border border-gray-700 overflow-hidden">
              {allMappingRows.length === 0 ? (
                <p className="text-center text-gray-500 py-12 text-sm">
                  No mappings found{hardcodedSearch && ` for "${hardcodedSearch}"`}.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-900/60 border-b border-gray-700">
                      <tr>
                        <th className="text-left px-4 py-3 text-gray-400 font-medium">Period / Civilization</th>
                        <th className="text-left px-4 py-3 text-gray-400 font-medium">Source</th>
                        <th className="text-left px-4 py-3 text-gray-400 font-medium">Countries</th>
                        <th className="text-left px-4 py-3 text-gray-400 font-medium hidden lg:table-cell">Timeframe</th>
                        <th className="text-right px-4 py-3 text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {allMappingRows.map((row) => {
                        const isCustom = row.source === 'custom';
                        const isPreviewing = previewPeriod === row.period;
                        return (
                          <Fragment key={`${row.source}-${row.period}`}>
                            <tr
                              className="hover:bg-white/5 transition"
                            >
                              <td className="px-4 py-3 max-w-[200px]">
                                <p className="font-semibold text-white truncate">{row.period}</p>
                                {row.description && row.source === 'custom' && (
                                  <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{row.description}</p>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                                    isCustom
                                      ? 'bg-purple-900/50 text-purple-300 border-purple-700'
                                      : 'bg-gray-700 text-gray-300 border-gray-600'
                                  }`}
                                >
                                  {isCustom ? 'Custom' : 'Static'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {row.countries.map((c) => (
                                    <span
                                      key={c}
                                      className="px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded text-xs border border-gray-700 font-mono"
                                    >
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell whitespace-nowrap">
                                {row.timeframe || '—'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1 justify-end flex-wrap">
                                  <button
                                    onClick={() => setPreviewPeriod(isPreviewing ? null : row.period)}
                                    className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600 transition"
                                  >
                                    {isPreviewing ? 'Hide' : 'Map'}
                                  </button>
                                  {isCustom ? (
                                    <>
                                      <button
                                        onClick={() => openEdit(row)}
                                        className="px-2 py-1 bg-blue-600/80 text-white rounded text-xs hover:bg-blue-600 transition"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteCustom(row.period)}
                                        className="px-2 py-1 bg-red-600/80 text-white rounded text-xs hover:bg-red-600 transition"
                                      >
                                        Delete
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => openEdit(row)}
                                      title="Save as a custom override"
                                      className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600 transition whitespace-nowrap"
                                    >
                                      Override
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {isPreviewing && (
                              <tr className="bg-gray-900/60">
                                <td colSpan={5} className="px-4 py-3">
                                  <RegionMapPreview countries={row.countries} height={150} />
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* Tab B — AI Cache                                                  */}
        {/* ================================================================ */}
        {activeTab === 'cache' && (
          <div className="space-y-5">

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Legacy Cache" value={Object.keys(legacyAICache).length} color="blue" note="regionCache key" />
              <StatCard label="Per-entry Cache" value={perEntryStats.entries} color="blue" note={`${perEntryStats.size} KB`} />
              <StatCard
                label="Oldest Entry"
                value={perEntryStats.oldest ? new Date(perEntryStats.oldest).toLocaleDateString() : '—'}
                color="gray"
                isText
              />
              <StatCard
                label="Newest Entry"
                value={perEntryStats.newest ? new Date(perEntryStats.newest).toLocaleDateString() : '—'}
                color="gray"
                isText
              />
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              <input
                type="text"
                placeholder="Search cached period…"
                value={cacheSearch}
                onChange={(e) => setCacheSearch(e.target.value)}
                className="flex-1 min-w-[240px] px-3 py-2 bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
              />
              {totalCacheEntries > 0 && (
                <button
                  onClick={handleClearLegacyCache}
                  className="px-3 py-2 bg-gray-800 text-red-400 rounded-lg text-sm border border-red-900/40 hover:bg-red-900/20 transition"
                >
                  Clear All Cache
                </button>
              )}
              {Object.keys(legacyAICache).length > 0 && (
                <button
                  onClick={() =>
                    downloadJSON(
                      Object.entries(legacyAICache).map(([period, entry]) => ({ period, ...entry })),
                      'ai-cache.json'
                    )
                  }
                  className="px-3 py-2 bg-gray-700 text-gray-200 rounded-lg text-sm border border-gray-600 hover:bg-gray-600 transition"
                >
                  Export Cache JSON
                </button>
              )}
            </div>

            {/* Legacy cache table */}
            {cacheEntries.length === 0 && perEntryStats.entries === 0 ? (
              <div className="text-center text-gray-500 py-16 text-sm bg-gray-900/60 rounded-lg border border-gray-700">
                No AI cache entries.{' '}
                <span className="text-gray-600">
                  They appear here after the map looks up unknown time periods via the AI API.
                </span>
              </div>
            ) : (
              <div className="bg-gray-900/80 rounded-lg border border-gray-700 overflow-hidden">
                {cacheEntries.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-900/60 border-b border-gray-700">
                        <tr>
                          <th className="text-left px-4 py-3 text-gray-400 font-medium">Period</th>
                          <th className="text-left px-4 py-3 text-gray-400 font-medium">Countries</th>
                          <th className="text-left px-4 py-3 text-gray-400 font-medium hidden lg:table-cell">Timeframe</th>
                          <th className="text-right px-4 py-3 text-gray-400 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {cacheEntries.map(([period, entry]) => (
                          <tr key={period} className="hover:bg-white/5 transition">
                            <td className="px-4 py-3">
                              <p className="font-medium text-white">{period}</p>
                              {entry.description && (
                                <p className="text-gray-500 text-xs mt-0.5">{entry.description}</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {entry.countries.map((c) => (
                                  <span
                                    key={c}
                                    className="px-1.5 py-0.5 bg-blue-900/40 text-blue-300 rounded text-xs border border-blue-800/40 font-mono"
                                  >
                                    {c}
                                  </span>
                                ))}
                                {entry.countries.length === 0 && (
                                  <span className="text-gray-600 text-xs italic">none</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell whitespace-nowrap">
                              {entry.timeframe || '—'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1 justify-end">
                                <button
                                  onClick={() => handlePromoteToCustom(period, entry)}
                                  title="Save as a custom override (takes priority over AI cache)"
                                  className="px-2 py-1 bg-purple-600/80 text-white rounded text-xs hover:bg-purple-600 transition whitespace-nowrap"
                                >
                                  → Custom
                                </button>
                                <button
                                  onClick={() => handleDeleteLegacyCache(period)}
                                  className="px-2 py-1 bg-red-600/80 text-white rounded text-xs hover:bg-red-600 transition"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8 text-sm">
                    {cacheSearch
                      ? `No cache entries matching "${cacheSearch}"`
                      : 'Legacy cache is empty.'}
                  </p>
                )}
                {perEntryStats.entries > 0 && (
                  <div className="border-t border-gray-700 px-4 py-3 text-xs text-gray-500 flex justify-between items-center">
                    <span>{perEntryStats.entries} per-entry cache item{perEntryStats.entries !== 1 ? 's' : ''} ({perEntryStats.size} KB) — stored as <code className="font-mono bg-gray-800 px-1 rounded">regionCache_*</code> keys</span>
                    <button
                      onClick={() => { clearPerEntryCache(); refresh(); }}
                      className="text-red-400 hover:text-red-300 transition text-xs"
                    >
                      Clear per-entry cache
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* Tab C — Add / Edit form                                          */}
        {/* ================================================================ */}
        {activeTab === 'add' && (
          <div className="max-w-xl mx-auto">
            <div className="bg-gray-900/80 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-1">
                {editingPeriod ? `Edit: ${editingPeriod}` : 'Add Custom Mapping'}
              </h2>
              <p className="text-gray-400 text-sm mb-5">
                {editingPeriod
                  ? 'Editing this entry saves it as a custom override.'
                  : 'New entries are saved as custom overrides — they take priority over static and AI-resolved mappings.'}
              </p>
              <RegionForm
                initialPeriod={editingPeriod ?? undefined}
                initialData={editingData}
                onSave={handleFormSave}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        )}

      </div>
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
  isText,
}: {
  label: string;
  value: number | string;
  color: 'gray' | 'purple' | 'blue' | 'teal';
  note?: string;
  isText?: boolean;
}) {
  const valueColor = { gray: 'text-gray-300', purple: 'text-purple-300', blue: 'text-blue-300', teal: 'text-teal-300' }[color];
  const cardBg = {
    gray:   'bg-gray-800/60 border-gray-700',
    purple: 'bg-purple-900/20 border-purple-800/40',
    blue:   'bg-blue-900/20 border-blue-800/40',
    teal:   'bg-teal-900/20 border-teal-800/40',
  }[color];

  return (
    <div className={`rounded-lg border p-4 ${cardBg}`}>
      <p className={`${isText ? 'text-lg' : 'text-3xl'} font-bold ${valueColor}`}>{value}</p>
      <p className="text-gray-300 text-sm mt-1 font-medium">{label}</p>
      {note && <p className="text-gray-500 text-xs mt-0.5">{note}</p>}
    </div>
  );
}
