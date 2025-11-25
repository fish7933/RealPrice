import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-2xl w-full space-y-4">
            <Alert variant="destructive" className="border-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="text-lg font-bold">
                시스템 오류가 발생했습니다
              </AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-4">
                  예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 홈으로 돌아가주세요.
                </p>
                {this.state.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                    <p className="font-semibold text-sm mb-1">에러 메시지:</p>
                    <p className="text-sm font-mono break-all">
                      {this.state.error.toString()}
                    </p>
                  </div>
                )}
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="bg-gray-100 border border-gray-300 rounded p-3 mb-4">
                    <summary className="cursor-pointer font-semibold text-sm mb-2">
                      개발자 정보 (클릭하여 펼치기)
                    </summary>
                    <pre className="text-xs overflow-auto whitespace-pre-wrap break-all">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
                <div className="flex gap-2 mt-4">
                  <Button onClick={this.handleReload} variant="destructive">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    페이지 새로고침
                  </Button>
                  <Button onClick={this.handleGoHome} variant="outline">
                    <Home className="h-4 w-4 mr-2" />
                    홈으로 이동
                  </Button>
                  <Button onClick={this.handleReset} variant="secondary">
                    계속 진행
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;