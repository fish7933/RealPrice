import { toast } from '@/hooks/use-toast';

export type ErrorType = 
  | 'network'
  | 'authentication'
  | 'permission'
  | 'validation'
  | 'database'
  | 'unknown';

export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  originalError?: unknown;
}

interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;

  private constructor() {
    this.setupGlobalHandlers();
  }

  public static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  private setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleError({
        type: 'unknown',
        message: '처리되지 않은 오류가 발생했습니다',
        details: event.reason?.message || String(event.reason),
        originalError: event.reason,
      });
      event.preventDefault();
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.handleError({
        type: 'unknown',
        message: '시스템 오류가 발생했습니다',
        details: event.error?.message || event.message,
        originalError: event.error,
      });
    });
  }

  public handleError(error: AppError) {
    const title = this.getErrorTitle(error.type);
    const description = this.formatErrorMessage(error);

    toast({
      title,
      description,
      variant: 'destructive',
      duration: 5000,
    });

    // Log to console for debugging
    console.error(`[${error.type}] ${error.message}`, {
      details: error.details,
      originalError: error.originalError,
    });
  }

  private getErrorTitle(type: ErrorType): string {
    const titles: Record<ErrorType, string> = {
      network: '네트워크 오류',
      authentication: '인증 오류',
      permission: '권한 오류',
      validation: '입력 오류',
      database: '데이터베이스 오류',
      unknown: '시스템 오류',
    };
    return titles[type];
  }

  private formatErrorMessage(error: AppError): string {
    let message = error.message;
    
    if (error.details) {
      message += `\n\n상세 정보: ${error.details}`;
    }

    return message;
  }

  // Helper methods for common error scenarios
  public handleNetworkError(originalError?: unknown) {
    this.handleError({
      type: 'network',
      message: '네트워크 연결에 문제가 발생했습니다. 인터넷 연결을 확인해주세요.',
      originalError,
    });
  }

  public handleAuthError(message?: string, originalError?: unknown) {
    this.handleError({
      type: 'authentication',
      message: message || '인증에 실패했습니다. 다시 로그인해주세요.',
      originalError,
    });
  }

  public handlePermissionError(message?: string, originalError?: unknown) {
    this.handleError({
      type: 'permission',
      message: message || '이 작업을 수행할 권한이 없습니다.',
      originalError,
    });
  }

  public handleValidationError(message: string, details?: string, originalError?: unknown) {
    this.handleError({
      type: 'validation',
      message,
      details,
      originalError,
    });
  }

  public handleDatabaseError(message?: string, originalError?: unknown) {
    this.handleError({
      type: 'database',
      message: message || '데이터베이스 작업 중 오류가 발생했습니다.',
      originalError,
    });
  }

  public handleSupabaseError(error: SupabaseError) {
    console.error('Supabase error:', error);

    // Parse Supabase error codes
    if (error.code === 'PGRST116') {
      this.handleDatabaseError('요청한 데이터를 찾을 수 없습니다.', error);
    } else if (error.code === '23505') {
      this.handleDatabaseError('중복된 데이터가 존재합니다.', error);
    } else if (error.code === '23503') {
      this.handleDatabaseError('참조 무결성 제약 조건 위반입니다.', error);
    } else if (error.message?.includes('JWT')) {
      this.handleAuthError('세션이 만료되었습니다. 다시 로그인해주세요.', error);
    } else if (error.message?.includes('permission')) {
      this.handlePermissionError(undefined, error);
    } else if (error.message?.includes('network')) {
      this.handleNetworkError(error);
    } else {
      this.handleDatabaseError(error.message || '데이터베이스 오류가 발생했습니다.', error);
    }
  }
}

// Export singleton instance
export const errorHandler = GlobalErrorHandler.getInstance();

// Export helper function for easy use
export function handleError(error: unknown, context?: string) {
  console.error(`Error in ${context || 'unknown context'}:`, error);

  if (error && typeof error === 'object') {
    // Supabase error
    if ('code' in error || ('message' in error && typeof error.message === 'string')) {
      errorHandler.handleSupabaseError(error as SupabaseError);
      return;
    }

    // Standard Error object
    if (error instanceof Error) {
      errorHandler.handleError({
        type: 'unknown',
        message: context ? `${context} 중 오류가 발생했습니다` : '오류가 발생했습니다',
        details: error.message,
        originalError: error,
      });
      return;
    }
  }

  // Unknown error type
  errorHandler.handleError({
    type: 'unknown',
    message: '알 수 없는 오류가 발생했습니다',
    details: String(error),
    originalError: error,
  });
}