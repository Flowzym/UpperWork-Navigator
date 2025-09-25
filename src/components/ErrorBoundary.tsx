import React, { Component, ErrorInfo, ReactNode } from 'react';
import EmptyState from './EmptyState';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('UI Error caught by boundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <EmptyState
            icon="⚠️"
            title="Fehler im UI aufgetreten"
            description="Ein unerwarteter Fehler ist aufgetreten. Dies ist ein Demo-System."
            tips={[
              'Seite neu laden und erneut versuchen',
              'Browser-Cache leeren',
              'Andere Browser-Tab verwenden',
              'Bei wiederholten Problemen: Entwickler kontaktieren'
            ]}
            action={{
              label: '🔄 Seite neu laden',
              onClick: this.handleReload
            }}
            type="error"
          />
        </div>
      );
    }

    return this.props.children;
  }
}