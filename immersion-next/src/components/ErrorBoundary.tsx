'use client';

import { Component, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  /** Content to render when there is no error. */
  children: ReactNode;
  /**
   * Optional custom fallback UI. Receives the caught error.
   * Defaults to a minimal dark-theme error card.
   */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Default fallback
// ---------------------------------------------------------------------------

function DefaultFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-800/50 bg-red-900/10 px-4 py-3 text-sm"
    >
      <p className="font-semibold text-red-400">Something went wrong</p>
      <p className="mt-1 text-red-300/70 text-xs font-mono break-all">{error.message}</p>
      <button
        onClick={reset}
        className="mt-3 px-3 py-1 bg-red-800/50 text-red-200 rounded text-xs hover:bg-red-800 transition"
      >
        Try again
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ErrorBoundary class
// ---------------------------------------------------------------------------

/**
 * React error boundary that catches rendering errors in its subtree and
 * displays a fallback UI instead of crashing the whole page.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeComponentThatMightThrow />
 *   </ErrorBoundary>
 *
 * Custom fallback:
 *   <ErrorBoundary fallback={(err, reset) => <MyFallback error={err} onRetry={reset} />}>
 *     ...
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Structured log — picked up by Vercel/Next.js log drain or any
    // console-based monitoring solution.
    console.error('[ErrorBoundary] caught rendering error', {
      message: error.message,
      stack: error.stack?.slice(0, 500),
      componentStack: info.componentStack?.slice(0, 500),
    });
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      return this.props.fallback
        ? this.props.fallback(error, this.reset)
        : <DefaultFallback error={error} reset={this.reset} />;
    }
    return this.props.children;
  }
}
