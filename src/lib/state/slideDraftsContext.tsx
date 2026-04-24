"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { ReactNode } from "react";
import type { FenceMonthUpdatePayload, SlideDraftPayload } from "@/lib/api/types";

type SlideDraftMap = Record<string, SlideDraftPayload>;

type ServiceContextValue = {
  activeServiceId: string | null;
  slideDrafts: SlideDraftMap;
  fenceDrafts: FenceMonthUpdatePayload[];
  hasSlideDrafts: boolean;
  hasFenceDrafts: boolean;
  hasUnsavedChanges: boolean;
  slidesMenuOpenKeys: string[];
  setSlidesMenuOpenKeys: React.Dispatch<React.SetStateAction<string[]>>;
  lastServiceIdForSlidesMenuRef: MutableRefObject<string | undefined>;
  syncActiveService: (nextServiceId: string) => void;
  confirmServiceChange: (nextServiceId: string) => boolean;
  setSlideDraft: (slideId: string, fields: SlideDraftPayload) => void;
  removeSlideDraft: (slideId: string) => void;
  setFenceDrafts: (fields: FenceMonthUpdatePayload[]) => void;
  clearFenceDrafts: () => void;
  clearAllDrafts: () => void;
};

const ServiceContext = createContext<ServiceContextValue | null>(null);

type ServiceProviderProps = {
  children: ReactNode;
};

export function ServiceProvider({ children }: ServiceProviderProps) {
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [slideDrafts, setSlideDrafts] = useState<SlideDraftMap>({});
  const [fenceDrafts, setFenceDrafts] = useState<FenceMonthUpdatePayload[]>([]);
  const [slidesMenuOpenKeys, setSlidesMenuOpenKeys] = useState<string[]>([]);
  const lastServiceIdForSlidesMenuRef = useRef<string | undefined>(undefined);

  const hasSlideDrafts = useMemo(() => Object.keys(slideDrafts).length > 0, [slideDrafts]);
  const hasFenceDrafts = fenceDrafts.length > 0;
  const hasUnsavedChanges = hasSlideDrafts || hasFenceDrafts;

  const syncActiveService = useCallback((nextServiceId: string) => {
    setActiveServiceId(nextServiceId);
  }, []);

  const clearAllDrafts = useCallback(() => {
    setSlideDrafts({});
    setFenceDrafts([]);
  }, []);

  const confirmServiceChange = useCallback(
    (nextServiceId: string) => {
      if (activeServiceId && activeServiceId !== nextServiceId && hasUnsavedChanges) {
        const shouldLeave = window.confirm("Вы покидаете страницу, изменения будут отменены");
        if (!shouldLeave) {
          return false;
        }
        clearAllDrafts();
      }

      setActiveServiceId(nextServiceId);
      return true;
    },
    [activeServiceId, clearAllDrafts, hasUnsavedChanges],
  );

  const setSlideDraft = useCallback((slideId: string, fields: SlideDraftPayload) => {
    setSlideDrafts((previous) => ({
      ...previous,
      [slideId]: fields,
    }));
  }, []);

  const removeSlideDraft = useCallback((slideId: string) => {
    setSlideDrafts((previous) => {
      if (!previous[slideId]) {
        return previous;
      }

      const next = { ...previous };
      delete next[slideId];
      return next;
    });
  }, []);

  const clearFenceDrafts = useCallback(() => setFenceDrafts([]), []);

  const value = useMemo(
    () => ({
      activeServiceId,
      slideDrafts,
      fenceDrafts,
      hasSlideDrafts,
      hasFenceDrafts,
      hasUnsavedChanges,
      slidesMenuOpenKeys,
      setSlidesMenuOpenKeys,
      lastServiceIdForSlidesMenuRef,
      syncActiveService,
      confirmServiceChange,
      setSlideDraft,
      removeSlideDraft,
      setFenceDrafts,
      clearFenceDrafts,
      clearAllDrafts,
    }),
    [
      activeServiceId,
      confirmServiceChange,
      clearAllDrafts,
      fenceDrafts,
      hasFenceDrafts,
      hasSlideDrafts,
      hasUnsavedChanges,
      clearFenceDrafts,
      slideDrafts,
      setFenceDrafts,
      setSlideDraft,
      removeSlideDraft,
      syncActiveService,
      slidesMenuOpenKeys,
    ]
  );

  return <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>;
}

export function useServiceContext() {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error("useServiceContext must be used inside ServiceProvider");
  }

  return context;
}
