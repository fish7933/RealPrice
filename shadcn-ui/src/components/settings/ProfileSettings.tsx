import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Lock, Info, Shield, Crown, CheckCircle2, Sparkles } from 'lucide-react';

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
          gradient: 'from-purple-500 to-pink-500',
          bgGradient: 'from-purple-50 to-pink-50',
          borderColor: 'border-purple-200'
        };
      case 'admin':
        return {
          label: '관리자',
          icon: Shield,
          gradient: 'from-blue-500 to-cyan-500',
          bgGradient: 'from-blue-50 to-cyan-50',
          borderColor: 'border-blue-200'
        };
      default:
        return {
          label: '사용자',
          icon: User,
          gradient: 'from-gray-400 to-gray-500',
          bgGradient: 'from-gray-50 to-slate-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  return (
    <div className="space-y-6">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <User className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold">프로필 설정</h2>
          </div>
          <p className="text-white/90 text-lg">계정 정보 및 비밀번호를 관리하세요</p>
        </div>
      </div>

      {/* User Info Card with Gradient */}
      <Card className={`border-none shadow-lg bg-gradient-to-br ${roleInfo.bgGradient}`}>
        <CardHeader className="border-b bg-white/50 backdrop-blur-sm">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className={`p-2 bg-gradient-to-r ${roleInfo.gradient} rounded-lg`}>
              <User className="h-5 w-5 text-white" />
            </div>
            계정 정보
          </CardTitle>
          <CardDescription>현재 로그인된 계정의 정보입니다</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-500" />
                사용자명
              </Label>
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
                <p className="font-semibold text-gray-900">{user.username}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-500" />
                이름
              </Label>
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
                <p className="font-semibold text-gray-900">{user.name}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-500" />
                직책
              </Label>
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
                <p className="font-semibold text-gray-900">{user.position}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-500" />
                권한
              </Label>
              <div className={`p-4 bg-gradient-to-r ${roleInfo.gradient} rounded-lg shadow-lg`}>
                <div className="flex items-center gap-2 text-white">
                  <RoleIcon className="h-5 w-5" />
                  <p className="font-bold">{roleInfo.label}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Card with Gradient */}
      <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg">
              <Lock className="h-5 w-5 text-white" />
            </div>
            비밀번호 변경
          </CardTitle>
          <CardDescription>보안을 위해 주기적으로 비밀번호를 변경하세요</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <Alert className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <ul className="mt-2 space-y-2 text-sm text-blue-900">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  비밀번호는 최소 4자 이상이어야 합니다
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  현재 비밀번호를 정확히 입력해야 합니다
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
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
                className="h-12 border-2 focus:border-red-500"
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
                className="h-12 border-2 focus:border-red-500"
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
                className="h-12 border-2 focus:border-red-500"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="bg-gradient-to-r from-red-50 to-rose-50 border-red-200">
                <AlertDescription className="text-red-900 font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleChangePassword}
                disabled={isChanging}
                className="flex-1 h-12 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
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