import { useCallback } from "react";
import { useAppState } from "../state/appState.jsx";

export function useNavigation() {
  const { state, dispatch } = useAppState();
  const stack = state.ui.screenStack;
  const current = stack[stack.length - 1] ?? null;

  const navigate = useCallback((name, params = {}) => {
    dispatch({ type: "NAVIGATE", payload: { name, params } });
  }, [dispatch]);

  const goBack = useCallback(() => {
    dispatch({ type: "GO_BACK" });
  }, [dispatch]);

  const navigateToTab = useCallback((tab) => {
    dispatch({ type: "SET_ACTIVE_SCREEN", payload: tab });
  }, [dispatch]);

  return {
    navigate,
    goBack,
    navigateToTab,

    currentRoute: current?.name ?? null,
    params: current?.params ?? {},
    canGoBack: stack.length > 0,
  };
}
