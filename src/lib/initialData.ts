import { ArtifactItem, CostingSheet, DocumentItem, KBArticle } from './types';
import { defaultPricingInputs } from './pricingEngine';
import { userPricingHtml } from './userPricingArtifact';

export const initialArtifacts: ArtifactItem[] = [
  {
    id: 'art-001',
    title: 'Fabric Shrinkage & GSM Yield Estimator',
    description: 'Interactive calculator created by Claude for predicting post-wash fabric shrinkage and pattern grading yield adjustments.',
    category: 'Calculators',
    tags: ['Fabric', 'Yield', 'GSM', 'Production'],
    source: 'Claude 3.7 Sonnet',
    version: '1.2',
    isPromoted: true,
    routeSlug: 'fabric-yield-estimator',
    status: 'promoted',
    isFavorite: true,
    createdAt: '2026-09-15T10:30:00Z',
    updatedAt: '2026-09-20T14:15:00Z',
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Rivlet Fabric Shrinkage & Yield Estimator</title>
  <style>
    :root {
      --bg: #0f1117;
      --card: #181b24;
      --border: #282d3d;
      --gold: #d4af37;
      --gold-light: #f3e5ab;
      --text: #f0f2f8;
      --muted: #8b92a5;
      --accent: #2e3547;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 28px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 18px; margin-bottom: 24px; }
    .logo { font-size: 1.3rem; font-weight: 700; letter-spacing: 2px; color: var(--gold); }
    .badge { background: rgba(212, 175, 55, 0.15); color: var(--gold); border: 1px solid rgba(212, 175, 55, 0.3); padding: 4px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
    .panel { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 22px; }
    .panel-title { font-size: 1rem; font-weight: 600; margin-bottom: 16px; color: var(--gold-light); display: flex; align-items: center; gap: 8px; }
    .field { margin-bottom: 16px; }
    label { display: block; font-size: 0.8rem; font-weight: 500; color: var(--muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    input, select { width: 100%; background: var(--bg); border: 1px solid var(--border); color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 0.95rem; outline: none; transition: 0.2s border; }
    input:focus, select:focus { border-color: var(--gold); }
    .slider-val { float: right; color: var(--gold); font-weight: 600; }
    .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 18px; }
    .kpi-card { background: rgba(0,0,0,0.25); border: 1px solid var(--border); border-radius: 8px; padding: 14px; }
    .kpi-label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; }
    .kpi-val { font-size: 1.4rem; font-weight: 700; color: var(--gold); margin-top: 4px; }
    .meter-bar { height: 8px; background: var(--accent); border-radius: 4px; overflow: hidden; margin-top: 10px; }
    .meter-fill { height: 100%; background: linear-gradient(90deg, var(--gold), #f9d976); width: 68%; transition: width 0.3s ease; }
    .note-box { margin-top: 18px; padding: 12px 14px; border-radius: 8px; background: rgba(212, 175, 55, 0.08); border-left: 3px solid var(--gold); font-size: 0.82rem; color: #d6d9e4; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">RIVLET / FABRIC YIELD LAB</div>
    <div class="badge">CLAUDE ARTIFACT v1.2</div>
  </div>

  <div class="grid">
    <div class="panel">
      <div class="panel-title"><span>🧶</span> Raw Fabric Parameters</div>
      <div class="field">
        <label>Fabric Construction</label>
        <select id="fabricType" onchange="calculate()">
          <option value="1.05">100% Cotton 480GSM French Terry (Diagonal Loop)</option>
          <option value="1.08">100% Combed Cotton 260GSM Single Jersey</option>
          <option value="1.12">95/5 Cotton/Elastane 300GSM Heavy Rib</option>
          <option value="1.03">100% Organic Cotton Heavy Canvas (Twilled)</option>
        </select>
      </div>

      <div class="field">
        <label>Roll Usable Width (Inches) <span id="widthVal" class="slider-val">60"</span></label>
        <input type="range" id="fabricWidth" min="48" max="72" value="60" oninput="calculate()">
      </div>

      <div class="field">
        <label>Garment Markers Consumption (Yards / Pcs) <span id="consVal" class="slider-val">1.75 yd</span></label>
        <input type="range" id="garmentConsumption" min="0.6" max="3.5" step="0.05" value="1.75" oninput="calculate()">
      </div>

      <div class="field">
        <label>Anticipated Shrinkage Buffer (%) <span id="shrinkVal" class="slider-val">6.0%</span></label>
        <input type="range" id="shrinkageBuffer" min="2" max="12" step="0.5" value="6.0" oninput="calculate()">
      </div>
    </div>

    <div class="panel">
      <div class="panel-title"><span>📊</span> Production Yield & Order Buffer</div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Gross Fabric / Garment</div>
          <div class="kpi-val" id="grossFabric">1.86 yd</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Fabric Weight / Unit</div>
          <div class="kpi-val" id="unitWeight">0.82 kg</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Roll Utilization</div>
          <div class="kpi-val" id="utilizationPct">89.2%</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">1000 Pcs Bulk Order</div>
          <div class="kpi-val" id="bulkOrder">820 kg</div>
        </div>
      </div>

      <div class="meter-bar">
        <div class="meter-fill" id="meterFill"></div>
      </div>

      <div class="note-box" id="adviceNote">
        Optimal Marker Efficiency detected. With 6.0% wash shrinkage buffer, pattern cutting length should be compensated by +1.8cm on torso and +1.2cm on sleeves.
      </div>
    </div>
  </div>

  <script>
    function calculate() {
      const typeFactor = parseFloat(document.getElementById('fabricType').value);
      const width = parseFloat(document.getElementById('fabricWidth').value);
      const cons = parseFloat(document.getElementById('garmentConsumption').value);
      const shrink = parseFloat(document.getElementById('shrinkageBuffer').value);

      document.getElementById('widthVal').innerText = width + '"';
      document.getElementById('consVal').innerText = cons.toFixed(2) + ' yd';
      document.getElementById('shrinkVal').innerText = shrink.toFixed(1) + '%';

      const grossCons = cons * (1 + (shrink / 100)) * (typeFactor > 1.05 ? 1.02 : 1.0);
      const weightPerPc = (grossCons * 0.44 * (width / 60)).toFixed(2);
      const utilization = Math.min(96, Math.max(74, Math.round(92 - (shrink * 0.8) + (width > 60 ? 3 : -2))));
      const bulkKg = Math.round(weightPerPc * 1000);

      document.getElementById('grossFabric').innerText = grossCons.toFixed(2) + ' yd';
      document.getElementById('unitWeight').innerText = weightPerPc + ' kg';
      document.getElementById('utilizationPct').innerText = utilization + '%';
      document.getElementById('bulkOrder').innerText = bulkKg + ' kg';
      document.getElementById('meterFill').style.width = utilization + '%';

      document.getElementById('adviceNote').innerText = 
        'Optimal Marker Efficiency detected. With ' + shrink.toFixed(1) + '% wash shrinkage buffer, pattern cutting length should be compensated by +' + 
        (shrink * 0.3).toFixed(1) + 'cm on torso and +' + (shrink * 0.2).toFixed(1) + 'cm on sleeves.';
    }
    calculate();
  </script>
</body>
</html>`
  },
  {
    id: 'art-002',
    title: 'Rivlet Luxury Color Palette & Pantone Contrast Matrix',
    description: 'Visual brand guide created by Claude containing Rivlet core seasonal palettes, Hex/RGB codes, and accessibility contrast scores.',
    category: 'Visual Pitch',
    tags: ['Branding', 'Design System', 'Pantone', 'Colors'],
    source: 'Claude 3.5 Sonnet',
    version: '2.0',
    isPromoted: true,
    routeSlug: 'brand-color-system',
    status: 'promoted',
    isFavorite: false,
    createdAt: '2026-09-18T16:00:00Z',
    updatedAt: '2026-09-22T11:45:00Z',
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Rivlet Luxury Color Harmony System</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0b0d13; color: #f8f9fc; padding: 32px; }
    .title { font-size: 1.6rem; letter-spacing: 3px; font-weight: 700; color: #cda052; text-transform: uppercase; margin-bottom: 8px; }
    .subtitle { color: #858d9f; font-size: 0.9rem; margin-bottom: 28px; }
    .palette-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; }
    .swatch { border-radius: 12px; overflow: hidden; border: 1px solid #232734; background: #141721; }
    .color-block { height: 120px; display: flex; align-items: flex-end; padding: 12px; font-weight: 700; font-size: 0.8rem; letter-spacing: 1px; }
    .swatch-info { padding: 16px; }
    .swatch-name { font-size: 1rem; font-weight: 600; color: #fff; margin-bottom: 4px; }
    .swatch-meta { font-size: 0.8rem; color: #858d9f; margin-bottom: 2px; }
    .pantone-tag { display: inline-block; background: #232734; color: #cda052; font-size: 0.72rem; padding: 2px 8px; border-radius: 4px; margin-top: 8px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="title">RIVLET / CORE APPAREL PALETTE</div>
  <div class="subtitle">Official FW26 / SS27 Dye Master Standards</div>

  <div class="palette-grid">
    <div class="swatch">
      <div class="color-block" style="background: #0b0d13; color: #858d9f;">#0B0D13</div>
      <div class="swatch-info">
        <div class="swatch-name">Obsidian Black</div>
        <div class="swatch-meta">RGB: 11, 13, 19</div>
        <div class="pantone-tag">PANTONE 19-4004 TCX</div>
      </div>
    </div>

    <div class="swatch">
      <div class="color-block" style="background: #cda052; color: #0b0d13;">#CDA052</div>
      <div class="swatch-info">
        <div class="swatch-name">Champagne Gold</div>
        <div class="swatch-meta">RGB: 205, 160, 82</div>
        <div class="pantone-tag">PANTONE 16-0947 TCX</div>
      </div>
    </div>

    <div class="swatch">
      <div class="color-block" style="background: #2b303d; color: #fff;">#2B303D</div>
      <div class="swatch-info">
        <div class="swatch-name">Mineral Slate</div>
        <div class="swatch-meta">RGB: 43, 48, 61</div>
        <div class="pantone-tag">PANTONE 19-3908 TCX</div>
      </div>
    </div>

    <div class="swatch">
      <div class="color-block" style="background: #e8e3d5; color: #0b0d13;">#E8E3D5</div>
      <div class="swatch-info">
        <div class="swatch-name">Raw Ecru / Ivory</div>
        <div class="swatch-meta">RGB: 232, 227, 213</div>
        <div class="pantone-tag">PANTONE 11-0604 TCX</div>
      </div>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'art-004',
    title: 'Rivlet Pricing & Unit Economics Planner',
    description: 'Original 5-step interactive pricing and forecast tool created by Claude with 3-scenario tables and Indian GST automatic rules.',
    category: 'Calculators',
    tags: ['Pricing', 'Unit Economics', 'GST', 'Scenarios', 'Forecast'],
    source: 'Claude 3.7 Sonnet',
    version: '2.0',
    isPromoted: true,
    routeSlug: 'pricing-planner',
    status: 'promoted',
    isFavorite: true,
    createdAt: '2026-09-27T12:00:00Z',
    updatedAt: '2026-09-27T12:00:00Z',
    htmlContent: userPricingHtml,
  }
];

export const initialCostingSheets: CostingSheet[] = [
  {
    id: 'cost-001',
    sku: 'RIV-FW26-HOOD-01',
    styleName: 'Oversized 480GSM French Terry Hoodie',
    season: 'FW26',
    category: 'Hoodie',
    currency: '₹',
    mrp: 4499,
    expectedMargin: 28.5,
    inputs: {
      ...defaultPricingInputs,
      productName: 'Oversized 480GSM French Terry Hoodie',
      productCode: 'RIV-FW26-HOOD-01',
      mrp: 4499,
      factory: 1280,
      packaging: 65,
      tags: 25,
      branding: 45,
    },
    notes: 'Flagship heavyweight luxury hoodie. Target MRP ₹4,499 with 15% promotional discount.',
    createdAt: '2026-09-12T14:00:00Z',
    updatedAt: '2026-09-25T16:20:00Z',
  },
  {
    id: 'cost-002',
    sku: 'RIV-SS26-TEE-02',
    styleName: 'Heavyweight 260GSM Vintage Wash Tee',
    season: 'SS26',
    category: 'T-Shirt',
    currency: '₹',
    mrp: 2199,
    expectedMargin: 32.0,
    inputs: {
      ...defaultPricingInputs,
      productName: 'Heavyweight 260GSM Vintage Wash Tee',
      productCode: 'RIV-SS26-TEE-02',
      mrp: 2199,
      factory: 520,
      packaging: 35,
      tags: 15,
      branding: 25,
      units: { low: 1000, mid: 2500, high: 5000 },
      discount: { low: 15, mid: 10, high: 5 },
      cac: { low: 250, mid: 180, high: 100 },
    },
    notes: 'High volume essential tee. Listed MRP ₹2,199 qualifies for 5% output GST automatically.',
    createdAt: '2026-09-14T09:30:00Z',
    updatedAt: '2026-09-21T18:10:00Z',
  },
];

export const initialDocuments: DocumentItem[] = [
  {
    id: 'doc-001',
    title: 'GOTS Organic Cotton Scope Certificate - Tirupur Mill',
    documentType: 'Certificate',
    fileName: 'GOTS_Scope_Certificate_2026_Rivlet.pdf',
    fileUrl: '/mock-docs/gots-cert.pdf',
    fileSizeBytes: 2450000,
    fileFormat: 'pdf',
    expiryDate: '2027-08-31',
    status: 'Active',
    tags: ['GOTS', 'Organic', 'Compliance', 'Cotton'],
    associatedVendor: 'Southern Eco Mills India',
    createdAt: '2026-08-15T11:00:00Z',
    updatedAt: '2026-08-15T11:00:00Z'
  },
  {
    id: 'doc-002',
    title: 'OEKO-TEX Standard 100 Class I (Harmful Substances Free)',
    documentType: 'Certificate',
    fileName: 'OEKO_TEX_Standard_100_Class1.pdf',
    fileUrl: '/mock-docs/oeko-tex.pdf',
    fileSizeBytes: 1890000,
    fileFormat: 'pdf',
    expiryDate: '2027-02-28',
    status: 'Active',
    tags: ['OEKO-TEX', 'Non-Toxic', 'Safety', 'Dyeing'],
    associatedVendor: 'Apex Dyeing & Finishing Works',
    createdAt: '2026-07-20T10:00:00Z',
    updatedAt: '2026-07-20T10:00:00Z'
  },
  {
    id: 'doc-003',
    title: 'Rivlet Oversized Hoodie FW26 Complete Tech Pack v2.4',
    documentType: 'Tech Pack',
    fileName: 'RIV_FW26_HOODIE_TechPack_v2_4.pdf',
    fileUrl: '/mock-docs/techpack-hoodie.pdf',
    fileSizeBytes: 8400000,
    fileFormat: 'pdf',
    status: 'Active',
    tags: ['Tech Pack', 'FW26', 'Measurements', 'Hoodie'],
    associatedVendor: 'Master Stitch Manufacturing',
    createdAt: '2026-09-01T15:00:00Z',
    updatedAt: '2026-09-22T09:30:00Z'
  },
  {
    id: 'doc-004',
    title: 'Master Manufacturing Agreement & Non-Disclosure Contract',
    documentType: 'Legal & Contract',
    fileName: 'Rivlet_Master_Manufacturing_NDA_Executed.docx',
    fileUrl: '/mock-docs/manufacturing-nda.docx',
    fileSizeBytes: 420000,
    fileFormat: 'docx',
    expiryDate: '2028-12-31',
    status: 'Active',
    tags: ['Legal', 'NDA', 'Contracts', 'IP Protection'],
    associatedVendor: 'Southern Eco Mills India',
    createdAt: '2026-06-10T12:00:00Z',
    updatedAt: '2026-06-10T12:00:00Z'
  }
];

export const initialKBArticles: KBArticle[] = [
  {
    id: 'kb-001',
    title: 'Master Mill & Dye House Directory (Primary Partners)',
    slug: 'mill-and-dyehouse-directory',
    category: 'Vendors & Mills',
    isConfidential: true,
    author: 'Rivlet Sourcing Team',
    tags: ['Suppliers', 'Mills', 'MOQ', 'Payment Terms'],
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-09-18T14:00:00Z',
    content: `# Master Mill & Dye House Directory (Rivlet Sourcing)

> **CONFIDENTIAL**: Strictly for Rivlet internal operations & executive team.

---

### 1. Southern Eco Mills (Tirupur, India)
- **Specialty**: Heavyweight French Terry (400–520 GSM), Combed Organic Cotton Jersey (220–300 GSM).
- **Certifications**: GOTS Scope Certificate, OEKO-TEX Standard 100 Class I.
- **Minimum Order Quantity (MOQ)**:
  - Custom Lab Dip Color: 300 kg / color
  - Running Greige stock: 150 kg
- **Payment Terms**: 30% Advance at PO, 70% against Bill of Lading (BL) copy.
- **Key Contact**: Rajesh Kumar (Head of Exports) — \`rajesh@southerneco.in\` / +91 98420 XXXXX

---

### 2. Apex Specialty Dyeing & Wash House (Surat / Tirupur)
- **Specialty**: Pigment dyeing, Mineral vintage acid wash, Enzyme bio-polishing.
- **Capacity**: 15,000 pcs / month.
- **Lead Time**: 12 days from greige fabric receipt.
- **Key Contact**: Meera Nair — \`meera.nair@apexdyeing.com\`
`
  },
  {
    id: 'kb-002',
    title: 'Garment Quality Control SOP: AQL 2.5 Major / 4.0 Minor Standards',
    slug: 'quality-control-sop-aql-2-5',
    category: 'Quality & AQL',
    isConfidential: false,
    author: 'Head of Quality',
    tags: ['AQL', 'Inspection', 'Defects', 'Tolerances'],
    createdAt: '2026-08-10T11:00:00Z',
    updatedAt: '2026-09-15T09:00:00Z',
    content: `# Garment Quality Control SOP: AQL 2.5 / 4.0 Standards

This Standard Operating Procedure defines the mandatory inspection criteria for all Rivlet bulk production before factory sign-off and dispatch.

---

### 1. Sampling Size Table (Single Sampling Plan - Normal Inspection Level II)
- **Batch Size 501 – 1,200 pcs**: Sample 80 pcs | Accept Major ≤ 5, Reject ≥ 6.
- **Batch Size 1,201 – 3,200 pcs**: Sample 125 pcs | Accept Major ≤ 7, Reject ≥ 8.

---

### 2. Defect Classifications

#### Critical Defects (Zero Tolerance - Batch Fails Instantly)
- Broken needles, sharp metal or loose pins left in garments.
- Fabric rot, mold, or chemical odor.
- Incorrect brand logo spelling or missing mandatory care/fiber legal label.

#### Major Defects (AQL 2.5)
- Measurement out of tolerance (Chest > ±1.0 cm, Length > ±1.5 cm).
- Fabric holes, laddering, or color shading across body panels.
- Open seams or broken stitching.
- Prominent stains or oil marks.

#### Minor Defects (AQL 4.0)
- Removable loose threads longer than 1 cm.
- Slight skewing of hangtag attachment.
- Slight crease marks removable with light ironing.
`
  },
  {
    id: 'kb-003',
    title: 'Brand Tone, Typography & Packaging Experience Guidelines',
    slug: 'brand-tone-and-packaging-guidelines',
    category: 'Brand Guidelines',
    isConfidential: false,
    author: 'Creative Director',
    tags: ['Branding', 'Packaging', 'Typography', 'Tone'],
    createdAt: '2026-09-02T13:30:00Z',
    updatedAt: '2026-09-20T16:00:00Z',
    content: `# Brand Tone & Packaging Unboxing Experience

Rivlet is built on understated luxury, structural silhouettes, and uncompromising heavyweight textiles.

---

### 1. Brand Pillars
- **Sculptural Minimalism**: Garments that hold their structure without synthetic stiffeners.
- **Tactile Weight**: Every textile must communicate durability and warmth the second it is touched.
- **Quiet Authority**: No loud billboards. Subtle tone-on-tone embroidery, micro-engraved hardware.

---

### 2. Packaging Specs & Assembly
1. Garment folded with 1 layer of acid-free parchment tissue paper.
2. Scent: Rivlet Signature Cedar & Amber linen mist (1 light press at 30cm distance).
3. Frosted matte biodegradable 80-micron polybag with gold foil logo.
4. Sealed with embossed metallic wafer sticker.
`
  }
];
