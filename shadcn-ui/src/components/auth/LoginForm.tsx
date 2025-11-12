import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (!success) {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">물류 운송 관리 시스템</CardTitle>
          <CardDescription className="text-center">
            계정 정보를 입력하여 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <Input
                id="username"
                type="text"
                placeholder="아이디를 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </Button>
          </form>

          {/* Version and Update Information */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">프로그램 버전:</span>
                <span className="text-gray-900 font-semibold">v2.5.0</span>
              </div>
              <div className="space-y-2">
                <div className="text-gray-600 font-medium">최근 업데이트:</div>
                <ul className="space-y-1.5 text-gray-700 pl-4">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>사용자 프로필 설정 및 비밀번호 변경 기능 추가</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>감사 로그 페이지네이션 및 타임머신 기능 개선</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>비용 계산기 로컬 차지 입력 기능 강화</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>해상 운임 테이블 검색 필터 및 페이지네이션 추가</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>슈퍼관리자 권한 관리 개선</span>
                  </li>
                </ul>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-600 font-medium">업데이트 날짜:</span>
                <span className="text-gray-900">2025-01-15</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}