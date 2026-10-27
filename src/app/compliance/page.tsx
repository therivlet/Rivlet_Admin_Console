'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Scale,
  BadgePercent,
  Ship,
  FileText,
  ShieldCheck,
  Lock,
  ListOrdered,
} from 'lucide-react';
import ComplianceHeader from '@/components/compliance/ComplianceHeader';
import WorkflowTrackerView from '@/components/compliance/WorkflowTrackerView';
import GstEngineView from '@/components/compliance/GstEngineView';
import IcegateCustomsView from '@/components/compliance/IcegateCustomsView';
import DscRegistryView from '@/components/compliance/DscRegistryView';
import ItrScheduleView from '@/components/compliance/ItrScheduleView';
import CredentialVaultView from '@/components/compliance/CredentialVaultView';
import {
  ComplianceWorkflowItem,
  GstSettings,
  GstReconciliationInvoice,
  CustomsDeclaration,
  DscRegistryItem,
  CredentialVaultItem,
} from '@/lib/types';
import {
  getLocalComplianceWorkflows,
  saveLocalComplianceWorkflows,
  loadMergedComplianceWorkflows,
  saveMergedComplianceWorkflows,
  getLocalGstSettings,
  saveLocalGstSettings,
  loadMergedGstSettings,
  saveMergedGstSettings,
  getLocalReconInvoices,
  saveLocalReconInvoices,
  loadMergedReconInvoices,
  saveMergedReconInvoices,
  getLocalCustomsDeclarations,
  saveLocalCustomsDeclarations,
  loadMergedCustomsDeclarations,
  saveMergedCustomsDeclarations,
  getLocalDscRegistry,
  saveLocalDscRegistry,
  loadMergedDscRegistry,
  saveMergedDscRegistry,
  getLocalCredentialVault,
  saveLocalCredentialVault,
  loadMergedCredentialVault,
  saveMergedCredentialVault,
} from '@/lib/complianceStorage';

type ComplianceTab = 'workflows' | 'gst' | 'icegate' | 'itr' | 'dsc' | 'vault';

interface TabMeta {
  key: ComplianceTab;
  label: string;
  icon: any;
  description: string;
}

const TABS: TabMeta[] = [
  { key: 'workflows', label: 'Overview & Workflows', icon: ListOrdered, description: 'Statutory filing matrix & assignments' },
  { key: 'gst', label: 'GST Engine & ITC', icon: BadgePercent, description: 'GSTR-1, GSTR-3B & Rule 88A settlement' },
  { key: 'icegate', label: 'IEC & ICEGATE Customs', icon: Ship, description: 'Apparel import BOE & export SB planner' },
  { key: 'itr', label: 'ITR & Direct Tax', icon: FileText, description: 'Advance Tax 4-tranches & TDS 26Q' },
  { key: 'dsc', label: 'DSC Token Registry', icon: ShieldCheck, description: 'Class 3 Digital Signatures & expiries' },
  { key: 'vault', label: 'Credential Vault', icon: Lock, description: 'Encrypted portal passwords & PAN/ICEGATE' },
];

function CompliancePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as ComplianceTab;

  const validTabs: ComplianceTab[] = ['workflows', 'gst', 'icegate', 'itr', 'dsc', 'vault'];
  const activeTab: ComplianceTab = validTabs.includes(tabParam) ? tabParam : 'workflows';

  const [workflows, setWorkflows] = useState<ComplianceWorkflowItem[]>([]);
  const [gstSettings, setGstSettings] = useState<GstSettings>(getLocalGstSettings());
  const [reconInvoices, setReconInvoices] = useState<GstReconciliationInvoice[]>([]);
  const [customsDeclarations, setCustomsDeclarations] = useState<CustomsDeclaration[]>([]);
  const [dscItems, setDscItems] = useState<DscRegistryItem[]>([]);
  const [vaultItems, setVaultItems] = useState<CredentialVaultItem[]>([]);

  // Load datasets on mount and synchronize with Supabase Cloud
  useEffect(() => {
    // 1. Initial fast local hydration
    setWorkflows(getLocalComplianceWorkflows());
    setGstSettings(getLocalGstSettings());
    setReconInvoices(getLocalReconInvoices());
    setCustomsDeclarations(getLocalCustomsDeclarations());
    setDscItems(getLocalDscRegistry());
    setVaultItems(getLocalCredentialVault());

    // 2. Direct Supabase Cloud synchronization
    loadMergedGstSettings().then((settings) => {
      if (settings) setGstSettings(settings);
    });

    loadMergedReconInvoices().then((invoices) => {
      if (invoices) setReconInvoices(invoices);
    });

    loadMergedComplianceWorkflows().then((merged) => {
      if (merged !== undefined && merged !== null) setWorkflows(merged);
    });

    loadMergedCustomsDeclarations().then((declarations) => {
      if (declarations !== undefined && declarations !== null) setCustomsDeclarations(declarations);
    });

    loadMergedDscRegistry().then((items) => {
      if (items !== undefined && items !== null) setDscItems(items);
    });

    loadMergedCredentialVault().then((items) => {
      if (items !== undefined && items !== null) setVaultItems(items);
    });
  }, []);

  const setTab = (nextTab: ComplianceTab) => {
    router.push(`/compliance?tab=${nextTab}`);
  };

  const handleSaveWorkflows = (updated: ComplianceWorkflowItem[]) => {
    setWorkflows(updated);
    saveMergedComplianceWorkflows(updated);
  };

  const handleUpdateGstSettings = (updated: GstSettings) => {
    setGstSettings(updated);
    saveMergedGstSettings(updated);
  };

  const handleUpdateReconInvoices = (updated: GstReconciliationInvoice[]) => {
    setReconInvoices(updated);
    saveMergedReconInvoices(updated);
  };

  const handleUpdateCustoms = (updated: CustomsDeclaration[]) => {
    setCustomsDeclarations(updated);
    saveMergedCustomsDeclarations(updated);
  };

  const handleUpdateDsc = (updated: DscRegistryItem[]) => {
    setDscItems(updated);
    saveMergedDscRegistry(updated);
  };

  const handleUpdateVault = (updated: CredentialVaultItem[]) => {
    setVaultItems(updated);
    saveMergedCredentialVault(updated);
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Executive Telemetry Header */}
      <ComplianceHeader
        workflows={workflows}
        dscItems={dscItems}
        customsDeclarations={customsDeclarations}
        onTabSelect={(t) => setTab(t as ComplianceTab)}
        activeTab={activeTab}
        settings={gstSettings}
        onUpdateSettings={handleUpdateGstSettings}
      />

      {/* Navigation Sub-Tabs Bar */}
      <div className="bg-white dark:bg-[#0e121b] p-1.5 rounded-2xl border border-slate-200 dark:border-[#1e2638] flex items-center gap-1 overflow-x-auto shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-amber-500/10 text-amber-700 dark:text-[#f7d88c] border border-amber-500/30 shadow-sm'
                  : 'text-slate-500 dark:text-[#8a96ae] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#cda052]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab View Rendering */}
      <div>
        {activeTab === 'workflows' && (
          <WorkflowTrackerView
            workflows={workflows}
            onSaveWorkflows={handleSaveWorkflows}
          />
        )}

        {activeTab === 'gst' && (
          <GstEngineView
            settings={gstSettings}
            onUpdateSettings={handleUpdateGstSettings}
            reconInvoices={reconInvoices}
            onUpdateReconInvoices={handleUpdateReconInvoices}
            workflows={workflows}
            onUpdateWorkflows={handleSaveWorkflows}
          />
        )}

        {activeTab === 'icegate' && (
          <IcegateCustomsView
            declarations={customsDeclarations}
            onUpdateDeclarations={handleUpdateCustoms}
          />
        )}

        {activeTab === 'itr' && <ItrScheduleView />}

        {activeTab === 'dsc' && (
          <DscRegistryView
            dscItems={dscItems}
            onUpdateDsc={handleUpdateDsc}
          />
        )}

        {activeTab === 'vault' && (
          <CredentialVaultView
            vaultItems={vaultItems}
            onUpdateVault={handleUpdateVault}
          />
        )}
      </div>
    </div>
  );
}

export default function CompliancePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[#a99a8b] animate-pulse">
          Loading Statutory Compliance Hub...
        </div>
      }
    >
      <CompliancePageInner />
    </Suspense>
  );
}
