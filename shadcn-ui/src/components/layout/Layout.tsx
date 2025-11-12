import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Ship,
  Calculator,
  Menu,
  LogOut,
  User,
  LayoutDashboard,
  Users,
  Shield,
  Settings,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define navigation items based on user role
  const superadminNavItems = [
    { path: '/users', label: '사용자 관리', icon: Users },
    { path: '/dashboard', label: '관리자 대시보드', icon: LayoutDashboard },
    { path: '/calculator', label: '원가 계산기', icon: Calculator },
    { path: '/profile', label: '프로필 설정', icon: Settings },
  ];

  const adminNavItems = [
    { path: '/users', label: '사용자 관리', icon: Users },
    { path: '/dashboard', label: '관리자 대시보드', icon: LayoutDashboard },
    { path: '/calculator', label: '원가 계산기', icon: Calculator },
    { path: '/profile', label: '프로필 설정', icon: Settings },
  ];

  const userNavItems = [
    { path: '/dashboard', label: '사용자 대시보드', icon: LayoutDashboard },
    { path: '/calculator', label: '원가 계산기', icon: Calculator },
    { path: '/profile', label: '프로필 설정', icon: Settings },
  ];

  const navItems = 
    user?.role === 'superadmin' ? superadminNavItems :
    user?.role === 'admin' ? adminNavItems : 
    userNavItems;

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'superadmin':
        return (
          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded flex items-center gap-1">
            <Shield className="h-3 w-3" />
            슈퍼 관리자
          </span>
        );
      case 'admin':
        return (
          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded flex items-center gap-1">
            <Shield className="h-3 w-3" />
            관리자
          </span>
        );
      default:
        return (
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
            사용자
          </span>
        );
    }
  };

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-2">
                      <Ship className="h-6 w-6 text-blue-600" />
                      <span className="font-bold text-lg">운임 관리</span>
                    </div>
                  </div>
                  <nav className="flex-1 p-4 space-y-2">
                    <NavLinks />
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2">
              <Ship className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg hidden sm:inline">운임 관리 시스템</span>
            </Link>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">{user?.username}</span>
              {getRoleBadge()}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <LogOut className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>로그아웃 확인</AlertDialogTitle>
                  <AlertDialogDescription>
                    정말 로그아웃 하시겠습니까?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>
                    로그아웃
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-57px)] sticky top-[57px]">
          <nav className="p-4 space-y-2">
            <NavLinks />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}