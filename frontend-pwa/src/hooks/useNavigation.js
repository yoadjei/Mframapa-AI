import { useAppState } from "../state/appState.jsx";

export function useNavigation() {
  const { state, dispatch } = useAppState();
  const stack = state.ui.screenStack;
  const current = stack[stack.length - 1] ?? null;

  return {
    navigate(name, params = {}) {
      dispatch({ type: "NAVIGATE", payload: { name, params } });
    },
    goBack() {
      dispatch({ type: "GO_BACK" });
    },
    navigateToTab(tab) {
      dispatch({ type: "SET_ACTIVE_SCREEN", payload: tab });
    },
    currentRoute: current?.name ?? null,
    params: current?.params ?? {},
    canGoBack: stack.length > 0,
  };
}
