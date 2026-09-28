'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Layers, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  Shirt, 
  Scissors, 
  Tag, 
  Package, 
  RotateCcw,
  Info,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { GarmentBOM, FabricBOMItem, TrimBOMItem } from '@/lib/types';
import { bomPresets } from '@/lib/bomPresets';
import ModalPortal from '@/components/ui/ModalPortal';

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
  const [selectedPreset, setSelectedPreset] = useState<string>('hoodie');
  const [garmentType, setGarmentType] = useState<string>('Oversized French Terry Hoodie (450 GSM)');
  const [fabricItems, setFabricItems] = useState<FabricBOMItem[]>([]);
  const [trimItems, setTrimItems] = useState<TrimBOMItem[]>([]);
  const [stitchingLabor, setStitchingLabor] = useState<number>(180);
  const [washFinishCost, setWashFinishCost] = useState<number>(65);
  const [notes, setNotes] = useState<string>('');
  const [appliedAlert, setAppliedAlert] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const loadPreset = useCallback((key: string) => {
    setSelectedPreset(key);
    const preset = bomPresets[key];
    if (preset) {
      setGarmentType(preset.garmentType);
      setFabricItems(JSON.parse(JSON.stringify(preset.fabricItems)));
      setTrimItems(JSON.parse(JSON.stringify(preset.trimItems)));
      setStitchingLabor(preset.stitchingLabor);
      setWashFinishCost(preset.washFinishCost);
      setNotes(preset.notes || '');
    }
  }, []);

  // Initialize or load preset
  useEffect(() => {
    if (!isOpen) return;
    if (initialBOM) {
      setGarmentType(initialBOM.garmentType || 'Custom Garment Spec');
      setFabricItems(initialBOM.fabricItems || []);
      setTrimItems(initialBOM.trimItems || []);
      setStitchingLabor(initialBOM.stitchingLabor || 0);
      setWashFinishCost(initialBOM.washFinishCost || 0);
      setNotes(initialBOM.notes || '');
    } else {
      loadPreset('hoodie');
    }
  }, [initialBOM, isOpen, loadPreset]);

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
      name: 'Secondary Fabric / Insert',
      material: '100% Combed Cotton',
      weightGsm: 300,
      consumption: 0.15,
      unit: 'kg',
      ratePerUnit: 600,
      totalCost: 90,
    };
    setFabricItems(prev => [...prev, newItem]);
  };

  const removeFabricRow = (id: string) => {
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
      name: 'Custom Hardware / Accessory',
      category: 'Trims & Hardware',
      specification: 'Custom metal trim with engraved logo',
      quantity: 1,
      ratePerUnit: 15,
      totalCost: 15,
    };
    setTrimItems(prev => [...prev, newItem]);
  };

  const removeTrimRow = (id: string) => {
    setTrimItems(prev => prev.filter(item => item.id !== id));
  };

  // Apply to Calculator
  const handleApply = () => {
    setValidationError(null);

    if (!garmentType || garmentType.trim().length < 2) {
      setValidationError('Garment type description is required.');
      return;
    }

    if (fabricItems.length === 0) {
      setValidationError('At least one fabric layer/body must be specified in the BOM.');
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

    // Break up into Rivlet Step 1 cost buckets:
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
      garmentType,
      fabricItems,
      trimItems,
      stitchingLabor,
      washFinishCost,
      totalBOMCost,
      notes,
    };

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
    }, 1200);
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
                  Architecture
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#7d869d] truncate">
                Itemize fabric blends, GSM, consumption rates, CMT labor, and luxury hardware trims.
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


        {/* Preset Selector Banner */}
        <div className="p-3 sm:p-4 bg-[#0d101a] border-b border-[#181f30] flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#717a90] font-medium mr-1">Apparel Presets:</span>
            <button
              onClick={() => loadPreset('hoodie')}
              title="Load preset specs for 450 GSM French Terry Hoodie"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedPreset === 'hoodie'
                  ? 'bg-gradient-to-r from-[#cda052] to-[#b38536] text-black shadow-glow'
                  : 'bg-[#141824] text-[#8e98ae] hover:text-white border border-[#22293d]'
              }`}
            >
              <Shirt className="w-3.5 h-3.5" />
              <span>450 GSM French Terry Hoodie</span>
            </button>

            <button
              onClick={() => loadPreset('tshirt')}
              title="Load preset specs for 280 GSM Heavy Boxy Tee"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedPreset === 'tshirt'
                  ? 'bg-gradient-to-r from-[#cda052] to-[#b38536] text-black shadow-glow'
                  : 'bg-[#141824] text-[#8e98ae] hover:text-white border border-[#22293d]'
              }`}
            >
              <Shirt className="w-3.5 h-3.5" />
              <span>280 GSM Heavy Boxy Tee</span>
            </button>

            <button
              onClick={() => loadPreset('sweatpants')}
              title="Load preset specs for 400 GSM Heavy Sweatpants"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedPreset === 'sweatpants'
                  ? 'bg-gradient-to-r from-[#cda052] to-[#b38536] text-black shadow-glow'
                  : 'bg-[#141824] text-[#8e98ae] hover:text-white border border-[#22293d]'
              }`}
            >
              <Shirt className="w-3.5 h-3.5" />
              <span>400 GSM Heavy Sweatpants</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-[#6e778d] flex-shrink-0">Garment Name:</span>
            <input
              type="text"
              value={garmentType}
              onChange={(e) => setGarmentType(e.target.value)}
              className="px-2.5 py-1 rounded bg-[#07090f] border border-[#20273c] text-xs text-white outline-none focus:border-[#cda052] flex-1 sm:w-64"
            />
          </div>
        </div>

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
                title="Add a new fabric or ribbing line to the BOM"
                className="px-2.5 py-1 rounded bg-[#131724] border border-[#22293d] hover:border-[#cda052]/50 text-xs text-[#cda052] flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Fabric Layer</span>
              </button>
            </div>

            <div className="border border-[#1d2437] rounded-xl overflow-x-auto bg-[#0c0f18]">
              <table className="w-full text-xs text-left min-w-[620px]">
                <thead className="bg-[#121623] border-b border-[#1d2437] text-[#8690a6]">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Fabric Layer & Composition</th>
                    <th className="py-2.5 px-2 text-center font-semibold w-24">Weight (GSM)</th>
                    <th className="py-2.5 px-2 text-center font-semibold w-28">Consumption</th>
                    <th className="py-2.5 px-2 text-right font-semibold w-28">Rate ({currency}/kg)</th>
                    <th className="py-2.5 px-3 text-right font-semibold w-28">Subtotal</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171d2c]">
                  {fabricItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#111522] transition-colors">
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateFabricField(item.id, 'name', e.target.value)}
                          placeholder="e.g. Main Body French Terry"
                          className="w-full bg-transparent font-medium text-white outline-none placeholder:text-[#525b70]"
                        />
                        <input
                          type="text"
                          value={item.material}
                          onChange={(e) => updateFabricField(item.id, 'material', e.target.value)}
                          placeholder="e.g. 100% Combed Compact Cotton"
                          className="w-full bg-transparent text-[11px] text-[#717b92] outline-none placeholder:text-[#424a5b]"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          value={item.weightGsm}
                          onChange={(e) => updateFabricField(item.id, 'weightGsm', Number(e.target.value))}
                          className="w-16 px-1.5 py-1 text-center bg-[#07090f] border border-[#20273a] rounded text-white font-mono text-xs outline-none"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            value={item.consumption}
                            onChange={(e) => updateFabricField(item.id, 'consumption', Number(e.target.value))}
                            className="w-16 px-1.5 py-1 text-center bg-[#07090f] border border-[#20273a] rounded text-white font-mono text-xs outline-none"
                          />
                          <span className="text-[10px] text-[#6b758c]">kg</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[#6b758c]">{currency}</span>
                          <input
                            type="number"
                            value={item.ratePerUnit}
                            onChange={(e) => updateFabricField(item.id, 'ratePerUnit', Number(e.target.value))}
                            className="w-20 px-1.5 py-1 text-right bg-[#07090f] border border-[#20273a] rounded text-white font-mono text-xs outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-[#cda052]">
                        {currency}{item.totalCost.toFixed(1)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {fabricItems.length > 1 && (
                          <button
                            onClick={() => removeFabricRow(item.id)}
                            title="Remove fabric component"
                            className="p-1 text-[#626a7e] hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-2.5 bg-[#0f1320] border-t border-[#1d2437] flex items-center justify-between text-xs px-4">
                <span className="text-[#7c869e] font-medium">Subtotal Fabric Cost per Garment</span>
                <span className="font-mono font-bold text-white text-sm">
                  {currency}{fabricTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: CMT STITCHING LABOR & WASH FINISHING */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-[#cda052]" />
              <h4 className="text-xs uppercase font-mono tracking-wider text-[#cda052] font-semibold">
                2. Cut, Make, Trim (CMT) & Chemical Wash Finishing
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#0c0f18] border border-[#1e2538] rounded-xl flex items-center justify-between gap-4">
                <div>
                  <label className="text-xs font-bold text-white block">Cut & Make Labor (CMT)</label>
                  <p className="text-[11px] text-[#717b92] mt-0.5">
                    Skilled flatlock stitching, reinforced collar, twin-needle finish
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs text-[#717b92]">{currency}</span>
                  <input
                    type="number"
                    value={stitchingLabor}
                    onChange={(e) => setStitchingLabor(Number(e.target.value))}
                    className="w-24 px-2.5 py-1.5 bg-[#07090f] border border-[#20273a] rounded-lg text-white font-mono text-xs text-right outline-none focus:border-[#cda052]"
                  />
                </div>
              </div>

              <div className="p-4 bg-[#0c0f18] border border-[#1e2538] rounded-xl flex items-center justify-between gap-4">
                <div>
                  <label className="text-xs font-bold text-white block">Dyeing & Specialty Wash</label>
                  <p className="text-[11px] text-[#717b92] mt-0.5">
                    Reactive piece dyeing, carbon peach / suede wash, enzyme softening
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs text-[#717b92]">{currency}</span>
                  <input
                    type="number"
                    value={washFinishCost}
                    onChange={(e) => setWashFinishCost(Number(e.target.value))}
                    className="w-24 px-2.5 py-1.5 bg-[#07090f] border border-[#20273a] rounded-lg text-white font-mono text-xs text-right outline-none focus:border-[#cda052]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: TRIMS, HARDWARE & LUXURY PACKAGING */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#cda052]" />
                <h4 className="text-xs uppercase font-mono tracking-wider text-[#cda052] font-semibold">
                  3. Hardware, Trims, Woven Labels & Packaging
                </h4>
              </div>
              <button
                onClick={addTrimRow}
                title="Add a new trim, zipper, or label component"
                className="px-2.5 py-1 rounded bg-[#131724] border border-[#22293d] hover:border-[#cda052]/50 text-xs text-[#cda052] flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Trim / Packaging</span>
              </button>
            </div>

            <div className="border border-[#1d2437] rounded-xl overflow-x-auto bg-[#0c0f18]">
              <table className="w-full text-xs text-left min-w-[620px]">
                <thead className="bg-[#121623] border-b border-[#1d2437] text-[#8690a6]">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Trim / Hardware Component</th>
                    <th className="py-2.5 px-2 font-semibold">Category</th>
                    <th className="py-2.5 px-2 text-center font-semibold w-20">Quantity</th>
                    <th className="py-2.5 px-2 text-right font-semibold w-24">Rate ({currency})</th>
                    <th className="py-2.5 px-3 text-right font-semibold w-24">Subtotal</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171d2c]">
                  {trimItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#111522] transition-colors">
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateTrimField(item.id, 'name', e.target.value)}
                          placeholder="e.g. Laser-Engraved Gunmetal Aglets"
                          className="w-full bg-transparent font-medium text-white outline-none placeholder:text-[#525b70]"
                        />
                        <input
                          type="text"
                          value={item.specification}
                          onChange={(e) => updateTrimField(item.id, 'specification', e.target.value)}
                          placeholder="e.g. Matte finish, 12mm loop"
                          className="w-full bg-transparent text-[11px] text-[#717b92] outline-none placeholder:text-[#424a5b]"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={item.category}
                          onChange={(e) => updateTrimField(item.id, 'category', e.target.value as any)}
                          className="px-2 py-1 bg-[#07090f] border border-[#20273a] rounded text-[11px] text-[#cbd5e1] outline-none"
                        >
                          <option value="Trims & Hardware">Hardware & Trims</option>
                          <option value="Labels & Packaging">Labels & Packaging</option>
                        </select>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => updateTrimField(item.id, 'quantity', Number(e.target.value))}
                          className="w-14 px-1.5 py-1 text-center bg-[#07090f] border border-[#20273a] rounded text-white font-mono text-xs outline-none"
                        />
                      </td>
                      <td className="py-2 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[#6b758c]">{currency}</span>
                          <input
                            type="number"
                            value={item.ratePerUnit}
                            onChange={(e) => updateTrimField(item.id, 'ratePerUnit', Number(e.target.value))}
                            className="w-16 px-1.5 py-1 text-right bg-[#07090f] border border-[#20273a] rounded text-white font-mono text-xs outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-[#cda052]">
                        {currency}{item.totalCost.toFixed(1)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => removeTrimRow(item.id)}
                          title="Remove trim component"
                          className="p-1 text-[#626a7e] hover:text-rose-400 transition-colors"
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
                Applied to Step 1!
              </span>
            )}

            <button
              onClick={onClose}
              title="Discard changes and exit"
              className="px-4 py-2 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-xs text-[#8c95ab] hover:text-white border border-[#20273a] transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleApply}
              title="Apply itemized BOM factory cost directly to the active costing sheet"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow transition-all"
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
