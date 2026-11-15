"use client";

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";
import type { BomProject } from "@/types/product";
import {
  getInitialBomProjectsSync,
  getBomProjects,
  createBomProject,
  addBomItem,
  updateBomItem,
  deleteBomItem,
  deleteBomProject,
} from "@/services/bom-service";
import { toast } from "@/components/ui/toast";

interface BomContextValue {
  bomProjects: BomProject[];
  selectedBomId: string;
  setSelectedBomId: (id: string) => void;
  addBomProject: (name?: string, description?: string, targetBudget?: number) => string;
  addToBomProject: (projId: string, productId: string, qty?: number, referenceDesignator?: string) => void;
  setBomQty: (projId: string, productId: string, qty: number) => void;
  removeBomLineItem: (projId: string, productId: string) => void;
  deleteProject: (projId: string) => Promise<boolean>;
  syncFromApi: () => Promise<void>;
  bomCount: number;
}

const BomContext = createContext<BomContextValue | null>(null);

export function BomProvider({ children }: { children: React.ReactNode }) {
  const [bomProjects, setBomProjects] = useState<BomProject[]>(() => getInitialBomProjectsSync());
  const [selectedBomId, setSelectedBomId] = useState<string>(() => getInitialBomProjectsSync()[0]?.id ?? "b1");

  // Hydrate from live Neon PostgreSQL backend on mount
  const syncFromApi = useCallback(async () => {
    try {
      const live = await getBomProjects();
      if (live && live.length > 0) {
        setBomProjects(live);
        setSelectedBomId((current) => {
          if (live.some((p) => p.id === current)) return current;
          return live[0].id;
        });
      }
    } catch (e) {
      console.warn("Could not sync BOM from API:", e);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    getBomProjects().then((live) => {
      if (!ignore && live && live.length > 0) {
        setBomProjects(live);
        setSelectedBomId((current) => {
          if (live.some((p) => p.id === current)) return current;
          return live[0].id;
        });
      }
    }).catch((e) => {
      console.warn("Could not sync BOM from API:", e);
    });

    return () => {
      ignore = true;
    };
  }, []);

  const addBomProjectHandler = useCallback(
    (name: string = "New BOM Project", description?: string, targetBudget?: number) => {
      const tempId = `b${Date.now()}`;
      const newProj: BomProject = {
        id: tempId,
        name,
        description: description || null,
        targetBudget: targetBudget || null,
        lineItems: [],
      };

      setBomProjects((prev) => [...prev, newProj]);
      setSelectedBomId(tempId);
      toast(`Created BOM project "${name}"`, "success");

      // Persist to backend API asynchronously
      createBomProject(name, description, targetBudget).then((created) => {
        if (created && created.id && created.id !== tempId) {
          setBomProjects((prev) =>
            prev.map((p) => (p.id === tempId ? { ...p, id: created.id } : p))
          );
          setSelectedBomId((current) => (current === tempId ? created.id : current));
        }
      });

      return tempId;
    },
    []
  );

  const addToBomProjectHandler = useCallback(
    (projId: string, productId: string, qty: number = 1, referenceDesignator?: string) => {
      setBomProjects((prev) => {
        let targetName = "";
        const updated = prev.map((proj) => {
          if (proj.id !== projId) return proj;
          targetName = proj.name;
          const existing = proj.lineItems.find((li) => li.productId === productId);
          if (existing) {
            return {
              ...proj,
              lineItems: proj.lineItems.map((li) =>
                li.productId === productId ? { ...li, qty: li.qty + qty } : li
              ),
            };
          }
          return {
            ...proj,
            lineItems: [...proj.lineItems, { productId, qty, referenceDesignator: referenceDesignator || null }],
          };
        });
        if (targetName) {
          toast(`Added component to "${targetName}"`, "success");
        }
        return updated;
      });

      // Persist to backend API asynchronously
      addBomItem(projId, productId, qty, referenceDesignator).then((refreshed) => {
        if (refreshed) {
          setBomProjects((prev) =>
            prev.map((p) => (p.id === projId ? refreshed : p))
          );
        }
      });
    },
    []
  );

  const setBomQtyHandler = useCallback((projId: string, productId: string, qty: number) => {
    let targetItem: { id?: string } | undefined;

    setBomProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projId) return proj;
        targetItem = proj.lineItems.find((li) => li.productId === productId);
        if (qty <= 0) {
          return {
            ...proj,
            lineItems: proj.lineItems.filter((li) => li.productId !== productId),
          };
        }
        return {
          ...proj,
          lineItems: proj.lineItems.map((li) =>
            li.productId === productId ? { ...li, qty } : li
          ),
        };
      })
    );

    // Persist to backend API asynchronously
    if (targetItem?.id) {
      if (qty <= 0) {
        deleteBomItem(projId, targetItem.id);
      } else {
        updateBomItem(projId, targetItem.id, qty);
      }
    }
  }, []);

  const removeBomLineItemHandler = useCallback((projId: string, productId: string) => {
    let targetItem: { id?: string } | undefined;

    setBomProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projId) return proj;
        targetItem = proj.lineItems.find((li) => li.productId === productId);
        return {
          ...proj,
          lineItems: proj.lineItems.filter((li) => li.productId !== productId),
        };
      })
    );

    if (targetItem?.id) {
      deleteBomItem(projId, targetItem.id);
    }
  }, []);

  const deleteProjectHandler = useCallback(async (projId: string) => {
    setBomProjects((prev) => prev.filter((p) => p.id !== projId));
    setSelectedBomId((current) => {
      if (current === projId) {
        const remaining = bomProjects.filter((p) => p.id !== projId);
        return remaining[0]?.id ?? "";
      }
      return current;
    });
    toast("BOM project deleted", "info");

    return deleteBomProject(projId);
  }, [bomProjects]);

  const bomCount = useMemo(() => {
    return bomProjects.reduce((total, p) => total + (p.lineItems ?? []).length, 0);
  }, [bomProjects]);

  const value = useMemo(
    () => ({
      bomProjects,
      selectedBomId,
      setSelectedBomId,
      addBomProject: addBomProjectHandler,
      addToBomProject: addToBomProjectHandler,
      setBomQty: setBomQtyHandler,
      removeBomLineItem: removeBomLineItemHandler,
      deleteProject: deleteProjectHandler,
      syncFromApi,
      bomCount,
    }),
    [
      bomProjects,
      selectedBomId,
      addBomProjectHandler,
      addToBomProjectHandler,
      setBomQtyHandler,
      removeBomLineItemHandler,
      deleteProjectHandler,
      syncFromApi,
      bomCount,
    ]
  );

  return <BomContext.Provider value={value}>{children}</BomContext.Provider>;
}

export function useBom() {
  const context = useContext(BomContext);
  if (!context) {
    throw new Error("useBom must be used within a BomProvider");
  }
  return context;
}
