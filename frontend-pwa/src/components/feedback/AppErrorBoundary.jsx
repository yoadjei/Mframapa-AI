import { Component } from "react";

/**
 * Last line of defence. Without this, a single thrown render anywhere unmounts
 * the whole tree and the user is left staring at a blank page with no way back
 * and nothing reported. This shows a way out and hands the error to Sentry.
 *
 * Deliberately dependency free: it cannot rely on translations, theme or state,
 * because any of those could be what failed.
 */
export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("app crashed", error, info);
    window.Sentry?.captureException?.(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          textAlign: "center",
          backgroundColor: "#0A0D12",
          color: "#FFFFFF",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <p style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
          Something went wrong
        </p>
        <p style={{ fontSize: 14, color: "#9AA7B5", margin: 0, maxWidth: 320 }}>
          The app hit an unexpected problem. Reloading usually clears it.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            minHeight: 44,
            padding: "12px 24px",
            borderRadius: 999,
            border: "none",
            backgroundColor: "#00C896",
            color: "#00110B",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
