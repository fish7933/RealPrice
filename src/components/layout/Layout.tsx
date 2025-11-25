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
  Sparkles,
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
    { path: '/users', label: '사용자', icon: Users },
    { path: '/dashboard', label: '대시보드', icon: LayoutDashboard },
    { path: '/calculator', label: '운임 조회', icon: Calculator },
    { path: '/profile', label: '프로필', icon: Settings },
  ];

  const adminNavItems = [
    { path: '/users', label: '사용자', icon: Users },
    { path: '/dashboard', label: '대시보드', icon: LayoutDashboard },
    { path: '/calculator', label: '운임 조회', icon: Calculator },
    { path: '/profile', label: '프로필', icon: Settings },
  ];

  const userNavItems = [
    { path: '/dashboard', label: '대시보드', icon: LayoutDashboard },
    { path: '/calculator', label: '운임 조회', icon: Calculator },
    { path: '/profile', label: '프로필', icon: Settings },
  ];

  const navItems = 
    user?.role === 'superadmin' ? superadminNavItems :
    user?.role === 'admin' ? adminNavItems : 
    userNavItems;

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'superadmin':
        return (
          <span className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1 font-semibold border border-blue-200">
            <Shield className="h-3 w-3" />
            슈퍼 관리자
          </span>
        );
      case 'admin':
        return (
          <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1 font-semibold border border-green-200">
            <Shield className="h-3 w-3" />
            관리자
          </span>
        );
      default:
        return (
          <span className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-semibold border border-gray-200">
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
            className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              isActive
                ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-sm'
                : 'text-gray-700 hover:bg-gray-100 border-2 border-transparent hover:border-gray-200'
            }`}
          >
            <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-gray-200'} transition-all`}>
              <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
            </div>
            <span className="font-semibold">{item.label}</span>
            {isActive && <Sparkles className="h-4 w-4 ml-auto text-blue-600" />}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden hover:bg-gray-100">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-white">
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Ship className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="font-bold text-lg text-gray-900">운임 시스템</span>
                    </div>
                  </div>
                  <nav className="flex-1 p-4 space-y-2">
                    <NavLinks />
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Ship className="h-6 w-6 text-blue-600" />
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-xl text-gray-900">
                  운임 시스템
                </div>
                <div className="text-xs text-gray-600 font-medium">Freight Management</div>
              </div>
            </Link>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-1.5 bg-gray-200 rounded-lg">
                <User className="h-4 w-4 text-gray-700" />
              </div>
              <span className="text-sm font-semibold text-gray-900">{user?.username}</span>
              {getRoleBadge()}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hover:bg-red-50 hover:text-red-600 transition-colors rounded-xl"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <LogOut className="h-5 w-5 text-red-600" />
                    로그아웃 확인
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    정말 로그아웃 하시겠습니까?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700"
                  >
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
        <aside className="hidden lg:block w-72 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)] sticky top-[73px] shadow-sm">
          <nav className="p-4 space-y-2">
            <NavLinks />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}