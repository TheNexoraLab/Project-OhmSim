"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import type { BomProject } from "@/types/product";
import { getInitialBomProjects } from "@/services/catalog-service";
import { toast } from "@/components/ui/toast";

interface BomContextValue {
  bomProjects: BomProject[];
  selectedBomId: string;
  setSelectedBomId: (id: string) => void;
  addBomProject: (name?: string) => string;
  addToBomProject: (projId: string, productId: string, qty?: number) => void;
  setBomQty: (projId: string, productId: string, qty: number) => void;
  removeBomLineItem: (projId: string, productId: string) => void;
  bomCount: number;
}

const BomContext = createContext<BomContextValue | null>(null);

export function BomProvider({ children }: { children: React.ReactNode }) {
  const [bomProjects, setBomProjects] = useState<BomProject[]>(() => getInitialBomProjects());
  const [selectedBomId, setSelectedBomId] = useState<string>(() => getInitialBomProjects()[0]?.id ?? "b1");

  const addBomProject = useCallback((name: string = "New BOM Project") => {
    const id = `b${Date.now()}`;
    const newProj: BomProject = { id, name, lineItems: [] };
    setBomProjects((prev) => [...prev, newProj]);
    setSelectedBomId(id);
    toast(`Created BOM project "${name}"`, "success");
    return id;
  }, []);

  const addToBomProject = useCallback((projId: string, productId: string, qty: number = 1) => {
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
          lineItems: [...proj.lineItems, { productId, qty }],
        };
      });
      if (targetName) {
        toast(`Added component to "${targetName}"`, "success");
      }
      return updated;
    });
  }, []);

  const setBomQty = useCallback((projId: string, productId: string, qty: number) => {
    setBomProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projId) return proj;
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
  }, []);

  const removeBomLineItem = useCallback((projId: string, productId: string) => {
    setBomProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projId) return proj;
        return {
          ...proj,
          lineItems: proj.lineItems.filter((li) => li.productId !== productId),
        };
      })
    );
  }, []);

  const bomCount = useMemo(() => {
    return bomProjects.reduce((total, p) => total + (p.lineItems ?? []).length, 0);
  }, [bomProjects]);

  const value = useMemo(
    () => ({
      bomProjects,
      selectedBomId,
      setSelectedBomId,
      addBomProject,
      addToBomProject,
      setBomQty,
      removeBomLineItem,
      bomCount,
    }),
    [bomProjects, selectedBomId, addBomProject, addToBomProject, setBomQty, removeBomLineItem, bomCount]
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
