import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  FlaskConical,
  HelpCircle,
  Play,
  Search,
  Sparkles,
} from 'lucide-react';
import { LabModuleId } from '../types/chemistry';

interface TheoryAndProcedureProps {
  onNavigateModule: (module: LabModuleId) => void;
  onTrySmilesInVisualizer: (smiles: string) => void;
}

const EXAMPLE_MOLECULES = [
  { name: 'Ethanol', smiles: 'CCO', formula: 'C2H6O' },
  { name: 'Benzene', smiles: 'c1ccccc1', formula: 'C6H6' },
  { name: 'Phenol', smiles: 'Oc1ccccc1', formula: 'C6H6O' },
  { name: 'Acetic Acid', smiles: 'CC(=O)O', formula: 'C2H4O2' },
  { name: 'Aspirin', smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O', formula: 'C9H8O4' },
  { name: 'Caffeine', smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C', formula: 'C8H10N4O2' },
];

interface GlossaryTerm {
  id: string;
  term: string;
  fullName: string;
  category: 'Notation & Structure' | 'Physicochemical Property' | 'Drug-Likeness Rule' | '3D Visualization';
  definition: string;
  keyRuleOrThreshold: string;
  exampleText: string;
  exampleSmiles: string;
  exampleMoleculeName: string;
}

const CHEMINFORMATICS_GLOSSARY: GlossaryTerm[] = [
  {
    id: 'smiles',
    term: 'SMILES',
    fullName: 'Simplified Molecular Input Line Entry System',
    category: 'Notation & Structure',
    definition:
      'A compact ASCII text line notation that represents a chemical structure (atoms, bonds, rings, and branches) as a single machine-readable string.',
    keyRuleOrThreshold:
      'Atoms = C, N, O; Double bond = "="; Triple bond = "#"; Branches = "()"; Rings = matching digits (e.g., c1ccccc1).',
    exampleText: 'Ethanol is written as CCO; Acetic Acid uses parentheses for its carbonyl branch: CC(=O)O.',
    exampleSmiles: 'CC(=O)O',
    exampleMoleculeName: 'Acetic Acid',
  },
  {
    id: 'tpsa',
    term: 'TPSA',
    fullName: 'Topological Polar Surface Area',
    category: 'Physicochemical Property',
    definition:
      'The sum of surface contributions of all polar atoms (primarily oxygen and nitrogen, plus their attached hydrogens) in a molecule, measured in square Ångströms (Å²).',
    keyRuleOrThreshold:
      'Oral Bioavailability: TPSA <= 140 Å² (Veber Rule) | Blood-Brain Barrier Penetration: TPSA < 90 Å².',
    exampleText: 'Aspirin has a TPSA of 63.6 Å², allowing passive gastrointestinal absorption.',
    exampleSmiles: 'CC(=O)OC1=CC=CC=C1C(=O)O',
    exampleMoleculeName: 'Aspirin',
  },
  {
    id: 'lipinski',
    term: "Lipinski's Rule of 5",
    fullName: "Lipinski's Rule of Five (Ro5) for Oral Drug-Likeness",
    category: 'Drug-Likeness Rule',
    definition:
      'A classic medicinal chemistry filter formulated by Christopher Lipinski to evaluate whether a chemical compound has physicochemical properties suitable for an orally active drug in humans.',
    keyRuleOrThreshold:
      'MW <= 500 g/mol, LogP <= 5, HBD <= 5, HBA <= 10. An orally active drug should have no more than 1 violation.',
    exampleText: 'Caffeine (MW = 194.19 g/mol, XLogP = -0.07, HBD = 0, HBA = 6) passes all four Lipinski criteria with 0 violations.',
    exampleSmiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
    exampleMoleculeName: 'Caffeine',
  },
  {
    id: 'logp',
    term: 'LogP / XLogP',
    fullName: 'Octanol-Water Partition Coefficient (Lipophilicity)',
    category: 'Physicochemical Property',
    definition:
      'A quantitative measure of molecular lipophilicity (fat solubility vs. water solubility), defined as the logarithm of the concentration ratio of a compound between 1-octanol and water.',
    keyRuleOrThreshold:
      'Lipinski Threshold: LogP <= 5.0. Higher positive values indicate greater hydrophobicity/lipophilicity.',
    exampleText: 'Benzene (c1ccccc1) is non-polar and lipophilic (XLogP = 2.13), whereas Ethanol (CCO) is hydrophilic (XLogP = -0.31).',
    exampleSmiles: 'c1ccccc1',
    exampleMoleculeName: 'Benzene',
  },
  {
    id: 'hba',
    term: 'HBA',
    fullName: 'Hydrogen Bond Acceptor',
    category: 'Physicochemical Property',
    definition:
      'Electronegative atoms (primarily Nitrogen and Oxygen) with lone electron pairs capable of accepting a hydrogen bond from a donor group.',
    keyRuleOrThreshold:
      'Lipinski Threshold: HBA <= 10 (counted as total N + O atoms in Lipinski Ro5).',
    exampleText: 'Aspirin contains 4 oxygen atoms, giving it HBA = 4.',
    exampleSmiles: 'CC(=O)OC1=CC=CC=C1C(=O)O',
    exampleMoleculeName: 'Aspirin',
  },
  {
    id: 'hbd',
    term: 'HBD',
    fullName: 'Hydrogen Bond Donor',
    category: 'Physicochemical Property',
    definition:
      'Polar functional groups containing a hydrogen atom covalently bonded to an electronegative atom—specifically hydroxyl (-OH) and amine/amide (-NH) groups.',
    keyRuleOrThreshold:
      'Lipinski Threshold: HBD <= 5 (total number of -OH and -NH groups).',
    exampleText: 'Phenol (Oc1ccccc1) has 1 phenolic hydroxyl (-OH) group, so HBD = 1.',
    exampleSmiles: 'Oc1ccccc1',
    exampleMoleculeName: 'Phenol',
  },
  {
    id: 'pi_bonds',
    term: 'Pi (π) Bonds & Unsaturation',
    fullName: 'Covalent Double (=) and Triple (#) Bond Multiplicity',
    category: 'Notation & Structure',
    definition:
      'Multiple covalent bonds consist of one sigma (σ) framework bond plus one or more pi (π) bonds formed by lateral p-orbital overlap.',
    keyRuleOrThreshold:
      'Double bond (=): 1 σ bond + 1 π bond | Triple bond (#): 1 σ bond + 2 π bonds.',
    exampleText: 'Acetic acid CC(=O)O has a C=O double bond containing 1 pi (π) bond.',
    exampleSmiles: 'CC(=O)O',
    exampleMoleculeName: 'Acetic Acid',
  },
  {
    id: 'cpk_model',
    term: 'Space-Filling (CPK) Model',
    fullName: 'Corey-Pauling-Koltun Van der Waals Volume Model',
    category: '3D Visualization',
    definition:
      'A 3D molecular representation where each atom is drawn as a sphere with a radius proportional to its Van der Waals radius, illustrating approximate molecular volume and steric bulk.',
    keyRuleOrThreshold:
      'Standard CPK Atom Colors: Carbon = Gray/Black, Oxygen = Red, Nitrogen = Blue, Hydrogen = White.',
    exampleText: 'Viewing Aspirin in Space-Filling (CPK Sphere) mode reveals the steric volume occupied by its ortho-acetoxy and carboxyl groups.',
    exampleSmiles: 'CC(=O)OC1=CC=CC=C1C(=O)O',
    exampleMoleculeName: 'Aspirin',
  },
];

export const TheoryAndProcedure: React.FC<TheoryAndProcedureProps> = ({
  onNavigateModule,
  onTrySmilesInVisualizer,
}) => {
  const [selectedExample, setSelectedExample] = useState<string>(EXAMPLE_MOLECULES[0].name);
  const [customSmiles, setCustomSmiles] = useState<string>(EXAMPLE_MOLECULES[0].smiles);

  // Interactive Glossary State
  const [selectedTermId, setSelectedTermId] = useState<string>(CHEMINFORMATICS_GLOSSARY[0].id);
  const [glossarySearch, setGlossarySearch] = useState<string>('');

  const filteredGlossary = CHEMINFORMATICS_GLOSSARY.filter(
    (item) =>
      item.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      item.fullName.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      item.definition.toLowerCase().includes(glossarySearch.toLowerCase())
  );

  const activeGlossaryItem =
    CHEMINFORMATICS_GLOSSARY.find((item) => item.id === selectedTermId) ||
    filteredGlossary[0] ||
    CHEMINFORMATICS_GLOSSARY[0];

  const handleSelectExample = (mol: { name: string; smiles: string }) => {
    setSelectedExample(mol.name);
    setCustomSmiles(mol.smiles);
  };

  const handleSubmitSmiles = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSmiles.trim()) return;
    onTrySmilesInVisualizer(customSmiles.trim());
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase text-teal-700 font-semibold">
            PAGE 03 · CHEMINFORMATICS THEORY & SMILES INPUT
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            Cheminformatics Theory, Interactive Glossary & SMILES Input
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Explore key cheminformatics definitions in the interactive glossary below, then enter your own SMILES notation or test an example molecule.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateModule('visualizer')}
          className="px-4 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          Next: 2D & 3D Visualizer
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* INTERACTIVE CHEMINFORMATICS GLOSSARY COMPONENT */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-teal-700" />
              <span className="text-xs font-mono uppercase text-teal-700 font-semibold">
                INTERACTIVE CHEMINFORMATICS GLOSSARY
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Click Any Term to View Definition, Thresholds & Chemical Examples
            </h3>
          </div>

          {/* Search Filter for Glossary Terms */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={glossarySearch}
              onChange={(e) => setGlossarySearch(e.target.value)}
              placeholder="Filter glossary terms..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
            />
          </div>
        </div>

        {/* Clickable Term Selector Buttons */}
        <div className="flex flex-wrap gap-2">
          {filteredGlossary.map((item) => {
            const isSelected = activeGlossaryItem.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedTermId(item.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{item.term}</span>
              </button>
            );
          })}
          {filteredGlossary.length === 0 && (
            <p className="text-xs text-slate-500 py-2">
              No glossary terms match "{glossarySearch}". Try searching for SMILES, TPSA, or Lipinski.
            </p>
          )}
        </div>

        {/* Active Term Detailed Definition Panel */}
        {activeGlossaryItem && (
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-mono uppercase font-semibold text-teal-700">
                  {activeGlossaryItem.category}
                </span>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                  {activeGlossaryItem.term} —{' '}
                  <span className="font-normal text-slate-700">
                    {activeGlossaryItem.fullName}
                  </span>
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onTrySmilesInVisualizer(activeGlossaryItem.exampleSmiles)}
                className="px-3.5 py-2 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Inspect {activeGlossaryItem.exampleMoleculeName} in 2D/3D
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
              <div className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-1">
                <div className="font-mono font-bold uppercase text-slate-500 text-[11px]">
                  Scientific Definition
                </div>
                <p className="text-slate-800 text-xs sm:text-sm">
                  {activeGlossaryItem.definition}
                </p>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-1">
                <div className="font-mono font-bold uppercase text-blue-900 text-[11px]">
                  Key Rule / Threshold
                </div>
                <p className="text-slate-800 font-medium text-xs sm:text-sm">
                  {activeGlossaryItem.keyRuleOrThreshold}
                </p>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-1">
                <div className="font-mono font-bold uppercase text-teal-700 text-[11px]">
                  Laboratory Example ({activeGlossaryItem.exampleMoleculeName})
                </div>
                <p className="text-slate-800 text-xs sm:text-sm">
                  {activeGlossaryItem.exampleText}
                </p>
                <div className="pt-1 font-mono text-[11px] text-slate-500">
                  SMILES: <strong className="text-slate-800">{activeGlossaryItem.exampleSmiles}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Core Theory Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
            <BookOpen className="w-4 h-4" />
            SMILES Notation
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>SMILES</strong> (Simplified Molecular Input Line Entry System) converts chemical structures into text strings: atoms (<code className="font-mono">C, N, O</code>), double bonds (<code className="font-mono">=</code>), triple bonds (<code className="font-mono">#</code>), branches (<code className="font-mono">()</code>), and rings (<code className="font-mono">c1ccccc1</code>).
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
            <FlaskConical className="w-4 h-4" />
            2D & 3D Structures
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            From a SMILES string, our portal generates a <strong>2D skeletal diagram</strong> and an interactive <strong>3D spatial conformer</strong> using <code className="font-mono">3Dmol.js</code> (<code className="font-mono">py3Dmol</code>) with Ball & Stick, Stick, and Space-Filling (CPK) models.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
            <BookOpen className="w-4 h-4" />
            Lipinski Rule of Five
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Evaluates oral drug bioavailability: <strong>MW ≤ 500 g/mol</strong>, <strong>XLogP ≤ 5</strong> (lipophilicity), <strong>HBD ≤ 5</strong>, <strong>HBA ≤ 10</strong>, and <strong>TPSA ≤ 140 Å²</strong>.
          </p>
        </div>
      </div>

      {/* Custom SMILES Entry + 6 Reference Example Molecules */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
        <div className="pb-3 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            Enter Your Own SMILES or Select an Example Molecule
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Type any custom SMILES string below, or click one of the 6 example molecules to populate the box and open it in the 2D/3D Visualizer.
          </p>
        </div>

        {/* Custom SMILES Input Form */}
        <form onSubmit={handleSubmitSmiles} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={customSmiles}
            onChange={(e) => setCustomSmiles(e.target.value)}
            placeholder="Enter any SMILES notation (e.g., CCO, c1ccccc1, CC(=O)O)..."
            className="flex-1 px-4 py-3 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
          />
          <button
            type="submit"
            className="px-6 py-3 text-xs sm:text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4" />
            Visualize 2D & 3D Structure
          </button>
        </form>

        {/* Reference Example Molecule List (Dark Card Style Matching Screenshot) */}
        <div className="space-y-2">
          <label className="block text-xs font-mono uppercase text-slate-500 font-semibold">
            Example Molecules (Click to Load SMILES)
          </label>
          <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-2 divide-y divide-slate-800/60">
            {EXAMPLE_MOLECULES.map((mol) => {
              const isSelected = selectedExample === mol.name && customSmiles === mol.smiles;
              return (
                <button
                  key={mol.name}
                  type="button"
                  onClick={() => handleSelectExample(mol)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#1E2536] text-white font-semibold'
                      : 'text-slate-200 hover:bg-[#161C2A]'
                  }`}
                >
                  <span className="text-sm font-medium">{mol.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400">
                      {mol.smiles}
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onTrySmilesInVisualizer(mol.smiles);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-blue-900/80 hover:bg-blue-800 text-white rounded-md"
                    >
                      Open in Page 4 →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
