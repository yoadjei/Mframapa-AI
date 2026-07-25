import { createContext, useContext } from "react";

/** True when the screen is rendered under the global stack back control. */
export const StackChromeContext = createContext(false);

export function useStackChrome() {
  return useContext(StackChromeContext);
}

/** Top padding that clears the fixed back button + notch. */
export function stackTopPad(inStack) {
  return inStack
    ? "calc(env(safe-area-inset-top) + 56px)"
    : "calc(env(safe-area-inset-top) + 12px)";
}

/** Left padding so a left-aligned title is not covered by the back control. */
export function stackTitlePad(inStack) {
  return inStack ? 56 : 0;
}
