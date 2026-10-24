# 🌟 Rivlet Enterprise: Google Gemini AI Integration Master Plan

> **Architectural Blueprint & Implementation Plan**  
> Powered by **Google Gemini 3.8 Flash & Gemini 4 Argon** via Google AI Studio and Antigravity IDE.  
> Status: **FINALIZED & READY FOR EXECUTION**  
> Target Platform: **Rivlet Admin & Enterprise Operations Suite**

---

## 🏛️ Executive Architecture & Google Gemini Integration

Rivlet is an enterprise-grade luxury apparel operations and unit economics platform. Integrating Google Gemini transforms Rivlet from a passive tracking and calculation tool into an **autonomous operational co-pilot**.

### 1. Technology Stack & SDK Foundation
- **Official SDK**: `@google/genai` (v2.29.1+)
- **Primary Workhorse Model**: `gemini-3.8-flash` (1M token context, sub-second latency, multimodal vision, high-fidelity reasoning)
- **Complex Financial & Planning Model**: `gemini-4-argon` (Deep reasoning for Bill of Materials optimization and multi-scenario margin calculations)
- **API Key Configuration**: Stored securely server-side in `.env.local` as `GEMINI_API_KEY` (never exposed to browser bundles or client DOM).
- **Installed Skills**:
  - `gemini-api-dev` (Installed in `.agents/skills/gemini-api-dev`)
  - `gemini-live-api-dev` (Installed in `.agents/skills/gemini-live-api-dev`)
  - `gemini-omni-flash-api` (Installed in `.agents/skills/gemini-omni-flash-api`)

```mermaid
graph TD
    UI[Rivlet Next.js Frontend] -->|Auth Session + Role Guard| API[Next.js API Gateway /api/ai/*]
    API -->|GEMINI_API_KEY| SDK[@google/genai Client]
    SDK -->|Text & Vision Prompts| G38[gemini-3.8-flash]
    SDK -->|Complex Reasoning| G4A[gemini-4-argon]
    G38 -->|Structured JSON| API
    G4A -->|Structured JSON| API
    API -->|Immutable Audit Log| DB[(Supabase public.audit_logs)]
    API -->|Live UI State Mutation| UI
```

---

## 🗺️ Master Plan by Phase & Workflow

```
Wave 1 (Foundation):
├── Phase 1.1: Environment & SDK Setup (@google/genai client singleton)
└── Phase 1.2: Server Route Gateway (/api/ai/generate, /api/ai/parse, /api/ai/extract)

Wave 2 (High-Impact Operational Automation):
├── Phase 2.1: Work Tracking: AI Natural Language Story & Task Decomposer (/work)
├── Phase 2.2: Work Item Modal: Auto-Generate QA Acceptance Criteria & Sizing Specs
└── Phase 2.3: Vendor Workspace: WhatsApp & Email Chat Parser to Journal Logs (/vendors)

Wave 3 (Garment Unit Economics & Tool Generation):
├── Phase 3.1: Garment BOM Auto-Estimator & Fabric Consumption Engine (/calculator)
├── Phase 3.2: Margin & Sensitivity Optimization Advisor (/calculator)
└── Phase 3.3: In-App Prompt-to-Sandboxed Tool Generator (/artifacts)

Wave 4 (Document Intelligence & Executive Briefing):
├── Phase 4.1: Multimodal Document Ingestion & Auto-Tagging (/documents)
├── Phase 4.2: Universal Document Viewer AI Summary & Q&A Drawer (/documents)
├── Phase 4.3: Executive Daily Briefing ("Morning Operations Pulse") (/)
└── Phase 4.4: Confidential Knowledge Base SOP Copilot (/knowledge-base)
```

---

## 📋 Detailed Phase Breakdown

### Phase 1: Gateway & Gemini Client Setup

#### Task 1.1: Install & Configure `@google/genai`
- **Files**: `package.json`, `.env.local`, `src/lib/gemini.ts`
- **Action**:
  1. Add `@google/genai` to dependencies.
  2. Implement `src/lib/gemini.ts` initializing `new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })`.
  3. Provide helper methods: `callGeminiJSON<T>()`, `streamGeminiText()`, and multimodal base64 helpers.
- **Verification**: `npm run build` passes, test script calls Gemini endpoint and validates output.

#### Task 1.2: Secure API Routes with Role-Based Access Control
- **Files**: `src/app/api/ai/generate/route.ts`, `src/app/api/ai/extract/route.ts`
- **Action**:
  1. Verify active Supabase user session and check permission matrix (`can('edit')`).
  2. Log AI generation events to `audit_logs` table for compliance.

---

### Phase 2: Agile Work & Vendor CRM Intelligence

#### Task 2.1: Natural Language Story & Task Decomposer
- **Files**: `src/components/work/BulkCreationView.tsx`, `src/app/api/ai/work/decompose/route.ts`
- **Feature**:
  - Add an *"✨ AI Sprint Decomposer"* button next to YAML/JSON modes in `BulkCreationView`.
  - User prompt example: *"Break down proto sample fit approvals and lab dip checks for Drop 1 Leggings with Layo Group across XS-M"*.
  - Gemini generates structured JSON matching `ParsedStory[]` (story title, points, priority, acceptance criteria, sub-tasks with points and POM tolerance criteria).
  - One-click load directly into the preview table for creation.

#### Task 2.2: Instant Acceptance Criteria Generator in WorkItemModal
- **Files**: `src/components/work/WorkItemModal.tsx`
- **Feature**:
  - In `WorkItemModal`, add a *"✨ Auto-Generate Acceptance Criteria"* button beside the criteria text box.
  - Passes current item title, style name, category, and vendor to Gemini.
  - Returns garment-specific, measurable QA criteria (e.g. *"Tensile recovery >= 95% after 25 wash cycles. Delta-E < 0.8 under D65 light booth"*).

#### Task 2.3: Vendor WhatsApp & Email Communication Log Parser
- **Files**: `src/components/vendors/VendorWorkspaceModal.tsx`, `src/app/api/ai/vendors/parse-log/route.ts`
- **Feature**:
  - In the Vendor Workspace Journal tab, add a *"✨ Paste WhatsApp / Email to Log"* drawer.
  - User pastes messy chat messages:
    > *"Layo QA: We finished the second proto sample today. Waistband elastic tension improved by 10%. We are shipping it via DHL tomorrow. Can you sign off on lab dips by Thursday?"*
  - Gemini parses into:
    - **Channel**: `WhatsApp`
    - **Summary**: *"Layo Group completed second proto sample with 10% improved waistband tension. Shipping via DHL tomorrow."*
    - **Outcome**: *"Awaiting physical sample arrival; lab dip sign-off requested by Thursday."*
    - **Next Follow-up Date**: Auto-calculated (Thursday).

---

### Phase 3: Apparel Unit Economics & Sandboxed Tool Generation

#### Task 3.1: Garment BOM Auto-Estimator
- **Files**: `src/components/calculator/BOMSpecifierModal.tsx`, `src/app/api/ai/calculator/estimate-bom/route.ts`
- **Feature**:
  - In `BOMSpecifierModal`, add an *"✨ AI Spec Estimator"* prompt bar:
    *"Oversized 480 GSM French Terry Drop Shoulder Hoodie with kangaroo pocket and double-layered hood"*.
  - Gemini returns complete `GarmentBOM`:
    - Fabric items (Main body 480 GSM French Terry @ 0.85 kg, 2x2 Rib Knit 420 GSM @ 0.15 kg, single jersey hood lining @ 0.12 kg with market rates).
    - Trims (Custom aglets, heavy-duty neck tape, silicone high-density badge, OEKO-TEX woven label).
    - Stitching labor (₹160) and bio-wash finishing (₹45).
  - Instantly populates the BOM specifier table with rolling unit cost calculation.

#### Task 3.2: Margin & Sensitivity Optimization Advisor
- **Files**: `src/components/calculator/CostingCalculator.tsx`
- **Feature**:
  - Add an *"✨ AI Pricing Advisor"* button in the Costing Calculator summary header.
  - Analyzes current MRP, scenario net sales, Indian GST slabs (5% vs 18%), CAC, and return provisions.
  - Output: Strategic recommendations (e.g., *"If you price at ₹2,499 instead of ₹2,599, GST drops from 18% to 5%, increasing contribution margin by 7.4% despite the ₹100 lower retail price."*).

#### Task 3.3: Native In-App Sandboxed Tool Generator
- **Files**: `src/app/artifacts/page.tsx`, `src/components/artifacts/ArtifactEditorModal.tsx`
- **Feature**:
  - Add a *"✨ Generate New Tool with Gemini"* button in `/artifacts`.
  - User specifies: *"Create an interactive Fabric Shrinkage & Yield Calculator with dark mode styling matching Rivlet"*
  - Gemini generates clean, self-contained HTML/CSS/JS with zero external dependencies, saving it directly to the Rivlet Artifact sandbox inbox.

---

### Phase 4: Multimodal Document Intelligence & Executive Copilot

#### Task 4.1: Multimodal Document Auto-Ingestion
- **Files**: `src/app/documents/page.tsx`, `src/app/api/ai/documents/inspect/route.ts`
- **Feature**:
  - When uploading a PDF, DOCX, or Image (Tech pack, OEKO-TEX certificate, or lab report), the file is sent to `gemini-3.8-flash`.
  - Gemini extracts:
    - **Document Title**: Clean human-readable name.
    - **Document Type**: `Certificate` | `Tech Pack` | `Audit Report` | `Legal & Contract`.
    - **Expiry Date**: Extracted expiration date (e.g. from cert validity).
    - **Associated Vendor**: Matched against Rivlet's vendor database.
    - **Associated Style**: Matched against Rivlet's pipeline styles.
  - Form fields are pre-filled automatically before saving to Supabase Storage.

#### Task 4.2: Universal Document Viewer "Ask Document" Drawer
- **Files**: `src/components/documents/UniversalDocumentViewer.tsx`
- **Feature**:
  - Adds a slide-over AI drawer inside the Universal Document Viewer.
  - Displays a concise 3-bullet executive summary of the open document.
  - Users can ask questions (e.g., *"What is the approved colorfastness rating?"* or *"What are the penalty clauses for late delivery?"*).

#### Task 4.3: Executive Daily Briefing ("Morning Operations Pulse")
- **Files**: `src/components/dashboard/TodaysFocusModern.tsx`
- **Feature**:
  - At the top of `/`, Gemini generates an executive morning digest:
    > *"Good morning. Today Drop 1 has 3 fit sample tasks due with Layo Group. 2 supplier compliance certificates expire this week. Launch budget burn is at 41% (₹6.8L of ₹16.5L spent)."*

#### Task 4.4: Confidential Knowledge Base SOP Copilot
- **Files**: `src/app/knowledge-base/page.tsx`
- **Feature**:
  - An interactive search bar: *"Ask Rivlet SOPs"*.
  - Answers sourcing, quality standard (AQL 2.5), and packaging questions backed directly by stored articles.

---

## 🔒 Security, Compliance & Enterprise Controls

1. **Deny-by-Default Access**: AI endpoints enforce `can('create')` or `can('edit')` based on Rivlet's 4 roles (Owner, Admin, Manager, Team Member).
2. **Zero Sensitive Key Exposure**: `GEMINI_API_KEY` is loaded exclusively in server-side Next.js route handlers.
3. **Audit Logging**: Every AI generation and parse action records actor, timestamp, module, and token usage into `public.audit_logs`.
4. **Sandboxed Artifact Execution**: All AI-generated HTML tools remain confined within opaque-origin sandboxed iframes with strict CSP (`connect-src 'none'`).

---

## ⏱️ Execution Milestones & Deliverables

| Wave | Milestone | Est. Time | Key Deliverable |
| :---: | :--- | :---: | :--- |
| **W1** | **Foundation & SDK Gateway** | 1 Day | `@google/genai` integration, `.env.local` linking, `/api/ai/*` route handlers |
| **W2** | **Agile & Vendor Intelligence** | 2 Days | Bulk creation AI generator, acceptance criteria button, WhatsApp journal parser |
| **W3** | **Garment BOM & Pricing AI** | 2 Days | Fabric BOM auto-estimator, GST pricing sensitivity advisor, in-app tool generator |
| **W4** | **Document & Executive Copilot** | 2 Days | Multimodal document auto-ingest, PDF viewer summary, Executive briefing |

---
*Created for Rivlet Admin Platform by Antigravity IDE with Google Gemini.*
