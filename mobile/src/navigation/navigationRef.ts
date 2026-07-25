import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    // Root stack is loosely typed; push deep links from OS notification taps.
    (navigationRef as any).navigate(name, params);
  }
}
