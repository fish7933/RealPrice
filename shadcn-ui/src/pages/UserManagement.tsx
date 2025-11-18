import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/freight';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Pencil, Trash2, Shield, User as UserIcon, ArrowRightLeft, Users as UsersIcon, Crown, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function UserManagement() {
  const { user, users, addUser, updateUser, deleteUser, transferSuperadmin, getSuperadmin } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedAdminForTransfer, setSelectedAdminForTransfer] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    position: '',
    role: 'viewer' as 'superadmin' | 'admin' | 'viewer',
  });

  const handleAddUser = async () => {
    if (!formData.username || !formData.password || !formData.name || !formData.position) {
      toast({
        title: '오류',
        description: '모든 필드를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    console.log('[UserManagement] Starting user creation...', { username: formData.username, role: formData.role });
    
    try {
      const success = await addUser(formData);
      
      if (success) {
        console.log('[UserManagement] User created successfully');
        toast({
          title: '성공',
          description: '사용자가 추가되었습니다.',
        });
        setIsAddDialogOpen(false);
        setFormData({ username: '', password: '', name: '', position: '', role: 'viewer' });
      } else {
        console.error('[UserManagement] User creation failed - addUser returned false');
        toast({
          title: '오류',
          description: '사용자 추가에 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[UserManagement] Exception during user creation:', error);
      toast({
        title: '오류',
        description: `사용자 추가 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    const updates: Partial<User> = {};
    if (formData.username && formData.username !== selectedUser.username) {
      updates.username = formData.username;
    }
    if (formData.password) {
      updates.password = formData.password;
    }
    if (formData.name && formData.name !== selectedUser.name) {
      updates.name = formData.name;
    }
    if (formData.position && formData.position !== selectedUser.position) {
      updates.position = formData.position;
    }
    if (formData.role !== selectedUser.role && selectedUser.role !== 'superadmin') {
      updates.role = formData.role;
    }

    setIsLoading(true);
    const success = await updateUser(selectedUser.id, updates);
    setIsLoading(false);
    
    if (success) {
      toast({
        title: '성공',
        description: '사용자 정보가 수정되었습니다.',
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      setFormData({ username: '', password: '', name: '', position: '', role: 'viewer' });
    } else {
      toast({
        title: '오류',
        description: '사용자 수정에 실패했습니다. 권한이 부족합니다.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsLoading(true);
    const success = await deleteUser(selectedUser.id);
    setIsLoading(false);
    
    if (success) {
      toast({
        title: '성공',
        description: '사용자가 삭제되었습니다.',
      });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } else {
      toast({
        title: '오류',
        description: '사용자 삭제에 실패했습니다. 본인은 삭제할 수 없거나 권한이 부족합니다.',
        variant: 'destructive',
      });
    }
  };

  const handleTransferSuperadmin = async () => {
    if (!selectedAdminForTransfer) {
      toast({
        title: '오류',
        description: '관리자를 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const success = await transferSuperadmin(selectedAdminForTransfer);
    setIsLoading(false);
    
    if (success) {
      toast({
        title: '성공',
        description: '최고관리자 권한이 위임되었습니다. 귀하는 이제 일반 관리자입니다.',
      });
      setIsTransferDialogOpen(false);
      setSelectedAdminForTransfer('');
    } else {
      toast({
        title: '오류',
        description: '최고관리자 권한 위임에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (u: User) => {
    setSelectedUser(u);
    setFormData({
      username: u.username,
      password: '',
      name: u.name,
      position: u.position,
      role: u.role,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (u: User) => {
    setSelectedUser(u);
    setIsDeleteDialogOpen(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
            <Crown className="h-3 w-3" />
            최고관리자
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
            <Shield className="h-3 w-3" />
            관리자
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg">
            <UserIcon className="h-3 w-3" />
            사용자
          </span>
        );
    }
  };

  const canEditUser = (targetUser: User) => {
    if (!user) return false;
    if (user.role === 'superadmin' && targetUser.role !== 'superadmin') return true;
    if (user.role === 'admin' && targetUser.createdBy === user.id) return true;
    return false;
  };

  const canDeleteUser = (targetUser: User) => {
    if (!user) return false;
    if (targetUser.id === user.id) return false;
    if (targetUser.role === 'superadmin') return false;
    if (user.role === 'superadmin' && targetUser.role !== 'superadmin') return true;
    if (user.role === 'admin' && targetUser.createdBy === user.id && targetUser.role === 'viewer') return true;
    return false;
  };

  const superadmin = getSuperadmin();
  const adminUsers = users.filter(u => u.role === 'admin');
  const superadminCount = users.filter(u => u.role === 'superadmin').length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const viewerCount = users.filter(u => u.role === 'viewer').length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Modern Header with Gradient */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-8 text-white shadow-lg">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <UsersIcon className="h-8 w-8" />
                  </div>
                  <h1 className="text-3xl font-bold">사용자 관리</h1>
                </div>
                <p className="text-white/90 text-lg">시스템 사용자 및 권한 관리</p>
              </div>
              <Button 
                onClick={() => setIsAddDialogOpen(true)} 
                disabled={isLoading}
                size="lg"
                className="bg-white text-purple-600 hover:bg-white/90 hover:scale-105 transition-all shadow-lg"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                사용자 추가
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">최고관리자</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">{superadminCount}</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Crown className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">관리자</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{adminCount}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">사용자</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{viewerCount}</p>
              </div>
              <div className="p-3 bg-gray-500/20 rounded-lg">
                <UserIcon className="h-8 w-8 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {user?.role === 'superadmin' && (
          <Alert className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <Crown className="h-4 w-4 text-purple-600" />
            <AlertTitle className="text-purple-900 font-semibold">최고관리자 권한</AlertTitle>
            <AlertDescription className="text-purple-800">
              시스템에는 항상 1명의 최고관리자만 존재합니다. 최고관리자 권한은 다른 관리자에게만 위임할 수 있습니다.
              {adminUsers.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-purple-300 text-purple-700 hover:bg-purple-100 hover:scale-105 transition-transform"
                  onClick={() => setIsTransferDialogOpen(true)}
                >
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  최고관리자 권한 위임
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <UsersIcon className="h-5 w-5 text-purple-600" />
                  사용자 목록
                </CardTitle>
                <CardDescription className="mt-1">
                  {user?.role === 'superadmin' 
                    ? '최고관리자는 모든 관리자와 사용자를 생성, 수정, 삭제할 수 있습니다.'
                    : '관리자는 자신이 생성한 사용자를 관리할 수 있습니다.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200">
                    <TableHead className="font-semibold">사용자명</TableHead>
                    <TableHead className="font-semibold">이름</TableHead>
                    <TableHead className="font-semibold">직급</TableHead>
                    <TableHead className="font-semibold">역할</TableHead>
                    <TableHead className="font-semibold">생성자</TableHead>
                    <TableHead className="font-semibold">생성일</TableHead>
                    <TableHead className="text-right font-semibold">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u, index) => {
                    const creator = users.find(creator => creator.id === u.createdBy);
                    return (
                      <TableRow 
                        key={u.id} 
                        className={`${
                          u.role === 'superadmin' 
                            ? 'bg-gradient-to-r from-purple-50 to-pink-50' 
                            : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        } hover:bg-gray-100 transition-colors`}
                      >
                        <TableCell className="font-medium">{u.username}</TableCell>
                        <TableCell>{u.name}</TableCell>
                        <TableCell>{u.position}</TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell>{creator ? creator.username : '-'}</TableCell>
                        <TableCell>{new Date(u.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {canEditUser(u) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(u)}
                                disabled={isLoading}
                                className="hover:bg-blue-50 hover:text-blue-600 hover:scale-105 transition-transform"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeleteUser(u) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteDialog(u)}
                                disabled={isLoading}
                                className="hover:bg-red-50 hover:text-red-600 hover:scale-105 transition-transform"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            {u.role === 'superadmin' && (
                              <span className="text-xs text-purple-600 px-2 py-1 bg-purple-50 rounded">
                                (위임 전용)
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Transfer Dialog */}
        <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-purple-600" />
                최고관리자 권한 위임
              </DialogTitle>
              <DialogDescription>
                최고관리자 권한을 다른 관리자에게 위임합니다. 위임 후 귀하는 일반 관리자가 됩니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Alert className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                <Shield className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>주의:</strong> 권한 위임 후에는 되돌릴 수 없습니다.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label>현재 최고관리자</Label>
                <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-md">
                  <div className="font-medium text-purple-900">{superadmin?.name} ({superadmin?.username})</div>
                  <div className="text-sm text-purple-700">{superadmin?.position}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfer-admin">새로운 최고관리자 선택</Label>
                {adminUsers.length > 0 ? (
                  <Select value={selectedAdminForTransfer} onValueChange={setSelectedAdminForTransfer}>
                    <SelectTrigger id="transfer-admin">
                      <SelectValue placeholder="관리자를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {adminUsers.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.name} ({admin.username}) - {admin.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Alert>
                    <AlertDescription>
                      권한을 위임할 관리자가 없습니다.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsTransferDialogOpen(false);
                setSelectedAdminForTransfer('');
              }} disabled={isLoading}>
                취소
              </Button>
              <Button 
                onClick={handleTransferSuperadmin}
                disabled={!selectedAdminForTransfer || isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                권한 위임
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-purple-600" />
                사용자 추가
              </DialogTitle>
              <DialogDescription>
                새로운 사용자를 추가합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="add-username">사용자명</Label>
                <Input
                  id="add-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="사용자명 입력"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-name">이름</Label>
                <Input
                  id="add-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="실명 입력"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-position">직급</Label>
                <Input
                  id="add-position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="직급 입력"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-password">비밀번호</Label>
                <Input
                  id="add-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="비밀번호 입력"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-role">역할</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'admin' | 'viewer') => setFormData({ ...formData, role: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="add-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {user?.role === 'superadmin' && (
                      <SelectItem value="admin">관리자</SelectItem>
                    )}
                    <SelectItem value="viewer">사용자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isLoading}>
                취소
              </Button>
              <Button 
                onClick={handleAddUser} 
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isLoading ? '처리 중...' : '추가'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-blue-600" />
                사용자 수정
              </DialogTitle>
              <DialogDescription>
                사용자 정보를 수정합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">이름</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-position">직급</Label>
                <Input
                  id="edit-position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">새 비밀번호 (선택사항)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="변경하지 않으려면 비워두세요"
                  disabled={isLoading}
                />
              </div>
              {user?.role === 'superadmin' && selectedUser?.role !== 'superadmin' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-role">역할</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: 'admin' | 'viewer') => setFormData({ ...formData, role: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="edit-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">관리자</SelectItem>
                      <SelectItem value="viewer">사용자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isLoading}>
                취소
              </Button>
              <Button 
                onClick={handleEditUser} 
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {isLoading ? '처리 중...' : '수정'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                사용자 삭제
              </DialogTitle>
              <DialogDescription>
                정말로 사용자 "{selectedUser?.name} ({selectedUser?.username})"를 삭제하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>
                취소
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteUser} 
                disabled={isLoading}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                {isLoading ? '처리 중...' : '삭제'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}