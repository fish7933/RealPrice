import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { migrateInitialData, checkMigrationStatus } from '@/lib/supabase-migration';
import { supabase, TABLES } from '@/lib/supabase';
import { defaultUsers } from '@/data/initialData';

export default function Migration() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'migrating' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [alreadyMigrated, setAlreadyMigrated] = useState(false);

  const checkStatus = async () => {
    setStatus('checking');
    setMessage('마이그레이션 상태를 확인하는 중...');

    const isMigrated = await checkMigrationStatus();
    setAlreadyMigrated(isMigrated);

    if (isMigrated) {
      setStatus('idle');
      setMessage('데이터가 이미 마이그레이션되었습니다.');
    } else {
      setStatus('idle');
      setMessage('마이그레이션이 필요합니다.');
    }
  };

  const createInitialUsers = async () => {
    try {
      console.log('Creating initial users...');

      // Create superadmin
      const superadmin = defaultUsers[0];
      const superadminEmail = `${superadmin.username}@freight.local`;
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: superadminEmail,
        password: superadmin.password,
        email_confirm: true,
      });

      if (authError) {
        console.error('Error creating superadmin auth:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create superadmin auth user');
      }

      // Create superadmin record in database
      const { error: dbError } = await supabase
        .from(TABLES.USERS)
        .insert({
          id: authData.user.id,
          username: superadmin.username,
          name: superadmin.name,
          position: superadmin.position,
          role: superadmin.role,
        });

      if (dbError) {
        console.error('Error creating superadmin record:', dbError);
        // Cleanup auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw dbError;
      }

      console.log('✓ Superadmin created successfully');

      // Create admin
      const admin = defaultUsers[1];
      const adminEmail = `${admin.username}@freight.local`;
      
      const { data: adminAuthData, error: adminAuthError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: admin.password,
        email_confirm: true,
      });

      if (adminAuthError) {
        console.error('Error creating admin auth:', adminAuthError);
        throw adminAuthError;
      }

      if (!adminAuthData.user) {
        throw new Error('Failed to create admin auth user');
      }

      const { error: adminDbError } = await supabase
        .from(TABLES.USERS)
        .insert({
          id: adminAuthData.user.id,
          username: admin.username,
          name: admin.name,
          position: admin.position,
          role: admin.role,
          created_by: authData.user.id,
        });

      if (adminDbError) {
        console.error('Error creating admin record:', adminDbError);
        await supabase.auth.admin.deleteUser(adminAuthData.user.id);
        throw adminDbError;
      }

      console.log('✓ Admin created successfully');

      // Create viewer
      const viewer = defaultUsers[2];
      const viewerEmail = `${viewer.username}@freight.local`;
      
      const { data: viewerAuthData, error: viewerAuthError } = await supabase.auth.admin.createUser({
        email: viewerEmail,
        password: viewer.password,
        email_confirm: true,
      });

      if (viewerAuthError) {
        console.error('Error creating viewer auth:', viewerAuthError);
        throw viewerAuthError;
      }

      if (!viewerAuthData.user) {
        throw new Error('Failed to create viewer auth user');
      }

      const { error: viewerDbError } = await supabase
        .from(TABLES.USERS)
        .insert({
          id: viewerAuthData.user.id,
          username: viewer.username,
          name: viewer.name,
          position: viewer.position,
          role: viewer.role,
          created_by: adminAuthData.user.id,
        });

      if (viewerDbError) {
        console.error('Error creating viewer record:', viewerDbError);
        await supabase.auth.admin.deleteUser(viewerAuthData.user.id);
        throw viewerDbError;
      }

      console.log('✓ Viewer created successfully');
      console.log('✅ All users created successfully');

      return true;
    } catch (error) {
      console.error('Failed to create initial users:', error);
      return false;
    }
  };

  const runMigration = async () => {
    setStatus('migrating');
    setMessage('마이그레이션을 시작합니다...');

    try {
      // Step 1: Create initial users
      setMessage('1/2: 초기 사용자 생성 중...');
      const usersCreated = await createInitialUsers();

      if (!usersCreated) {
        throw new Error('사용자 생성 실패');
      }

      // Step 2: Migrate data
      setMessage('2/2: 초기 데이터 마이그레이션 중...');
      const result = await migrateInitialData();

      if (result.success) {
        setStatus('success');
        setMessage('마이그레이션이 성공적으로 완료되었습니다!');
        setAlreadyMigrated(true);
      } else {
        throw new Error('데이터 마이그레이션 실패');
      }
    } catch (error) {
      console.error('Migration error:', error);
      setStatus('error');
      setMessage(`마이그레이션 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  React.useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>데이터베이스 마이그레이션</CardTitle>
          <CardDescription>
            Supabase 데이터베이스에 초기 데이터를 마이그레이션합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert>
              {status === 'success' && <CheckCircle2 className="h-4 w-4" />}
              {status === 'error' && <XCircle className="h-4 w-4" />}
              {(status === 'checking' || status === 'migrating') && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === 'idle' && <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">마이그레이션 내용:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>초기 사용자 계정 (superadmin, admin, viewer)</li>
              <li>선사 목록 (Shipping Lines)</li>
              <li>철도 운송사 (Rail Agents)</li>
              <li>트럭 운송사 (Truck Agents)</li>
              <li>목적지 (Destinations)</li>
              <li>해상운임 (Sea Freights)</li>
              <li>운송사별 해상운임 (Agent Sea Freights)</li>
              <li>D/O 비용 (DTHC)</li>
              <li>DP 비용 (DP Costs)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">초기 계정 정보:</h3>
            <div className="text-sm space-y-1 bg-muted p-3 rounded">
              <p><strong>최고관리자:</strong> superadmin / super123</p>
              <p><strong>관리자:</strong> admin / admin123</p>
              <p><strong>일반사용자:</strong> viewer / viewer123</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={checkStatus}
              disabled={status === 'checking' || status === 'migrating'}
              variant="outline"
            >
              {status === 'checking' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              상태 확인
            </Button>

            <Button
              onClick={runMigration}
              disabled={status === 'checking' || status === 'migrating' || alreadyMigrated}
            >
              {status === 'migrating' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              마이그레이션 실행
            </Button>
          </div>

          {alreadyMigrated && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                데이터가 이미 마이그레이션되었습니다. 중복 실행을 방지하기 위해 버튼이 비활성화되었습니다.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}