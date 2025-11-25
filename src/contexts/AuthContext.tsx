import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState } from '@/types/freight';
import { supabase, TABLES, hashPassword, saveSession, getSession, clearSession } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export type LoginError = 'user_not_found' | 'invalid_password' | 'unknown_error';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; error?: LoginError }>;
  logout: () => Promise<void>;
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateUser: (id: string, updates: Partial<User>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  transferSuperadmin: (targetAdminId: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  canManageUsers: () => boolean;
  canDeleteCalculation: (calculationCreatorId: string) => boolean;
  getSuperadmin: () => User | undefined;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadUserData = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[Auth] Failed to load user data:', error);
        clearSession();
        setAuthState({
          user: null,
          isAuthenticated: false,
        });
        return;
      }

      if (data) {
        const user: User = {
          id: data.id,
          username: data.username,
          name: data.name,
          position: data.position,
          role: data.role,
          createdBy: data.created_by,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        setAuthState({
          user,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error('[Auth] Exception loading user data:', error);
      clearSession();
      setAuthState({
        user: null,
        isAuthenticated: false,
      });
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('id, username, name, position, role, created_by, created_at, updated_at')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const mappedUsers: User[] = data.map(u => ({
          id: u.id,
          username: u.username,
          name: u.name,
          position: u.position,
          role: u.role,
          createdBy: u.created_by,
          createdAt: u.created_at,
          updatedAt: u.updated_at,
        }));

        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error('[Auth] Failed to load users:', error);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('[Auth] Initializing auth...');
        setLoading(true);
        
        const session = getSession();
        
        if (session) {
          await loadUserData(session.userId);
        }

        await loadUsers();

        console.log('[Auth] Auth initialization completed');
        setLoading(false);
      } catch (error) {
        console.error('[Auth] Failed to initialize auth:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, [loadUserData, loadUsers]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: LoginError }> => {
    try {
      console.log('[login] Starting login process for username:', username);
      
      // Get user from database
      const { data: userData, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (userError) {
        console.error('[login] Database error:', userError);
        return { success: false, error: 'unknown_error' };
      }

      if (!userData) {
        console.error('[login] User not found in database');
        return { success: false, error: 'user_not_found' };
      }

      console.log('[login] User found, verifying password...');

      // Hash the provided password and compare
      const passwordHash = await hashPassword(password);
      
      if (passwordHash !== userData.password_hash) {
        console.error('[login] Invalid password');
        return { success: false, error: 'invalid_password' };
      }

      console.log('[login] Password verified, creating session...');

      // Create session (expires in 24 hours)
      const session = {
        userId: userData.id,
        username: userData.username,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };

      saveSession(session);

      // Update auth state
      const user: User = {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        position: userData.position,
        role: userData.role,
        createdBy: userData.created_by,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
      };

      setAuthState({
        user,
        isAuthenticated: true,
      });

      // Reload users list
      await loadUsers();
      
      console.log('[login] Login successful');
      return { success: true };
    } catch (error) {
      console.error('[login] Exception during login:', error);
      return { success: false, error: 'unknown_error' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      clearSession();
      setAuthState({
        user: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const addUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      console.log('[addUser] Starting user creation process...', { username: userData.username, role: userData.role });
      
      if (userData.role === 'superadmin') {
        console.error('[addUser] Cannot create superadmin user');
        toast({
          title: "오류",
          description: "슈퍼관리자 계정은 생성할 수 없습니다.",
          variant: "destructive",
        });
        return false;
      }

      const { data: existingUser, error: checkError } = await supabase
        .from(TABLES.USERS)
        .select('id')
        .eq('username', userData.username)
        .maybeSingle();

      if (checkError) {
        console.error('[addUser] Error checking existing user:', checkError);
        return false;
      }

      if (existingUser) {
        console.error('[addUser] Username already exists');
        toast({
          title: "오류",
          description: "이미 존재하는 사용자명입니다.",
          variant: "destructive",
        });
        return false;
      }

      if (!authState.user) {
        console.error('[addUser] No authenticated user');
        return false;
      }
      
      if (userData.role === 'admin' && authState.user.role !== 'superadmin') {
        console.error('[addUser] Only superadmin can create admin users');
        toast({
          title: "권한 없음",
          description: "관리자 계정은 슈퍼관리자만 생성할 수 있습니다.",
          variant: "destructive",
        });
        return false;
      }
      
      if (userData.role === 'viewer' && authState.user.role === 'viewer') {
        console.error('[addUser] Viewer cannot create users');
        toast({
          title: "권한 없음",
          description: "조회자는 사용자를 생성할 수 없습니다.",
          variant: "destructive",
        });
        return false;
      }

      if (!userData.password) {
        console.error('[addUser] Password is required');
        toast({
          title: "오류",
          description: "비밀번호를 입력해주세요.",
          variant: "destructive",
        });
        return false;
      }

      console.log('[addUser] Hashing password...');
      const passwordHash = await hashPassword(userData.password);

      console.log('[addUser] Creating user record in database...');
      const { error: dbError } = await supabase
        .from(TABLES.USERS)
        .insert({
          username: userData.username,
          password_hash: passwordHash,
          name: userData.name,
          position: userData.position,
          role: userData.role,
          created_by: authState.user.id,
        });

      if (dbError) {
        console.error('[addUser] Failed to create user record:', dbError);
        toast({
          title: "오류",
          description: "사용자 생성에 실패했습니다.",
          variant: "destructive",
        });
        return false;
      }

      console.log('[addUser] User record created in database');
      console.log('[addUser] Reloading users list...');
      await loadUsers();
      
      toast({
        title: "성공",
        description: "사용자가 생성되었습니다.",
      });
      
      console.log('[addUser] User creation completed successfully');
      return true;
    } catch (error) {
      console.error('[addUser] Exception during user creation:', error);
      toast({
        title: "오류",
        description: "사용자 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateUser = async (id: string, updates: Partial<User>): Promise<boolean> => {
    try {
      if (!authState.user) return false;

      const targetUser = users.find(u => u.id === id);
      if (!targetUser) return false;

      if (updates.role === 'superadmin' || targetUser.role === 'superadmin') {
        toast({
          title: "권한 없음",
          description: "슈퍼관리자 계정은 수정할 수 없습니다.",
          variant: "destructive",
        });
        return false;
      }

      if (authState.user.role === 'superadmin') {
        if (targetUser.role === 'superadmin') {
          return false;
        }
      } else if (authState.user.role === 'admin') {
        if (targetUser.createdBy !== authState.user.id) {
          toast({
            title: "권한 없음",
            description: "자신이 생성한 사용자만 수정할 수 있습니다.",
            variant: "destructive",
          });
          return false;
        }
      } else {
        return false;
      }

      interface UpdateData {
        name?: string;
        position?: string;
        role?: string;
        updated_at: string;
        password_hash?: string;
      }

      const updateData: UpdateData = {
        name: updates.name,
        position: updates.position,
        role: updates.role,
        updated_at: new Date().toISOString(),
      };

      // If password is being updated, hash it
      if (updates.password) {
        updateData.password_hash = await hashPassword(updates.password);
      }

      const { error } = await supabase
        .from(TABLES.USERS)
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Failed to update user:', error);
        toast({
          title: "오류",
          description: "사용자 수정에 실패했습니다.",
          variant: "destructive",
        });
        return false;
      }

      await loadUsers();

      if (authState.user.id === id) {
        await loadUserData(id);
      }

      toast({
        title: "성공",
        description: "사용자 정보가 수정되었습니다.",
      });

      return true;
    } catch (error) {
      console.error('Update user failed:', error);
      toast({
        title: "오류",
        description: "사용자 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      if (!authState.user) return false;

      const targetUser = users.find(u => u.id === id);
      if (!targetUser) return false;

      if (id === authState.user.id || targetUser.role === 'superadmin') {
        toast({
          title: "권한 없음",
          description: "자신의 계정이나 슈퍼관리자 계정은 삭제할 수 없습니다.",
          variant: "destructive",
        });
        return false;
      }

      if (authState.user.role !== 'superadmin' && 
          !(authState.user.role === 'admin' && targetUser.createdBy === authState.user.id && targetUser.role === 'viewer')) {
        toast({
          title: "권한 없음",
          description: "이 사용자를 삭제할 권한이 없습니다.",
          variant: "destructive",
        });
        return false;
      }

      const { error: dbError } = await supabase
        .from(TABLES.USERS)
        .delete()
        .eq('id', id);

      if (dbError) {
        console.error('Failed to delete user from database:', dbError);
        toast({
          title: "오류",
          description: "사용자 삭제에 실패했습니다.",
          variant: "destructive",
        });
        return false;
      }

      await loadUsers();
      
      toast({
        title: "성공",
        description: "사용자가 삭제되었습니다.",
      });
      
      return true;
    } catch (error) {
      console.error('Delete user failed:', error);
      toast({
        title: "오류",
        description: "사용자 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return false;
    }
  };

  const transferSuperadmin = async (targetAdminId: string): Promise<boolean> => {
    try {
      if (!authState.user || authState.user.role !== 'superadmin') {
        return false;
      }

      const targetUser = users.find(u => u.id === targetAdminId);
      if (!targetUser || targetUser.role !== 'admin' || targetAdminId === authState.user.id) {
        return false;
      }

      const { error: error1 } = await supabase
        .from(TABLES.USERS)
        .update({ role: 'admin', updated_at: new Date().toISOString() })
        .eq('id', authState.user.id);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from(TABLES.USERS)
        .update({ role: 'superadmin', updated_at: new Date().toISOString() })
        .eq('id', targetAdminId);

      if (error2) {
        await supabase
          .from(TABLES.USERS)
          .update({ role: 'superadmin', updated_at: new Date().toISOString() })
          .eq('id', authState.user.id);
        throw error2;
      }

      await loadUsers();
      await loadUserData(authState.user.id);

      toast({
        title: "성공",
        description: "슈퍼관리자 권한이 이전되었습니다.",
      });

      return true;
    } catch (error) {
      console.error('Transfer superadmin failed:', error);
      toast({
        title: "오류",
        description: "슈퍼관리자 권한 이전에 실패했습니다.",
        variant: "destructive",
      });
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      if (!authState.user) {
        console.error('[changePassword] No authenticated user');
        return false;
      }

      console.log('[changePassword] Starting password change process...');

      // Get current user data from database
      const { data: userData, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('password_hash')
        .eq('id', authState.user.id)
        .single();

      if (userError || !userData) {
        console.error('[changePassword] Failed to get user data:', userError);
        toast({
          title: "오류",
          description: "사용자 정보를 가져오는데 실패했습니다.",
          variant: "destructive",
        });
        return false;
      }

      // Verify current password
      const currentPasswordHash = await hashPassword(currentPassword);
      if (currentPasswordHash !== userData.password_hash) {
        console.error('[changePassword] Current password is incorrect');
        toast({
          title: "오류",
          description: "현재 비밀번호가 일치하지 않습니다.",
          variant: "destructive",
        });
        return false;
      }

      // Validate new password
      if (!newPassword || newPassword.length < 4) {
        toast({
          title: "오류",
          description: "새 비밀번호는 최소 4자 이상이어야 합니다.",
          variant: "destructive",
        });
        return false;
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password in database
      const { error: updateError } = await supabase
        .from(TABLES.USERS)
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authState.user.id);

      if (updateError) {
        console.error('[changePassword] Failed to update password:', updateError);
        toast({
          title: "오류",
          description: "비밀번호 변경에 실패했습니다.",
          variant: "destructive",
        });
        return false;
      }

      console.log('[changePassword] Password changed successfully');
      toast({
        title: "성공",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      });

      return true;
    } catch (error) {
      console.error('[changePassword] Exception during password change:', error);
      toast({
        title: "오류",
        description: "비밀번호 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getSuperadmin = (): User | undefined => {
    return users.find(u => u.role === 'superadmin');
  };

  const canManageUsers = (): boolean => {
    return authState.user?.role === 'superadmin' || authState.user?.role === 'admin';
  };

  const canDeleteCalculation = (calculationCreatorId: string): boolean => {
    if (!authState.user) return false;
    
    if (authState.user.role === 'admin' || authState.user.role === 'superadmin') {
      return true;
    }
    
    return authState.user.id === calculationCreatorId;
  };

  return (
    <AuthContext.Provider value={{ 
      ...authState, 
      login, 
      logout, 
      users,
      addUser,
      updateUser,
      deleteUser,
      transferSuperadmin,
      changePassword,
      canManageUsers,
      canDeleteCalculation,
      getSuperadmin,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};