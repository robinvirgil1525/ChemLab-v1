export type LabModuleId =
  | 'home'
  | 'objectives'
  | 'theory'
  | 'visualizer'
  | 'properties'
  | 'analysis'
  | 'assessment';

export type VisualizationStyle3D =
  | 'ball_and_stick'
  | 'stick'
  | 'sphere'
  | 'wireframe'
  | 'surface';

export interface StudentProfile {
  studentName: string;
  registerNumber: string;
  faculty: string;
  department: string;
  courseCode: string;
  semester: string;
  batch: string;
  instructorName: string;
  experimentDate: string;
  isRegistered: boolean;
}

export interface LipinskiEvaluation {
  passes: boolean;
  violations: number;
  mwPass: boolean;
  logpPass: boolean;
  hbdPass: boolean;
  hbaPass: boolean;
  notes: string[];
}

export interface VeberEvaluation {
  passes: boolean;
  violations: number;
  rotatableBondsPass: boolean;
  tpsaPass: boolean;
  bbbPermeable: boolean;
}

export interface FunctionalGroupMatch {
  name: string;
  smartsLabel: string;
  count: number;
  description: string;
}

export interface MoleculeRecord {
  id: string;
  queryInput: string;
  name: string;
  iupacName: string;
  cid: number;
  smiles: string;
  canonicalSmiles: string;
  isomericSmiles: string;
  formula: string;
  inchi: string;
  inchiKey: string;
  molecularWeight: number;
  xlogp: number;
  tpsa: number;
  hBondDonors: number;
  hBondAcceptors: number;
  rotatableBonds: number;
  heavyAtomCount: number;
  charge: number;
  complexity: number;
  aromaticRings: number;
  fractionCsp3: number;
  qedEstimate: number;
  sdf3D: string;
  sourceProvenance: 'PubChem PUG REST + RDKit Descriptors' | 'Benchmark Curated Reference + PubChem';
  lipinski: LipinskiEvaluation;
  veber: VeberEvaluation;
  functionalGroups: FunctionalGroupMatch[];
  therapeuticClass?: string;
  analyzedAt: string;
}

export interface SmilesValidationResult {
  isValid: boolean;
  normalizedSmiles: string;
  atomCountEstimate: number;
  ringClosures: number;
  branches: number;
  aromaticAtoms: number;
  stereocenters: number;
  errors: string[];
  warnings: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  category: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ObservationPrompts {
  primaryMoleculeAnalysis: string;
  lipinskiBioavailabilityConclusion: string;
  structurePropertyComparison: string;
  visualizationStyleReflection: string;
}

export interface AssessmentState {
  mcqAnswers: Record<string, number>;
  submitted: boolean;
  score: number;
  totalQuestions: number;
  observations: ObservationPrompts;
  submittedAt?: string;
}
