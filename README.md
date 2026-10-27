# SRM Institute of Science and Technology, Tiruchirappalli — Cheminformatics Virtual Laboratory

**Faculty of Engineering and Technology | School of Sciences | Division of Chemistry**

An interactive **Cheminformatics Virtual Laboratory & Automated Data Analysis Portal** built for undergraduate and postgraduate chemistry students at **SRM Institute of Science and Technology, Tiruchirappalli Campus**. Students can enter and validate SMILES notations, visualize 2D skeletal chemical structures and interactive 3D conformers, compute drug-likeness descriptors, compare multiple molecules side-by-side, complete a 12-mark graded assessment, and export an official PDF Laboratory Project Report containing both 2D and 3D molecular images.

---

## Key Features & 7-Page Sequential Laboratory Workflow

### Page 1 — Student Registration & Check-In
- Students enter their **Student Full Name** and **Registration Number** to unlock the sequential virtual laboratory modules.
- Student credentials are automatically stamped onto the final downloadable PDF laboratory dossier.

### Page 2 — Learning Objectives & 5-Step Experimental Workflow
- Concise overview of the 6 core learning objectives and the 5-step practical cheminformatics procedure.
- Real-time **Circular Progress Ring** in the top navigation bar tracking objective completion (`0%` to `100%`).

### Page 3 — Cheminformatics Theory, Interactive Glossary & SMILES Input
- **Interactive Cheminformatics Glossary**: Clickable definitions, Lipinski/Veber thresholds, and molecular examples for **SMILES**, **TPSA**, **Lipinski's Rule of 5**, **LogP / XLogP**, **HBA**, **HBD**, **Pi (π) Bonds**, and **Space-Filling (CPK) Models**.
- **Custom SMILES Input & Reference Examples**: Students can enter any custom SMILES string or select from 6 reference molecules (**Ethanol**, **Benzene**, **Phenol**, **Acetic Acid**, **Aspirin**, **Caffeine**) to launch directly into the 2D/3D visualizer.

### Page 4 — Interactive 2D & 3D Molecular Visualization Workbench
- **Real-Time SMILES Grammar & Valence Validator**: Checks ring-closure parity, parenthesis balance, and atomic valence.
- **2D Structure Renderer (`RDKit / Canvas 2D` & `PubChem 2D`)**: Generates high-contrast 2D skeletal chemical structures with CPK heteroatom coloring and aromatic/multiple bond geometry.
- **3D WebGL Conformer Engine (`py3Dmol` / `3Dmol.js`)**:
  - Supports **Ball & Stick**, **Stick**, **CPK Sphere (Space-Filling)**, **Wireframe**, and **Van der Waals (VDW) Surface** styles.
  - Explicit **X, Y, and Z Axis Auto-Rotation** controls (`Spin X`, `Spin Y`, `Spin Z`, `Stop`), atom coordinate (`X, Y, Z` in Å) inspection, hydrogen toggle, atom labels, and PNG/SDF exports.

### Page 5 — Complete Molecular Properties Report
- Computes key physicochemical descriptors:
  - **Molecular Weight (MW)** (`g/mol`)
  - **Octanol-Water Partition Coefficient (XLogP)**
  - **Topological Polar Surface Area (TPSA)** (`Å²`)
  - **Hydrogen Bond Donors (HBD)** & **Hydrogen Bond Acceptors (HBA)**
  - **Rotatable Bonds**, **Heavy Atom Count**, **Structural Complexity**, and **QED Drug-Likeness Score**
- Automated evaluation of **Lipinski's Rule of Five (Ro5)** and **Veber's Oral Bioavailability Criteria**.
- One-click export to **CSV**, **JSON**, and **PDF**.

### Page 6 — Multi-Molecule Structure-Property Analysis (`pandas`-Style Data Portal)
- Side-by-side comparison matrix for multiple molecules with custom SMILES addition.
- Interactive **2D Chemical Space Scatter Plot (Molecular Weight vs. XLogP)** with Lipinski oral bioavailability cutoffs (`MW ≤ 500 g/mol`, `XLogP ≤ 5.0`).

### Page 7 — 12-Mark Graded Assessment & Official Final PDF Report
- **12 Multiple-Choice Assessment Questions** (`1 Mark` each, `Total = 12 Marks`) with clean checkbox selection and end-of-quiz submission.
- **Automated Official PDF Project Report (`jsPDF`)**:
  - Official **SRM Institute of Science and Technology, Tiruchirappalli** letterhead.
  - Embeds both the **2D Chemical Structure Image** and the **3D Molecular Conformer Image**.
  - Includes Student Registration Record, Physicochemical Descriptor Table, Multi-Molecule Comparison Matrix, Learning Objectives Checklist, and the 12-Mark Assessment Scorecard.

---

## Tech Stack

- **Frontend Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (with Light Mode & Dark Mode toggle)
- **3D Molecular Visualization**: `3Dmol.js` (`py3Dmol` WebGL engine)
- **2D Structure Depiction**: `smiles-drawer` + Custom 2D Coordinate Graph Canvas Renderer
- **Chemical Data & 3D Conformers**: PubChem PUG REST API + Local Topological Descriptor Engine
- **Report Export**: `jsPDF` & `jspdf-autotable` (PDF), plus CSV & JSON dataset exporters

---

## Getting Started (Run Locally)

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Build for Production
```bash
npm run build
```
The production-ready static files will be generated in the `dist/` directory.

---

## Deploying to GitHub Pages / Vercel / Netlify

- **Vercel / Netlify**:
  - Import your GitHub repository.
  - Set **Build Command** to `npm run build` and **Output Directory** to `dist`.
- **GitHub Pages**:
  - Run `npm run build` and deploy the `dist/` folder using GitHub Actions (`actions/deploy-pages`) or `gh-pages`.

---

## Institution

**SRM Institute of Science and Technology, Tiruchirappalli Campus**  
*Faculty of Engineering and Technology · School of Sciences · Division of Chemistry*
