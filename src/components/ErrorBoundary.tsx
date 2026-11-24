import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let friendly = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(error.message) as { error?: string; operationType?: string };
      if (parsed && typeof parsed.error === 'string') {
        friendly = parsed.error.includes('permission')
          ? 'Your session does not have permission to perform this action. Please sign in with the authorized admin account or reload the page.'
          : parsed.error;
      }
    } catch {
      // Plain error message
    }
    return { hasError: true, errorMessage: friendly };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary caught:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#EAEAEA] text-[#111111] flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-[28px] bg-white border border-black/[0.08] p-7 sm:p-8 shadow-xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-[#FFC966] text-[#111111] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold tracking-tight text-[#111111]">
                Something interrupted the workspace
              </h1>
              <p className="text-sm text-[#55555B] leading-relaxed">{this.state.errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-2xl bg-[#111111] hover:bg-[#2a2a2f] text-white text-sm font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Reload Portfolio</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
