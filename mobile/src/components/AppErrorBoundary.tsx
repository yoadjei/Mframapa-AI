import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * Last line of defence. Without it, a single thrown render crashes the app to a
 * blank or a native red box and the user has no way back. This shows a plain
 * recovery screen and hands the error to Sentry once the DSN is set.
 *
 * Dependency free on purpose: it cannot rely on theme, translations or store,
 * because any of those could be what failed.
 */
type Props = { children: React.ReactNode };
type State = { failed: boolean };

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('app crashed', error);
    // @ts-expect-error Sentry is attached at runtime when configured
    global.Sentry?.captureException?.(error);
  }

  private reset = () => this.setState({ failed: false });

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <View style={styles.root} accessibilityRole="alert">
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>
          The app hit an unexpected problem. Try again.
        </Text>
        <TouchableOpacity style={styles.button} onPress={this.reset} accessibilityRole="button">
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: '#0A0D12',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  body: { fontSize: 14, color: '#9AA7B5', textAlign: 'center', maxWidth: 320 },
  button: {
    minHeight: 44,
    paddingHorizontal: 24,
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#00C896',
  },
  buttonText: { fontSize: 15, fontWeight: '700', color: '#00110B' },
});
