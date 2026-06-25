import React from 'react';

interface Props {
  children: React.ReactNode;
  label?: string;
}
interface State {
  hasError: boolean;
}

// Stops a single component's render error from white-screening the whole app.
// Shows a friendly, retryable fallback and keeps the rest of the page usable.
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Surface in the console for diagnostics without crashing the UI.
    console.error('UI error caught by ErrorBoundary:', error);
  }

  handleRetry = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-emoji" aria-hidden="true">⚠️</div>
          <h2>Something went wrong{this.props.label ? ` loading ${this.props.label}` : ''}</h2>
          <p>This section hit a snag. The rest of the site still works.</p>
          <button type="button" onClick={this.handleRetry}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
