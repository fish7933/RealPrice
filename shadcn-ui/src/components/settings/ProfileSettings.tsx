import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Lock, Info, Shield, Crown, CheckCircle2, UserCog } from 'lucide-react';

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

  const getRoleInfo = () => {
    switch (user.role) {
      case 'superadmin':
        return {
          label: '슈퍼관리자',
          icon: Crown,
          bgColor: 'bg-gray-800',
          borderColor: 'border-gray-700'
        };
      case 'admin':
        return {
          label: '관리자',
          icon: Shield,
          bgColor: 'bg-gray-600',
          borderColor: 'border-gray-500'
        };
      default:
        return {
          label: '사용자',
          icon: User,
          bgColor: 'bg-gray-400',
          borderColor: 'border-gray-300'
        };
    }
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  return (
    <div className="space-y-6">
      {/* Gray Header */}
      <div className="relative overflow-hidden rounded-xl bg-gray-800 p-4 shadow-xl">
        <div className="absolute inset-0 bg-grid-white/5"></div>
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/10 backdrop-blur-sm rounded-lg">
              <UserCog className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              프로필 설정
            </h1>
          </div>
          <p className="text-gray-300 text-sm ml-9">계정 정보 및 비밀번호를 관리하세요</p>
        </div>
      </div>

      {/* User Info Card */}
      <Card className="border-none shadow-lg bg-gray-50">
        <CardHeader className="border-b bg-white/50 backdrop-blur-sm">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className={`p-2 ${roleInfo.bgColor} rounded-lg`}>
              <User className="h-5 w-5 text-white" />
            </div>
            계정 정보
          </CardTitle>
          <CardDescription>현재 로그인된 계정의 정보입니다</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                사용자명
              </Label>
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
                <p className="font-semibold text-gray-900">{user.username}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                이름
              </Label>
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
                <p className="font-semibold text-gray-900">{user.name}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                직책
              </Label>
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
                <p className="font-semibold text-gray-900">{user.position}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                권한
              </Label>
              <div className={`p-4 ${roleInfo.bgColor} rounded-lg shadow-lg`}>
                <div className="flex items-center gap-2 text-white">
                  <RoleIcon className="h-5 w-5" />
                  <p className="font-bold">{roleInfo.label}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-gray-700 rounded-lg">
              <Lock className="h-5 w-5 text-white" />
            </div>
            비밀번호 변경
          </CardTitle>
          <CardDescription>보안을 위해 주기적으로 비밀번호를 변경하세요</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <Alert className="bg-gray-50 border-gray-300">
            <Info className="h-4 w-4 text-gray-700" />
            <AlertDescription>
              <ul className="mt-2 space-y-2 text-sm text-gray-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gray-700" />
                  비밀번호는 최소 4자 이상이어야 합니다
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gray-700" />
                  현재 비밀번호를 정확히 입력해야 합니다
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gray-700" />
                  새 비밀번호는 현재 비밀번호와 달라야 합니다
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-semibold">현재 비밀번호 *</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="현재 비밀번호를 입력하세요"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isChanging}
                className="h-12 border-2 focus:border-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-semibold">새 비밀번호 *</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="새 비밀번호를 입력하세요 (최소 4자)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isChanging}
                className="h-12 border-2 focus:border-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold">새 비밀번호 확인 *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="새 비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isChanging}
                className="h-12 border-2 focus:border-gray-500"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-300">
                <AlertDescription className="text-red-900 font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleChangePassword}
                disabled={isChanging}
                className="flex-1 h-12 bg-gray-800 hover:bg-gray-900 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                <Lock className="h-5 w-5 mr-2" />
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
                className="h-12 border-2 hover:bg-gray-50 hover:scale-105 transition-all"
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