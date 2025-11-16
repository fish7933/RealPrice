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
import { UserPlus, Pencil, Trash2, Shield, User as UserIcon, ArrowRightLeft } from 'lucide-react';
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
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Shield className="h-3 w-3" />
            최고관리자
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Shield className="h-3 w-3" />
            관리자
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">사용자 관리</h1>
          <p className="text-gray-600 mt-2">시스템 사용자 및 권한 관리</p>
        </div>

        {user?.role === 'superadmin' && (
          <Alert className="bg-purple-50 border-purple-200">
            <Shield className="h-4 w-4 text-purple-600" />
            <AlertTitle className="text-purple-900">최고관리자 권한</AlertTitle>
            <AlertDescription className="text-purple-800">
              시스템에는 항상 1명의 최고관리자만 존재합니다. 최고관리자 권한은 다른 관리자에게만 위임할 수 있습니다.
              {adminUsers.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-purple-300 text-purple-700 hover:bg-purple-100"
                  onClick={() => setIsTransferDialogOpen(true)}
                >
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  최고관리자 권한 위임
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><UserIcon className="h-5 w-5" />사용자 목록</CardTitle>
                <CardDescription>
                  {user?.role === 'superadmin' 
                    ? '최고관리자는 모든 관리자와 사용자를 생성, 수정, 삭제할 수 있습니다.'
                    : '관리자는 자신이 생성한 사용자를 관리할 수 있습니다.'}
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)} disabled={isLoading}>
                <UserPlus className="mr-2 h-4 w-4" />
                사용자 추가
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자명</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>직급</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>생성자</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const creator = users.find(creator => creator.id === u.createdBy);
                  return (
                    <TableRow key={u.id} className={u.role === 'superadmin' ? 'bg-purple-50' : ''}>
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
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {u.role === 'superadmin' && (
                            <span className="text-xs text-purple-600 px-2 py-1">
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
          </CardContent>
        </Card>

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
              <Alert className="bg-amber-50 border-amber-200">
                <Shield className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>주의:</strong> 권한 위임 후에는 되돌릴 수 없습니다.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label>현재 최고관리자</Label>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
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
                className="bg-purple-600 hover:bg-purple-700"
              >
                권한 위임
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>사용자 추가</DialogTitle>
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
              <Button onClick={handleAddUser} disabled={isLoading}>
                {isLoading ? '처리 중...' : '추가'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>사용자 수정</DialogTitle>
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
              <Button onClick={handleEditUser} disabled={isLoading}>
                {isLoading ? '처리 중...' : '수정'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>사용자 삭제</DialogTitle>
              <DialogDescription>
                정말로 사용자 "{selectedUser?.name} ({selectedUser?.username})"를 삭제하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>
                취소
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser} disabled={isLoading}>
                {isLoading ? '처리 중...' : '삭제'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}