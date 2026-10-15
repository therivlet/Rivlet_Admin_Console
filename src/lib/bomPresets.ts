import { GarmentBOM } from './types';

export const STORAGE_KEY_SAVED_BOMS = 'rivlet_saved_garment_boms';

// In-memory cache for SSR/runtime
let inMemoryBOMs: GarmentBOM[] = [];

/**
 * Retrieve user's stored Garment BOM specifications from local storage.
 * Starts empty (no dummy presets) as per user specifications.
 */
export function getSavedBOMs(): GarmentBOM[] {
  if (typeof window === 'undefined') return inMemoryBOMs;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_BOMS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      inMemoryBOMs = parsed;
      return parsed;
    }
  } catch (e) {
    console.error('Failed to read saved BOMs from storage:', e);
  }
  return [];
}

/**
 * Save or update a custom Garment BOM in local storage.
 */
export function saveCustomBOM(bom: GarmentBOM): GarmentBOM[] {
  const current = getSavedBOMs();
  const id = bom.id || `bom-${Date.now()}`;
  const updatedBOM: GarmentBOM = {
    ...bom,
    id,
    updatedAt: new Date().toISOString(),
  };

  const existingIdx = current.findIndex(b => (b.id && b.id === id) || b.garmentType === bom.garmentType);
  let updatedList: GarmentBOM[];

  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = updatedBOM;
  } else {
    updatedList = [updatedBOM, ...current];
  }

  inMemoryBOMs = updatedList;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_BOMS, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Failed to save BOM to storage:', e);
    }
  }
  return updatedList;
}

/**
 * Delete a custom Garment BOM from storage.
 */
export function deleteCustomBOM(idOrName: string): GarmentBOM[] {
  const current = getSavedBOMs();
  const filtered = current.filter(b => b.id !== idOrName && b.garmentType !== idOrName);
  inMemoryBOMs = filtered;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_BOMS, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to delete BOM from storage:', e);
    }
  }
  return filtered;
}

/**
 * Creates a clean, empty Garment BOM structure for creating new garments.
 */
export function createEmptyBOM(name?: string): GarmentBOM {
  return {
    id: `bom-${Date.now()}`,
    garmentType: name || 'New Garment Specification',
    fabricItems: [
      {
        id: `fab-${Date.now()}-1`,
        name: 'Main Fabric',
        material: '100% Combed Cotton',
        weightGsm: 300,
        consumption: 0.8,
        unit: 'kg',
        ratePerUnit: 550,
        totalCost: 440,
      },
    ],
    trimItems: [
      {
        id: `trm-${Date.now()}-1`,
        name: 'Neck Brand Label',
        category: 'Labels & Packaging',
        specification: 'Woven damask micro-label',
        quantity: 1,
        ratePerUnit: 12,
        totalCost: 12,
      },
    ],
    stitchingLabor: 150,
    washFinishCost: 45,
    totalBOMCost: 647,
    notes: '',
    updatedAt: new Date().toISOString(),
  };
}

// Deprecated empty dictionary for type-safety with old imports
export const bomPresets: Record<string, GarmentBOM> = {};
