# SRM Tiruchirappalli — Cheminformatics Virtual Laboratory Portal

An official interactive virtual laboratory and automated data analysis portal for **SRM Institute of Science and Technology, Tiruchirappalli (Faculty of Engineering and Technology | School of Sciences | Division of Chemistry)**. It guides students step-by-step from SMILES notation validation and 2D/3D molecular visualization through physicochemical property calculation, multi-molecule structure-property comparison, graded assessment, and official PDF laboratory report generation.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Please review the confirmed institutional details and recommended defaults below before we proceed to build the portal.

- **Confirmed Institutional Identity**: Branded with the uploaded **SRM Institute of Science and Technology, Tiruchirappalli** official crest (`/assets/aistudio/SRM_logo_f0d368b0.jpg`) and academic hierarchy: *Faculty of Engineering and Technology · School of Sciences · Division of Chemistry*.
- **Confirmed Assessment & Grading Flow**: Combines an **auto-graded multiple-choice conceptual & analytical quiz** with **structured laboratory observation questions** tied to the student's analyzed molecules, automatically compiled into the final PDF project report.
- **Confirmed Multi-Molecule Analysis & Export Scope**: Includes **Lipinski's Rule of Five & Veber oral bioavailability evaluation**, **interactive radar and bar charts** for multi-molecule comparison, **functional group/substructure inspection**, and **CSV/JSON dataset export** alongside the formatted **PDF Project Report**.
- **Web-Native Equivalent of Python Scientific Stack (`rdkit`, `py3Dmol`, `pandas`)**: To run instantaneously in the browser without requiring students to install Python environments, the portal pairs live **PubChem PUG REST / 3D Conformer SDF APIs** and client-side **RDKit-compatible SMILES parsing (`smiles-drawer`)** with **3Dmol.js** (the core WebGL engine underlying `py3Dmol`), **DataFrame-style tabular data processing & CSV/JSON export** (`pandas` equivalent), and **jsPDF** for publication-grade PDF report generation.

---

## 1. Overview & Core Concept

- **What It Does**: Provides a structured, 6-stage virtual laboratory workbench where chemistry and engineering students register their session details, study cheminformatics theory, validate SMILES strings, inspect 2D depictions and interactive 3D conformers across multiple rendering styles, compute full physicochemical & drug-likeness descriptors, compare multiple molecules side-by-side, complete a graded assessment, and download an official SRM-branded PDF laboratory report.
- **Target Audience / Persona**: Undergraduate and postgraduate students and faculty in the Division of Chemistry at SRM Institute of Science and Technology, Tiruchirappalli conducting virtual practicals in Cheminformatics, Computational Chemistry, and Molecular Modeling.
- **Key Value**: Eliminates local software installation hurdles while delivering authentic, research-grade molecular visualization and empirical chemical property analysis backed by live authoritative chemical databases (PubChem PUG REST) and interactive WebGL rendering.

---

## 2. User Experience & Visual Design

### Key User Flows (6-Stage Guided Laboratory Curriculum)

1. **Stage 1 — Home & Student Registration**:
   - Displays the official SRM Tiruchirappalli header, Division of Chemistry banner, experiment title, and the **9 Core Learning Objectives** (enter SMILES notation, validate structures, generate 2D depictions, generate interactive 3D conformers, switch visualization styles, compute complete molecular properties, download individual molecular reports, compare multiple molecules, and complete the lab assessment).
   - **Student Session Registration Form**: Captures *Student Full Name*, *Registration Number (e.g., RA24110...)*, *Course / Branch*, *Semester / Batch*, and *Experiment Date*. Unlocking or updating registration persists across all modules and stamps the live session badge and final PDF report.
2. **Stage 2 — Theory & Experimental Procedure**:
   - Interactive educational reference covering **SMILES (Simplified Molecular-Input Line-Entry System) grammar** (atoms, bonds, branches, aromaticity, ring closures, stereochemistry), **2D vs. 3D coordinate generation**, **Molecular Descriptors** ($\text{MW}$, $X\log P$, $\text{TPSA}$, $\text{HBD}$, $\text{HBA}$, Rotatable Bonds, Complexity), **Lipinski's Rule of Five & Veber's Rules**, and a clear step-by-step guide on how to complete the lab and generate the final PDF report.
3. **Stage 3 — 2D & 3D Molecular Visualization Workbench**:
   - **Quick-Try Preset Bar**: Pre-loaded benchmark molecules (Aspirin, Paracetamol, Caffeine, Ibuprofen, Penicillin G, Cisplatin, Curcumin, Quinine) plus custom SMILES or chemical name input with real-time **SMILES syntax & valence validation**.
   - **Dual-Viewport Canvas**:
     - *2D Depiction Panel*: Renders high-resolution 2D skeletal structures via client-side SMILES canvas rendering (`SmilesDrawer`) and authoritative PubChem 2D depiction, with downloadable PNG export.
     - *3D Interactive WebGL Viewport (`3Dmol.js` / `py3Dmol` engine)*: Fetches 3D SDF conformers and renders interactive 3D models with style selectors (**Ball & Stick**, **Stick**, **CPK Spacefill Sphere**, **Wireframe**, and **Translucent Molecular Surface**), atom label toggles, CPK element color legend, spin animation, dark/light canvas switch, and 3D snapshot capture.
4. **Stage 4 — Molecular Properties Report**:
   - Displays a comprehensive descriptor report card for the active molecule: IUPAC Name, PubChem CID, Molecular Formula, Molecular Weight ($\text{g/mol}$), Canonical & Isomeric SMILES, InChI & InChIKey, Partition Coefficient ($X\log P$), Topological Polar Surface Area ($\text{TPSA}$ in $\text{\AA}^2$), H-Bond Donors ($\text{HBD}$), H-Bond Acceptors ($\text{HBA}$), Rotatable Bonds, Heavy Atom Count, Formal Charge, and Structural Complexity.
   - **Automated Drug-Likeness & Bioavailability Audit**: Evaluates **Lipinski's Rule of Five** and **Veber's Rules** with explicit pass/violation indicators and allows one-click **"Add to Comparison Workbench"** and **"Download Single Molecule Report (CSV / JSON / PDF)"**.
5. **Stage 5 — Structure-Property Analysis & Multi-Molecule Comparison**:
   - Allows students to compare 2 to 6 molecules simultaneously in a **Pandas-style DataFrame Comparison Matrix** with sortable columns, statistical summary rows (Mean, Min, Max, Range), and one-click CSV/JSON export.
   - **Interactive Visual Analytics**:
     - *Normalized Multi-Molecule Radar Spider Chart*: Overlays physicochemical profiles ($\text{MW}$, $X\log P$, $\text{TPSA}$, $\text{HBD}$, $\text{HBA}$, Rotatable Bonds) relative to Lipinski/Veber thresholds.
     - *Structure-Property Bar & Scatter Comparisons*: Visualizes $\text{MW}$ vs. $X\log P$ lipophilicity trends and polar surface area distributions.
6. **Stage 6 — Assessment & Final PDF Project Report**:
   - **Part A (Auto-GradedCheminformatics Quiz)**: 8 curated multiple-choice questions testing SMILES syntax, 3D conformation concepts, Lipinski rules, TPSA, and structure-property relationships with instant scoring and detailed explanations upon submission.
   - **Part B (Structured Lab Observations &Viva Conclusions)**: Prompts students to record their experimental interpretation of the molecules they analyzed and compared.
   - **Official PDF Project Report Generator**: Compiles a multi-page, print-ready **SRM Institute of Science and Technology, Tiruchirappalli — Division of Chemistry** laboratory report containing the SRM logo, student registration metadata, learning objectives checklist, 2D/3D structure snapshots, complete molecular property tables, multi-molecule comparison summary, assessment score, student observations, and signature blocks for Student and Faculty In-Charge.

### Visual Identity & Theme

- **Aesthetic Direction**: *Clinical Publication-Grade Scientific Workbench* paired with SRM Tiruchirappalli institutional academic authority.
- **Color Palette & 60-30-10 Allocation**:
  - *60% Dominant Neutral Canvas*: Crisp laboratory alabaster (`#F8FAFC`) and pure white (`#FFFFFF`) analytical surfaces.
  - *30% Structural Panels & Hairlines*: Slate hairline borders (`1px solid #E2E8F0`), technical header ribbons (`#F1F5F9`), and bounded deep-slate 3D WebGL viewport (`#0F172A`) for high-contrast CPK atomic rendering.
  - *10% Calibrated Institutional & Telemetry Accents*: SRM Royal Blue (`#1E3A8A` / `#1D4ED8`) and Heritage Gold (`#B45309` / `#D97706`) for institutional identity, paired with Scientific Teal (`#0D9488`) for active chemical telemetry and Emerald/Crimson semantic indicators accompanied by explicit text labels (`● PASS`, `▲ VIOLATION`).
- **Typography & Hierarchy**:
  - *Display & Academic Headings*: `Plus Jakarta Sans` (SemiBold/Bold, tight tracking, balanced headline wrapping).
  - *Body & Theoretical Prose*: `DM Sans` (`15px–16px`, comfortable `68ch` reading measure for theory modules).
  - *Chemical Notations, SMILES & Tabular Descriptors*: `JetBrains Mono` with `tabular-nums` so SMILES strings, InChIKeys, bond counts, and molecular weights align with vertical precision.
- **Component Styling & Top Bar Contract**:
  - Strict 3-zone top navigation bar: SRM Tiruchirappalli brand lockup on the left, concise single-line module navigation links in the center, and the primary **"Download Final PDF Report"** action on the right.
  - Workspace module stepper bar below the header showing real-time completion progress across the 6 laboratory stages.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Hybrid Client-Side + Authoritative PubChem PUG REST Cheminformatics Engine**
  - *Chosen Approach*: Combine client-side SMILES grammar validation and 2D/3D rendering (`SmilesDrawer` + `3Dmol.js`) with live **PubChem PUG REST API** resolution (with `fetchWithRetry` and built-in offline fallback records for benchmark lab molecules).
  - *Why*: Students get real, authoritative IUPAC names, InChIKeys, 3D conformer SDF coordinates, and experimental/computed descriptors for *any* valid SMILES or compound name they enter, while guaranteed fallback data ensures the virtual lab never fails during classroom network hiccups.
- **Decision 2: Session Persistence & Pre-Loaded Benchmark Set**
  - *Chosen Approach*: Persist student registration, analyzed molecule history, comparison basket, and quiz responses in browser `localStorage`, while pre-loading a default molecule (Aspirin) and comparison trio (Aspirin, Paracetamol, Caffeine) on initial launch.
  - *Why*: Prevents students from losing their work if they accidentally refresh the browser during a 2-hour laboratory session, and ensures the workbench is immediately interactive.
- **Decision 3: Direct Client-Side Multi-Page PDF Compilation (`jsPDF` + Canvas Capture)**
  - *Chosen Approach*: Generate the final PDF report directly in the browser using `jsPDF` and `jspdf-autotable`, embedding the official SRM logo, student registration block, captured 2D/3D structure canvases, formatted property tables, Lipinski audit results, and graded assessment summary.
  - *Why*: Produces a crisp, vector-text academic PDF document with selectable tables and institutional headers rather than a blurry browser print screenshot.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```text
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                  SRM TIRUCHIRAPPALLI VIRTUAL LAB PORTAL (React + TS)                 │
├──────────────────────────────────────────────────────────────────────────────────────┤
│  TOP NAVIGATION BAR (3-Zone Contract)                                                │
│  [SRM Logo + Brand Title] ─── [Home · Theory · Visualizer · Analysis · Assessment]   │
│                                                       ─── [Export Final PDF Report]  │
├──────────────────────────────────────────────────────────────────────────────────────┤
│  GLOBAL LAB SESSION STORE (React Context + localStorage Persistence)                 │
│  ┌────────────────────┐  ┌─────────────────────┐  ┌───────────────┐  ┌────────────┐  │
│  │ StudentProfile     │  │ ActiveMolecule &    │  │ ComparisonSet │  │ Assessment │  │
│  │ (Name, RegNo,      │  │ AnalyzedHistory[]   │  │ (2-6 Compounds│  │ Answers &  │  │
│  │  Course, Semester) │  │ (Descriptors + SDF) │  │  DataFrame)   │  │ Viva Notes │  │
│  └─────────┬──────────┘  └──────────┬──────────┘  └───────┬───────┘  └──────┬─────┘  │
└────────────┼────────────────────────┼─────────────────────┼─────────────────┼────────┘
             │                        │                     │                 │
   ┌─────────▼──────────┐   ┌─────────▼──────────┐  ┌───────▼───────┐  ┌──────▼────────┐
   │ 1. Home & Theory   │   │ 2. 2D/3D Molecular │  │ 3. Properties │  │ 4. Assessment │
   │    Modules         │   │    Workbench       │  │    & Multi-   │  │    & Official │
   │ • Learning Obj.    │   │ • SMILES Validator │  │    Molecule   │  │    PDF Engine │
   │ • Student Reg Form │   │ • SmilesDrawer 2D  │  │    Comparison │  │ • Auto-Graded │
   │ • SMILES & Lipinski│   │ • 3Dmol.js WebGL   │  │ • Lipinski/   │  │   MCQ Quiz    │
   │   Theory Guide     │   │   (Stick/Sphere/   │  │   Veber Audit │  │ • Viva Prompt │
   │ • Report Workflow  │   │   Surface/CPK)     │  │ • Radar/Bar   │  │ • jsPDF Report│
   └────────────────────┘   └─────────┬──────────┘  │   Charts      │  │   Compiler    │
                                      │             │ • CSV/JSON IO │  └───────────────┘
                                      ▼             └───────▲───────┘
                            ┌────────────────────────────────┐
                            │ Cheminformatics Service Layer  │
                            │ • Local SMILES Parser & Rules  │
                            │ • PubChem PUG REST API Client  │
                            │   (Properties, CID, 3D SDF)    │
                            └────────────────────────────────┘
```

### Data Model & State

- **`StudentSession`**: `studentName`, `registerNumber`, `department` (defaults to *Division of Chemistry, School of Sciences*), `courseCode`, `semester`, `instructorName`, `sessionDate`, and `completedSteps`.
- **`MoleculeRecord`**: `id`, `queryInput`, `name`, `iupacName`, `cid`, `smiles`, `canonicalSmiles`, `isomericSmiles`, `formula`, `inchi`, `inchiKey`, `molecularWeight`, `xlogp`, `tpsa`, `hBondDonors`, `hBondAcceptors`, `rotatableBonds`, `heavyAtomCount`, `charge`, `complexity`, `sdf3D`, `lipinski` (`passes`, `violations`, `details`), `veber` (`passes`, `violations`), `functionalGroups`, and `timestamp`.
- **`AssessmentState`**: `mcqResponses` (map of question ID to selected option index), `submitted`, `score`, `maxScore`, and `observationResponses` (structured synthesis questions on structure-property findings).

### Interactive Component & State Mapping

- **SMILES Validator & Input Bar**: Validates brackets, ring closure parity, aromatic symbols, and valid organic/inorganic atomic symbols in real time; queries PubChem PUG REST (`/rest/pug/compound/smiles/...` or `/name/...`) with `fetchWithRetry`; updates `activeMolecule` and appends to `analyzedHistory`.
- **2D & 3D Molecular Viewports**:
  - `SmilesDrawer` renders the 2D skeletal structure onto an HTML5 `<canvas>` with theme toggles and PNG snapshot export.
  - `3Dmol.js` loads the 3D conformer SDF (or synthesizes 3D coordinates if a rare compound lacks a precomputed 3D conformer) and provides instant interactive controls for representation style (`Ball & Stick`, `Stick`, `Sphere`, `Wireframe`, `Surface`), VDW surface opacity, atom coordinate picking on click, auto-spin, and camera reset.
- **Comparison Matrix & Charts**: Synchronizes `comparisonList` across a tabular dataframe view (with computed Mean/StdDev/Min/Max rows and CSV/JSON export) and interactive SVG Radar/Bar charts comparing normalized drug-likeness parameters.
- **PDF Report Compiler**: Aggregates `StudentSession`, `activeMolecule`, `comparisonList`, `AssessmentState`, and the SRM Tiruchirappalli logo image into a multi-page PDF downloaded directly to the student's device.
