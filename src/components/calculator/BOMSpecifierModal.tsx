'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Layers, 
  Plus, 
  Trash2, 
  Check, 
  Shirt, 
  Scissors, 
  Save,
  RotateCcw,
  AlertCircle,
  FileText,
  ChevronDown,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { GarmentBOM, FabricBOMItem, TrimBOMItem } from '@/lib/types';
import { 
  getSavedBOMs, 
  saveCustomBOM, 
  deleteCustomBOM, 
  createEmptyBOM 
} from '@/lib/bomPresets';
import ModalPortal from '@/components/ui/ModalPortal';
import { useConfirm } from '@/lib/confirmContext';

interface BOMSpecifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  initialBOM?: GarmentBOM;
  onApplyBOM: (bom: GarmentBOM, rollup: {
    factoryCost: number;
    brandingCost: number;
    packagingCost: number;
    tagsCost: number;
  }) => void;
}

export default function BOMSpecifierModal({
  isOpen,
  onClose,
  currency,
  initialBOM,
  onApplyBOM,
}: BOMSpecifierModalProps) {
  const confirm = useConfirm();
  const [savedBOMs, setSavedBOMs] = useState<GarmentBOM[]>([]);
  const [activeBOMId, setActiveBOMId] = useState<string | null>(null);

  const [garmentType, setGarmentType] = useState<string>('Custom Garment Spec');
  const [fabricItems, setFabricItems] = useState<FabricBOMItem[]>([]);
  const [trimItems, setTrimItems] = useState<TrimBOMItem[]>([]);
  const [stitchingLabor, setStitchingLabor] = useState<number>(150);
  const [washFinishCost, setWashFinishCost] = useState<number>(45);
  const [notes, setNotes] = useState<string>('');
  const [appliedAlert, setAppliedAlert] = useState(false);
  const [saveSuccessAlert, setSaveSuccessAlert] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Gemini AI BOM Estimator State
  const [showAIEstimator, setShowAIEstimator] = useState(false);
  const [aiGarmentPrompt, setAiGarmentPrompt] = useState('');
  const [isEstimatingBOM, setIsEstimatingBOM] = useState(false);
  const [aiBOMError, setAiBOMError] = useState<string | null>(null);

  const handleEstimateBOM = async (promptOverride?: string) => {
    const text = (promptOverride || aiGarmentPrompt || garmentType).trim();
    if (!text) return;
    setIsEstimatingBOM(true);
    setAiBOMError(null);
    try {
      const res = await fetch('/api/ai/calculator/estimate-bom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garmentDescription: text,
          currency,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to estimate BOM');
      }

      const data = await res.json();
      if (data.bom) {
        loadBOMIntoForm(data.bom);
        setShowAIEstimator(false);
        setAiGarmentPrompt('');
      }
    } catch (err: any) {
      setAiBOMError(err.message || 'Error estimating BOM');
    } finally {
      setIsEstimatingBOM(false);
    }
  };

  // Load saved BOM library from localStorage
  const refreshSavedBOMs = useCallback(() => {
    const list = getSavedBOMs();
    setSavedBOMs(list);
    return list;
  }, []);

  // Set active BOM into editor fields
  const loadBOMIntoForm = useCallback((bom: GarmentBOM) => {
    setActiveBOMId(bom.id || null);
    setGarmentType(bom.garmentType || 'Custom Garment Spec');
    setFabricItems(JSON.parse(JSON.stringify(bom.fabricItems || [])));
    setTrimItems(JSON.parse(JSON.stringify(bom.trimItems || [])));
    setStitchingLabor(bom.stitchingLabor || 0);
    setWashFinishCost(bom.washFinishCost || 0);
    setNotes(bom.notes || '');
    setValidationError(null);
  }, []);

  // Initialize modal state on open
  useEffect(() => {
    if (!isOpen) return;
    const list = refreshSavedBOMs();

    if (initialBOM && initialBOM.fabricItems && initialBOM.fabricItems.length > 0) {
      loadBOMIntoForm(initialBOM);
    } else if (list.length > 0) {
      loadBOMIntoForm(list[0]);
    } else {
      // Start with a clean empty BOM (no dummy presets)
      const fresh = createEmptyBOM('New Garment Spec');
      loadBOMIntoForm(fresh);
    }
  }, [isOpen, initialBOM, refreshSavedBOMs, loadBOMIntoForm]);

  // Calculations
  const fabricTotal = fabricItems.reduce((acc, item) => acc + (Number(item.totalCost) || 0), 0);
  const trimsHardwareTotal = trimItems
    .filter(t => t.category === 'Trims & Hardware')
    .reduce((acc, item) => acc + (Number(item.totalCost) || 0), 0);
  const labelsPackagingTotal = trimItems
    .filter(t => t.category === 'Labels & Packaging')
    .reduce((acc, item) => acc + (Number(item.totalCost) || 0), 0);
  const totalBOMCost = fabricTotal + stitchingLabor + washFinishCost + trimsHardwareTotal + labelsPackagingTotal;

  // Fabric handlers
  const updateFabricField = (id: string, field: keyof FabricBOMItem, val: any) => {
    setFabricItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };
      if (field === 'consumption' || field === 'ratePerUnit') {
        updated.totalCost = Math.round((Number(updated.consumption) || 0) * (Number(updated.ratePerUnit) || 0) * 10) / 10;
      }
      return updated;
    }));
  };

  const addFabricRow = () => {
    const newItem: FabricBOMItem = {
      id: `fab-${Date.now()}`,
      name: 'Fabric Component',
      material: '100% Cotton Blend',
      weightGsm: 280,
      consumption: 0.8,
      unit: 'kg',
      ratePerUnit: 550,
      totalCost: 440,
    };
    setFabricItems(prev => [...prev, newItem]);
  };

  const removeFabricRow = async (id: string, name?: string) => {
    const ok = await confirm({
      title: 'Remove Fabric Component',
      message: `Remove "${name || 'this fabric'}" from the Bill of Materials?`,
      confirmLabel: 'Remove Fabric',
      danger: true,
    });
    if (!ok) return;
    setFabricItems(prev => prev.filter(item => item.id !== id));
  };

  // Trim handlers
  const updateTrimField = (id: string, field: keyof TrimBOMItem, val: any) => {
    setTrimItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };
      if (field === 'quantity' || field === 'ratePerUnit') {
        updated.totalCost = Math.round((Number(updated.quantity) || 0) * (Number(updated.ratePerUnit) || 0) * 10) / 10;
      }
      return updated;
    }));
  };

  const addTrimRow = () => {
    const newItem: TrimBOMItem = {
      id: `trm-${Date.now()}`,
      name: 'Trim / Label Component',
      category: 'Labels & Packaging',
      specification: 'Brand label / packaging spec',
      quantity: 1,
      ratePerUnit: 15,
      totalCost: 15,
    };
    setTrimItems(prev => [...prev, newItem]);
  };

  const removeTrimRow = async (id: string, name?: string) => {
    const ok = await confirm({
      title: 'Remove Trim Component',
      message: `Remove "${name || 'this trim item'}" from the Bill of Materials?`,
      confirmLabel: 'Remove Trim',
      danger: true,
    });
    if (!ok) return;
    setTrimItems(prev => prev.filter(item => item.id !== id));
  };

  // Create new BOM from scratch
  const handleCreateNew = async () => {
    if (fabricItems.length > 0) {
      const ok = await confirm({
        title: 'Create New Garment BOM',
        message: 'Start a blank Garment BOM specification? Unsaved changes to the current BOM will be cleared.',
        confirmLabel: 'New BOM',
        danger: false,
      });
      if (!ok) return;
    }
    const fresh = createEmptyBOM('New Garment Spec');
    loadBOMIntoForm(fresh);
  };

  // Save or update BOM in library
  const handleSaveToLibrary = () => {
    if (!garmentType.trim()) {
      setValidationError('Please enter a garment name or style code for this BOM.');
      return;
    }

    const compiled: GarmentBOM = {
      id: activeBOMId || `bom-${Date.now()}`,
      garmentType: garmentType.trim(),
      fabricItems,
      trimItems,
      stitchingLabor: Number(stitchingLabor) || 0,
      washFinishCost: Number(washFinishCost) || 0,
      totalBOMCost,
      notes,
    };

    const updatedList = saveCustomBOM(compiled);
    setSavedBOMs(updatedList);
    setActiveBOMId(compiled.id!);
    setValidationError(null);
    setSaveSuccessAlert(true);
    setTimeout(() => setSaveSuccessAlert(false), 2000);
  };

  // Delete BOM from library
  const handleDeleteBOM = async () => {
    if (!activeBOMId) return;
    const ok = await confirm({
      title: 'Delete Garment BOM',
      message: `Are you sure you want to permanently delete "${garmentType}" from your saved BOM library?`,
      confirmLabel: 'Delete BOM',
      danger: true,
    });
    if (!ok) return;

    const remaining = deleteCustomBOM(activeBOMId);
    setSavedBOMs(remaining);
    if (remaining.length > 0) {
      loadBOMIntoForm(remaining[0]);
    } else {
      const fresh = createEmptyBOM('New Garment Spec');
      loadBOMIntoForm(fresh);
    }
  };

  // Apply BOM to Costing Sheet
  const handleApply = () => {
    setValidationError(null);

    if (!garmentType.trim()) {
      setValidationError('Please enter a garment name.');
      return;
    }

    if (fabricItems.length === 0) {
      setValidationError('Please add at least one fabric component to itemize your garment.');
      return;
    }

    for (const fab of fabricItems) {
      if (!fab.name.trim()) {
        setValidationError('All fabric items must have a valid fabric name.');
        return;
      }
      if (Number(fab.consumption) <= 0) {
        setValidationError(`Consumption for "${fab.name}" must be greater than 0.`);
        return;
      }
      if (Number(fab.ratePerUnit) < 0) {
        setValidationError(`Rate for "${fab.name}" cannot be negative.`);
        return;
      }
    }

    for (const trm of trimItems) {
      if (!trm.name.trim()) {
        setValidationError('All trim items must have a valid name.');
        return;
      }
      if (Number(trm.quantity) <= 0) {
        setValidationError(`Quantity for "${trm.name}" must be greater than 0.`);
        return;
      }
      if (Number(trm.ratePerUnit) < 0) {
        setValidationError(`Rate for "${trm.name}" cannot be negative.`);
        return;
      }
    }

    if (stitchingLabor < 0 || washFinishCost < 0) {
      setValidationError('Labor and wash finishing costs cannot be negative.');
      return;
    }

    // Factory base CMT = Fabric Total + Stitching Labor + Wash/Finish
    const factoryCost = Math.round(fabricTotal + stitchingLabor + washFinishCost);
    
    // Branding & Hardware
    const brandingCost = Math.round(
      trimItems
        .filter(t => t.category === 'Trims & Hardware' || t.name.toLowerCase().includes('neck label') || t.name.toLowerCase().includes('pip'))
        .reduce((sum, t) => sum + (Number(t.totalCost) || 0), 0)
    );

    // Packaging bags
    const packagingCost = Math.round(
      trimItems
        .filter(t => t.name.toLowerCase().includes('polybag') || t.name.toLowerCase().includes('bag') || t.name.toLowerCase().includes('tissue'))
        .reduce((sum, t) => sum + (Number(t.totalCost) || 0), 0)
    );

    // Hangtags
    const tagsCost = Math.round(
      trimItems
        .filter(t => t.name.toLowerCase().includes('hangtag') || t.name.toLowerCase().includes('tag') || t.name.toLowerCase().includes('care'))
        .reduce((sum, t) => sum + (Number(t.totalCost) || 0), 0)
    );

    const compiledBOM: GarmentBOM = {
      id: activeBOMId || `bom-${Date.now()}`,
      garmentType,
      fabricItems,
      trimItems,
      stitchingLabor,
      washFinishCost,
      totalBOMCost,
      notes,
    };

    // Auto-save to library on apply
    saveCustomBOM(compiledBOM);

    onApplyBOM(compiledBOM, {
      factoryCost,
      brandingCost: brandingCost || 30,
      packagingCost: packagingCost || 35,
      tagsCost: tagsCost || 18,
    });

    setAppliedAlert(true);
    setTimeout(() => {
      setAppliedAlert(false);
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen}>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      >
        <div 
          className="w-full max-w-5xl bg-[#090b12] border border-[#20273a] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#1c2336] bg-[#0e121d] flex items-center justify-between gap-3 sm:gap-4 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#cda052] to-[#8a6828] flex items-center justify-center text-black shadow-glow flex-shrink-0">
              <Scissors className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <h3 className="text-sm sm:text-base font-bold text-white font-serif tracking-wide truncate">
                  Technical Bill of Materials (BOM) & Trim Specifier
                </h3>
                <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-[rgba(205,160,82,0.15)] text-[#cda052] border border-[rgba(205,160,82,0.3)] font-semibold flex-shrink-0">
                  Custom Architecture
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#7d869d] truncate">
                Create, customize, and store exact fabric layers, consumption rates, CMT labor, and luxury trims for your garments.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Close BOM Specifier"
            aria-label="Close BOM Specifier"
            className="p-1.5 rounded-lg text-[#858e9f] hover:text-white hover:bg-[#181d2a] transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {validationError && (
          <div className="p-3 mx-4 mt-3 bg-rose-950/80 border border-rose-700/60 rounded-xl text-rose-200 text-xs flex items-center gap-2 animate-fade-in font-medium flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Dynamic Garment BOM Library & Management Bar (No Dummy Presets) */}
        <div className="p-3 sm:p-4 bg-[#0d101a] border-b border-[#181f30] flex flex-col md:flex-row md:items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <span className="text-xs text-[#717a90] font-medium flex-shrink-0 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#cda052]" /> Saved Garments:
            </span>

            {savedBOMs.length > 0 ? (
              <select
                value={activeBOMId || ''}
                onChange={(e) => {
                  const selected = savedBOMs.find(b => b.id === e.target.value);
                  if (selected) loadBOMIntoForm(selected);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#141824] border border-[#232d44] text-xs text-white focus:outline-none focus:border-[#cda052] max-w-[220px] truncate"
              >
                {savedBOMs.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.garmentType}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[11px] text-[#5a657c] italic">No saved specifications yet</span>
            )}

            <button
              type="button"
              onClick={handleCreateNew}
              title="Create a fresh garment BOM from scratch"
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#141824] hover:bg-[#1a2133] text-[#cbd5e1] hover:text-white border border-[#232d44] transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 text-[#cda052]" />
              <span>New BOM</span>
            </button>

            {activeBOMId && (
              <button
                type="button"
                onClick={handleDeleteBOM}
                title="Delete this saved BOM from your library"
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Garment Title and Save Button */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={garmentType}
              onChange={(e) => setGarmentType(e.target.value)}
              placeholder="Garment Name (e.g. Rivlet Overshirt)"
              className="px-3 py-1.5 rounded-lg bg-[#07090f] border border-[#20273c] text-xs text-white font-medium outline-none focus:border-[#cda052] flex-1 md:w-64"
            />
            <button
              type="button"
              onClick={() => setShowAIEstimator(!showAIEstimator)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(205,160,82,0.15)] text-[#cda052] border border-[rgba(205,160,82,0.3)] hover:bg-[rgba(205,160,82,0.25)] transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-sm"
              title="Auto-estimate full BOM with fabrics, trims, and labor using Google Gemini"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#cda052]" />
              <span>✨ AI Auto-Estimate</span>
            </button>
            <button
              type="button"
              onClick={handleSaveToLibrary}
              title="Save or update this Garment BOM in your library"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#131b2c] hover:bg-[#1c273e] text-[#cbd5e1] hover:text-white border border-[#243352] hover:border-[#cda052]/50 transition-all flex items-center gap-1 flex-shrink-0"
            >
              <Save className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Save Spec</span>
            </button>
            {saveSuccessAlert && (
              <span className="text-[11px] text-emerald-400 font-medium animate-fade-in flex items-center gap-0.5">
                <Check className="w-3 h-3" /> Saved!
              </span>
            )}
          </div>
        </div>

        {/* AI Auto-Estimator Collapsible Bar */}
        {showAIEstimator && (
          <div className="mx-4 sm:mx-6 mt-3 p-4 rounded-xl bg-gradient-to-br from-[#12192a] to-[#0a0d16] border border-[#cda052]/40 shadow-xl space-y-3 animate-fade-in">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#cda052]" />
                  <span>Gemini Technical Garment BOM Estimator</span>
                </h5>
                <p className="text-[#8c9bb5] text-[11px] mt-0.5">
                  Enter any garment description or technical silhouette. Gemini calculates realistic fabric consumption (kg), rib knit ratios, custom trims, and Indian market labor/finishing costs.
                </p>
              </div>
              <button
                onClick={() => setShowAIEstimator(false)}
                className="p-1 rounded text-[#64748b] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={aiGarmentPrompt}
                onChange={(e) => setAiGarmentPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isEstimatingBOM && (aiGarmentPrompt.trim() || garmentType.trim())) {
                    handleEstimateBOM();
                  }
                }}
                placeholder="e.g. Oversized 480 GSM French Terry Drop Shoulder Hoodie with double hood & custom aglets"
                className="flex-1 px-3 py-2 rounded-lg bg-[#07090e] border border-[#222d44] text-xs text-white placeholder:text-[#52607a] outline-none focus:border-[#cda052]"
              />
              <button
                type="button"
                onClick={() => handleEstimateBOM()}
                disabled={isEstimatingBOM || (!aiGarmentPrompt.trim() && !garmentType.trim())}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b0883d] text-black text-xs font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer flex-shrink-0"
              >
                {isEstimatingBOM ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Calculating BOM...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 fill-black" />
                    <span>Generate BOM</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Garment Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-[#64748b]">Quick templates:</span>
              {[
                'Oversized 480 GSM French Terry Hoodie with Kangaroo Pocket',
                '260 GSM Heavyweight Compact Cotton Vintage Wash Tee',
                '78/22 Nylon Lycra High-Rise Squat-Proof Leggings',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={isEstimatingBOM}
                  onClick={() => {
                    setAiGarmentPrompt(preset);
                    handleEstimateBOM(preset);
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-[#182030] text-[#cbd5e1] hover:text-[#cda052] hover:bg-[#202b40] transition-colors cursor-pointer border border-[#222d42]"
                >
                  {preset}
                </button>
              ))}
            </div>

            {aiBOMError && (
              <p className="text-[11px] text-rose-400 bg-rose-950/40 border border-rose-900/50 p-2 rounded-lg">
                {aiBOMError}
              </p>
            )}
          </div>
        )}

        {/* Scrollable BOM Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* SECTION 1: MAIN BODY & KNIT FABRICS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#cda052]" />
                <h4 className="text-xs uppercase font-mono tracking-wider text-[#cda052] font-semibold">
                  1. Fabric Layers & Consumption Rates
                </h4>
              </div>
              <button
                onClick={addFabricRow}
                title="Add an additional fabric layer or insert"
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-[#161c2b] text-[#cbd5e1] hover:text-white border border-[#252f44] hover:border-[#cda052] transition-colors"
              >
                <Plus className="w-3 h-3 text-[#cda052]" />
                <span>Add Fabric Row</span>
              </button>
            </div>

            <div className="rounded-xl border border-[#1b2234] bg-[#0c0f18] overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-[#0f1320] text-[#717a90] text-[10px] font-mono uppercase tracking-wider border-b border-[#1d2437]">
                  <tr>
                    <th className="py-2.5 px-3">Component / Placement</th>
                    <th className="py-2.5 px-3">Material Composition</th>
                    <th className="py-2.5 px-3 w-20">GSM</th>
                    <th className="py-2.5 px-3 w-24">Consumption</th>
                    <th className="py-2.5 px-3 w-16">Unit</th>
                    <th className="py-2.5 px-3 w-24">Rate ({currency})</th>
                    <th className="py-2.5 px-3 w-24 text-right">Cost ({currency})</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171d2c]">
                  {fabricItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#121624] transition-colors">
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateFabricField(item.id, 'name', e.target.value)}
                          className="w-full bg-[#07090f] px-2 py-1 rounded border border-[#1d2539] text-white text-xs focus:border-[#cda052] outline-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={item.material}
                          onChange={(e) => updateFabricField(item.id, 'material', e.target.value)}
                          className="w-full bg-[#07090f] px-2 py-1 rounded border border-[#1d2539] text-white text-xs focus:border-[#cda052] outline-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          value={item.weightGsm || ''}
                          onChange={(e) => updateFabricField(item.id, 'weightGsm', Number(e.target.value))}
                          className="w-full bg-[#07090f] px-2 py-1 rounded border border-[#1d2539] text-white text-xs text-right focus:border-[#cda052] outline-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.01"
                          value={item.consumption || ''}
                          onChange={(e) => updateFabricField(item.id, 'consumption', Number(e.target.value))}
                          className="w-full bg-[#07090f] px-2 py-1 rounded border border-[#1d2539] text-white text-xs text-right focus:border-[#cda052] outline-none font-mono"
                        />
                      </td>
                      <td className="p-2.5">
                        <select
                          value={item.unit}
                          onChange={(e) => updateFabricField(item.id, 'unit', e.target.value)}
                          className="w-full bg-[#07090f] px-1 py-1 rounded border border-[#1d2539] text-white text-xs focus:border-[#cda052] outline-none"
                        >
                          <option value="kg">kg</option>
                          <option value="meters">m</option>
                          <option value="pieces">pcs</option>
                        </select>
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="1"
                          value={item.ratePerUnit || ''}
                          onChange={(e) => updateFabricField(item.id, 'ratePerUnit', Number(e.target.value))}
                          className="w-full bg-[#07090f] px-2 py-1 rounded border border-[#1d2539] text-white text-xs text-right focus:border-[#cda052] outline-none font-mono"
                        />
                      </td>
                      <td className="p-2.5 text-right font-mono font-semibold text-white">
                        {item.totalCost?.toFixed(1) || '0.0'}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => removeFabricRow(item.id, item.name)}
                          title="Remove fabric row"
                          className="p-1 rounded text-[#717a90] hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-2.5 bg-[#0f1320] border-t border-[#1d2437] flex items-center justify-between text-xs px-4">
                <span className="text-[#7c869e] font-medium">Subtotal Fabric Supply</span>
                <span className="font-mono font-bold text-white text-sm">
                  {currency}{fabricTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: CMT STITCHING LABOR & FINISHING */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-[#cda052]" />
              <h4 className="text-xs uppercase font-mono tracking-wider text-[#cda052] font-semibold">
                2. CMT Stitching Labor & Specialty Washing / Dyeing
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 bg-[#0c0f18] border border-[#1b2234] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white block">Cut, Make & Trim (CMT) Stitching Labor</label>
                  <span className="text-[10px] text-[#717a90] font-mono">Per Unit</span>
                </div>
                <p className="text-[11px] text-[#788299]">Precision cutting, flatlock seams, and structural assembly.</p>
                <div className="relative pt-1">
                  <input
                    type="number"
                    step="5"
                    value={stitchingLabor}
                    onChange={(e) => setStitchingLabor(Number(e.target.value) || 0)}
                    className="w-full bg-[#07090f] px-3 py-1.5 rounded-lg border border-[#1d2539] text-white text-sm font-mono focus:border-[#cda052] outline-none"
                  />
                  <span className="absolute right-3 top-[11px] text-[#6b758b] text-xs font-mono">{currency}</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#0c0f18] border border-[#1b2234] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white block">Specialty Washing, Softening & Piece Dye</label>
                  <span className="text-[10px] text-[#717a90] font-mono">Per Unit</span>
                </div>
                <p className="text-[11px] text-[#788299]">Garment enzyme wash, carbon suede finish, reactive dyeing.</p>
                <div className="relative pt-1">
                  <input
                    type="number"
                    step="5"
                    value={washFinishCost}
                    onChange={(e) => setWashFinishCost(Number(e.target.value) || 0)}
                    className="w-full bg-[#07090f] px-3 py-1.5 rounded-lg border border-[#1d2539] text-white text-sm font-mono focus:border-[#cda052] outline-none"
                  />
                  <span className="absolute right-3 top-[11px] text-[#6b758b] text-xs font-mono">{currency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: LUXURY HARDWARE TRIMS, LABELS & PACKAGING */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shirt className="w-4 h-4 text-[#cda052]" />
                <h4 className="text-xs uppercase font-mono tracking-wider text-[#cda052] font-semibold">
                  3. Hardware Trims, Brand Labels & Packaging
                </h4>
              </div>
              <button
                onClick={addTrimRow}
                title="Add an itemized trim or label"
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-[#161c2b] text-[#cbd5e1] hover:text-white border border-[#252f44] hover:border-[#cda052] transition-colors"
              >
                <Plus className="w-3 h-3 text-[#cda052]" />
                <span>Add Trim Row</span>
              </button>
            </div>

            <div className="rounded-xl border border-[#1b2234] bg-[#0c0f18] overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-[#0f1320] text-[#717a90] text-[10px] font-mono uppercase tracking-wider border-b border-[#1d2437]">
                  <tr>
                    <th className="py-2.5 px-3">Item / Trim Description</th>
                    <th className="py-2.5 px-3 w-40">Category</th>
                    <th className="py-2.5 px-3">Engineering Spec / Finish</th>
                    <th className="py-2.5 px-3 w-20">Qty/Garment</th>
                    <th className="py-2.5 px-3 w-24">Rate ({currency})</th>
                    <th className="py-2.5 px-3 w-24 text-right">Cost ({currency})</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171d2c]">
                  {trimItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#121624] transition-colors">
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateTrimField(item.id, 'name', e.target.value)}
                          className="w-full bg-[#07090f] px-2 py-1 rounded border border-[#1d2539] text-white text-xs focus:border-[#cda052] outline-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <select
                          value={item.category}
                          onChange={(e) => updateTrimField(item.id, 'category', e.target.value)}
                          className="w-full bg-[#07090f] px-2 py-1 rounded border border-[#1d2539] text-white text-xs focus:border-[#cda052] outline-none"
                        >
                          <option value="Trims & Hardware">Trims & Hardware</option>
                          <option value="Labels & Packaging">Labels & Packaging</option>
                          <option value="Labor & Finishing">Labor & Finishing</option>
                        </select>
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={item.specification}
                          onChange={(e) => updateTrimField(item.id, 'specification', e.target.value)}
                          className="w-full bg-[#07090f] px-2 py-1 rounded border border-[#1d2539] text-white text-xs focus:border-[#cda052] outline-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="1"
                          value={item.quantity || ''}
                          onChange={(e) => updateTrimField(item.id, 'quantity', Number(e.target.value))}
                          className="w-full bg-[#07090f] px-2 py-1 rounded border border-[#1d2539] text-white text-xs text-right focus:border-[#cda052] outline-none font-mono"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="1"
                          value={item.ratePerUnit || ''}
                          onChange={(e) => updateTrimField(item.id, 'ratePerUnit', Number(e.target.value))}
                          className="w-full bg-[#07090f] px-2 py-1 rounded border border-[#1d2539] text-white text-xs text-right focus:border-[#cda052] outline-none font-mono"
                        />
                      </td>
                      <td className="p-2.5 text-right font-mono font-semibold text-white">
                        {item.totalCost?.toFixed(1) || '0.0'}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => removeTrimRow(item.id, item.name)}
                          title="Remove trim row"
                          className="p-1 rounded text-[#717a90] hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-2.5 bg-[#0f1320] border-t border-[#1d2437] flex items-center justify-between text-xs px-4">
                <span className="text-[#7c869e] font-medium">Subtotal Trims, Labels & Packaging</span>
                <span className="font-mono font-bold text-white text-sm">
                  {currency}{(trimsHardwareTotal + labelsPackagingTotal).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Summary & Action Rollup Bar */}
        <div className="p-4 bg-[#0a0d16] border-t border-[#1a2133] flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs w-full md:w-auto">
            <div>
              <span className="text-[10px] text-[#6d778d] block uppercase font-mono">FABRIC & KNIT</span>
              <span className="font-mono font-bold text-white text-sm">{currency}{fabricTotal.toFixed(1)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6d778d] block uppercase font-mono">CMT & WASHING</span>
              <span className="font-mono font-bold text-white text-sm">{currency}{(stitchingLabor + washFinishCost).toFixed(1)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6d778d] block uppercase font-mono">HARDWARE & TRIMS</span>
              <span className="font-mono font-bold text-white text-sm">{currency}{trimsHardwareTotal.toFixed(1)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6d778d] block uppercase font-mono">TOTAL FOB TARGET</span>
              <span className="font-mono font-bold text-[#cda052] text-base">{currency}{totalBOMCost.toFixed(1)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            {appliedAlert && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald-400" />
                Applied to Pricing Engine!
              </span>
            )}

            <button
              onClick={onClose}
              title="Discard changes and exit"
              className="px-4 py-2 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-xs text-[#8c95ab] hover:text-white border border-[#20273a] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleApply}
              title="Apply itemized BOM factory cost directly to the active costing sheet"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply BOM to Pricing Engine</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
}
