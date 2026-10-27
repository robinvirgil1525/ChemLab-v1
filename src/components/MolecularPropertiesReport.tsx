import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Plus,
} from 'lucide-react';
import { MoleculeRecord } from '../types/chemistry';
import {
  exportMoleculesToCsv,
  exportMoleculesToJson,
} from '../services/pdfReportGenerator';

interface MolecularPropertiesReportProps {
  activeMolecule: MoleculeRecord;
  isInComparison: boolean;
  onAddToComparison: (molecule: MoleculeRecord) => void;
  onDownloadSingleReport: () => void;
  onExportFullPdf: () => void;
  onNavigateNext: () => void;
}

export const MolecularPropertiesReport: React.FC<
  MolecularPropertiesReportProps
> = ({
  activeMolecule,
  isInComparison,
  onAddToComparison,
  onDownloadSingleReport,
  onExportFullPdf,
  onNavigateNext,
}) => {
  const handleCsvExport = () => {
    onDownloadSingleReport();
    exportMoleculesToCsv(
      [activeMolecule],
      `${activeMolecule.name.replace(/\s+/g, '_')}_Descriptors.csv`
    );
  };

  const handleJsonExport = () => {
    onDownloadSingleReport();
    exportMoleculesToJson(
      [activeMolecule],
      `${activeMolecule.name.replace(/\s+/g, '_')}_Descriptors.json`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Single Molecule Export Bar */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-teal-700 font-semibold">
              STAGE 04 · PHYSICOCHEMICAL & PHARMACOKINETIC DESCRIPTOR REPORT
            </p>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              {activeMolecule.name} — Complete Molecular Properties
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
              <span>Provenance: {activeMolecule.sourceProvenance}</span>
              <span>·</span>
              <span className="font-mono">
                PubChem CID: {activeMolecule.cid > 0 ? activeMolecule.cid : 'De Novo'}
              </span>
              {activeMolecule.cid > 0 && (
                <>
                  <span>·</span>
                  <a
                    href={`https://pubchem.ncbi.nlm.nih.gov/compound/${activeMolecule.cid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-800 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    View Authoritative PubChem Record
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCsvExport}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Download CSV
            </button>
            <button
              type="button"
              onClick={handleJsonExport}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download JSON
            </button>
            <button
              type="button"
              onClick={() => {
                onDownloadSingleReport();
                onExportFullPdf();
              }}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Download PDF Report
            </button>
            <button
              type="button"
              onClick={onNavigateNext}
              className="px-3.5 py-2 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              Compare Molecules
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Chemical Identifiers & Line Notations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
            <div className="text-slate-500 font-mono uppercase">
              IUPAC SYSTEMATIC NOMENCLATURE
            </div>
            <div className="font-medium text-slate-900 break-words">
              {activeMolecule.iupacName}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
            <div className="text-slate-500 font-mono uppercase">
              CANONICAL SMILES NOTATION
            </div>
            <div className="font-mono text-blue-950 font-semibold break-all">
              {activeMolecule.canonicalSmiles}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
            <div className="text-slate-500 font-mono uppercase">
              STANDARD InChIKey HASH
            </div>
            <div className="font-mono text-slate-900">
              {activeMolecule.inchiKey}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
            <div className="text-slate-500 font-mono uppercase">
              IUPAC InChI STRING
            </div>
            <div className="font-mono text-slate-700 break-all">
              {activeMolecule.inchi}
            </div>
          </div>
        </div>
      </section>

      {/* Primary Physicochemical Metric Grid (Tabular Numerals + Standardized Units) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-mono uppercase text-slate-500">
            FORMULA
          </div>
          <div className="text-xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
            {activeMolecule.formula}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Heavy: {activeMolecule.heavyAtomCount} atoms
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-mono uppercase text-slate-500">
            MOL WEIGHT
          </div>
          <div className="text-xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
            {activeMolecule.molecularWeight.toFixed(2)}
            <span className="text-xs font-mono text-slate-400 ml-1">Da</span>
          </div>
          <div
            className={`text-[11px] font-mono mt-1 ${
              activeMolecule.lipinski.mwPass ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {activeMolecule.lipinski.mwPass ? '● ≤ 500 Da' : '▲ > 500 Da'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-mono uppercase text-slate-500">
            XLOGP3
          </div>
          <div className="text-xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
            {activeMolecule.xlogp.toFixed(2)}
          </div>
          <div
            className={`text-[11px] font-mono mt-1 ${
              activeMolecule.lipinski.logpPass ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {activeMolecule.lipinski.logpPass ? '● ≤ 5.0' : '▲ > 5.0'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-mono uppercase text-slate-500">
            TPSA
          </div>
          <div className="text-xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
            {activeMolecule.tpsa.toFixed(1)}
            <span className="text-xs font-mono text-slate-400 ml-1">Å²</span>
          </div>
          <div
            className={`text-[11px] font-mono mt-1 ${
              activeMolecule.veber.tpsaPass ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {activeMolecule.veber.tpsaPass ? '● ≤ 140 Å²' : '▲ > 140 Å²'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-mono uppercase text-slate-500">
            H-BOND DONORS
          </div>
          <div className="text-xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
            {activeMolecule.hBondDonors}
          </div>
          <div
            className={`text-[11px] font-mono mt-1 ${
              activeMolecule.lipinski.hbdPass ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {activeMolecule.lipinski.hbdPass ? '● ≤ 5 (OH/NH)' : '▲ > 5'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-mono uppercase text-slate-500">
            H-BOND ACCEPT
          </div>
          <div className="text-xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
            {activeMolecule.hBondAcceptors}
          </div>
          <div
            className={`text-[11px] font-mono mt-1 ${
              activeMolecule.lipinski.hbaPass ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {activeMolecule.lipinski.hbaPass ? '● ≤ 10 (N/O)' : '▲ > 10'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-mono uppercase text-slate-500">
            ROTATABLE BONDS
          </div>
          <div className="text-xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
            {activeMolecule.rotatableBonds}
          </div>
          <div
            className={`text-[11px] font-mono mt-1 ${
              activeMolecule.veber.rotatableBondsPass
                ? 'text-emerald-700'
                : 'text-amber-700'
            }`}
          >
            {activeMolecule.veber.rotatableBondsPass ? '● ≤ 10' : '▲ > 10'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-mono uppercase text-slate-500">
            QED SCORE
          </div>
          <div className="text-xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
            {activeMolecule.qedEstimate.toFixed(2)}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            Fsp3: {activeMolecule.fractionCsp3.toFixed(2)}
          </div>
        </div>
      </section>

      {/* Lipinski Rule of Five, Veber Bioavailability & Functional Group Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Lipinski & Veber Audit Card (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono uppercase text-blue-900 font-semibold">
                  MEDICINAL CHEMISTRY DRUG-LIKENESS AUDIT
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Lipinski&rsquo;s Rule of Five & Veber Oral Bioavailability Evaluation
                </h3>
              </div>
              <span
                className={`text-xs font-mono font-bold ${
                  activeMolecule.lipinski.passes
                    ? 'text-emerald-700'
                    : 'text-rose-700'
                }`}
              >
                {activeMolecule.lipinski.passes
                  ? `● LIPINSKI PASS (${activeMolecule.lipinski.violations} VIOLATIONS)`
                  : `▲ LIPINSKI FAIL (${activeMolecule.lipinski.violations} VIOLATIONS)`}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {[
                {
                  rule: 'Molecular Weight (MW ≤ 500 Da)',
                  actual: `${activeMolecule.molecularWeight.toFixed(2)} Da`,
                  pct: Math.min(100, (activeMolecule.molecularWeight / 500) * 100),
                  pass: activeMolecule.lipinski.mwPass,
                },
                {
                  rule: 'Octanol-Water Partition (XLogP ≤ 5.0)',
                  actual: `${activeMolecule.xlogp.toFixed(2)}`,
                  pct: Math.min(100, Math.max(8, ((activeMolecule.xlogp + 1) / 6) * 100)),
                  pass: activeMolecule.lipinski.logpPass,
                },
                {
                  rule: 'Hydrogen Bond Donors (HBD ≤ 5)',
                  actual: `${activeMolecule.hBondDonors} donors`,
                  pct: Math.min(100, (activeMolecule.hBondDonors / 5) * 100),
                  pass: activeMolecule.lipinski.hbdPass,
                },
                {
                  rule: 'Hydrogen Bond Acceptors (HBA ≤ 10)',
                  actual: `${activeMolecule.hBondAcceptors} acceptors`,
                  pct: Math.min(100, (activeMolecule.hBondAcceptors / 10) * 100),
                  pass: activeMolecule.lipinski.hbaPass,
                },
                {
                  rule: 'Topological Polar Surface Area (Veber TPSA ≤ 140 Å²)',
                  actual: `${activeMolecule.tpsa.toFixed(1)} Å²`,
                  pct: Math.min(100, (activeMolecule.tpsa / 140) * 100),
                  pass: activeMolecule.veber.tpsaPass,
                },
                {
                  rule: 'Conformational Flexibility (Veber Rotatable Bonds ≤ 10)',
                  actual: `${activeMolecule.rotatableBonds} bonds`,
                  pct: Math.min(100, (activeMolecule.rotatableBonds / 10) * 100),
                  pass: activeMolecule.veber.rotatableBondsPass,
                },
              ].map((item) => (
                <div key={item.rule} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.rule}</span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="font-bold text-slate-900">{item.actual}</span>
                      <span
                        className={
                          item.pass ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'
                        }
                      >
                        {item.pass ? '● PASS' : '▲ EXCEEDS'}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.pass ? 'bg-teal-600' : 'bg-rose-600'
                      }`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              <strong>BBB Permeability Prediction:</strong>{' '}
              {activeMolecule.veber.bbbPermeable
                ? 'Likely CNS/BBB permeable (TPSA < 90 Å² & RotBonds ≤ 8)'
                : 'Peripheral-selective / Low passive BBB penetration (TPSA ≥ 90 Å²)'}
            </div>
            <button
              type="button"
              onClick={() => onAddToComparison(activeMolecule)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                isInComparison
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {isInComparison ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  In Comparison Matrix
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Add to Comparison Matrix
                </>
              )}
            </button>
          </div>
        </div>

        {/* Detected Functional Groups & Substructures (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-200">
              <span className="text-xs font-mono uppercase text-teal-700 font-semibold">
                RDKit SMARTS SUBSTRUCTURE MATCHING
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Identified Functional Groups & Structural Motifs
              </h3>
            </div>

            <div className="mt-4 space-y-3">
              {activeMolecule.functionalGroups.length > 0 ? (
                activeMolecule.functionalGroups.map((fg) => (
                  <div
                    key={fg.name}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {fg.name}
                      </span>
                      <span className="text-xs font-mono font-semibold text-blue-900">
                        Count: {fg.count} · SMARTS: {fg.smartsLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {fg.description}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                  Aliphatic / Hydrocarbon core with no polar heteroatom functional motifs detected.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>Structural Complexity Index:</span>
            <span className="font-mono font-bold text-slate-900">
              {activeMolecule.complexity} (Aromatic Rings: {activeMolecule.aromaticRings})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
