import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Lock, Info } from 'lucide-react';

export default function ProfileSettings() {
  const { user, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const handleChangePassword = async () => {
    setError('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (newPassword.length < 4) {
      setError('새 비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
      return;
    }

    setIsChanging(true);

    try {
      const success = await changePassword(currentPassword, newPassword);
      
      if (success) {
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('Password change error:', error);
    } finally {
      setIsChanging(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">프로필 설정</h2>
        <p className="text-gray-600">계정 정보 및 비밀번호를 관리하세요.</p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            계정 정보
          </CardTitle>
          <CardDescription>현재 로그인된 계정의 정보입니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">사용자명</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                {user.username}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">이름</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                {user.name}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">직책</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                {user.position}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">권한</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                {user.role === 'superadmin' && '슈퍼관리자'}
                {user.role === 'admin' && '관리자'}
                {user.role === 'viewer' && '조회자'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            비밀번호 변경
          </CardTitle>
          <CardDescription>보안을 위해 주기적으로 비밀번호를 변경하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• 비밀번호는 최소 4자 이상이어야 합니다</li>
                <li>• 현재 비밀번호를 정확히 입력해야 합니다</li>
                <li>• 새 비밀번호는 현재 비밀번호와 달라야 합니다</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">현재 비밀번호 *</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="현재 비밀번호를 입력하세요"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isChanging}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">새 비밀번호 *</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="새 비밀번호를 입력하세요 (최소 4자)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isChanging}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">새 비밀번호 확인 *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="새 비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isChanging}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleChangePassword}
                disabled={isChanging}
                className="flex-1"
              >
                <Lock className="h-4 w-4 mr-2" />
                {isChanging ? '변경 중...' : '비밀번호 변경'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError('');
                }}
                disabled={isChanging}
              >
                초기화
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}