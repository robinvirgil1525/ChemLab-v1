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
  { stroke: '#1d4ed8', fill: 'rgba(29, 78, 216, 0.16)', text: 'text-blue-700', hex: '#1d4ed8' },
  { stroke: '#0d9488', fill: 'rgba(13, 148, 136, 0.16)', text: 'text-teal-700', hex: '#0d9488' },
  { stroke: '#d97706', fill: 'rgba(217, 119, 6, 0.16)', text: 'text-amber-700', hex: '#d97706' },
  { stroke: '#9333ea', fill: 'rgba(147, 51, 234, 0.16)', text: 'text-purple-700', hex: '#9333ea' },
  { stroke: '#e11d48', fill: 'rgba(225, 29, 72, 0.16)', text: 'text-rose-700', hex: '#e11d48' },
  { stroke: '#0284c7', fill: 'rgba(2, 132, 199, 0.16)', text: 'text-sky-700', hex: '#0284c7' },
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
        backgroundColor: 'rgba(225, 29, 72, 0.18)',
        borderBottom: '2px solid rgba(225, 29, 72, 0.65)',
      };
    }
    const min = Math.min(...valuesArray);
    const max = Math.max(...valuesArray);
    const ratio = max > min ? (value - min) / (max - min) : 0.5;
    const alpha = (0.06 + ratio * 0.24).toFixed(2);
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

  // Compute Pandas DataFrame statistical summary on the filtered comparison list
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

  // Radar Chart Geometry (6 radial axes normalized against Lipinski/Veber maxima)
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
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-teal-700 font-semibold">
              PAGE 06 · PANDAS DATAFRAME MATRIX & MULTI-MOLECULE COMPARISON
            </p>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
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
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
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
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={onNavigateNext}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
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
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Enter Any SMILES Notation or Molecule Name to Add to Comparison:
              </label>
              <input
                id="custom-compare-smiles"
                type="text"
                value={customCompareInput}
                onChange={(e) => setCustomCompareInput(e.target.value)}
                placeholder="Type any SMILES (e.g., CCO, c1ccccc1, CC(=O)O) or compound name..."
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 focus:bg-white text-slate-900"
              />
            </div>

            <div className="lg:col-span-3">
              <label
                htmlFor="compare-example-dropdown"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
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
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-900 text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
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
                className="w-full px-4 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
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
            <div className="text-xs font-medium text-rose-700 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          {/* Quick-Add Example Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-medium text-slate-500 mr-1">
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
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 opacity-80'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer'
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
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs font-mono uppercase text-blue-900 font-semibold">
              TABULAR DATAFRAME INSPECTOR (PANDAS EQUIVALENT)
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Physicochemical Descriptor Matrix & Statistical Summary
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowHeatmap((h) => !h)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                showHeatmap
                  ? 'bg-blue-900 text-white border-blue-900'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            >
              {showHeatmap ? 'Heatmap Shading: ON' : 'Heatmap Shading: OFF'}
            </button>
            <span className="text-xs font-mono text-slate-500">
              Showing {filteredComparisonList.length} of {comparisonList.length} Compounds
            </span>
          </div>
        </div>

        {/* Search & Molecular Property Filter Bar */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-mono font-bold uppercase text-slate-700 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-900" />
              Filter Comparison Matrix by Molecular Properties
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Search by Name, SMILES, or Formula */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Search Name / SMILES / Formula
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., Aspirin, C9H8O4, CCO..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
                />
              </div>
            </div>

            {/* 2. Max Molecular Weight (MW <= X Da) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Max Molecular Weight (≤ Da)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={maxMwFilter}
                onChange={(e) => setMaxMwFilter(e.target.value)}
                placeholder="Any MW (e.g., 200)"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
              />
            </div>

            {/* 3. Max Number of Heavy Atoms (Heavy Atoms <= X) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Max Heavy Atoms (≤ Count)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={maxHeavyAtomsFilter}
                onChange={(e) => setMaxHeavyAtomsFilter(e.target.value)}
                placeholder="Any count (e.g., 15)"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
              />
            </div>

            {/* 4. Lipinski Rule of Five Verdict */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Lipinski Ro5 Compliance
              </label>
              <select
                value={lipinskiFilter}
                onChange={(e) =>
                  setLipinskiFilter(e.target.value as 'all' | 'pass' | 'fail')
                }
                className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 cursor-pointer"
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
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-600 px-1">
            <span>
              Heatmap Gradient: Lighter shade = Lower relative value · Darker shade = Higher relative value · Rose underline = Exceeds Lipinski/Veber limit
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold font-mono">
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
            <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
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
                      isCurrent ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-xs mr-2 align-middle"
                        style={{ backgroundColor: color.hex }}
                      />
                      {mol.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-[160px] truncate" title={mol.canonicalSmiles}>
                      {mol.canonicalSmiles}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{mol.formula}</td>
                    <td
                      style={getHeatmapStyle(mol.molecularWeight, mwArr, '30, 58, 138', 500)}
                      className="py-2.5 px-3 text-right font-semibold text-slate-900"
                    >
                      {mol.molecularWeight.toFixed(2)}
                    </td>
                    <td
                      style={getHeatmapStyle(mol.heavyAtomCount, heavyArr, '2, 132, 199')}
                      className="py-2.5 px-3 text-right font-semibold text-blue-900"
                    >
                      {mol.heavyAtomCount}
                    </td>
                    <td
                      style={getHeatmapStyle(mol.xlogp, logpArr, '13, 148, 136', 5)}
                      className="py-2.5 px-3 text-right text-slate-800"
                    >
                      {mol.xlogp.toFixed(2)}
                    </td>
                    <td
                      style={getHeatmapStyle(mol.tpsa, tpsaArr, '217, 119, 6', 140)}
                      className="py-2.5 px-3 text-right text-slate-800"
                    >
                      {mol.tpsa.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700">
                      {mol.hBondDonors} / {mol.hBondAcceptors}
                    </td>
                    <td
                      style={getHeatmapStyle(mol.rotatableBonds, rotArr, '147, 51, 234', 10)}
                      className="py-2.5 px-3 text-right text-slate-700"
                    >
                      {mol.rotatableBonds}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={
                          mol.lipinski.passes
                            ? 'text-emerald-700 font-semibold'
                            : 'text-rose-700 font-semibold'
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
                          className="px-2 py-1 text-[11px] font-sans font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                        >
                          Inspect 3D
                        </button>
                        {comparisonList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onRemoveFromComparison(mol.id)}
                            title="Remove from Comparison"
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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
                  <td colSpan={11} className="py-8 text-center font-sans text-xs text-slate-500">
                    No molecules match your current filter criteria. Click{' '}
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="text-blue-900 font-semibold underline cursor-pointer"
                    >
                      Reset Filters
                    </button>{' '}
                    to view all {comparisonList.length} compounds.
                  </td>
                </tr>
              )}

              {/* Statistical Summary Row (df.describe() mean) */}
              {filteredComparisonList.length > 0 && (
                <tr className="bg-slate-100/90 font-semibold text-slate-900 border-t-2 border-slate-300">
                  <td className="py-2.5 px-3 font-sans">
                    Dataset Mean (df.mean)
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">—</td>
                  <td className="py-2.5 px-3 text-slate-500">N = {filteredComparisonList.length}</td>
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
                  <td className="py-2.5 px-3 text-slate-600" colSpan={2}>
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
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono uppercase text-teal-700 font-semibold">
              RADAR PARAMETER CALIBRATION
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Normalized Lipinski & Veber Chemical Space Radar
            </h3>
            <p className="text-xs text-slate-600 mt-1">
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
                      stroke={level === 1.0 ? '#94a3b8' : '#e2e8f0'}
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
                        stroke="#cbd5e1"
                        strokeWidth={1}
                      />
                      <text
                        x={labelPt.x}
                        y={labelPt.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[10px] font-mono fill-slate-700 font-semibold"
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
          <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-3 text-xs">
            {comparisonList.slice(0, 6).map((mol, idx) => {
              const color = SERIES_COLORS[idx % SERIES_COLORS.length];
              return (
                <div key={mol.id} className="flex items-center gap-1.5 font-medium text-slate-800">
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
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono uppercase text-blue-900 font-semibold">
                  QUANTITATIVE PROPERTY DISTRIBUTION
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Descriptor Comparison Across Analyzed Compounds
                </h3>
              </div>

              {/* Segmented Metric Selector */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
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
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
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
                      <span className="font-semibold text-slate-900">
                        {mol.name}
                      </span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {typeof rawVal === 'number' ? rawVal.toFixed(2) : rawVal}
                        {unit}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-md overflow-hidden">
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

          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-600">
            <strong>Structure-Property Insight:</strong> Compare how adding polar substituents (hydroxyl, carboxyl, amide groups) elevates TPSA and lowers XLogP, whereas aromatic rings or hydrocarbon chains increase XLogP lipophilicity.
          </div>
        </div>
      </div>
    </div>
  );
};
