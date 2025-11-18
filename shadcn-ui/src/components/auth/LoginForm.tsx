import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Ship, Lock, User, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('사용자명과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(username, password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        // Display specific error messages based on error type
        switch (result.error) {
          case 'user_not_found':
            setError('존재하지 않는 사용자명입니다.');
            break;
          case 'invalid_password':
            setError('비밀번호가 올바르지 않습니다.');
            break;
          default:
            setError('로그인에 실패했습니다. 다시 시도해주세요.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <Card className="w-full max-w-md relative z-10 border-none shadow-2xl bg-white/80 backdrop-blur-md">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-75 animate-pulse"></div>
              <div className="relative p-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl">
                <Ship className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            운임 관리 시스템
          </CardTitle>
          <CardDescription className="text-base text-gray-600 font-medium">
            중앙아시아 컨테이너 운임 계산
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                사용자명
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="사용자명을 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={isLoading}
                className="h-12 border-2 focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4 text-purple-600" />
                비밀번호
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isLoading}
                className="h-12 border-2 focus:border-purple-500 transition-colors"
              />
            </div>
            {error && (
              <Alert variant="destructive" className="bg-gradient-to-r from-red-50 to-rose-50 border-red-200">
                <AlertDescription className="text-red-900 font-medium">{error}</AlertDescription>
              </Alert>
            )}
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all" 
              disabled={isLoading}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          {/* Version and Update Information */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <span className="text-gray-700 font-semibold">프로그램 버전:</span>
                <span className="text-blue-600 font-bold text-base">v2.5.0</span>
              </div>
              <div className="space-y-2">
                <div className="text-gray-700 font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  최근 업데이트:
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start p-2 hover:bg-blue-50 rounded transition-colors">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                    <span>사용자 프로필 설정 및 비밀번호 변경 기능 추가</span>
                  </li>
                  <li className="flex items-start p-2 hover:bg-purple-50 rounded transition-colors">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-purple-600 flex-shrink-0" />
                    <span>감사 로그 페이지네이션 및 타임머신 기능 개선</span>
                  </li>
                  <li className="flex items-start p-2 hover:bg-pink-50 rounded transition-colors">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-pink-600 flex-shrink-0" />
                    <span>비용 계산기 로컬 차지 입력 기능 강화</span>
                  </li>
                  <li className="flex items-start p-2 hover:bg-cyan-50 rounded transition-colors">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-cyan-600 flex-shrink-0" />
                    <span>해상 운임 테이블 검색 필터 및 페이지네이션 추가</span>
                  </li>
                  <li className="flex items-start p-2 hover:bg-indigo-50 rounded transition-colors">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-indigo-600 flex-shrink-0" />
                    <span>슈퍼관리자 권한 관리 개선</span>
                  </li>
                </ul>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <span className="text-gray-700 font-semibold">업데이트 날짜:</span>
                <span className="text-purple-600 font-bold">2025-01-15</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}