"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// Exklusives Akkordeon fürs Schreib-Cockpit: Es ist immer höchstens EIN
// Kapitel geöffnet — vorher starteten alle ungeschriebenen Kapitel offen und
// die Seite wurde ein Endlos-Scroll (Benjamins Befund 25.08.). Der Provider
// hält die offene anchorId; ChapterCollapse und der Navigator docken per
// Context an. `followId` (das gerade generierende Kapitel) übernimmt die
// Öffnung automatisch, sobald es sich ändert — man sieht immer, wo gearbeitet
// wird.

type AccordionState = {
  openId: string | null;
  setOpenId: (id: string | null) => void;
};

const AccordionContext = createContext<AccordionState | null>(null);

export function useChapterAccordion(): AccordionState | null {
  return useContext(AccordionContext);
}

export function ChapterAccordion({
  initialOpenId,
  followId,
  children,
}: {
  initialOpenId: string | null;
  /** anchorId des gerade generierenden Kapitels — öffnet sich automatisch. */
  followId: string | null;
  children: ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(initialOpenId);
  const lastFollow = useRef<string | null>(followId);

  useEffect(() => {
    if (followId && followId !== lastFollow.current) {
       
      setOpenId(followId);
    }
    lastFollow.current = followId;
  }, [followId]);

  return (
    <AccordionContext.Provider value={{ openId, setOpenId }}>
      {children}
    </AccordionContext.Provider>
  );
}
