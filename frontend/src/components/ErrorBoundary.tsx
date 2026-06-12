import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="alert-error m-6 max-w-lg">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-red-800">Something went wrong</h2>
            <p className="text-sm text-red-700/90">
              Reload the page. If the problem continues, restart the frontend dev server.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-secondary text-xs"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
