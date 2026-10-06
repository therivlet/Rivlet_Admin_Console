# Rivlet Admin & Enterprise Operations Platform

> Centralized Operations, Enterprise Access Control & Governance, Claude HTML Artifact Engine, Apparel Unit Economics Suite & Confidential Brand Knowledge Base for **Rivlet**.

---

## 🛡️ Enterprise Security, Access Control & Governance

Rivlet Admin implements an enterprise-grade, defense-in-depth security model where **Supabase Row Level Security (RLS)** serves as the non-negotiable enforcement boundary, paired with client-side route guards, strict iframe sandboxing, and session-derived audit trails.

### 1. Four Role Templates + Custom Module Overrides
Access is governed across **13 distinct modules** and **7 granular actions** (`view`, `create`, `edit`, `delete`, `export`, `approve`, `manage_access`), with **deny-by-default**:

| Role Template | Scope & Description | Default Access |
| :--- | :--- | :--- |
| **Owner** | Full unrestricted project governance, access management, security controls, and immutable audit inspection. | Full permissions (`*`) across all 13 modules. |
| **Administrator** | Broad operational access across modules. Cannot delete or demote the Owner or alter Owner security controls without explicit override. | View/Create/Edit/Export across operational modules; Delete restricted on sensitive modules. |
| **Manager** | Operational oversight on assigned department modules with approval capabilities. | View/Create/Edit/Export/Approve on core modules; Budget & Artifacts read-only; Access/Audit denied. |
| **Team Member** | Focused execution on assigned modules and tasks. | View/Create/Edit on Work, Documents, SOPs, Profile; read-only on Pipeline/Vendors; other modules denied. |

- **Fine-Grained Permission Matrix**: The Owner can customize an individual user's access with per-user overrides without altering their default role template.
- **Read-Only Module Access**: Implemented via module permissions (`view: true`, `edit: false`) rather than an arbitrary fifth role.
- **Header Identity Badge**: The authenticated user's full name and styled role badge appear in the top header on every page.

### 2. Owner Account Preservation & Automatic Bootstrap
- The existing Supabase account is permanently designated as the **Owner**.
- **Self-Healing Bootstrap**: The migration introduces `claim_or_bootstrap_owner()`, which automatically binds the authenticated project creator to the permanent Owner role upon their first sign-in.
- **Database Trigger Guard**: A PostgreSQL trigger `protect_last_owner()` enforces at the database engine level that at least one active Owner must always exist. Any attempt to delete or demote the last remaining Owner is blocked.

### 3. Removal of Public Registration & Secure Server-Side Invites
- **Public Signup Disabled**: Self-service registration has been removed from `/login`.
- **Privileged Server-Side Provisioning**: User invitations and account creations are executed exclusively from server-side Next.js route handlers (`/api/admin/users`) via Supabase Auth Admin using `SUPABASE_SERVICE_ROLE_KEY`.
- **Zero Client Credential Leakage**: The service-role key is never exposed in browser bundles, client logs, or local storage.

### 4. Untrusted HTML Artifact Isolation & CSP
- User-generated HTML artifacts in `/artifacts` and `/tools/[slug]` are rendered inside sandboxed iframes.
- **Opaque Origin Isolation**: The `allow-same-origin` directive has been explicitly removed (`sandbox="allow-scripts allow-forms allow-popups allow-downloads"`). This forces the iframe into an opaque origin (`null`), strictly barring untrusted scripts from accessing the Rivlet app's `window.localStorage`, session tokens, cookies, or DOM.
- **Content Security Policy**: Artifact documents are injected with a strict CSP (`default-src 'self' 'unsafe-inline' data: blob:; connect-src 'none';`) preventing unauthorized outbound data exfiltration.

### 5. Append-Only Audit Trail & Activity History
- All business mutations (creations, edits, deletions, stage transitions, approvals, invites) are logged to `public.audit_logs`.
- **Actor Attribution**: Identity is derived directly from the verified session (`auth.uid()`). Ordinary users and administrators cannot edit or purge audit records.
- **Owner-Only Audit UI**: Dedicated governance area at `/audit` with filtering by module, action, date, and user, plus JSON before/after diff inspection and CSV export.
- **Record Activity Drawers**: Instant activity timeline drawer for styles, vendors, costing sheets, and work items.

### 6. Durable Notifications, Reminders & Follow-Up Workflows
- **Notification Center**: Header inbox (`NotificationCenterDropdown`) tracking unread/read alerts with direct record links.
- **Milestone & Follow-Up Reminders**: Tracks vendor touchpoints, overdue work items, pipeline fit/sample dates, and document vault expiration dates.

### 7. User-Scoped Browser Cache & Data Integrity
- Local store caching in `src/lib/store.tsx` is strictly scoped per authenticated user ID (`rivlet_cache_${userId}_*`).
- Switching accounts or logging out purges cached data to prevent data leakage between different users on shared machines.
- Explicit sync telemetry indicators (`Saved to Cloud`, `Saving...`, `Offline / Local Mode`).

---

## 🗄️ Database Migration Execution Order

When setting up or upgrading your Supabase environment, run the SQL migrations in the following order in the **Supabase SQL Editor**:

```
1. supabase_schema.sql                              (Base application schema & business tables)
2. supabase_migration_v11_pipeline_hsn_code.sql    (HSN code support in sampling & production pipeline)
3. supabase_migration_v12_security_access_control.sql (User profiles, permissions matrix, owner bootstrap, RLS)
4. supabase_migration_v13_audit_and_notifications.sql (Audit logs, notifications, reminders, vendor activities)
```

### Manual Supabase Dashboard Steps
1. **Disable Public Signups in Supabase Auth**:
   - Go to your **Supabase Dashboard** -> **Authentication** -> **Signers / Providers** -> **Email**.
   - Turn off **"Enable Signups"** (leave "Enable email provider" ON).
   - This guarantees that only invitations issued via the Rivlet Admin Access Management console can join.
2. **Obtain the Service Role Key**:
   - Go to **Supabase Dashboard** -> **Project Settings** -> **API**.
   - Copy the `service_role` secret (starts with `ey...`).
   - Add it to your local environment file:
     ```env
     SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
     ```
3. **Storage Bucket**:
   - Migration `v12` creates the private `vault-files` bucket with signed URL download policies. Ensure this bucket is marked private in **Storage** -> **Buckets**.

---

## 🛠️ Environment Configuration

Create a `.env.local` file based on `.env.example`:

```env
# Public Supabase Client (Browser & Server)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Privileged Server-Only Secret (NEVER prefix with NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🚀 Development & Build

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Run production build & verify TypeScript compilation
npm run build
```

---

## 📄 License
Private & Confidential — Rivlet Operations.
