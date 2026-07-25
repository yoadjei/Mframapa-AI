import { createContext, useContext } from "react";

/** True when the screen is rendered under the global stack back control. */
export const StackChromeContext = createContext(false);

export function useStackChrome() {
  return useContext(StackChromeContext);
}

/**
 * Top padding for stack body content.
 * When inStack, App.jsx owns a flex header (safe-area + back) above a scroll
 * region — screens only need a small content inset, not another safe-area.
 */
export function stackTopPad(inStack) {
  return inStack ? "12px" : "calc(env(safe-area-inset-top) + 12px)";
}

/**
 * Left padding for left-aligned titles.
 * With the flex header chrome, the back control is no longer overlaid on the
 * title — keep 0 in stack so layout stays flexible.
 */
export function stackTitlePad(inStack) {
  return 0;
}
