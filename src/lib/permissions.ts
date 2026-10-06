import {
  AppModule,
  AppRole,
  ModulePermissionSet,
  PermissionAction,
  UserProfile,
  UserPermissionMap,
} from './types';

export const ALL_MODULES: AppModule[] = [
  'dashboard',
  'work',
  'vendors',
  'pipeline',
  'documents',
  'calculator',
  'budget',
  'knowledge',
  'artifacts',
  'profile',
  'access',
  'audit',
  'notifications',
];

export const ALL_ACTIONS: PermissionAction[] = [
  'view',
  'create',
  'edit',
  'delete',
  'export',
  'approve',
  'manage_access',
];

export const MODULE_CONFIG: Record<
  AppModule,
  { name: string; description: string; path: string }
> = {
  dashboard: {
    name: "Dashboard & Today's Focus",
    description: 'Executive telemetry, focus queues, and sprint tracking',
    path: '/',
  },
  work: {
    name: 'Work Tracking & Sprints',
    description: 'Sprint backlog, kanban boards, and task execution',
    path: '/work',
  },
  vendors: {
    name: 'Vendors & Mills Ecosystem',
    description: 'Directory, commercial terms, contacts, and communication logs',
    path: '/vendors',
  },
  pipeline: {
    name: 'Sampling & Production Pipeline',
    description: 'Style lifecycles, HSN codes, proto/fit stages, and PO tracking',
    path: '/pipeline',
  },
  documents: {
    name: 'Document Vault',
    description: 'Tech packs, compliance certs, mill audits, and contracts',
    path: '/documents',
  },
  calculator: {
    name: 'Garment Pricing & Costing Engine',
    description: 'Technical BOMs, gross margin calculators, and retail scenarios',
    path: '/calculator',
  },
  budget: {
    name: 'Launch Budget & Spend Ledger',
    description: 'Tranche allocations, burn rate, actual expenses, and capital inflows',
    path: '/budget',
  },
  knowledge: {
    name: 'Brand Knowledge Base & SOPs',
    description: 'Confidential production guidelines, fabric specs, and mill procedures',
    path: '/knowledge-base',
  },
  artifacts: {
    name: 'Claude Interactive Artifacts',
    description: 'Sandboxed micro-tools, executive dashboards, and calculators',
    path: '/artifacts',
  },
  profile: {
    name: 'Profile & Brand Settings',
    description: 'Personal settings and company brand identity configuration',
    path: '/profile',
  },
  access: {
    name: 'Access Management & Users',
    description: 'User invitations, role assignments, and permission overrides',
    path: '/access',
  },
  audit: {
    name: 'Audit Trail & Compliance Log',
    description: 'Immutable operation history and actor attribution records',
    path: '/audit',
  },
  notifications: {
    name: 'Notifications & Reminders',
    description: 'Operational alerts, scheduled follow-ups, and due date reminders',
    path: '#notifications',
  },
};

export const ACTION_CONFIG: Record<
  PermissionAction,
  { label: string; description: string }
> = {
  view: { label: 'View', description: 'Read records and open module views' },
  create: { label: 'Create', description: 'Add new records or draft items' },
  edit: { label: 'Edit', description: 'Modify existing records' },
  delete: { label: 'Delete / Archive', description: 'Remove or archive records' },
  export: { label: 'Export', description: 'Download CSVs, reports, and data sheets' },
  approve: { label: 'Approve', description: 'Authorize workflows, budgets, and stage gates' },
  manage_access: { label: 'Manage Access', description: 'Grant or revoke permissions and invite users' },
};

export const ROLE_LABELS: Record<AppRole, string> = {
  owner: 'Owner',
  admin: 'Administrator',
  manager: 'Manager',
  member: 'Team Member',
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  owner: 'Full unrestricted governance, access controls, owner-only security settings, and audit logs. Permanent project steward.',
  admin: 'Broad operational access across all modules. Cannot transfer ownership or alter Owner accounts.',
  manager: 'Department workflows and operational oversight. Full create/edit/approval rights on assigned modules.',
  member: 'Focused execution. Granular read and task execution permissions tailored by template or custom override.',
};

const EMPTY_PERMISSIONS: ModulePermissionSet = {
  view: false,
  create: false,
  edit: false,
  delete: false,
  export: false,
  approve: false,
  manage_access: false,
};

const FULL_PERMISSIONS: ModulePermissionSet = {
  view: true,
  create: true,
  edit: true,
  delete: true,
  export: true,
  approve: true,
  manage_access: true,
};

/**
 * Default permission templates for the four role templates.
 */
export function getRoleTemplateDefaults(role: AppRole): UserPermissionMap {
  const map: Partial<UserPermissionMap> = {};

  if (role === 'owner') {
    for (const mod of ALL_MODULES) {
      map[mod] = { ...FULL_PERMISSIONS };
    }
    return map as UserPermissionMap;
  }

  if (role === 'admin') {
    for (const mod of ALL_MODULES) {
      if (mod === 'access') {
        // Administrator can view access roster, but manage_access requires explicit override or Owner
        map[mod] = {
          view: true,
          create: true,
          edit: true,
          delete: false,
          export: true,
          approve: false,
          manage_access: false,
        };
      } else {
        map[mod] = {
          view: true,
          create: true,
          edit: true,
          delete: true,
          export: true,
          approve: true,
          manage_access: false,
        };
      }
    }
    return map as UserPermissionMap;
  }

  if (role === 'manager') {
    for (const mod of ALL_MODULES) {
      switch (mod) {
        case 'dashboard':
        case 'work':
        case 'vendors':
        case 'pipeline':
        case 'documents':
        case 'calculator':
        case 'knowledge':
        case 'notifications':
        case 'profile':
          map[mod] = {
            view: true,
            create: true,
            edit: true,
            delete: false,
            export: true,
            approve: true,
            manage_access: false,
          };
          break;
        case 'budget':
        case 'artifacts':
          map[mod] = {
            view: true,
            create: false,
            edit: false,
            delete: false,
            export: true,
            approve: false,
            manage_access: false,
          };
          break;
        case 'access':
        case 'audit':
        default:
          map[mod] = { ...EMPTY_PERMISSIONS };
          break;
      }
    }
    return map as UserPermissionMap;
  }

  // Team Member template
  for (const mod of ALL_MODULES) {
    switch (mod) {
      case 'dashboard':
      case 'work':
      case 'documents':
      case 'knowledge':
      case 'notifications':
      case 'profile':
        map[mod] = {
          view: true,
          create: true,
          edit: true,
          delete: false,
          export: false,
          approve: false,
          manage_access: false,
        };
        break;
      case 'vendors':
      case 'pipeline':
        map[mod] = {
          view: true,
          create: false,
          edit: false,
          delete: false,
          export: false,
          approve: false,
          manage_access: false,
        };
        break;
      default:
        map[mod] = { ...EMPTY_PERMISSIONS };
        break;
    }
  }

  return map as UserPermissionMap;
}

/**
 * Calculates effective permissions for a user by merging their role template
 * defaults with any custom per-user permission overrides.
 */
export function getEffectivePermissions(
  role: AppRole,
  overrides?: Partial<Record<AppModule, Partial<ModulePermissionSet>>>
): UserPermissionMap {
  const base = getRoleTemplateDefaults(role);
  if (!overrides || role === 'owner') return base;

  const result: Partial<UserPermissionMap> = {};
  for (const mod of ALL_MODULES) {
    result[mod] = {
      ...base[mod],
      ...(overrides[mod] || {}),
    };
  }

  return result as UserPermissionMap;
}

/**
 * Typed permission decision check. Denies access by default.
 */
export function hasPermission(
  user: UserProfile | null | undefined,
  module: AppModule,
  action: PermissionAction
): boolean {
  if (!user) return false;
  if (user.status === 'deactivated') return false;
  if (user.role === 'owner') return true;

  const effective = getEffectivePermissions(user.role, user.permissionOverrides);
  const modPerms = effective[module];
  if (!modPerms) return false;

  return Boolean(modPerms[action]);
}

/**
 * Check if the user can view/navigate to a given module.
 */
export function canAccessModule(
  user: UserProfile | null | undefined,
  module: AppModule
): boolean {
  return hasPermission(user, module, 'view');
}

/**
 * Human-readable label for roles
 */
export function getRoleBadgeLabel(role: AppRole): string {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'admin':
      return 'Administrator';
    case 'manager':
      return 'Manager';
    case 'member':
      return 'Team Member';
    default:
      return 'Member';
  }
}
