import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="max-w-lg rounded-lg border border-destructive/40 bg-card p-6 text-card-foreground shadow-sm">
            <h1 className="mb-2 text-lg font-semibold text-destructive">Something went wrong</h1>
            <p className="mb-4 text-sm text-muted-foreground">
              The app hit a runtime error after loading. Check the browser console for details.
            </p>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">{this.state.error.message}</pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
