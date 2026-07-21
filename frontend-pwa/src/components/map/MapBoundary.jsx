import { Component } from "react";

/**
 * The map is a large lazy chunk running WebGL. When it fails — a dropped chunk
 * on a poor connection, no WebGL, a Mapbox error — React unmounts the subtree
 * and the caller is left showing an empty box with no explanation. That is what
 * a user reported as "the heatmap is blank". This turns any such failure into a
 * message with a retry.
 */
export class MapBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // surfaced in the console and in sentry once the dsn is set
    console.error("map failed to render", error);
  }

  retry = () => {
    this.setState({ failed: false });
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return this.props.fallback(this.retry);
  }
}
