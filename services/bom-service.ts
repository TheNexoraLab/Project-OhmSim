import { INITIAL_BOM_PROJECTS } from '@/lib/mocks/products';
import type { BomProject, BomLineItem } from '@/types/product';

export type EnrichedBomLineItem = BomLineItem;
export type EnrichedBomProject = BomProject;

/**
 * Synchronous mock fallback for instant SSR/initial render
 */
export function getInitialBomProjectsSync(): EnrichedBomProject[] {
  return INITIAL_BOM_PROJECTS.map((p) => ({
    id: p.id,
    name: p.name,
    description: null,
    targetBudget: 2500,
    totalCost: 0,
    totalComponentCount: p.lineItems.reduce((acc, li) => acc + li.qty, 0),
    allInStock: true,
    lineItems: p.lineItems.map((li, idx) => ({
      id: `mock-item-${p.id}-${idx}`,
      productId: li.productId,
      qty: li.qty,
      referenceDesignator: `U${idx + 1}`,
    })),
  }));
}

/**
 * Fetch all BOM projects for the active user session from live backend
 */
export async function getBomProjects(userId?: string): Promise<EnrichedBomProject[]> {
  try {
    const url = userId ? `/api/bom?userId=${encodeURIComponent(userId)}` : '/api/bom';
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Return mock fallback for unauthenticated guest demo preview
        return getInitialBomProjectsSync();
      }
      throw new Error(`Failed to fetch BOM projects: ${res.statusText}`);
    }

    const json = await res.json();
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      return json.data;
    }

    // If live user has no database projects yet, seed initial view gracefully
    return getInitialBomProjectsSync();
  } catch (error) {
    console.warn('Network or database error fetching BOM projects, using mock fallback:', error);
    return getInitialBomProjectsSync();
  }
}

/**
 * Fetch single BOM project by ID
 */
export async function getBomProjectById(
  id: string,
  userId?: string
): Promise<EnrichedBomProject | null> {
  try {
    const url = userId
      ? `/api/bom/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`
      : `/api/bom/${encodeURIComponent(id)}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      const fallback = getInitialBomProjectsSync().find((p) => p.id === id);
      return fallback || null;
    }

    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return getInitialBomProjectsSync().find((p) => p.id === id) || null;
  }
}

/**
 * Create a new BOM project
 */
export async function createBomProject(
  name: string,
  description?: string,
  targetBudget?: number,
  userId?: string
): Promise<EnrichedBomProject> {
  try {
    const res = await fetch('/api/bom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, targetBudget, userId }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (error) {
    console.warn('API error creating BOM project, creating local record:', error);
  }

  // Fallback local creation
  return {
    id: `b${Date.now()}`,
    name,
    description: description || null,
    targetBudget: targetBudget || null,
    totalCost: 0,
    totalComponentCount: 0,
    allInStock: false,
    lineItems: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Update existing BOM project
 */
export async function updateBomProject(
  id: string,
  updates: { name?: string; description?: string; targetBudget?: number | null },
  userId?: string
): Promise<boolean> {
  try {
    const res = await fetch(`/api/bom/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, userId }),
    });
    return res.ok;
  } catch (error) {
    console.warn('API error updating BOM project:', error);
    return false;
  }
}

/**
 * Delete a BOM project
 */
export async function deleteBomProject(id: string, userId?: string): Promise<boolean> {
  try {
    const url = userId
      ? `/api/bom/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`
      : `/api/bom/${encodeURIComponent(id)}`;

    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.ok;
  } catch (error) {
    console.warn('API error deleting BOM project:', error);
    return false;
  }
}

/**
 * Add component item to a BOM project
 */
export async function addBomItem(
  projId: string,
  productId: string,
  quantity = 1,
  referenceDesignator?: string,
  userId?: string
): Promise<EnrichedBomProject | null> {
  try {
    const res = await fetch(`/api/bom/${encodeURIComponent(projId)}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity, referenceDesignator, userId }),
    });

    if (res.ok) {
      const json = await res.json();
      return json.success ? json.data : null;
    }
  } catch (error) {
    console.warn('API error adding BOM item:', error);
  }
  return null;
}

/**
 * Update item quantity or reference designator
 */
export async function updateBomItem(
  projId: string,
  itemId: string,
  quantity: number,
  referenceDesignator?: string,
  userId?: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/bom/${encodeURIComponent(projId)}/items/${encodeURIComponent(itemId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, referenceDesignator, userId }),
      }
    );
    return res.ok;
  } catch (error) {
    console.warn('API error modifying BOM item:', error);
    return false;
  }
}

/**
 * Remove component item from BOM project
 */
export async function deleteBomItem(
  projId: string,
  itemId: string,
  userId?: string
): Promise<boolean> {
  try {
    const url = userId
      ? `/api/bom/${encodeURIComponent(projId)}/items/${encodeURIComponent(itemId)}?userId=${encodeURIComponent(userId)}`
      : `/api/bom/${encodeURIComponent(projId)}/items/${encodeURIComponent(itemId)}`;

    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.ok;
  } catch (error) {
    console.warn('API error deleting BOM item:', error);
    return false;
  }
}
