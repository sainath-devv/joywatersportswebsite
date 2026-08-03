import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends (Component as any) {
  state: State = { hasError: false };

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if ((this.state as State).hasError) {
      if ((this.props as Props).fallback) {
        return (this.props as Props).fallback;
      }

      return (
        <div className="min-h-[300px] w-full flex items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl my-4 text-center">
          <div className="max-w-md space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">Something went wrong</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                An unexpected error occurred while rendering this page. Please refresh or try again later.
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return (this.props as Props).children;
  }
}

export default ErrorBoundary;
