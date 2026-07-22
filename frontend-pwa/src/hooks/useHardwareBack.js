import { useEffect, useRef } from "react";

/**
 * Ties the in-app screen stack to browser history.
 *
 * Without this the app had two separate ideas of "back": an in-app arrow that
 * popped the stack, and the phone's own back button, which the app never heard
 * about. Pressing hardware back therefore left the app or reloaded it to the
 * start instead of returning to the previous screen. On Android that is the
 * button people actually use, so navigation felt broken.
 *
 * Now each pushed screen adds one history entry, and hardware or gesture back
 * fires `popstate`, which pops the stack instead. The in-app arrow calls
 * `history.back()` too, so both routes go through the same path and cannot
 * disagree.
 */
export function useHardwareBack(stackLength, dispatch) {
  const prevLen = useRef(stackLength);

  // one history entry per screen on the stack
  useEffect(() => {
    if (stackLength > prevLen.current) {
      for (let i = prevLen.current; i < stackLength; i += 1) {
        window.history.pushState({ mfDepth: i + 1 }, "");
      }
    }
    prevLen.current = stackLength;
  }, [stackLength]);

  useEffect(() => {
    function onPop() {
      // only intercept while there is somewhere in-app to go back to; otherwise
      // let the browser do what it normally would.
      if (prevLen.current > 0) {
        dispatch({ type: "GO_BACK" });
      }
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [dispatch]);
}
