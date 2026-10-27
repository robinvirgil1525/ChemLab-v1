import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { LabModuleId, StudentProfile } from '../types/chemistry';

interface HomeAndRegistrationProps {
  mode: 'registration' | 'objectives';
  student: StudentProfile;
  onSaveStudent: (updated: StudentProfile) => void;
  completedObjectives: string[];
  onNavigateModule: (module: LabModuleId) => void;
}

export const HomeAndRegistration: React.FC<HomeAndRegistrationProps> = ({
  mode,
  student,
  onSaveStudent,
  onNavigateModule,
}) => {
  const [formData, setFormData] = useState<StudentProfile>(student);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setValidationError(null);
    setFormData({ ...formData, studentName: val });
  };

  const handleRegChange = (val: string) => {
    setValidationError(null);
    setFormData({ ...formData, registerNumber: val.toUpperCase() });
  };

  const handleSubmitAndContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.studentName.trim();
    const trimmedReg = formData.registerNumber.trim();

    if (!trimmedName || !trimmedReg) {
      setValidationError(
        'Please enter both your Student Full Name and Registration Number to proceed to the next page.'
      );
      return;
    }

    const updated: StudentProfile = {
      ...formData,
      studentName: trimmedName,
      registerNumber: trimmedReg.toUpperCase(),
      isRegistered: true,
    };
    setValidationError(null);
    onSaveStudent(updated);
    setFormData(updated);
    onNavigateModule('objectives');
  };

  // PAGE 1: CLEAN, CENTERED STUDENT REGISTRATION PAGE
  if (mode === 'registration') {
    const canProceed =
      Boolean(formData.studentName.trim()) &&
      Boolean(formData.registerNumber.trim());

    return (
      <div className="max-w-xl mx-auto py-6">
        <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          {/* Official SRM Tiruchirappalli Branding */}
          <div className="flex flex-col items-center text-center pb-5 border-b border-slate-200 space-y-3">
            <div className="bg-white border border-slate-200 rounded-lg p-2.5 inline-flex items-center justify-center">
              <img
                src="/assets/aistudio/SRM_logo_f0d368b0.jpg"
                alt="SRM Institute of Science and Technology Tiruchirappalli"
                referrerPolicy="no-referrer"
                className="h-16 w-auto object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-blue-950">
                SRM Institute of Science and Technology, Tiruchirappalli
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mt-0.5">
                Faculty of Engineering and Technology · School of Sciences · Division of Chemistry
              </p>
            </div>
            <div className="pt-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Cheminformatics Virtual Laboratory
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Enter your Student Name and Registration Number to unlock the virtual laboratory.
              </p>
            </div>
          </div>

          {/* Simple Student Registration Form */}
          <form onSubmit={handleSubmitAndContinue} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="student-name"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Student Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                id="student-name"
                type="text"
                required
                value={formData.studentName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="reg-number"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Registration Number <span className="text-rose-600">*</span>
              </label>
              <input
                id="reg-number"
                type="text"
                required
                value={formData.registerNumber}
                onChange={(e) => handleRegChange(e.target.value)}
                placeholder="e.g., RA2411003040001"
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900"
              />
            </div>

            {validationError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs font-medium text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={!canProceed}
                className={`w-full px-5 py-3 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  canProceed
                    ? 'text-white bg-blue-900 hover:bg-blue-800 cursor-pointer'
                    : 'text-slate-400 bg-slate-200 cursor-not-allowed'
                }`}
              >
                Next Page
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  // PAGE 2: SIMPLE, EASY-TO-UNDERSTAND LEARNING OBJECTIVES & WORKFLOW
  const simpleObjectives = [
    'Enter any SMILES notation and validate molecular structure',
    'Generate 2D chemical structures and interactive 3D models',
    'Explore different 3D molecular visualization styles (Ball & Stick, Sphere, Surface)',
    'Calculate complete molecular properties and Lipinski drug-likeness rules',
    'Compare multiple molecules side-by-side with charts and data tables',
    'Complete the 12-mark assessment and download the Final Project Report (PDF)',
  ];

  const simpleWorkflow = [
    { step: 'Step 1', title: 'Theory', desc: 'Read basic SMILES rules and lab steps' },
    { step: 'Step 2', title: '2D & 3D Visualizer', desc: 'Enter SMILES and view 2D/3D structures' },
    { step: 'Step 3', title: 'Properties Report', desc: 'Check molecular weight, LogP, TPSA & rules' },
    { step: 'Step 4', title: 'Compare Molecules', desc: 'Compare multiple molecules with charts' },
    { step: 'Step 5', title: 'Assessment & PDF', desc: 'Submit 12-mark assessment and download PDF' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Learning Objectives Box */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <p className="text-xs font-mono uppercase text-teal-700 font-semibold">
              PAGE 02 · EXPERIMENT OVERVIEW
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              Learning Objectives
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateModule('theory')}
            className="px-4 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            Next: Go to Theory
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-600">
          In this virtual laboratory, you will perform the following tasks:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {simpleObjectives.map((item, idx) => (
            <div
              key={item}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3"
            >
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm font-medium text-slate-800">
                <strong className="font-mono text-blue-900 mr-1.5">0{idx + 1}.</strong>
                {item}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Simple 5-Step Lab Workflow */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
        <div className="pb-3 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            How to Complete This Virtual Lab (5 Simple Steps)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {simpleWorkflow.map((w) => (
            <div
              key={w.step}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <div className="text-xs font-mono font-bold text-blue-900">
                {w.step}
              </div>
              <div className="text-sm font-bold text-slate-900 mt-1">
                {w.title}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {w.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
