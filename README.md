# Rivlet Admin & Knowledge Platform

> Centralized Operations, Claude HTML Artifact Engine, Apparel Unit Economics Suite & Confidential Brand Knowledge Base for **Rivlet**.

---

## 🌟 Core Modules

### 1. Claude HTML Artifact Hub (`/artifacts`)
- **Staging vs. Promoted Pipeline**: Newly added Claude artifacts land in an **Artifact Inbox** to review, sanitize, and preview without cluttering production.
- **Sandboxed Execution**: Isolated `iframe` environment with multi-device viewport testing (Desktop, Laptop, Tablet, Mobile).
- **In-App HTML Cleaner**: Built-in data scrubber to strip conversational boilerplate and adjust dummy figures with split live preview.
- **1-Click Page Promotion**: Promote high-value tools to first-class application pages with dedicated routes (`/tools/[slug]`) pinned to the sidebar navigation.

### 2. Garment Pricing & Unit Economics Suite (`/calculator`)
- **Apparel BOM Builder**: Fabric consumption yield, GSM, trims, CMT labor, and packaging.
- **Indian Step-Function Output GST**: Automatically evaluates discounted checkout price:
  - $\le \text{₹2,500} \rightarrow 5\%$ GST
  - $> \text{₹2,500} \rightarrow 18\%$ GST
- **3-Scenario Range Forecasting**: Conservative (low), Expected (mid), and Upside (high) volume, discount, CAC, and return risk.
- **Annual Overhead Dynamic Allocation**: Dynamic allocation of company overheads across planned unit volumes.
- **Exact Pricing Solver**: Calculates Break-Even MRP, Target Margin MRP, and Maximum Affordable Factory Cost.
- **Export**: Full cost deduction waterfall CSV and printable PDF cost sheet.

### 3. Document Vault (`/documents`)
- Repository for compliance certificates (GOTS Organic, OEKO-TEX Standard 100), factory audit reports, contracts, and tech packs.
- Expiration date tracking and status badges (`Active`, `Expiring Soon`, `Expired`).

### 4. Confidential Brand Knowledge Base (`/knowledge-base`)
- Gitbook/Notion-style documentation center.
- Pre-seeded with:
  - *Master Mill & Dye House Directory (Tirupur & Surat)*
  - *AQL 2.5 Quality Inspection & Defect Classification SOP*
  - *Brand Tone, Typography & Packaging Guidelines*
- **Confidential Lock**: Flags sensitive commercial formulas and supplier agreements.

### 5. Unified Command Center & Spotlight Search (`/`)
- Executive KPI cards, quick tool launcher, and global `⌘K` Spotlight Search indexing artifacts, costing sheets, documents, and SOPs.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Rivlet Obsidian & Champagne Gold luxury palette)
- **Icons**: Lucide React
- **Backend / DB**: Supabase (PostgreSQL + Supabase Storage + Row Level Security)
- **Local Fallback**: Reactive LocalStorage sync for offline development

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and add your Supabase credentials:
```bash
cp .env.example .env.local
```
Add:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Initialize Supabase Database
Run the SQL migration script from `supabase_schema.sql` in your Supabase SQL Editor to create all tables and storage buckets.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 License
Private & Confidential — Rivlet Operations.
