/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  FileDown,
  Moon,
  Sun,
} from 'lucide-react';
import {
  AssessmentState,
  LabModuleId,
  MoleculeRecord,
  StudentProfile,
} from './types/chemistry';
import {
  analyzeMoleculeBySmilesOrName,
  BENCHMARK_MOLECULES,
  buildMoleculeRecordFromPreset,
  fetchPubChem3DSdf,
  LAB_QUIZ_QUESTIONS,
} from './services/cheminformatics';
import { generateOfficialLabReportPdf } from './services/pdfReportGenerator';
import { HomeAndRegistration } from './components/HomeAndRegistration';
import { TheoryAndProcedure } from './components/TheoryAndProcedure';
import { MolecularViewerWorkbench } from './components/MolecularViewerWorkbench';
import { MolecularPropertiesReport } from './components/MolecularPropertiesReport';
import { StructurePropertyAnalysis } from './components/StructurePropertyAnalysis';
import { AssessmentAndReport } from './components/AssessmentAndReport';

const STORAGE_KEY_STUDENT = 'srm_chemlab_student_v1';
const STORAGE_KEY_ASSESSMENT = 'srm_chemlab_assessment_v1';
const STORAGE_KEY_THEME = 'srm_chemlab_darkmode_v1';

const LAB_PAGES: Array<{
  id: LabModuleId;
  step: string;
  shortLabel: string;
  fullTitle: string;
}> = [
  {
    id: 'home',
    step: '01',
    shortLabel: 'Student Details',
    fullTitle: 'Page 1: Student Registration & Check-In',
  },
  {
    id: 'objectives',
    step: '02',
    shortLabel: 'Objectives & Workflow',
    fullTitle: 'Page 2: Learning Objectives & Experimental Workflow',
  },
  {
    id: 'theory',
    step: '03',
    shortLabel: 'Theory & SOP',
    fullTitle: 'Page 3: Cheminformatics Theory & Operating Procedure',
  },
  {
    id: 'visualizer',
    step: '04',
    shortLabel: '2D/3D Visualizer',
    fullTitle: 'Page 4: Interactive 2D & 3D Molecular Visualization',
  },
  {
    id: 'properties',
    step: '05',
    shortLabel: 'Properties Report',
    fullTitle: 'Page 5: Complete Molecular Properties Report',
  },
  {
    id: 'analysis',
    step: '06',
    shortLabel: 'Structure-Property',
    fullTitle: 'Page 6: Multi-Molecule Structure-Property Analysis',
  },
  {
    id: 'assessment',
    step: '07',
    shortLabel: 'Assessment & PDF',
    fullTitle: 'Page 7: Graded Assessment & Final PDF Project Report',
  },
];

export default function App() {
  // Strict Page-to-Page Model starting at Page 1 ('home' = Student Details)
  const [activeModule, setActiveModule] = useState<LabModuleId>('home');

  // Global Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_THEME) === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const rootEl = document.documentElement;
    if (darkMode) {
      rootEl.classList.add('dark');
    } else {
      rootEl.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEY_THEME, darkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [darkMode]);

  // Student Registration State (Always starts clean on Page 1)
  const [student, setStudent] = useState<StudentProfile>(() => ({
    studentName: '',
    registerNumber: '',
    faculty: 'Faculty of Engineering and Technology',
    department: 'School of Sciences | Division of Chemistry',
    courseCode: 'CYB2101 — Cheminformatics Laboratory',
    semester: 'Even Semester · Batch 1',
    batch: 'Batch 1',
    instructorName: 'Division of Chemistry Faculty',
    experimentDate: new Date().toISOString().split('T')[0],
    isRegistered: false,
  }));

  // Active Molecule State (Default: Aspirin)
  const [activeMolecule, setActiveMolecule] = useState<MoleculeRecord>(() =>
    buildMoleculeRecordFromPreset(BENCHMARK_MOLECULES[0])
  );

  // Comparison Matrix List (Default: Aspirin, Paracetamol, Caffeine, Ibuprofen)
  const [comparisonList, setComparisonList] = useState<MoleculeRecord[]>(() => [
    buildMoleculeRecordFromPreset(BENCHMARK_MOLECULES[0]),
    buildMoleculeRecordFromPreset(BENCHMARK_MOLECULES[1]),
    buildMoleculeRecordFromPreset(BENCHMARK_MOLECULES[2]),
    buildMoleculeRecordFromPreset(BENCHMARK_MOLECULES[3]),
  ]);

  // Completed Learning Objectives & 7-Page Lab Progress Tracker (Starts at 0% on Page 1)
  const CORE_OBJECTIVE_IDS = [
    'step_home',
    'step_objectives',
    'smiles',
    '2d',
    'properties',
    'compare',
    'assessment',
  ];

  const [completedObjectives, setCompletedObjectives] = useState<string[]>([]);

  const completedCoreCount = CORE_OBJECTIVE_IDS.filter((id) =>
    completedObjectives.includes(id)
  ).length;
  const completionPercentage = Math.round(
    (completedCoreCount / CORE_OBJECTIVE_IDS.length) * 100
  );
  const ringRadius = 13;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset =
    ringCircumference - (completionPercentage / 100) * ringCircumference;

  // Assessment State (Always starts clean with no pre-selected answers)
  const [assessment, setAssessment] = useState<AssessmentState>(() => ({
    mcqAnswers: {},
    submitted: false,
    score: 0,
    totalQuestions: LAB_QUIZ_QUESTIONS.length,
    observations: {
      primaryMoleculeAnalysis: '',
      lipinskiBioavailabilityConclusion: '',
      structurePropertyComparison: '',
      visualizationStyleReflection: '',
    },
  }));

  const [isLoadingMolecule, setIsLoadingMolecule] = useState<boolean>(false);
  const [moleculeError, setMoleculeError] = useState<string | null>(null);
  const [snapshot2D, setSnapshot2D] = useState<string | null>(null);
  const [snapshot3D, setSnapshot3D] = useState<string | null>(null);

  // Fetch authoritative 3D SDF from PubChem on initial mount for default Aspirin
  useEffect(() => {
    let mounted = true;
    fetchPubChem3DSdf(
      BENCHMARK_MOLECULES[0].cid,
      BENCHMARK_MOLECULES[0].name,
      BENCHMARK_MOLECULES[0].smiles
    ).then((sdf) => {
      if (mounted && sdf) {
        setActiveMolecule((prev) =>
          prev.cid === BENCHMARK_MOLECULES[0].cid ? { ...prev, sdf3D: sdf } : prev
        );
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const isRegisteredRef = React.useRef<boolean>(student.isRegistered);
  isRegisteredRef.current = student.isRegistered;

  const markObjectiveDone = (id: string) => {
    setCompletedObjectives((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const markMultipleObjectivesDone = (ids: string[]) => {
    setCompletedObjectives((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return Array.from(next);
    });
  };

  const navigateToPage = (moduleId: LabModuleId) => {
    if (moduleId !== 'home' && !isRegisteredRef.current) {
      setActiveModule('home');
      return;
    }
    if (moduleId === 'objectives') {
      markMultipleObjectivesDone(['step_home']);
    } else if (moduleId === 'theory') {
      markMultipleObjectivesDone(['step_home', 'step_objectives']);
    } else if (moduleId === 'visualizer') {
      markMultipleObjectivesDone(['step_home', 'step_objectives', 'smiles']);
    } else if (moduleId === 'properties') {
      markMultipleObjectivesDone([
        'step_home',
        'step_objectives',
        'smiles',
        'validate',
        '2d',
        '3d',
      ]);
    } else if (moduleId === 'analysis') {
      markMultipleObjectivesDone([
        'step_home',
        'step_objectives',
        'smiles',
        'validate',
        '2d',
        '3d',
        'properties',
      ]);
    } else if (moduleId === 'assessment') {
      markMultipleObjectivesDone([
        'step_home',
        'step_objectives',
        'smiles',
        'validate',
        '2d',
        '3d',
        'properties',
        'compare',
      ]);
    }
    setActiveModule(moduleId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentPageIndex = LAB_PAGES.findIndex((p) => p.id === activeModule);
  const prevPage = currentPageIndex > 0 ? LAB_PAGES[currentPageIndex - 1] : null;
  const nextPage =
    currentPageIndex < LAB_PAGES.length - 1
      ? LAB_PAGES[currentPageIndex + 1]
      : null;

  const handleSaveStudent = (updated: StudentProfile) => {
    isRegisteredRef.current = updated.isRegistered;
    setStudent(updated);
    if (updated.isRegistered) {
      markMultipleObjectivesDone(['step_home']);
    }
    // Clear any previous assessment selections so every student session starts completely blank
    setAssessment({
      mcqAnswers: {},
      submitted: false,
      score: 0,
      totalQuestions: LAB_QUIZ_QUESTIONS.length,
      observations: {
        primaryMoleculeAnalysis: '',
        lipinskiBioavailabilityConclusion: '',
        structurePropertyComparison: '',
        visualizationStyleReflection: '',
      },
    });
    try {
      localStorage.setItem(STORAGE_KEY_STUDENT, JSON.stringify(updated));
      localStorage.removeItem(STORAGE_KEY_ASSESSMENT);
    } catch {
      // ignore
    }
  };

  const handleUpdateAssessment = (updated: AssessmentState) => {
    setAssessment(updated);
    if (updated.submitted) {
      markMultipleObjectivesDone([
        'step_home',
        'step_objectives',
        'smiles',
        'validate',
        '2d',
        '3d',
        'properties',
        'compare',
        'assessment',
      ]);
    }
  };

  const handleAnalyzeQuery = async (query: string) => {
    setIsLoadingMolecule(true);
    setMoleculeError(null);
    try {
      const record = await analyzeMoleculeBySmilesOrName(query);
      setActiveMolecule(record);
      markMultipleObjectivesDone([
        'step_home',
        'step_objectives',
        'smiles',
        'validate',
        '2d',
        '3d',
      ]);
    } catch (err: any) {
      setMoleculeError(
        err?.message || 'Unable to parse SMILES string. Please check syntax and valence.'
      );
    } finally {
      setIsLoadingMolecule(false);
    }
  };

  const handleAddToComparison = (mol: MoleculeRecord) => {
    markObjectiveDone('compare');
    setComparisonList((prev) => {
      const exists = prev.some(
        (item) =>
          item.canonicalSmiles === mol.canonicalSmiles || item.name === mol.name
      );
      if (exists) return prev;
      return [...prev, mol];
    });
  };

  const handleAddPresetToComparison = async (smiles: string) => {
    const record = await analyzeMoleculeBySmilesOrName(smiles);
    handleAddToComparison(record);
  };

  const handleRemoveFromComparison = (id: string) => {
    setComparisonList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDownloadOfficialPdf = async () => {
    const allCompleted = [
      'step_home',
      'step_objectives',
      'smiles',
      'validate',
      '2d',
      '3d',
      'properties',
      'compare',
      'report_single',
      'assessment',
    ];
    markMultipleObjectivesDone(allCompleted);
    await generateOfficialLabReportPdf({
      student,
      activeMolecule,
      comparisonList,
      assessment,
      completedObjectives: allCompleted,
      snapshot2DDataUrl: snapshot2D,
      snapshot3DDataUrl: snapshot3D,
    });
  };

  const isInComparison = comparisonList.some(
    (m) =>
      m.canonicalSmiles === activeMolecule.canonicalSmiles ||
      m.name === activeMolecule.name
  );

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Top Bar Contract: Strictly 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            navigateToPage('home');
          }}
          className="text-base font-bold tracking-tight text-blue-950 whitespace-nowrap shrink-0"
        >
          SRM Tiruchirappalli · Cheminformatics Lab
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-600">
          {(['home', 'objectives', 'theory', 'visualizer', 'assessment'] as LabModuleId[]).map(
            (id) => {
              const item = LAB_PAGES.find((p) => p.id === id)!;
              const isLocked = !student.isRegistered && item.id !== 'home';
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => navigateToPage(item.id)}
                  className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    activeModule === item.id
                      ? 'text-blue-950 font-semibold border-blue-900 cursor-pointer'
                      : isLocked
                      ? 'border-transparent text-slate-400 cursor-not-allowed'
                      : 'border-transparent hover:text-slate-900 cursor-pointer'
                  }`}
                >
                  {item.shortLabel}
                </button>
              );
            }
          )}
        </nav>

        {/* Zone 3: Circular Progress Ring + Primary Action Button */}
        <div className="flex items-center gap-3.5 shrink-0">
          {/* Visual Circular Progress Ring for Completed Lab Objectives */}
          <div
            title={`${completedCoreCount} of ${CORE_OBJECTIVE_IDS.length} Lab Objectives Completed (${completionPercentage}%)`}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200"
          >
            <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                <circle
                  cx="16"
                  cy="16"
                  r={ringRadius}
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="3"
                />
                <circle
                  cx="16"
                  cy="16"
                  r={ringRadius}
                  fill="none"
                  stroke={completionPercentage === 100 ? '#059669' : '#1E3A8A'}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringDashOffset}
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <span className="absolute text-[9px] font-mono font-bold text-slate-800">
                {completionPercentage}%
              </span>
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-[10px] font-mono uppercase text-slate-500 font-semibold">
                Lab Progress
              </div>
              <div className="text-xs font-mono font-bold text-slate-800">
                {completedCoreCount}/{CORE_OBJECTIVE_IDS.length} Done
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={!student.isRegistered}
            onClick={handleDownloadOfficialPdf}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              student.isRegistered
                ? 'text-white bg-blue-900 hover:bg-blue-800 cursor-pointer'
                : 'text-slate-400 bg-slate-200 cursor-not-allowed'
            }`}
          >
            <FileDown className="w-3.5 h-3.5" />
            Export Final PDF Report
          </button>
        </div>
      </header>

      {/* Secondary Page-to-Page Progress Stepper & Dark Mode Toggle Ribbon */}
      <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5">
        <div className="max-w-[1380px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Interactive 7-Page Stepper */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {LAB_PAGES.map((item, idx) => {
              const isActive = activeModule === item.id;
              const isPassed = idx < currentPageIndex;
              const isLocked = !student.isRegistered && item.id !== 'home';
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => navigateToPage(item.id)}
                  className={`px-2.5 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-blue-900 text-white font-semibold shadow-xs cursor-pointer'
                      : isLocked
                      ? 'text-slate-400 cursor-not-allowed opacity-60'
                      : isPassed
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-pointer'
                      : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 cursor-pointer'
                  }`}
                >
                  <span className="font-mono mr-1 opacity-80">P{item.step}:</span>
                  {item.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Dark Mode Toggle Button & Student Telemetry */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-slate-600">
            <span>
              Student:{' '}
              <strong className="text-slate-900">
                {student.isRegistered
                  ? `${student.studentName} (${student.registerNumber})`
                  : 'Unregistered'}
              </strong>
            </span>
            <span>·</span>
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 font-sans font-semibold text-xs transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              {darkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  Dark Mode
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Single-Page-At-A-Time Workbench Content Container */}
      <main className="flex-1 w-full max-w-[1380px] mx-auto px-4 sm:px-6 py-8 flex flex-col justify-between">
        <div>
          {activeModule === 'home' && (
            <HomeAndRegistration
              mode="registration"
              student={student}
              onSaveStudent={handleSaveStudent}
              completedObjectives={completedObjectives}
              onNavigateModule={navigateToPage}
            />
          )}

          {activeModule === 'objectives' && (
            <HomeAndRegistration
              mode="objectives"
              student={student}
              onSaveStudent={handleSaveStudent}
              completedObjectives={completedObjectives}
              onNavigateModule={navigateToPage}
            />
          )}

          {activeModule === 'theory' && (
            <TheoryAndProcedure
              onNavigateModule={navigateToPage}
              onTrySmilesInVisualizer={async (smiles) => {
                navigateToPage('visualizer');
                await handleAnalyzeQuery(smiles);
              }}
            />
          )}

          {activeModule === 'visualizer' && (
            <MolecularViewerWorkbench
              activeMolecule={activeMolecule}
              isLoading={isLoadingMolecule}
              errorMsg={moleculeError}
              onAnalyzeQuery={handleAnalyzeQuery}
              onAddToComparison={handleAddToComparison}
              isInComparison={isInComparison}
              onStyleExplored={() => markObjectiveDone('styles')}
              onCaptureSnapshots={(snap2D, snap3D) => {
                if (snap2D) setSnapshot2D(snap2D);
                if (snap3D) setSnapshot3D(snap3D);
              }}
              onNavigateNext={() => navigateToPage('properties')}
            />
          )}

          {activeModule === 'properties' && (
            <MolecularPropertiesReport
              activeMolecule={activeMolecule}
              isInComparison={isInComparison}
              onAddToComparison={handleAddToComparison}
              onDownloadSingleReport={() => markObjectiveDone('report_single')}
              onExportFullPdf={handleDownloadOfficialPdf}
              onNavigateNext={() => navigateToPage('analysis')}
            />
          )}

          {activeModule === 'analysis' && (
            <StructurePropertyAnalysis
              comparisonList={comparisonList}
              activeMoleculeId={activeMolecule.id}
              onSelectMoleculeForViewer={(mol) => {
                setActiveMolecule(mol);
                navigateToPage('visualizer');
              }}
              onAddPresetBySmiles={handleAddPresetToComparison}
              onRemoveFromComparison={handleRemoveFromComparison}
              onNavigateNext={() => navigateToPage('assessment')}
            />
          )}

          {activeModule === 'assessment' && (
            <AssessmentAndReport
              student={student}
              activeMolecule={activeMolecule}
              comparisonList={comparisonList}
              assessment={assessment}
              completedObjectives={completedObjectives}
              snapshot2D={snapshot2D}
              snapshot3D={snapshot3D}
              onUpdateAssessment={handleUpdateAssessment}
              onDownloadOfficialPdf={handleDownloadOfficialPdf}
              onNavigateToHomeForReg={() => navigateToPage('home')}
            />
          )}
        </div>

        {/* Dedicated Page-to-Page Bottom Navigation Bar (Removed on First Page) */}
        {activeModule !== 'home' && (
          <div className="mt-10 bg-white border border-slate-200 rounded-xl p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              {prevPage ? (
                <button
                  type="button"
                  onClick={() => navigateToPage(prevPage.id)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous: {prevPage.shortLabel} (Page {prevPage.step})
                </button>
              ) : (
                <span className="text-xs font-mono text-slate-500">
                  Start of Laboratory Sequence (Page 01 of 07)
                </span>
              )}
            </div>

            <div className="text-xs font-mono font-semibold text-slate-600 text-center">
              {LAB_PAGES[currentPageIndex]?.fullTitle}
            </div>

            <div>
              {nextPage ? (
                <button
                  type="button"
                  onClick={() => navigateToPage(nextPage.id)}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  Next: {nextPage.shortLabel} (Page {nextPage.step})
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadOfficialPdf}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  Download Final PDF Project Report
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-5 mt-8">
        <div className="max-w-[1380px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            SRM Institute of Science and Technology, Tiruchirappalli Campus · Faculty of Engineering and Technology · School of Sciences · Division of Chemistry
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigateToPage('home')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Page 1: Student Details
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => navigateToPage('objectives')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Page 2: Objectives
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={handleDownloadOfficialPdf}
              className="hover:text-slate-900 transition-colors font-medium text-blue-900 cursor-pointer"
            >
              Download Official PDF Report
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
