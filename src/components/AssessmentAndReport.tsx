import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Copy,
  FileDown,
  RotateCcw,
} from 'lucide-react';
import {
  AssessmentState,
  MoleculeRecord,
  StudentProfile,
} from '../types/chemistry';
import { LAB_QUIZ_QUESTIONS } from '../services/cheminformatics';
import {
  generate2DSnapshotDataUrl,
  generate3DFallbackSnapshotDataUrl,
} from '../services/molecularCanvasRenderer';
import { buildImportantCheminformaticsCode } from '../services/pdfReportGenerator';

interface AssessmentAndReportProps {
  student: StudentProfile;
  activeMolecule: MoleculeRecord;
  comparisonList: MoleculeRecord[];
  assessment: AssessmentState;
  completedObjectives: string[];
  snapshot2D: string | null;
  snapshot3D: string | null;
  onUpdateAssessment: (updated: AssessmentState) => void;
  onDownloadOfficialPdf: () => void;
  onNavigateToHomeForReg: () => void;
}

export const AssessmentAndReport: React.FC<AssessmentAndReportProps> = ({
  student,
  activeMolecule,
  comparisonList,
  assessment,
  snapshot2D,
  snapshot3D,
  onUpdateAssessment,
  onDownloadOfficialPdf,
  onNavigateToHomeForReg,
}) => {
  const [preview2D, setPreview2D] = useState<string | null>(snapshot2D);
  const [preview3D, setPreview3D] = useState<string | null>(snapshot3D);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (snapshot2D) {
      setPreview2D(snapshot2D);
    } else {
      generate2DSnapshotDataUrl(activeMolecule).then((url) => {
        if (mounted) setPreview2D(url);
      });
    }

    if (snapshot3D) {
      setPreview3D(snapshot3D);
    } else {
      const url3d = generate3DFallbackSnapshotDataUrl(activeMolecule);
      if (mounted) setPreview3D(url3d);
    }
    return () => {
      mounted = false;
    };
  }, [activeMolecule, snapshot2D, snapshot3D]);

  const handleToggleOption = (questionId: string | number, optionIndex: number) => {
    if (assessment.submitted) return;
    const nextAnswers = { ...assessment.mcqAnswers };
    if (nextAnswers[questionId] === optionIndex) {
      delete nextAnswers[questionId];
    } else {
      nextAnswers[questionId] = optionIndex;
    }
    onUpdateAssessment({
      ...assessment,
      mcqAnswers: nextAnswers,
      totalQuestions: LAB_QUIZ_QUESTIONS.length,
    });
  };

  const handleSubmitAssessment = () => {
    const score = LAB_QUIZ_QUESTIONS.reduce((acc, q) => {
      return acc + (assessment.mcqAnswers[q.id] === q.correctIndex ? 1 : 0);
    }, 0);
    onUpdateAssessment({
      ...assessment,
      submitted: true,
      score,
      totalQuestions: LAB_QUIZ_QUESTIONS.length,
    });
  };

  const handleRetakeAssessment = () => {
    onUpdateAssessment({
      ...assessment,
      mcqAnswers: {},
      submitted: false,
      score: 0,
      totalQuestions: LAB_QUIZ_QUESTIONS.length,
    });
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const answeredCount = Object.keys(assessment.mcqAnswers).length;
  const totalMarks = LAB_QUIZ_QUESTIONS.length; // 12 Marks (1 Mark per question)
  const importantCodeModules = buildImportantCheminformaticsCode(
    activeMolecule,
    comparisonList
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-cyan-700 dark:text-cyan-400 font-semibold">
            PAGE 07 · CHEMINFORMATICS ASSESSMENT & FINAL PDF REPORT
          </p>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            Laboratory Assessment (12 Questions · 1 Mark Each · Total 12 Marks)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Tick the checkbox next to your chosen answer for each question, then click{' '}
            <strong className="text-slate-900 dark:text-slate-100">Submit Assessment</strong> at the bottom to calculate your marks out of 12.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 bg-slate-50 dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300">
            {assessment.submitted ? (
              <span>
                Final Marks:{' '}
                <strong className="text-emerald-700 dark:text-emerald-400 text-sm">
                  {assessment.score} / {totalMarks} Marks
                </strong>
              </span>
            ) : (
              <span>
                Answered:{' '}
                <strong className="text-slate-900 dark:text-slate-100">
                  {answeredCount} / {totalMarks} Questions
                </strong>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onDownloadOfficialPdf}
            className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <FileDown className="w-4 h-4" />
            Download Final PDF Report (with 2D/3D Images & Code)
          </button>
        </div>
      </section>

      {/* Registration Reminder if Unregistered */}
      {!student.isRegistered && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Student Registration Incomplete:</span>{' '}
              Please enter your Student Name and Registration Number on Page 1 so your PDF report includes your identity.
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToHomeForReg}
            className="px-3.5 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Go to Page 1: Student Details
          </button>
        </div>
      )}

      {/* 12 Assessment Questions Grid (Clean Checkboxes — No Blue Answer Fill) */}
      <section className="bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Assessment Questions (12 Questions × 1 Mark = 12 Marks)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click the checkbox box next to an option to select your answer. All boxes start unselected.
            </p>
          </div>
          {(answeredCount > 0 || assessment.submitted) && (
            <button
              type="button"
              onClick={handleRetakeAssessment}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#131C31] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer self-start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear All Answers
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {LAB_QUIZ_QUESTIONS.map((q, qIdx) => {
            const selected = assessment.mcqAnswers[q.id];

            return (
              <div
                key={q.id}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-[#131C31]/70 flex flex-col justify-between space-y-3.5"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      <span className="font-mono text-cyan-700 dark:text-cyan-400 mr-1.5">
                        {qIdx + 1}.
                      </span>
                      {q.question}
                    </div>
                    <span className="px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-700 rounded shrink-0">
                      1 Mark
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {q.options.map((opt, optIdx) => {
                      const isChecked = selected === optIdx;

                      return (
                        <label
                          key={opt}
                          className={`px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1322] text-slate-800 dark:text-slate-200 text-xs sm:text-sm flex items-center gap-3 transition-colors select-none ${
                            assessment.submitted
                              ? 'cursor-default'
                              : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={assessment.submitted}
                            onChange={() => handleToggleOption(q.id, optIdx)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 accent-slate-900 dark:accent-emerald-500 shrink-0 cursor-pointer"
                          />
                          <span className="leading-snug">
                            <strong className="font-mono mr-1.5 text-slate-600 dark:text-slate-400">
                              {String.fromCharCode(65 + optIdx)}.
                            </strong>
                            {opt}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Submit Button & Marks Calculation Card */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          {!assessment.submitted ? (
            <>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                You have answered{' '}
                <strong className="font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {answeredCount} of {totalMarks}
                </strong>{' '}
                questions. Click Submit Assessment to calculate your marks.
              </div>
              <button
                type="button"
                onClick={handleSubmitAssessment}
                className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                Submit Assessment ({answeredCount}/{totalMarks} Answered)
              </button>
            </>
          ) : (
            <div className="w-full p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                    Assessment Submitted Successfully
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                    Each correct question carries 1 mark out of {totalMarks} total marks.
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 bg-white dark:bg-[#0D1322] border border-emerald-300 dark:border-emerald-700 rounded-lg text-center shrink-0">
                <div className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400">
                  Total Marks Scored
                </div>
                <div className="text-lg font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  {assessment.score} / {totalMarks} Marks
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2D & 3D Molecular Structure Preview Included in Final PDF Report */}
      <section className="bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              2D & 3D Molecular Structure Images for Final PDF Report ({activeMolecule.name})
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Both the 2D chemical structure diagram and the 3D conformer model shown below are automatically embedded in your downloaded PDF report.
            </p>
          </div>
          <button
            type="button"
            onClick={onDownloadOfficialPdf}
            className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <FileDown className="w-4 h-4" />
            Download Official PDF Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center">
            <div className="w-full text-xs font-mono font-bold text-cyan-800 dark:text-cyan-400 mb-2">
              1. 2D Molecular Structure Image ({activeMolecule.name})
            </div>
            {preview2D ? (
              <img
                src={preview2D}
                alt={`2D structure of ${activeMolecule.name}`}
                className="h-48 w-auto object-contain bg-white border border-slate-200 rounded-lg p-2"
              />
            ) : (
              <div className="h-48 w-full flex items-center justify-center text-xs text-slate-400">
                Generating 2D structure image...
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 dark:bg-[#131C31] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center">
            <div className="w-full text-xs font-mono font-bold text-cyan-800 dark:text-cyan-400 mb-2">
              2. 3D Molecular Structure Image ({activeMolecule.name})
            </div>
            {preview3D ? (
              <img
                src={preview3D}
                alt={`3D structure of ${activeMolecule.name}`}
                className="h-48 w-auto object-contain bg-slate-950 border border-slate-800 rounded-lg p-2"
              />
            ) : (
              <div className="h-48 w-full flex items-center justify-center text-xs text-slate-400">
                Generating 3D structure image...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Important Cheminformatics Source Code Included in Final PDF Report */}
      <section className="bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-cyan-700 dark:text-cyan-400 font-semibold flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" />
              SECTION 7 OF FINAL PDF DOSSIER · EXECUTABLE CHEMINFORMATICS CODE
            </p>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Important Python Cheminformatics Code Included in Final PDF Report
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              These 4 core Python code modules (RDKit, py3Dmol, PubChemPy, and Pandas) are dynamically tailored to{' '}
              <strong className="font-mono text-slate-900 dark:text-slate-200">
                {activeMolecule.name} ({activeMolecule.canonicalSmiles})
              </strong>{' '}
              and automatically embedded into Section 7 of your downloaded PDF report.
            </p>
          </div>
          <button
            type="button"
            onClick={onDownloadOfficialPdf}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer self-start sm:self-center shadow-xs"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export PDF with Code
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {importantCodeModules.map((mod) => {
            const isCopied = copiedId === mod.id;
            return (
              <div
                key={mod.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131C31] flex flex-col justify-between overflow-hidden"
              >
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {mod.title}
                    </div>
                    <div className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400 mt-0.5">
                      {mod.library}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {mod.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(mod.id, mod.code)}
                    className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1322] text-slate-700 dark:text-slate-200 hover:border-cyan-500/50 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-4 text-[11px] font-mono leading-relaxed text-slate-100 bg-[#070A12] overflow-x-auto">
                  <code>{mod.code}</code>
                </pre>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
