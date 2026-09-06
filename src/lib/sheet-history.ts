"use client";

import { useCallback, useEffect, useRef } from "react";

type SheetCloser = () => void;

const stack: SheetCloser[] = [];

function onPopState() {
  // History is LIFO, so the top of the stack is always the visible sheet.
  const top = stack.pop();
  top?.();
}

function ensureListener() {
  if (typeof window === "undefined") return;
  const flag = "__ywnSheetHistoryInstalled";
  if ((window as unknown as Record<string, unknown>)[flag]) return;
  (window as unknown as Record<string, unknown>)[flag] = true;
  window.addEventListener("popstate", onPopState);
}

function removeCloser(closer: SheetCloser) {
  const index = stack.indexOf(closer);
  if (index >= 0) stack.splice(index, 1);
}

/**
 * Makes the mobile system back button (and installed-PWA back) close an
 * open sheet instead of leaving the page. Opening pushes one history entry;
 * a back press pops it and closes the topmost sheet. Closing manually
 * (X, scrim, Escape, action) rewinds the entry when this sheet is on top.
 *
 * Returns a dismiss function that components must use for every manual
 * close path. Safe with stacked sheets: only the top entry rewinds.
 */
export function useSystemBack(open: boolean, onClose: () => void): () => void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const dismissedRef = useRef(false);
  const stableClose = useCallback(() => {
    onCloseRef.current();
  }, []);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    dismissedRef.current = false;
    ensureListener();
    window.history.pushState({ ywnSheet: true }, "");
    stack.push(stableClose);
    return () => {
      removeCloser(stableClose);
    };
  }, [open, stableClose]);

  return useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    if (typeof window === "undefined") {
      stableClose();
      return;
    }
    if (stack[stack.length - 1] === stableClose) {
      // Ours is the top entry: going back fires popstate, which pops the
      // stack and runs this same close. No direct call needed.
      window.history.back();
      return;
    }
    removeCloser(stableClose);
    stableClose();
  }, [stableClose]);
}
