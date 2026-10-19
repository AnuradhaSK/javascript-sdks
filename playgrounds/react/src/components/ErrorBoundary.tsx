// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Component, ErrorInfo, ReactNode} from 'react';
import {logEvent} from '../lib/events';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Keeps a throwing story from taking down the whole explorer.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {error: null};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {error};
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    logEvent('story:error', `${error.message} ${info.componentStack?.split('\n')[1]?.trim() ?? ''}`, 'error');
  }

  override render(): ReactNode {
    const {error} = this.state;
    const {children} = this.props;

    if (error) {
      return (
        <div className="pg-warning" role="alert">
          This story threw: {error.message}
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
