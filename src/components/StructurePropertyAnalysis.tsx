import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Download,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { MoleculeRecord } from '../types/chemistry';
import { BENCHMARK_MOLECULES } from '../services/cheminformatics';
import {
  exportMoleculesToCsv,
  exportMoleculesToJson,
} from '../services/pdfReportGenerator';

interface StructurePropertyAnalysisProps {
  comparisonList: MoleculeRecord[];
  activeMoleculeId: string;
  onSelectMoleculeForViewer: (molecule: MoleculeRecord) => void;
  onAddPresetBySmiles: (smiles: string) => Promise<void>;
  onRemoveFromComparison: (id: string) => void;
  onNavigateNext: () => void;
}

const SERIES_COLORS = [
  { stroke: '#22d3ee', fill: 'rgba(34, 211, 238, 0.18)', text: 'text-cyan-400', hex: '#22d3ee' },
  { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.18)', text: 'text-emerald-400', hex: '#10b981' },
  { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.18)', text: 'text-amber-400', hex: '#f59e0b' },
  { stroke: '#a855f7', fill: 'rgba(168, 85, 247, 0.18)', text: 'text-purple-400', hex: '#a855f7' },
  { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.18)', text: 'text-rose-400', hex: '#f43f5e' },
  { stroke: '#38bdf8', fill: 'rgba(56, 189, 248, 0.18)', text: 'text-sky-400', hex: '#38bdf8' },
];

export const StructurePropertyAnalysis: React.FC<
  StructurePropertyAnalysisProps
> = ({
  comparisonList,
  activeMoleculeId,
  onSelectMoleculeForViewer,
  onAddPresetBySmiles,
  onRemoveFromComparison,
  onNavigateNext,
}) => {
  const [selectedMetricBar, setSelectedMetricBar] = useState<
    'molecularWeight' | 'xlogp' | 'tpsa' | 'complexity'
  >('molecularWeight');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [customCompareInput, setCustomCompareInput] = useState<string>('');
  const [isAddingCustom, setIsAddingCustom] = useState<boolean>(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Table Search, Molecular Property Filter, & Heatmap States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxMwFilter, setMaxMwFilter] = useState<string>('');
  const [maxHeavyAtomsFilter, setMaxHeavyAtomsFilter] = useState<string>('');
  const [lipinskiFilter, setLipinskiFilter] = useState<'all' | 'pass' | 'fail'>('all');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);

  const getHeatmapStyle = (
    value: number,
    valuesArray: number[],
    rgb: string,
    violationThreshold?: number
  ): React.CSSProperties => {
    if (!showHeatmap || valuesArray.length === 0) return {};
    if (violationThreshold !== undefined && value > violationThreshold) {
      return {
        backgroundColor: 'rgba(244, 63, 94, 0.22)',
        borderBottom: '2px solid rgba(244, 63, 94, 0.75)',
      };
    }
    const min = Math.min(...valuesArray);
    const max = Math.max(...valuesArray);
    const ratio = max > min ? (value - min) / (max - min) : 0.5;
    const alpha = (0.08 + ratio * 0.26).toFixed(2);
    return {
      backgroundColor: `rgba(${rgb}, ${alpha})`,
    };
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    Boolean(maxMwFilter.trim()) ||
    Boolean(maxHeavyAtomsFilter.trim()) ||
    lipinskiFilter !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setMaxMwFilter('');
    setMaxHeavyAtomsFilter('');
    setLipinskiFilter('all');
  };

  const filteredComparisonList = comparisonList.filter((mol) => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const matchesText =
        mol.name.toLowerCase().includes(q) ||
        mol.canonicalSmiles.toLowerCase().includes(q) ||
        mol.formula.toLowerCase().includes(q);
      if (!matchesText) return false;
    }

    if (maxMwFilter.trim() !== '') {
      const maxMwNum = Number(maxMwFilter);
      if (!Number.isNaN(maxMwNum) && maxMwNum > 0 && mol.molecularWeight > maxMwNum) {
        return false;
      }
    }

    if (maxHeavyAtomsFilter.trim() !== '') {
      const maxHeavyNum = Number(maxHeavyAtomsFilter);
      if (!Number.isNaN(maxHeavyNum) && maxHeavyNum > 0 && mol.heavyAtomCount > maxHeavyNum) {
        return false;
      }
    }

    if (lipinskiFilter === 'pass' && !mol.lipinski.passes) return false;
    if (lipinskiFilter === 'fail' && mol.lipinski.passes) return false;

    return true;
  });

  const handleQuickAddPreset = async (id: string, smiles: string) => {
    setAddingId(id);
    setAddError(null);
    try {
      await onAddPresetBySmiles(smiles);
    } catch (err: any) {
      setAddError(err?.message || 'Unable to add molecule.');
    } finally {
      setAddingId(null);
    }
  };

  const handleAddCustomMolecule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCompareInput.trim()) return;
    setIsAddingCustom(true);
    setAddError(null);
    try {
      await onAddPresetBySmiles(customCompareInput.trim());
      setCustomCompareInput('');
    } catch (err: any) {
      setAddError(
        err?.message || 'Invalid SMILES string. Please check syntax and try again.'
      );
    } finally {
      setIsAddingCustom(false);
    }
  };

  const count = Math.max(1, filteredComparisonList.length);
  const meanMw =
    filteredComparisonList.reduce((acc, m) => acc + m.molecularWeight, 0) / count;
  const meanLogP =
    filteredComparisonList.reduce((acc, m) => acc + m.xlogp, 0) / count;
  const meanTpsa =
    filteredComparisonList.reduce((acc, m) => acc + m.tpsa, 0) / count;
  const meanRotB =
    filteredComparisonList.reduce((acc, m) => acc + m.rotatableBonds, 0) / count;
  const meanQed =
    filteredComparisonList.reduce((acc, m) => acc + m.qedEstimate, 0) / count;

  const radarAxes = [
    { label: 'MW (500 Da)', getNorm: (m: MoleculeRecord) => Math.min(1.15, m.molecularWeight / 500) },
    { label: 'XLogP (5.0)', getNorm: (m: MoleculeRecord) => Math.min(1.15, Math.max(0.08, (m.xlogp + 1) / 6)) },
    { label: 'TPSA (140 Å²)', getNorm: (m: MoleculeRecord) => Math.min(1.15, m.tpsa / 140) },
    { label: 'HBD (5)', getNorm: (m: MoleculeRecord) => Math.min(1.15, m.hBondDonors / 5) },
    { label: 'HBA (10)', getNorm: (m: MoleculeRecord) => Math.min(1.15, m.hBondAcceptors / 10) },
    { label: 'RotBonds (10)', getNorm: (m: MoleculeRecord) => Math.min(1.15, m.rotatableBonds / 10) },
  ];

  const cx = 175;
  const cy = 155;
  const maxR = 105;

  const getPoint = (axisIdx: number, normalizedRatio: number) => {
    const angle = (Math.PI * 2 * axisIdx) / radarAxes.length - Math.PI / 2;
    const r = normalizedRatio * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  return (
    <div className="space-y-6">
      {/* Header & Custom SMILES Comparison Adder */}
      <section className="bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-cyan-700 dark:text-cyan-400 font-semibold">
              PAGE 06 · PANDAS DATAFRAME MATRIX & MULTI-MOLECULE COMPARISON
            </p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              Structure-Property Analysis ({comparisonList.length} Compounds)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                exportMoleculesToCsv(
                  comparisonList,
                  'SRM_Cheminformatics_Comparison_DataFrame.csv'
                )
              }
              className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#131C31] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export DataFrame CSV
            </button>
            <button
              type="button"
              onClick={() =>
                exportMoleculesToJson(
                  comparisonList,
                  'SRM_Cheminformatics_Comparison_DataFrame.json'
                )
              }
              className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#131C31] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={onNavigateNext}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              Next: Assessment & PDF
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Add Custom SMILES or Select Example Molecule to Compare */}
        <form onSubmit={handleAddCustomMolecule} className="pt-4 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
            <div className="lg:col-span-6">
              <label
                htmlFor="custom-compare-smiles"
                className="block text-xs font-mono uppercase tracking-wider font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Enter Any SMILES Notation or Molecule Name to Add to Comparison:
              </label>
              <input
                id="custom-compare-smiles"
                type="text"
                value={customCompareInput}
                onChange={(e) => setCustomCompareInput(e.target.value)}
                placeholder="Type any SMILES (e.g., CCO, c1ccccc1, CC(=O)O) or compound name..."
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-[#131C31] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="lg:col-span-3">
              <label
                htmlFor="compare-example-dropdown"
                className="block text-xs font-mono uppercase tracking-wider font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Or Add Example Molecule:
              </label>
              <select
                id="compare-example-dropdown"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleQuickAddPreset(e.target.value, e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-100 dark:bg-[#131C31] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="" disabled>
                  -- Add Example Molecule --
                </option>
                {BENCHMARK_MOLECULES.map((preset) => (
                  <option key={preset.id} value={preset.smiles}>
                    + {preset.name} ({preset.smiles})
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3">
              <button
                type="submit"
                disabled={isAddingCustom || !customCompareInput.trim()}
                className="w-full px-4 py-2.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isAddingCustom ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Adding Molecule...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add SMILES to Comparison
                  </>
                )}
              </button>
            </div>
          </div>

          {addError && (
            <div className="text-xs font-medium text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          {/* Quick-Add Example Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 mr-1">
              Quick Add Examples:
            </span>
            {BENCHMARK_MOLECULES.map((preset) => {
              const alreadyIn = comparisonList.some(
                (m) =>
                  m.canonicalSmiles === preset.smiles || m.name === preset.name
              );
              return (
                <button
                  key={preset.id}
                  type="button"
                  disabled={alreadyIn || addingId === preset.id}
                  onClick={() => handleQuickAddPreset(preset.id, preset.smiles)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    alreadyIn
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 opacity-85'
                      : 'bg-slate-50 dark:bg-[#131C31] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-cyan-500/40 cursor-pointer'
                  }`}
                >
                  {alreadyIn ? '✓ ' : '+ '}
                  {preset.name}
                </button>
              );
            })}
          </div>
        </form>
      </section>

      {/* Pandas-Style Multi-Molecule DataFrame Comparison Table */}
      <section className="bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-700 dark:text-cyan-400 font-semibold">
              TABULAR DATAFRAME INSPECTOR (PANDAS EQUIVALENT)
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Physicochemical Descriptor Matrix & Statistical Summary
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowHeatmap((h) => !h)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                showHeatmap
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                  : 'bg-slate-100 dark:bg-[#131C31] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
            >
              {showHeatmap ? 'Heatmap Shading: ON' : 'Heatmap Shading: OFF'}
            </button>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
              Showing {filteredComparisonList.length} of {comparisonList.length} Compounds
            </span>
          </div>
        </div>

        {/* Search & Molecular Property Filter Bar */}
        <div className="p-4 bg-slate-50 dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              Filter Comparison Matrix by Molecular Properties
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 rounded-md flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Search by Name, SMILES, or Formula */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Search Name / SMILES / Formula
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., Aspirin, C9H8O4, CCO..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-[#0D1322] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* 2. Max Molecular Weight (MW <= X Da) */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Max Molecular Weight (≤ Da)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={maxMwFilter}
                onChange={(e) => setMaxMwFilter(e.target.value)}
                placeholder="Any MW (e.g., 200)"
                className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-[#0D1322] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* 3. Max Number of Heavy Atoms (Heavy Atoms <= X) */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Max Heavy Atoms (≤ Count)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={maxHeavyAtomsFilter}
                onChange={(e) => setMaxHeavyAtomsFilter(e.target.value)}
                placeholder="Any count (e.g., 15)"
                className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-[#0D1322] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* 4. Lipinski Rule of Five Verdict */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Lipinski Ro5 Compliance
              </label>
              <select
                value={lipinskiFilter}
                onChange={(e) =>
                  setLipinskiFilter(e.target.value as 'all' | 'pass' | 'fail')
                }
                className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-[#0D1322] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="all">All Compounds</option>
                <option value="pass">Lipinski PASS Only</option>
                <option value="fail">Lipinski Violations Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Heatmap Intensity Legend */}
        {showHeatmap && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400 px-1">
            <span>
              Heatmap Gradient: Lighter shade = Lower relative value · Stronger shade = Higher relative value · Rose underline = Exceeds Lipinski/Veber limit
            </span>
          </div>
        )}

        {/* Mobile-friendly horizontal scrolling container for full table */}
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[780px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131C31] text-slate-700 dark:text-slate-300 font-semibold font-mono">
                <th className="py-2.5 px-3">Compound</th>
                <th className="py-2.5 px-3">SMILES</th>
                <th className="py-2.5 px-3">Formula</th>
                <th className="py-2.5 px-3 text-right">MW (Da)</th>
                <th className="py-2.5 px-3 text-right">Heavy Atoms</th>
                <th className="py-2.5 px-3 text-right">XLogP</th>
                <th className="py-2.5 px-3 text-right">TPSA (Å²)</th>
                <th className="py-2.5 px-3 text-right">HBD / HBA</th>
                <th className="py-2.5 px-3 text-right">RotB</th>
                <th className="py-2.5 px-3">Lipinski Ro5</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono tabular-nums">
              {filteredComparisonList.map((mol, idx) => {
                const color = SERIES_COLORS[idx % SERIES_COLORS.length];
                const isCurrent = mol.id === activeMoleculeId;
                const mwArr = filteredComparisonList.map((m) => m.molecularWeight);
                const heavyArr = filteredComparisonList.map((m) => m.heavyAtomCount);
                const logpArr = filteredComparisonList.map((m) => m.xlogp);
                const tpsaArr = filteredComparisonList.map((m) => m.tpsa);
                const rotArr = filteredComparisonList.map((m) => m.rotatableBonds);

                return (
                  <tr
                    key={mol.id}
                    className={`transition-colors ${
                      isCurrent
                        ? 'bg-cyan-50/60 dark:bg-cyan-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-[#131C31]/70'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-slate-100">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-xs mr-2 align-middle"
                        style={{ backgroundColor: color.hex }}
                      />
                      {mol.name}
                    </td>
                    <td
                      className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-[160px] truncate"
                      title={mol.canonicalSmiles}
                    >
                      {mol.canonicalSmiles}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {mol.formula}
                    </td>
                    <td
                      style={getHeatmapStyle(mol.molecularWeight, mwArr, '6, 182, 212', 500)}
                      className="py-2.5 px-3 text-right font-semibold text-slate-900 dark:text-slate-100"
                    >
                      {mol.molecularWeight.toFixed(2)}
                    </td>
                    <td
                      style={getHeatmapStyle(mol.heavyAtomCount, heavyArr, '56, 189, 248')}
                      className="py-2.5 px-3 text-right font-semibold text-cyan-800 dark:text-cyan-300"
                    >
                      {mol.heavyAtomCount}
                    </td>
                    <td
                      style={getHeatmapStyle(mol.xlogp, logpArr, '16, 185, 129', 5)}
                      className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200"
                    >
                      {mol.xlogp.toFixed(2)}
                    </td>
                    <td
                      style={getHeatmapStyle(mol.tpsa, tpsaArr, '245, 158, 11', 140)}
                      className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200"
                    >
                      {mol.tpsa.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      {mol.hBondDonors} / {mol.hBondAcceptors}
                    </td>
                    <td
                      style={getHeatmapStyle(mol.rotatableBonds, rotArr, '168, 85, 247', 10)}
                      className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300"
                    >
                      {mol.rotatableBonds}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={
                          mol.lipinski.passes
                            ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                            : 'text-rose-700 dark:text-rose-400 font-semibold'
                        }
                      >
                        {mol.lipinski.passes
                          ? `● PASS (${mol.lipinski.violations})`
                          : `▲ FAIL (${mol.lipinski.violations})`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectMoleculeForViewer(mol)}
                          title="Inspect in 2D/3D Visualizer"
                          className="px-2 py-1 text-[11px] font-sans font-semibold text-cyan-900 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 border border-cyan-200 dark:border-cyan-800 rounded transition-colors cursor-pointer"
                        >
                          Inspect 3D
                        </button>
                        {comparisonList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onRemoveFromComparison(mol.id)}
                            title="Remove from Comparison"
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredComparisonList.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="py-8 text-center font-sans text-xs text-slate-500 dark:text-slate-400"
                  >
                    No molecules match your current filter criteria. Click{' '}
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="text-cyan-700 dark:text-cyan-400 font-semibold underline cursor-pointer"
                    >
                      Reset Filters
                    </button>{' '}
                    to view all {comparisonList.length} compounds.
                  </td>
                </tr>
              )}

              {/* Statistical Summary Row (df.describe() mean) */}
              {filteredComparisonList.length > 0 && (
                <tr className="bg-slate-100 dark:bg-[#131C31] font-semibold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                  <td className="py-2.5 px-3 font-sans">
                    Dataset Mean (df.mean)
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">—</td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                    N = {filteredComparisonList.length}
                  </td>
                  <td className="py-2.5 px-3 text-right">{meanMw.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right">
                    {(
                      filteredComparisonList.reduce((acc, m) => acc + m.heavyAtomCount, 0) /
                      count
                    ).toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right">{meanLogP.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right">{meanTpsa.toFixed(1)}</td>
                  <td className="py-2.5 px-3 text-right">—</td>
                  <td className="py-2.5 px-3 text-right">{meanRotB.toFixed(1)}</td>
                  <td
                    className="py-2.5 px-3 text-slate-600 dark:text-slate-300"
                    colSpan={2}
                  >
                    Avg QED: {meanQed.toFixed(2)} · Pass Rate:{' '}
                    {Math.round(
                      (filteredComparisonList.filter((m) => m.lipinski.passes).length /
                        count) *
                        100
                    )}
                    %
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive Radar Spider Chart & Comparative Bar Plot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Normalized 6-Axis Drug-Likeness Radar Spider Chart (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-700 dark:text-cyan-400 font-semibold">
              RADAR PARAMETER CALIBRATION
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Normalized Lipinski & Veber Chemical Space Radar
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Outer polygon (100% radius) represents the maximum Lipinski/Veber threshold (MW 500 Da, XLogP 5, TPSA 140 Å², HBD 5, HBA 10, RotBonds 10).
            </p>

            <div className="mt-4 flex flex-col items-center">
              <svg
                viewBox="0 0 350 310"
                className="w-full max-w-[360px] h-auto overflow-visible"
              >
                {/* Concentric hexagonal grid rings */}
                {[0.25, 0.5, 0.75, 1.0].map((level) => {
                  const pts = radarAxes
                    .map((_, idx) => {
                      const p = getPoint(idx, level);
                      return `${p.x},${p.y}`;
                    })
                    .join(' ');
                  return (
                    <polygon
                      key={level}
                      points={pts}
                      fill="none"
                      stroke={level === 1.0 ? '#06b6d4' : '#334155'}
                      strokeWidth={level === 1.0 ? 1.5 : 1}
                      strokeDasharray={level === 1.0 ? '3,3' : undefined}
                    />
                  );
                })}

                {/* Radial spokes and vertex labels */}
                {radarAxes.map((axis, idx) => {
                  const endPt = getPoint(idx, 1.12);
                  const labelPt = getPoint(idx, 1.28);
                  return (
                    <g key={axis.label}>
                      <line
                        x1={cx}
                        y1={cy}
                        x2={endPt.x}
                        y2={endPt.y}
                        stroke="#475569"
                        strokeWidth={1}
                      />
                      <text
                        x={labelPt.x}
                        y={labelPt.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[10px] font-mono fill-slate-700 dark:fill-slate-300 font-semibold"
                      >
                        {axis.label}
                      </text>
                    </g>
                  );
                })}

                {/* Molecule Polygons */}
                {comparisonList.slice(0, 6).map((mol, mIdx) => {
                  const color = SERIES_COLORS[mIdx % SERIES_COLORS.length];
                  const polyPoints = radarAxes
                    .map((ax, aIdx) => {
                      const pt = getPoint(aIdx, ax.getNorm(mol));
                      return `${pt.x},${pt.y}`;
                    })
                    .join(' ');
                  return (
                    <g key={mol.id}>
                      <polygon
                        points={polyPoints}
                        fill={color.fill}
                        stroke={color.stroke}
                        strokeWidth={2}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Radar Legend */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 text-xs">
            {comparisonList.slice(0, 6).map((mol, idx) => {
              const color = SERIES_COLORS[idx % SERIES_COLORS.length];
              return (
                <div
                  key={mol.id}
                  className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200"
                >
                  <span
                    className="w-3 h-3 rounded-xs inline-block"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span>{mol.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Multi-Compound Quantitative Descriptor Bar Comparison (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-700 dark:text-cyan-400 font-semibold">
                  QUANTITATIVE PROPERTY DISTRIBUTION
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  Descriptor Comparison Across Analyzed Compounds
                </h3>
              </div>

              {/* Segmented Metric Selector */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-lg">
                {(
                  [
                    { id: 'molecularWeight', label: 'MW (Da)' },
                    { id: 'xlogp', label: 'XLogP' },
                    { id: 'tpsa', label: 'TPSA (Å²)' },
                    { id: 'complexity', label: 'Complexity' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedMetricBar(tab.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedMetricBar === tab.id
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {comparisonList.map((mol, idx) => {
                const color = SERIES_COLORS[idx % SERIES_COLORS.length];
                const rawVal = mol[selectedMetricBar];
                const maxRef =
                  selectedMetricBar === 'molecularWeight'
                    ? 500
                    : selectedMetricBar === 'xlogp'
                    ? 5.0
                    : selectedMetricBar === 'tpsa'
                    ? 140
                    : 500;
                const widthPct = Math.min(
                  100,
                  Math.max(6, (Math.max(0.2, rawVal) / maxRef) * 100)
                );
                const unit =
                  selectedMetricBar === 'molecularWeight'
                    ? ' Da'
                    : selectedMetricBar === 'tpsa'
                    ? ' Å²'
                    : '';

                return (
                  <div key={mol.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {mol.name}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {typeof rawVal === 'number' ? rawVal.toFixed(2) : rawVal}
                        {unit}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
                      <div
                        className="h-full rounded-md transition-all duration-200"
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: color.hex,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <strong className="text-slate-900 dark:text-slate-200">
              Structure-Property Insight:
            </strong>{' '}
            Compare how adding polar substituents (hydroxyl, carboxyl, amide groups) elevates TPSA and lowers XLogP, whereas aromatic rings or hydrocarbon chains increase XLogP lipophilicity.
          </div>
        </div>
      </div>
    </div>
  );
};
