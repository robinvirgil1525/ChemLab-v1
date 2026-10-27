import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AssessmentState,
  MoleculeRecord,
  StudentProfile,
} from '../types/chemistry';
import {
  LAB_QUIZ_QUESTIONS,
} from './cheminformatics';
import {
  generate2DSnapshotDataUrl,
  generate3DFallbackSnapshotDataUrl,
} from './molecularCanvasRenderer';

const LEARNING_OBJECTIVES = [
  { id: 'smiles', title: 'Enter & Validate Any SMILES Notation' },
  { id: '2d', title: 'Generate 2D Chemical Structure' },
  { id: '3d', title: 'Interact with 3D Molecular Conformers & Styles' },
  { id: 'properties', title: 'Calculate Complete Molecular Properties & Lipinski Rules' },
  { id: 'compare', title: 'Compare Multiple Molecules in Structure-Property Analysis' },
  { id: 'assessment', title: 'Complete the 12-Question Cheminformatics Assessment & PDF Dossier' },
];

interface ReportPayload {
  student: StudentProfile;
  activeMolecule: MoleculeRecord;
  comparisonList: MoleculeRecord[];
  assessment: AssessmentState;
  completedObjectives: string[];
  snapshot2DDataUrl?: string | null;
  snapshot3DDataUrl?: string | null;
}

export function exportMoleculesToCsv(
  molecules: MoleculeRecord[],
  filename = 'SRM_Cheminformatics_Dataset.csv'
): void {
  const headers = [
    'Name',
    'IUPAC_Name',
    'PubChem_CID',
    'Formula',
    'Canonical_SMILES',
    'MW_g_mol',
    'XLogP',
    'TPSA_A2',
    'HBD',
    'HBA',
    'Rotatable_Bonds',
    'Heavy_Atoms',
    'Complexity',
    'QED_Score',
    'Lipinski_Violations',
    'Lipinski_Pass',
  ];

  const rows = molecules.map((m) => {
    const mw = Number(m.molecularWeight ?? 0);
    const xlogp = Number(m.xlogp ?? 0);
    const tpsa = Number(m.tpsa ?? 0);
    const hbd = Number(m.hBondDonors ?? 0);
    const hba = Number(m.hBondAcceptors ?? 0);
    const rotB = Number(m.rotatableBonds ?? 0);
    const heavy = Number(m.heavyAtomCount ?? 0);
    const comp = Number(m.complexity ?? 0);
    const qed = Number(m.qedEstimate ?? 0);
    const violations = Number(m.lipinski?.violations ?? 0);
    const passes = Boolean(m.lipinski?.passes ?? violations <= 1);

    return [
      `"${(m.name || '').replace(/"/g, '""')}"`,
      `"${(m.iupacName || '').replace(/"/g, '""')}"`,
      m.cid || 'Custom',
      m.formula || '',
      `"${(m.canonicalSmiles || m.smiles || '').replace(/"/g, '""')}"`,
      mw.toFixed(2),
      xlogp.toFixed(2),
      tpsa.toFixed(1),
      hbd,
      hba,
      rotB,
      heavy,
      comp,
      qed.toFixed(2),
      violations,
      passes ? 'PASS' : 'FAIL',
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportMoleculesToJson(
  molecules: MoleculeRecord[],
  filename = 'SRM_Cheminformatics_Dataset.json'
): void {
  const payload = molecules.map((m) => ({
    name: m.name,
    iupacName: m.iupacName,
    cid: m.cid,
    formula: m.formula,
    canonicalSmiles: m.canonicalSmiles || m.smiles,
    molecularWeight: m.molecularWeight,
    xlogp: m.xlogp,
    tpsa: m.tpsa,
    hBondDonors: m.hBondDonors,
    hBondAcceptors: m.hBondAcceptors,
    rotatableBonds: m.rotatableBonds,
    heavyAtomCount: m.heavyAtomCount,
    complexity: m.complexity,
    qedEstimate: m.qedEstimate,
    lipinski: m.lipinski,
    veber: m.veber,
  }));
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateOfficialLabReportPdf(payload: ReportPayload): Promise<void> {
  const {
    student,
    activeMolecule,
    comparisonList,
    assessment,
    completedObjectives,
    snapshot2DDataUrl,
    snapshot3DDataUrl,
  } = payload;

  // Guarantee both 2D and 3D molecular images are always available for the final PDF report
  const final2DImage =
    snapshot2DDataUrl || (await generate2DSnapshotDataUrl(activeMolecule));
  const final3DImage =
    snapshot3DDataUrl || generate3DFallbackSnapshotDataUrl(activeMolecule);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  // Load SRM Tiruchirappalli Logo
  const logoDataUrl = await loadImageAsDataUrl('/assets/aistudio/SRM_logo_f0d368b0.jpg');
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'JPEG', 14, y, 42, 21);
    } catch {
      // ignore if logo fails
    }
  }

  // Official Institutional Letterhead
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138); // SRM Navy
  doc.text(
    'SRM INSTITUTE OF SCIENCE AND TECHNOLOGY',
    logoDataUrl ? 60 : 14,
    y + 6
  );

  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'Tiruchirappalli Campus | Faculty of Engineering and Technology',
    logoDataUrl ? 60 : 14,
    y + 11.5
  );
  doc.text(
    'School of Sciences | Division of Chemistry',
    logoDataUrl ? 60 : 14,
    y + 16.5
  );

  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9); // SRM Gold Accent
  doc.text(
    'OFFICIAL CHEMINFORMATICS VIRTUAL LABORATORY DOSSIER',
    logoDataUrl ? 60 : 14,
    y + 21.5
  );

  y += 26;
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.6);
  doc.line(14, y, pageWidth - 14, y);
  y += 6;

  // 1. Student Identification Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. STUDENT REGISTRATION RECORD', 14, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2.2,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    body: [
      [
        'Student Name',
        student.studentName || 'Not Entered',
        'Registration Number',
        student.registerNumber || 'Not Entered',
      ],
      [
        'Faculty / School',
        'Faculty of Engineering & Technology | School of Sciences',
        'Division & Date',
        `Division of Chemistry (${student.experimentDate || new Date().toISOString().split('T')[0]})`,
      ],
    ],
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 38 },
      1: { cellWidth: 55 },
      2: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 38 },
      3: { cellWidth: 51 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 7;

  // 2. 2D & 3D Molecular Structure Images (Guaranteed inclusion in final PDF)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `2. 2D & 3D MOLECULAR STRUCTURE VISUALIZATION: ${(activeMolecule.name || 'MOLECULE').toUpperCase()}`,
    14,
    y
  );
  y += 3;

  const imgBoxWidth = 86;
  const imgBoxHeight = 52;

  // Left Box: 2D Structure Image
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(14, y, imgBoxWidth, imgBoxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138);
  doc.text('2D Chemical Structure (RDKit / Canvas 2D)', 17, y + 5);

  if (final2DImage) {
    try {
      doc.addImage(final2DImage, 'PNG', 16, y + 7, imgBoxWidth - 4, imgBoxHeight - 9);
    } catch {
      // ignore image error
    }
  }

  // Right Box: 3D Structure Image
  const rightBoxX = 14 + imgBoxWidth + 10;
  doc.setDrawColor(203, 213, 225);
  doc.rect(rightBoxX, y, imgBoxWidth, imgBoxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138);
  doc.text('3D Spatial Conformer (3Dmol.js / CPK Model)', rightBoxX + 3, y + 5);

  if (final3DImage) {
    try {
      doc.addImage(
        final3DImage,
        'PNG',
        rightBoxX + 2,
        y + 7,
        imgBoxWidth - 4,
        imgBoxHeight - 9
      );
    } catch {
      // ignore image error
    }
  }

  y += imgBoxHeight + 7;

  // 3. Primary Molecule Physicochemical & Lipinski Report
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `3. PRIMARY MOLECULE PHYSICOCHEMICAL PROPERTIES (${(activeMolecule.name || 'MOLECULE').toUpperCase()})`,
    14,
    y
  );
  y += 2;

  const mw = Number(activeMolecule.molecularWeight ?? 0);
  const xlogp = Number(activeMolecule.xlogp ?? 0);
  const tpsa = Number(activeMolecule.tpsa ?? 0);
  const hbd = Number(activeMolecule.hBondDonors ?? 0);
  const hba = Number(activeMolecule.hBondAcceptors ?? 0);
  const rotB = Number(activeMolecule.rotatableBonds ?? 0);
  const heavy = Number(activeMolecule.heavyAtomCount ?? 0);
  const comp = Number(activeMolecule.complexity ?? 0);
  const qed = Number(activeMolecule.qedEstimate ?? 0);
  const lipinskiViolations = Number(activeMolecule.lipinski?.violations ?? 0);
  const lipinskiPassed = Boolean(activeMolecule.lipinski?.passes ?? lipinskiViolations <= 1);

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
    },
    head: [['Descriptor', 'Calculated Value', 'Lipinski / Veber Threshold', 'Status']],
    body: [
      ['Compound Name & PubChem CID', `${activeMolecule.name} (CID: ${activeMolecule.cid || 'Custom'})`, 'Validated Structure', 'PASS'],
      ['Canonical SMILES', activeMolecule.canonicalSmiles || activeMolecule.smiles, 'Topological Line Notation', 'VALID'],
      ['Molecular Formula & IUPAC', `${activeMolecule.formula} | ${activeMolecule.iupacName}`, 'Elemental Identity', 'INFO'],
      ['Molecular Weight (MW)', `${mw.toFixed(2)} g/mol`, '<= 500.00 g/mol (Lipinski)', mw <= 500 ? 'PASS' : 'VIOLATION'],
      ['Partition Coefficient (XLogP)', `${xlogp.toFixed(2)}`, '<= 5.00 (Lipinski)', xlogp <= 5 ? 'PASS' : 'VIOLATION'],
      ['Topological Polar Surface Area (TPSA)', `${tpsa.toFixed(1)} Å²`, '<= 140.0 Å² (Veber)', tpsa <= 140 ? 'PASS' : 'VIOLATION'],
      ['H-Bond Donors (HBD)', `${hbd}`, '<= 5 (Lipinski)', hbd <= 5 ? 'PASS' : 'VIOLATION'],
      ['H-Bond Acceptors (HBA)', `${hba}`, '<= 10 (Lipinski)', hba <= 10 ? 'PASS' : 'VIOLATION'],
      ['Rotatable Bonds', `${rotB}`, '<= 10 (Veber)', rotB <= 10 ? 'PASS' : 'VIOLATION'],
      ['Heavy Atom Count & Complexity', `${heavy} atoms | Complexity: ${comp}`, 'Graph Density', 'INFO'],
      ['QED Drug-Likeness & Rule Verdict', `QED = ${qed.toFixed(2)} (${lipinskiViolations} violations)`, 'Oral Bioavailability', lipinskiPassed ? 'DRUG-LIKE' : 'NON-COMPLIANT'],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 7;

  // 4. Multi-Molecule Structure-Property Comparison Matrix
  if (y > 220) {
    doc.addPage();
    y = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('4. MULTI-MOLECULE STRUCTURE-PROPERTY COMPARISON MATRIX', 14, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
    },
    head: [
      [
        'Compound',
        'Formula',
        'SMILES',
        'MW (g/mol)',
        'XLogP',
        'TPSA (Å²)',
        'HBD',
        'HBA',
        'RotB',
        'Ro5 Verdict',
      ],
    ],
    body: comparisonList.map((mol) => {
      const mSmiles = mol.canonicalSmiles || mol.smiles || '';
      const mMw = Number(mol.molecularWeight ?? 0);
      const mLogP = Number(mol.xlogp ?? 0);
      const mTpsa = Number(mol.tpsa ?? 0);
      const mHbd = Number(mol.hBondDonors ?? 0);
      const mHba = Number(mol.hBondAcceptors ?? 0);
      const mRot = Number(mol.rotatableBonds ?? 0);
      const mViol = Number(mol.lipinski?.violations ?? 0);
      const mPass = Boolean(mol.lipinski?.passes ?? mViol <= 1);

      return [
        mol.name || 'Compound',
        mol.formula || '-',
        mSmiles.length > 22 ? mSmiles.slice(0, 20) + '...' : mSmiles,
        mMw.toFixed(2),
        mLogP.toFixed(2),
        mTpsa.toFixed(1),
        String(mHbd),
        String(mHba),
        String(mRot),
        mPass ? 'PASS' : `FAIL (${mViol})`,
      ];
    }),
  });

  y = (doc as any).lastAutoTable.finalY + 7;

  // Start Page 2 if needed for Assessment & Learning Objectives
  if (y > 200) {
    doc.addPage();
    y = 16;
  }

  // 5. Learning Objectives Checklist
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('5. LEARNING OBJECTIVES COMPLETION CHECKLIST', 14, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: {
      fontSize: 8,
      cellPadding: 1.8,
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
    },
    head: [['#', 'Learning Objective', 'Verification Status']],
    body: LEARNING_OBJECTIVES.map((obj, idx) => [
      String(idx + 1),
      obj.title,
      completedObjectives.includes(obj.id) ? 'COMPLETED' : 'IN PROGRESS',
    ]),
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 135 },
      2: { cellWidth: 37, fontStyle: 'bold', halign: 'center' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 7;

  if (y > 190) {
    doc.addPage();
    y = 16;
  }

  // 6. Assessment Scorecard (12 Questions · 1 Mark Each · Total 12 Marks)
  const score = LAB_QUIZ_QUESTIONS.reduce((acc, q) => {
    return acc + (assessment.mcqAnswers[q.id] === q.correctIndex ? 1 : 0);
  }, 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `6. CHEMINFORMATICS ASSESSMENT SCORECARD (${score} / ${LAB_QUIZ_QUESTIONS.length} MARKS)`,
    14,
    y
  );
  y += 2;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
    },
    head: [['Q#', 'Assessment Question', 'Student Selection', 'Marks (Max 1)']],
    body: LAB_QUIZ_QUESTIONS.map((q, idx) => {
      const selectedIdx = assessment.mcqAnswers[q.id];
      const selectedText =
        selectedIdx !== undefined ? q.options[selectedIdx] : 'Not Answered';
      const marksEarned = selectedIdx === q.correctIndex ? '1 / 1' : '0 / 1';
      return [
        `Q${idx + 1}`,
        q.question,
        selectedText,
        marksEarned,
      ];
    }),
    columnStyles: {
      0: { cellWidth: 12, fontStyle: 'bold' },
      1: { cellWidth: 96 },
      2: { cellWidth: 50 },
      3: { cellWidth: 24, fontStyle: 'bold', halign: 'center' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  if (y > 265) {
    doc.addPage();
    y = 25;
  }

  // Signature Footer
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(14, y, 74, y);
  doc.line(pageWidth - 74, y, pageWidth - 14, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Student Signature & Date', 14, y + 4.5);
  doc.text('Faculty In-Charge Signature (Division of Chemistry)', pageWidth - 74, y + 4.5);

  const safeRegNo = (student.registerNumber || 'UNREGISTERED').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeMolName = (activeMolecule.name || 'Molecule').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`SRM_Trichy_Cheminformatics_Report_${safeRegNo}_${safeMolName}.pdf`);
}
