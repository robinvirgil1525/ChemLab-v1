import React, { useEffect, useRef, useState } from 'react';
import * as $3Dmol from '3dmol';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Compass,
  Download,
  Eye,
  Layers,
  Moon,
  Plus,
  RefreshCw,
  RotateCw,
  Search,
  Sun,
} from 'lucide-react';
import {
  MoleculeRecord,
  SmilesValidationResult,
  VisualizationStyle3D,
} from '../types/chemistry';
import {
  BENCHMARK_MOLECULES,
  validateSmilesNotation,
} from '../services/cheminformatics';
import { render2DStructureToCanvas } from '../services/molecularCanvasRenderer';

interface MolecularViewerWorkbenchProps {
  activeMolecule: MoleculeRecord;
  isLoading: boolean;
  errorMsg: string | null;
  onAnalyzeQuery: (query: string) => Promise<void>;
  onAddToComparison: (molecule: MoleculeRecord) => void;
  isInComparison: boolean;
  onStyleExplored: () => void;
  onCaptureSnapshots: (snap2D: string | null, snap3D: string | null) => void;
  onNavigateNext: () => void;
}

export const MolecularViewerWorkbench: React.FC<MolecularViewerWorkbenchProps> = ({
  activeMolecule,
  isLoading,
  errorMsg,
  onAnalyzeQuery,
  onAddToComparison,
  isInComparison,
  onStyleExplored,
  onCaptureSnapshots,
  onNavigateNext,
}) => {
  const [smilesInput, setSmilesInput] = useState<string>(activeMolecule.canonicalSmiles);
  const [validation, setValidation] = useState<SmilesValidationResult>(() =>
    validateSmilesNotation(activeMolecule.canonicalSmiles)
  );
  const [style3D, setStyle3D] = useState<VisualizationStyle3D>('ball_and_stick');
  const [dark3DCanvas, setDark3DCanvas] = useState<boolean>(true);
  const [spinAxis, setSpinAxis] = useState<'x' | 'y' | 'z' | null>(null);
  const [showAtomLabels, setShowAtomLabels] = useState<boolean>(false);
  const [showHydrogens, setShowHydrogens] = useState<boolean>(true);
  const [pickedAtomInfo, setPickedAtomInfo] = useState<string | null>(null);
  const [depiction2DMode, setDepiction2DMode] = useState<'canvas' | 'pubchem'>('canvas');
  const [recentHistory, setRecentHistory] = useState<
    Array<{ name: string; smiles: string; formula: string; mw: number }>
  >(() => [
    {
      name: activeMolecule.name,
      smiles: activeMolecule.canonicalSmiles,
      formula: activeMolecule.formula,
      mw: activeMolecule.molecularWeight,
    },
  ]);

  const canvas2DRef = useRef<HTMLCanvasElement | null>(null);
  const viewer3DContainerRef = useRef<HTMLDivElement | null>(null);
  const viewer3DInstanceRef = useRef<any>(null);

  // Sync input and append to Recent Molecules (Last 5 Parsed SMILES) when activeMolecule changes
  useEffect(() => {
    setSmilesInput(activeMolecule.canonicalSmiles);
    setValidation(validateSmilesNotation(activeMolecule.canonicalSmiles));
    setRecentHistory((prev) => {
      const filtered = prev.filter(
        (item) =>
          item.smiles !== activeMolecule.canonicalSmiles &&
          item.name !== activeMolecule.name
      );
      return [
        {
          name: activeMolecule.name,
          smiles: activeMolecule.canonicalSmiles,
          formula: activeMolecule.formula,
          mw: activeMolecule.molecularWeight,
        },
        ...filtered,
      ].slice(0, 5);
    });
  }, [
    activeMolecule.id,
    activeMolecule.canonicalSmiles,
    activeMolecule.name,
    activeMolecule.formula,
    activeMolecule.molecularWeight,
  ]);

  // Live SMILES validation as student types
  const handleSmilesChange = (val: string) => {
    setSmilesInput(val);
    setValidation(validateSmilesNotation(val));
  };

  // Render 2D structure using our bulletproof RDKit/Canvas renderer (SmilesDrawer SvgDrawer + 2D Coordinate Graph)
  useEffect(() => {
    const canvas = canvas2DRef.current;
    if (!canvas || !activeMolecule.canonicalSmiles) return;

    render2DStructureToCanvas(activeMolecule, canvas, (dataUrl2D) => {
      onCaptureSnapshots(dataUrl2D, null);
    });
  }, [activeMolecule, depiction2DMode]);

  // Initialize and update 3Dmol.js WebGL Viewer (py3Dmol browser engine)
  useEffect(() => {
    const container = viewer3DContainerRef.current;
    if (!container) return;

    const lib3D: any =
      ($3Dmol as any)?.createViewer
        ? $3Dmol
        : ($3Dmol as any)?.default?.createViewer
        ? ($3Dmol as any).default
        : (window as any).$3Dmol;

    if (!lib3D || !lib3D.createViewer) return;

    if (!viewer3DInstanceRef.current) {
      viewer3DInstanceRef.current = lib3D.createViewer(container, {
        defaultcolors: lib3D.rasmolElementColors,
        backgroundColor: dark3DCanvas ? '#0f172a' : '#f8fafc',
        antialias: true,
      });
    }

    const viewer = viewer3DInstanceRef.current;
    viewer.setBackgroundColor(dark3DCanvas ? '#0f172a' : '#f8fafc');
    viewer.clear();

    if (activeMolecule.sdf3D) {
      viewer.addModel(activeMolecule.sdf3D, 'sdf');
    }

    const elemFilter = showHydrogens ? {} : { elem: 'H', invert: true };

    if (style3D === 'ball_and_stick') {
      viewer.setStyle(elemFilter, {
        stick: { radius: 0.16, colorscheme: 'Jmol' },
        sphere: { scale: 0.28, colorscheme: 'Jmol' },
      });
    } else if (style3D === 'stick') {
      viewer.setStyle(elemFilter, {
        stick: { radius: 0.24, colorscheme: 'Jmol' },
      });
    } else if (style3D === 'sphere') {
      viewer.setStyle(elemFilter, {
        sphere: { scale: 0.85, colorscheme: 'Jmol' },
      });
    } else if (style3D === 'wireframe') {
      viewer.setStyle(elemFilter, {
        line: { linewidth: 2.5, colorscheme: 'Jmol' },
      });
    } else if (style3D === 'surface') {
      viewer.setStyle(elemFilter, {
        stick: { radius: 0.16, colorscheme: 'Jmol' },
        sphere: { scale: 0.24, colorscheme: 'Jmol' },
      });
      try {
        viewer.addSurface(
          lib3D.SurfaceType?.VDW ?? 1,
          { opacity: 0.72, colorscheme: 'Jmol' },
          elemFilter
        );
      } catch {
        // ignore surface error on tiny models
      }
    }

    if (showAtomLabels) {
      const model = viewer.getModel();
      if (model) {
        const atoms = model.selectedAtoms({ elem: 'H', invert: true });
        atoms.slice(0, 35).forEach((atom: any, idx: number) => {
          viewer.addLabel(`${atom.elem}${idx + 1}`, {
            position: { x: atom.x, y: atom.y, z: atom.z },
            backgroundColor: dark3DCanvas ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.9)',
            fontColor: dark3DCanvas ? '#f8fafc' : '#0f172a',
            fontSize: 10,
            borderThickness: 0.5,
            borderColor: '#94a3b8',
          });
        });
      }
    }

    // Enable interactive atom clicking for coordinate inspection
    viewer.setClickable({}, true, (atom: any) => {
      if (!atom) return;
      setPickedAtomInfo(
        `Atom ${atom.elem} (Serial #${atom.serial}) · Coordinates: X=${atom.x.toFixed(
          3
        )} Å, Y=${atom.y.toFixed(3)} Å, Z=${atom.z.toFixed(3)} Å`
      );
    });

    viewer.resize();
    viewer.zoomTo();
    viewer.render();
    viewer.spin(spinAxis ? spinAxis : false);

    const resizeObs = new ResizeObserver(() => {
      if (viewer3DInstanceRef.current) {
        viewer3DInstanceRef.current.resize();
        viewer3DInstanceRef.current.render();
      }
    });
    resizeObs.observe(container);

    // Capture 3D snapshot for PDF report
    const snapTimer = setTimeout(() => {
      try {
        const pngUri = viewer.pngURI();
        const canvas2D = canvas2DRef.current;
        const png2D = canvas2D ? canvas2D.toDataURL('image/png') : null;
        onCaptureSnapshots(png2D, pngUri);
      } catch {
        // ignore
      }
    }, 350);

    return () => {
      clearTimeout(snapTimer);
      resizeObs.disconnect();
    };
  }, [
    activeMolecule.sdf3D,
    style3D,
    dark3DCanvas,
    showAtomLabels,
    showHydrogens,
  ]);

  const handleSetSpinAxis = (axis: 'x' | 'y' | 'z' | null) => {
    const nextAxis = spinAxis === axis ? null : axis;
    setSpinAxis(nextAxis);
    if (viewer3DInstanceRef.current) {
      viewer3DInstanceRef.current.spin(nextAxis ? nextAxis : false);
    }
  };

  const handleSelectStyle = (newStyle: VisualizationStyle3D) => {
    setStyle3D(newStyle);
    onStyleExplored();
  };

  const handleResetCamera = () => {
    if (viewer3DInstanceRef.current) {
      viewer3DInstanceRef.current.zoomTo();
      viewer3DInstanceRef.current.render();
    }
  };

  const handleDownload2DPng = () => {
    const canvas = canvas2DRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeMolecule.name.replace(/\s+/g, '_')}_2D_Structure.png`;
    a.click();
  };

  const handleDownload3DPng = () => {
    if (!viewer3DInstanceRef.current) return;
    try {
      const uri = viewer3DInstanceRef.current.pngURI();
      const a = document.createElement('a');
      a.href = uri;
      a.download = `${activeMolecule.name.replace(/\s+/g, '_')}_3D_Conformer.png`;
      a.click();
    } catch {
      // ignore
    }
  };

  const handleDownloadSdf = () => {
    const blob = new Blob([activeMolecule.sdf3D], { type: 'chemical/x-mdl-sdfile' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeMolecule.name.replace(/\s+/g, '_')}_3D.sdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smilesInput.trim()) return;
    await onAnalyzeQuery(smilesInput.trim());
  };

  return (
    <div className="space-y-6">
      {/* Top SMILES Input Console & Example Molecule Selector */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-teal-700 font-semibold">
              PAGE 04 · RDKit SMILES PARSER & py3Dmol / 3Dmol.js WORKBENCH
            </p>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Interactive 2D & 3D Molecular Structure Visualization
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
                  Added to Comparison Matrix
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Add to Multi-Molecule Comparison
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onNavigateNext}
              className="px-3.5 py-2 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              Next: Properties Report
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Primary Student Custom SMILES Input Form + Example Selector */}
        <form onSubmit={handleSubmitForm} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
            <div className="lg:col-span-6">
              <label
                htmlFor="smiles-input"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Enter Your Own SMILES Notation (or Compound Name):
              </label>
              <input
                id="smiles-input"
                type="text"
                value={smilesInput}
                onChange={(e) => handleSmilesChange(e.target.value)}
                placeholder="Type any SMILES string (e.g., CCO, c1ccccc1, CC(=O)O) or molecule name..."
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 focus:bg-white text-slate-900"
              />
            </div>

            <div className="lg:col-span-3">
              <label
                htmlFor="preset-molecule-dropdown"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Or Select Example Molecule:
              </label>
              <select
                id="preset-molecule-dropdown"
                value={
                  BENCHMARK_MOLECULES.find(
                    (b) =>
                      b.smiles === activeMolecule.canonicalSmiles ||
                      b.name === activeMolecule.name
                  )?.smiles || ''
                }
                onChange={(e) => {
                  if (e.target.value) {
                    setSmilesInput(e.target.value);
                    onAnalyzeQuery(e.target.value);
                  }
                }}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-900 text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="" disabled>
                  -- Example Molecules --
                </option>
                {BENCHMARK_MOLECULES.map((preset) => (
                  <option key={preset.id} value={preset.smiles}>
                    {preset.name} ({preset.smiles})
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3">
              <button
                type="submit"
                disabled={isLoading || !smilesInput.trim()}
                className="w-full px-5 py-2.5 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating 2D & 3D...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Validate & Generate 2D / 3D
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Example Quick-Fill Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 mr-1">Quick Examples:</span>
            {BENCHMARK_MOLECULES.slice(0, 6).map((preset) => {
              const isSelected =
                activeMolecule.canonicalSmiles === preset.smiles ||
                activeMolecule.name === preset.name;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSmilesInput(preset.smiles);
                    onAnalyzeQuery(preset.smiles);
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>

          {/* Recent Molecules History List (Tracks Last 5 Parsed SMILES with Chemical Formulas & 2D/3D Badges) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase font-semibold text-teal-800">
                Recent Molecules History ({recentHistory.length}/5 Parsed)
              </span>
              <span className="text-[11px] text-slate-500">
                Click any card to reload its 2D & 3D structure
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {recentHistory.map((item, idx) => {
                const isCurrent = item.smiles === activeMolecule.canonicalSmiles;
                return (
                  <button
                    key={`${item.smiles}-${idx}`}
                    type="button"
                    onClick={() => {
                      setSmilesInput(item.smiles);
                      onAnalyzeQuery(item.smiles);
                    }}
                    title={`Reload ${item.name} (${item.formula} · ${item.smiles})`}
                    className={`text-left p-2.5 rounded-lg border transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                      isCurrent
                        ? 'bg-teal-900 text-white border-teal-800 shadow-xs'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5 w-full">
                      <span className="text-xs font-bold truncate">
                        {item.name}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded shrink-0 ${
                          isCurrent
                            ? 'bg-teal-700 text-teal-50'
                            : 'bg-blue-50 text-blue-900 border border-blue-200'
                        }`}
                      >
                        2D/3D
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1 text-[11px] font-mono">
                      <span
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                          isCurrent
                            ? 'bg-teal-800 text-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.formula || 'Formula'}
                      </span>
                      <span
                        className={isCurrent ? 'text-teal-200' : 'text-slate-500'}
                      >
                        {Number(item.mw || 0).toFixed(1)} Da
                      </span>
                    </div>

                    <div
                      className={`text-[10px] font-mono truncate w-full ${
                        isCurrent ? 'text-teal-100' : 'text-slate-400'
                      }`}
                    >
                      SMILES: {item.smiles}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Real-Time SMILES Grammar & Valence Validation Telemetry Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {validation.isValid ? (
              <span className="font-mono font-semibold text-emerald-700 flex items-center gap-1.5">
                ● VALID SMILES SYNTAX
              </span>
            ) : (
              <span className="font-mono font-semibold text-rose-700 flex items-center gap-1.5">
                ▲ SYNTAX ERROR: {validation.errors[0]}
              </span>
            )}
            <span className="text-slate-300">·</span>
            <span className="text-slate-600 font-mono">
              Heavy Atoms: {validation.atomCountEstimate}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600 font-mono">
              Rings: {validation.ringClosures}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600 font-mono">
              Branches: {validation.branches}
            </span>
          </div>

          {errorMsg && (
            <div className="text-xs font-medium text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </section>

      {/* Dual-Viewport 2D Skeletal Depiction & 3D WebGL Conformer Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Pane: 2D Chemical Structure Renderer (5 columns on desktop) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono uppercase text-slate-500">
                  2D TOPOLOGICAL DEPICTION
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {activeMolecule.name}
                </h3>
              </div>

              {/* Segmented 2D Renderer Source Toggle */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setDepiction2DMode('canvas')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    depiction2DMode === 'canvas'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  RDKit / Canvas 2D
                </button>
                <button
                  type="button"
                  onClick={() => setDepiction2DMode('pubchem')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    depiction2DMode === 'pubchem'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PubChem 2D
                </button>
              </div>
            </div>

            {/* 2D Canvas Viewport (kept white inside for clear chemical bond legibility in both light and dark mode) */}
            <div
              style={{ backgroundColor: '#FFFFFF' }}
              className="mt-4 border border-slate-200 rounded-lg flex items-center justify-center min-h-[320px] relative overflow-hidden"
            >
              <canvas
                ref={canvas2DRef}
                width={420}
                height={320}
                className={`max-w-full h-auto ${
                  depiction2DMode === 'canvas' ? 'block' : 'hidden'
                }`}
              />
              {depiction2DMode === 'pubchem' && (
                <img
                  src={
                    activeMolecule.cid > 0
                      ? `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${activeMolecule.cid}/PNG?image_size=400x400`
                      : `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(
                          activeMolecule.canonicalSmiles
                        )}/PNG?image_size=400x400`
                  }
                  alt={`2D chemical structure of ${activeMolecule.name}`}
                  referrerPolicy="no-referrer"
                  onError={() => setDepiction2DMode('canvas')}
                  className="max-h-[300px] w-auto object-contain"
                />
              )}
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-slate-600 bg-slate-100/90 px-2.5 py-1 rounded">
                <span>Formula: {activeMolecule.formula}</span>
                <span>MW: {activeMolecule.molecularWeight.toFixed(2)} g/mol</span>
              </div>
            </div>
          </div>

          {/* 2D Metadata & Export Footer */}
          <div className="mt-4 pt-3 border-t border-slate-200 space-y-2.5">
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Canonical SMILES: </span>
              <code className="font-mono text-[11px] text-blue-900 break-all">
                {activeMolecule.canonicalSmiles}
              </code>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-xs text-slate-500">
                CPK Colored (O: Red, N: Blue, S: Yellow, Halogens: Green)
              </span>
              <button
                type="button"
                onClick={handleDownload2DPng}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Save 2D PNG
              </button>
            </div>
          </div>
        </div>

        {/* Right Pane: Interactive 3D WebGL Viewer (7 columns on desktop) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            {/* 3D Style Selector Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono uppercase text-teal-700 font-semibold">
                  3D WEBGL CONFORMER ENGINE (py3Dmol / 3Dmol.js)
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Interactive 3D Spatial Conformation & Surface Inspector
                </h3>
              </div>

              {/* Visualization Style Buttons */}
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    { id: 'ball_and_stick', label: 'Ball & Stick' },
                    { id: 'stick', label: 'Stick' },
                    { id: 'sphere', label: 'CPK Sphere' },
                    { id: 'wireframe', label: 'Wireframe' },
                    { id: 'surface', label: 'VDW Surface' },
                  ] as Array<{ id: VisualizationStyle3D; label: string }>
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectStyle(item.id)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      style3D === item.id
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Secondary 3D Viewport Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {/* Explicit X, Y, Z Axis Auto-Rotation Controls (py3Dmol API) */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg">
                  <span className="px-1.5 text-[11px] font-mono font-semibold text-slate-600 flex items-center gap-1">
                    <RotateCw className={`w-3.5 h-3.5 ${spinAxis ? 'animate-spin text-teal-700' : 'text-slate-500'}`} />
                    Auto-Rotate:
                  </span>
                  {(['x', 'y', 'z'] as const).map((axis) => {
                    const isActive = spinAxis === axis;
                    return (
                      <button
                        key={axis}
                        type="button"
                        onClick={() => handleSetSpinAxis(axis)}
                        className={`px-2.5 py-1 rounded font-mono font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-teal-700 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                        }`}
                      >
                        Spin {axis.toUpperCase()}
                      </button>
                    );
                  })}
                  {spinAxis && (
                    <button
                      type="button"
                      onClick={() => handleSetSpinAxis(null)}
                      className="px-2 py-1 rounded font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Stop
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowAtomLabels((l) => !l)}
                  className={`px-2.5 py-1 rounded border font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
                    showAtomLabels
                      ? 'bg-blue-50 border-blue-300 text-blue-800'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showAtomLabels ? 'Atom Labels: ON' : 'Atom Labels'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowHydrogens((h) => !h)}
                  className={`px-2.5 py-1 rounded border font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
                    showHydrogens
                      ? 'bg-slate-100 border-slate-300 text-slate-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  {showHydrogens ? 'Hydrogens: Shown' : 'Hydrogens: Hidden'}
                </button>

                <button
                  type="button"
                  onClick={handleResetCamera}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Center Camera
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDark3DCanvas((d) => !d)}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  {dark3DCanvas ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      Light Stage
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-slate-700" />
                      Dark Stage
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Bounded 3D WebGL Container */}
            <div className="relative rounded-lg overflow-hidden border border-slate-300 min-h-[340px] h-[340px] w-full cursor-crosshair">
              <div
                ref={viewer3DContainerRef}
                className="w-full h-full relative"
              />
              {/* Overlay HUD for CPK Element Legend */}
              <div className="absolute bottom-2.5 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none text-[11px] font-mono">
                <div className="bg-slate-900/80 text-slate-100 px-2.5 py-1 rounded backdrop-blur-xs">
                  <span>CPK Elements: C (Grey) · O (Red) · N (Blue) · S (Yellow) · H (White) · Halogens (Green)</span>
                </div>
                <div className="bg-slate-900/80 text-teal-300 px-2.5 py-1 rounded backdrop-blur-xs">
                  Left-Drag: Rotate · Scroll: Zoom · Click Atom: Inspect XYZ
                </div>
              </div>
            </div>
          </div>

          {/* 3D Telemetry & Export Footer */}
          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-mono text-slate-600">
              {pickedAtomInfo ? (
                <span className="text-teal-800 font-semibold">{pickedAtomInfo}</span>
              ) : (
                <span>
                  Click any atom in the 3D viewport to measure its 3D Cartesian (X, Y, Z) coordinates in Ångströms.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload3DPng}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                Save 3D Snapshot
              </button>
              <button
                type="button"
                onClick={handleDownloadSdf}
                className="px-3 py-1.5 text-xs font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export 3D SDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
