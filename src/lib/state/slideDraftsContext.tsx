"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { ReactNode } from "react";
import type { SlideDraftPayload } from "@/lib/api/types";

type DraftMap = Record<string, SlideDraftPayload>;

type SlideDraftsContextValue = {
  activeServiceId: string | null;
  drafts: DraftMap;
  hasDrafts: boolean;
  slidesMenuOpenKeys: string[];
  setSlidesMenuOpenKeys: React.Dispatch<React.SetStateAction<string[]>>;
  lastServiceIdForSlidesMenuRef: MutableRefObject<string | undefined>;
  syncActiveService: (nextServiceId: string) => void;
  confirmServiceChange: (nextServiceId: string) => boolean;
  setDraft: (slideId: string, fields: SlideDraftPayload) => void;
  removeDraft: (slideId: string) => void;
  clearDrafts: () => void;
};

const SlideDraftsContext = createContext<SlideDraftsContextValue | null>(null);

type SlideDraftsProviderProps = {
  children: ReactNode;
};

export function SlideDraftsProvider({ children }: SlideDraftsProviderProps) {
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [slidesMenuOpenKeys, setSlidesMenuOpenKeys] = useState<string[]>([]);
  const lastServiceIdForSlidesMenuRef = useRef<string | undefined>(undefined);

  const hasDrafts = useMemo(() => Object.keys(drafts).length > 0, [drafts]);

  const syncActiveService = useCallback((nextServiceId: string) => {
    setActiveServiceId(nextServiceId);
  }, []);

  const confirmServiceChange = useCallback(
    (nextServiceId: string) => {
      if (activeServiceId && activeServiceId !== nextServiceId && hasDrafts) {
        const shouldLeave = window.confirm("Вы покидаете страницу, изменения будут отменены");
        if (!shouldLeave) {
          return false;
        }
        setDrafts({});
      }

      setActiveServiceId(nextServiceId);
      return true;
    },
    [activeServiceId, hasDrafts]
  );

  const setDraft = useCallback((slideId: string, fields: SlideDraftPayload) => {
    setDrafts((previous) => ({
      ...previous,
      [slideId]: fields,
    }));
  }, []);

  const removeDraft = useCallback((slideId: string) => {
    setDrafts((previous) => {
      if (!previous[slideId]) {
        return previous;
      }

      const next = { ...previous };
      delete next[slideId];
      return next;
    });
  }, []);

  const clearDrafts = useCallback(() => setDrafts({}), []);

  const value = useMemo(
    () => ({
      activeServiceId,
      drafts,
      hasDrafts,
      slidesMenuOpenKeys,
      setSlidesMenuOpenKeys,
      lastServiceIdForSlidesMenuRef,
      syncActiveService,
      confirmServiceChange,
      setDraft,
      removeDraft,
      clearDrafts,
    }),
    [
      activeServiceId,
      clearDrafts,
      confirmServiceChange,
      drafts,
      hasDrafts,
      slidesMenuOpenKeys,
      removeDraft,
      setDraft,
      syncActiveService,
    ]
  );

  return <SlideDraftsContext.Provider value={value}>{children}</SlideDraftsContext.Provider>;
}

export function useSlideDrafts() {
  const context = useContext(SlideDraftsContext);
  if (!context) {
    throw new Error("useSlideDrafts must be used inside SlideDraftsProvider");
  }

  return context;
}
