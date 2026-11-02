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
  Info,
  Layers,
  Moon,
  Plus,
  RefreshCw,
  RotateCw,
  Search,
  ShieldAlert,
  Sparkles,
  Sun,
  X,
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

interface MoleculeSummaryInfo {
  classification: string;
  safetyInfo: string;
  industrialApplications: string;
  pharmacologicalNote: string;
}

function buildMoleculeSummary(mol: MoleculeRecord): MoleculeSummaryInfo {
  const n = mol.name.toLowerCase();
  if (n.includes('aspirin') || mol.canonicalSmiles.includes('CC(=O)OC1=CC=CC=C1C(=O)O')) {
    return {
      classification:
        'Salicylate Ester / Aromatic Carboxylic Acid Derivative (Non-Steroidal Anti-Inflammatory Agent, NSAID).',
      safetyInfo:
        'GHS07 Warning: Harmful if swallowed in concentrated laboratory form; irritating to eyes, respiratory tract, and gastric mucosa. Avoid dust inhalation and use standard laboratory PPE (nitrile gloves, safety goggles).',
      industrialApplications:
        'Large-scale pharmaceutical tablet manufacturing (analgesic, antipyretic, and antiplatelet cardiovascular prophylaxis), reference standard for HPLC/UV spectroscopy calibration, and chemical intermediate in fine organic synthesis.',
      pharmacologicalNote:
        'Irreversibly acetylates Ser530 of cyclooxygenase-1 (COX-1) and COX-2 enzymes, inhibiting prostaglandin and thromboxane A2 biosynthesis.',
    };
  }
  if (n.includes('caffeine')) {
    return {
      classification:
        'Purine Alkaloid / Trimethylxanthine Heterocycle (1,3,7-Trimethylpurine-2,6-dione).',
      safetyInfo:
        'GHS06/GHS07 Acute Toxicity (Oral Category 4): Moderately toxic in pure anhydrous powder form. Handle in a fume hood or well-ventilated bench; avoid ingestion and contact with eyes.',
      industrialApplications:
        'Pharmaceutical central nervous system (CNS) stimulant formulations, combination migraine therapeutics, functional beverage fortification, cosmetic dermatological formulations, and analytical chromatography standard.',
      pharmacologicalNote:
        'Non-selective competitive antagonist at adenosine A1 and A2A receptors with high Blood-Brain Barrier (BBB) permeability (TPSA = 58.4 Å²).',
    };
  }
  if (n.includes('paracetamol') || n.includes('acetaminophen')) {
    return {
      classification:
        'Para-Aminophenol Derivative / Acetanilide Aromatic Amide.',
      safetyInfo:
        'GHS07 Warning: Hepatotoxic in acute overdose due to N-acetyl-p-benzoquinone imine (NAPQI) reactive metabolite formation. Standard laboratory eye and skin protection required.',
      industrialApplications:
        'Global bulk active pharmaceutical ingredient (API) for antipyretic and analgesic formulations, industrial precursor for photographic chemicals andazo dye synthesis.',
      pharmacologicalNote:
        'Selectively inhibits central prostaglandin synthesis with minimal peripheral gastrointestinal irritation.',
    };
  }
  if (n.includes('ibuprofen')) {
    return {
      classification:
        '2-Arylpropionic Acid Derivative (Chiral Non-Steroidal Anti-Inflammatory Drug).',
      safetyInfo:
        'GHS07 Warning: Causes serious eye irritation and potential gastrointestinal or renal toxicity upon systemic overexposure. Handle crystalline powder with standard laboratory PPE.',
      industrialApplications:
        'Industrial API synthesis (Boots BHC green catalytic carbonylation process), oral solid dosage manufacturing, topical analgesic gels, and pediatric suspension formulations.',
      pharmacologicalNote:
        'Reversible competitive inhibitor of COX-1 and COX-2 isozymes; the (S)-(+)-enantiomer is the pharmacologically active stereoisomer.',
    };
  }
  if (n.includes('ethanol') || mol.canonicalSmiles === 'CCO') {
    return {
      classification:
        'Primary Aliphatic Alcohol (Short-Chain Hydroxyalkane).',
      safetyInfo:
        'GHS02 Highly Flammable Liquid and Vapor; GHS07 Eye Irritant. Keep away from open flames, hot surfaces, and ignition sources. Store in explosion-proof flammable cabinets.',
      industrialApplications:
        'Universal polar protic laboratory solvent, renewable bio-ethanol fuel additive, hospital-grade antiseptic and surface disinfectant (70% v/v), and feedstock for ethyl ester and acetic acid synthesis.',
      pharmacologicalNote:
        'Amphiphilic small molecule (MW = 46.07 Da, XLogP = -0.10) exhibiting complete miscibility with water and rapid passive membrane diffusion.',
    };
  }
  if (n.includes('benzene') || mol.canonicalSmiles === 'c1ccccc1') {
    return {
      classification:
        'Monocyclic Aromatic Hydrocarbon (6π Hückel Annulene).',
      safetyInfo:
        'GHS02 Highly Flammable Liquid; GHS08 Confirmed Human Carcinogen & Mutagen (H350/H340). Strictly handle inside a certified chemical fume hood; avoid all vapor inhalation and skin contact.',
      industrialApplications:
        'Primary petrochemical precursor for ethylbenzene (styrene/polystyrene plastics), cumene (phenol/acetone), cyclohexane (nylon-6,6 fibers), and nitrobenzene (aniline dyes).',
      pharmacologicalNote:
        'Planar hydrophobic π-system (TPSA = 0.0 Å², XLogP = 2.10) serving as the foundational phenyl scaffold in medicinal chemistry.',
    };
  }
  if (n.includes('phenol')) {
    return {
      classification:
        'Aromatic Hydroxyarene (Benzenol).',
      safetyInfo:
        'GHS05 Corrosive & GHS06 Toxic: Causes severe chemical skin burns, eye damage, and systemic toxicity via dermal absorption. Use neoprene/butyl gloves and fume hood containment.',
      industrialApplications:
        'Industrial production of Bisphenol-A (polycarbonate resins), phenolic Bakelite thermosetting polymers, caprolactam, salicylic acid (Aspirin precursor), and nucleic acid extraction buffers.',
      pharmacologicalNote:
        'Weakly acidic aromatic alcohol (pKa ≈ 9.95) due to resonance stabilization of the phenoxide anion across the ortho and para ring positions.',
    };
  }
  if (n.includes('acetic acid') || mol.canonicalSmiles === 'CC(=O)O') {
    return {
      classification:
        'Aliphatic Monocarboxylic Acid (Ethanoic Acid).',
      safetyInfo:
        'GHS05 Corrosive & GHS02 Flammable (Glacial grade >80%): Causes severe skin burns and eye damage; pungent lachrymatory vapors. Dispense in a fume hood with acid-resistant PPE.',
      industrialApplications:
        'Manufacture of vinyl acetate monomer (VAM for adhesives and coatings), acetic anhydride, cellulose acetate fibers, terephthalic acid (PET bottle solvent), and food-grade acidity regulation.',
      pharmacologicalNote:
        'Prototypical hydrogen-bond donor/acceptor carboxylic acid motif (TPSA = 37.3 Å²) capable of forming cyclic centrosymmetric dimers.',
    };
  }

  const fgNames =
    mol.functionalGroups.length > 0
      ? mol.functionalGroups.map((f) => f.name).join(', ')
      : 'Aliphatic / Carbocyclic Hydrocarbon Framework';

  return {
    classification: `Organic Compound (${mol.formula}, MW ${mol.molecularWeight.toFixed(
      2
    )} Da) featuring: ${fgNames}.`,
    safetyInfo: `Standard Laboratory Precaution (GHS Protocol): Handle ${mol.name} with nitrile gloves, protective eyewear, and adequate bench ventilation. Lipophilicity XLogP = ${mol.xlogp.toFixed(
      2
    )}, TPSA = ${mol.tpsa.toFixed(1)} Å².`,
    industrialApplications: `Cheminformatics lead optimization, QSAR molecular modeling, synthetic organic intermediate screening, and structure-property benchmarking (${
      mol.lipinski.passes
        ? 'Complies with Lipinski Rule of Five for oral drug-likeness'
        : `Exhibits ${mol.lipinski.violations} Lipinski violation(s)`
    }).`,
    pharmacologicalNote: `Quantitative Estimate of Drug-likeness (QED) = ${mol.qedEstimate.toFixed(
      2
    )}; ${
      mol.veber.bbbPermeable
        ? 'predicted to be Blood-Brain Barrier (BBB) permeable (TPSA < 90 Å²).'
        : 'predicted to remain peripherally restricted (TPSA ≥ 90 Å² or high flexibility).'
    }`,
  };
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
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
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

  const handleSmilesChange = (val: string) => {
    setSmilesInput(val);
    setValidation(validateSmilesNotation(val));
  };

  useEffect(() => {
    const canvas = canvas2DRef.current;
    if (!canvas || !activeMolecule.canonicalSmiles) return;

    render2DStructureToCanvas(activeMolecule, canvas, (dataUrl2D) => {
      onCaptureSnapshots(dataUrl2D, null);
    });
  }, [activeMolecule, depiction2DMode]);

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
        backgroundColor: dark3DCanvas ? '#070A12' : '#f8fafc',
        antialias: true,
      });
    }

    const viewer = viewer3DInstanceRef.current;
    viewer.setBackgroundColor(dark3DCanvas ? '#070A12' : '#f8fafc');
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
            backgroundColor: dark3DCanvas ? 'rgba(7,10,18,0.88)' : 'rgba(255,255,255,0.9)',
            fontColor: dark3DCanvas ? '#22d3ee' : '#0f172a',
            fontSize: 10,
            borderThickness: 0.5,
            borderColor: '#06b6d4',
          });
        });
      }
    }

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

  const moleculeInfo = buildMoleculeSummary(activeMolecule);

  return (
    <div className="space-y-6">
      {/* Top SMILES Input Console & Example Molecule Selector */}
      <section className="bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-cyan-700 dark:text-cyan-400 font-semibold">
              PAGE 04 · RDKit SMILES PARSER & py3Dmol / 3Dmol.js WORKBENCH
            </p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              Interactive 2D & 3D Molecular Structure Visualization
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowInfoModal(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-cyan-500/40 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-900 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              Compound Info & Safety
            </button>
            <button
              type="button"
              onClick={() => onAddToComparison(activeMolecule)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                isInComparison
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-900 dark:bg-slate-800 border-slate-900 dark:border-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-700'
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
              className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
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
                className="block text-xs font-mono uppercase tracking-wider font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Enter Your Own SMILES Notation (or Compound Name):
              </label>
              <input
                id="smiles-input"
                type="text"
                value={smilesInput}
                onChange={(e) => handleSmilesChange(e.target.value)}
                placeholder="Type any SMILES string (e.g., CCO, c1ccccc1, CC(=O)O) or molecule name..."
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 dark:bg-[#131C31] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="lg:col-span-3">
              <label
                htmlFor="preset-molecule-dropdown"
                className="block text-xs font-mono uppercase tracking-wider font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
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
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-100 dark:bg-[#131C31] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
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
                className="w-full px-5 py-2.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
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
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 mr-1">
              Quick Examples:
            </span>
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
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                      : 'bg-slate-50 dark:bg-[#131C31] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-cyan-500/40'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>

          {/* Recent Molecules History List (Tracks Last 5 Parsed SMILES with Chemical Formulas & 2D/3D Badges) */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#131C31]/90 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase font-semibold text-cyan-800 dark:text-cyan-400">
                Recent Molecules History ({recentHistory.length}/5 Parsed)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Click any card to reload its 2D & 3D structure
              </span>
            </div>

            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-5 gap-2.5 overflow-x-auto pb-1 sm:pb-0">
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
                    className={`min-w-[180px] sm:min-w-0 text-left p-2.5 rounded-lg border transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                      isCurrent
                        ? 'bg-cyan-950/80 text-white border-cyan-400 shadow-xs'
                        : 'bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5 w-full">
                      <span className="text-xs font-bold truncate">
                        {item.name}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded shrink-0 ${
                          isCurrent
                            ? 'bg-cyan-400 text-slate-950'
                            : 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800'
                        }`}
                      >
                        2D/3D
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1 text-[11px] font-mono tabular-nums">
                      <span
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                          isCurrent
                            ? 'bg-cyan-900/90 text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.formula || 'Formula'}
                      </span>
                      <span
                        className={
                          isCurrent
                            ? 'text-cyan-200'
                            : 'text-slate-500 dark:text-slate-400'
                        }
                      >
                        {Number(item.mw || 0).toFixed(1)} Da
                      </span>
                    </div>

                    <div
                      className={`text-[10px] font-mono truncate w-full ${
                        isCurrent
                          ? 'text-cyan-100'
                          : 'text-slate-400 dark:text-slate-500'
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
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {validation.isValid ? (
              <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                ● VALID SMILES SYNTAX
              </span>
            ) : (
              <span className="font-mono font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                ▲ SYNTAX ERROR: {validation.errors[0]}
              </span>
            )}
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-slate-600 dark:text-slate-400 font-mono tabular-nums">
              Heavy Atoms: {validation.atomCountEstimate}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-slate-600 dark:text-slate-400 font-mono tabular-nums">
              Rings: {validation.ringClosures}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-slate-600 dark:text-slate-400 font-mono tabular-nums">
              Branches: {validation.branches}
            </span>
          </div>

          {errorMsg && (
            <div className="text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </section>

      {/* Dual-Viewport 2D Skeletal Depiction & 3D WebGL Conformer Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Pane: 2D Chemical Structure Renderer (5 columns on desktop) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-700 dark:text-cyan-400 font-semibold">
                  2D TOPOLOGICAL DEPICTION
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {activeMolecule.name}
                </h3>
              </div>

              {/* Segmented 2D Renderer Source Toggle */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setDepiction2DMode('canvas')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    depiction2DMode === 'canvas'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  RDKit / Canvas 2D
                </button>
                <button
                  type="button"
                  onClick={() => setDepiction2DMode('pubchem')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    depiction2DMode === 'pubchem'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  PubChem 2D
                </button>
              </div>
            </div>

            {/* 2D Canvas Viewport (kept white inside for clear chemical bond legibility in both light and dark mode) */}
            <div
              style={{ backgroundColor: '#FFFFFF' }}
              className="mt-4 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center min-h-[300px] sm:min-h-[320px] relative overflow-x-auto"
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
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-700 bg-slate-100/95 border border-slate-200 px-2.5 py-1 rounded">
                <span>Formula: {activeMolecule.formula}</span>
                <span>MW: {activeMolecule.molecularWeight.toFixed(2)} g/mol</span>
              </div>
            </div>
          </div>

          {/* 2D Metadata & Export Footer */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Canonical SMILES:{' '}
              </span>
              <code className="font-mono text-[11px] text-cyan-800 dark:text-cyan-300 break-all">
                {activeMolecule.canonicalSmiles}
              </code>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                CPK Colored (O: Red, N: Blue, S: Yellow, Halogens: Green)
              </span>
              <button
                type="button"
                onClick={handleDownload2DPng}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#131C31] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Save 2D PNG
              </button>
            </div>
          </div>
        </div>

        {/* Right Pane: Interactive 3D WebGL Viewer (7 columns on desktop) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            {/* 3D Style Selector Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-700 dark:text-cyan-400 font-semibold">
                  3D WEBGL CONFORMER ENGINE (py3Dmol / 3Dmol.js)
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Interactive 3D Spatial Conformation & Surface Inspector
                </h3>
              </div>

              {/* Visualization Style Buttons */}
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto max-w-full">
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
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
                  <span className="px-1.5 text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <RotateCw
                      className={`w-3.5 h-3.5 ${
                        spinAxis
                          ? 'animate-spin text-cyan-600 dark:text-cyan-400'
                          : 'text-slate-500'
                      }`}
                    />
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
                            ? 'bg-cyan-500 text-slate-950 shadow-xs'
                            : 'bg-white dark:bg-[#0D1322] text-slate-700 dark:text-slate-300 hover:border-cyan-500/40 border border-slate-200 dark:border-slate-700'
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
                      className="px-2 py-1 rounded font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
                      ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-400 text-cyan-900 dark:text-cyan-300'
                      : 'bg-white dark:bg-[#131C31] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-cyan-500/40'
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
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100'
                      : 'bg-white dark:bg-[#131C31] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  {showHydrogens ? 'Hydrogens: Shown' : 'Hydrogens: Hidden'}
                </button>

                <button
                  type="button"
                  onClick={handleResetCamera}
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131C31] text-slate-700 dark:text-slate-300 hover:border-cyan-500/40 font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Center Camera
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDark3DCanvas((d) => !d)}
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131C31] text-slate-700 dark:text-slate-300 hover:border-cyan-500/40 font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  {dark3DCanvas ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      Light Stage
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-cyan-400" />
                      Dark Stage
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Bounded 3D WebGL Container */}
            <div className="relative rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 min-h-[320px] sm:min-h-[340px] h-[340px] w-full cursor-crosshair">
              <div
                ref={viewer3DContainerRef}
                className="w-full h-full relative"
              />
              {/* Overlay HUD for CPK Element Legend */}
              <div className="absolute bottom-2.5 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none text-[11px] font-mono">
                <div className="bg-slate-950/85 text-slate-100 border border-slate-800 px-2.5 py-1 rounded backdrop-blur-xs">
                  <span>
                    CPK Elements: C (Grey) · O (Red) · N (Blue) · S (Yellow) · H (White) · Halogens (Green)
                  </span>
                </div>
                <div className="bg-slate-950/85 text-cyan-300 border border-cyan-900/60 px-2.5 py-1 rounded backdrop-blur-xs">
                  Left-Drag: Rotate · Scroll: Zoom · Click Atom: Inspect XYZ
                </div>
              </div>
            </div>
          </div>

          {/* 3D Telemetry & Export Footer */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
              {pickedAtomInfo ? (
                <span className="text-cyan-700 dark:text-cyan-300 font-semibold">
                  {pickedAtomInfo}
                </span>
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
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#131C31] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                Save 3D Snapshot
              </button>
              <button
                type="button"
                onClick={handleDownloadSdf}
                className="px-3 py-1.5 text-xs font-semibold text-cyan-900 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 border border-cyan-200 dark:border-cyan-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export 3D SDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Compound Info, Classification, Safety & Industrial Applications Modal */}
      {showInfoModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-cyan-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-cyan-700 dark:text-cyan-400 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  COMPOUND INTELLIGENCE & SAFETY DOSSIER
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {activeMolecule.name} ({activeMolecule.formula} · {activeMolecule.molecularWeight.toFixed(2)} Da)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#131C31] border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-mono uppercase font-bold text-cyan-800 dark:text-cyan-400 mb-1">
                  1. Chemical Classification & Structural Family
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {moleculeInfo.classification}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70">
                <div className="text-xs font-mono uppercase font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  2. Laboratory Safety & GHS Hazard Information
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {moleculeInfo.safetyInfo}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#131C31] border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-mono uppercase font-bold text-emerald-800 dark:text-emerald-400 mb-1">
                  3. Primary Industrial & Pharmaceutical Applications
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {moleculeInfo.industrialApplications}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#131C31] border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-mono uppercase font-bold text-slate-700 dark:text-slate-300 mb-1">
                  4. Cheminformatics & Pharmacokinetic Profile
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {moleculeInfo.pharmacologicalNote}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-500 dark:text-slate-400">
                SMILES: {activeMolecule.canonicalSmiles}
              </span>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
