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
    { path: '/users', label: '사용자 관리', icon: Users, gradient: 'from-purple-500 to-pink-500' },
    { path: '/dashboard', label: '관리자 대시보드', icon: LayoutDashboard, gradient: 'from-blue-500 to-cyan-500' },
    { path: '/calculator', label: '원가 계산기', icon: Calculator, gradient: 'from-green-500 to-emerald-500' },
    { path: '/profile', label: '프로필 설정', icon: Settings, gradient: 'from-orange-500 to-red-500' },
  ];

  const adminNavItems = [
    { path: '/users', label: '사용자 관리', icon: Users, gradient: 'from-purple-500 to-pink-500' },
    { path: '/dashboard', label: '관리자 대시보드', icon: LayoutDashboard, gradient: 'from-blue-500 to-cyan-500' },
    { path: '/calculator', label: '원가 계산기', icon: Calculator, gradient: 'from-green-500 to-emerald-500' },
    { path: '/profile', label: '프로필 설정', icon: Settings, gradient: 'from-orange-500 to-red-500' },
  ];

  const userNavItems = [
    { path: '/dashboard', label: '사용자 대시보드', icon: LayoutDashboard, gradient: 'from-blue-500 to-cyan-500' },
    { path: '/calculator', label: '원가 계산기', icon: Calculator, gradient: 'from-green-500 to-emerald-500' },
    { path: '/profile', label: '프로필 설정', icon: Settings, gradient: 'from-orange-500 to-red-500' },
  ];

  const navItems = 
    user?.role === 'superadmin' ? superadminNavItems :
    user?.role === 'admin' ? adminNavItems : 
    userNavItems;

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'superadmin':
        return (
          <span className="text-xs px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center gap-1 font-semibold shadow-lg">
            <Shield className="h-3 w-3" />
            슈퍼 관리자
          </span>
        );
      case 'admin':
        return (
          <span className="text-xs px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full flex items-center gap-1 font-semibold shadow-lg">
            <Shield className="h-3 w-3" />
            관리자
          </span>
        );
      default:
        return (
          <span className="text-xs px-3 py-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-full font-semibold shadow-lg">
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
                ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg scale-105`
                : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:scale-102'
            }`}
          >
            <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-white'} transition-all`}>
              <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
            </div>
            <span className="font-medium">{item.label}</span>
            {isActive && <Sparkles className="h-4 w-4 ml-auto animate-pulse" />}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header with Gradient */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden hover:bg-blue-50">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-gradient-to-b from-white to-gray-50">
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Ship className="h-6 w-6 text-white" />
                      </div>
                      <span className="font-bold text-lg text-white">운임 관리</span>
                    </div>
                  </div>
                  <nav className="flex-1 p-4 space-y-2">
                    <NavLinks />
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo with Gradient */}
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <Ship className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  운임 관리 시스템
                </div>
                <div className="text-xs text-gray-500 font-medium">Freight Management System</div>
              </div>
            </Link>
          </div>

          {/* User Info with Gradient */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700">{user?.username}</span>
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
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
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
        {/* Sidebar - Desktop with Gradient */}
        <aside className="hidden lg:block w-72 bg-white/80 backdrop-blur-md border-r border-gray-200/50 min-h-[calc(100vh-73px)] sticky top-[73px] shadow-sm">
          <nav className="p-4 space-y-2">
            <NavLinks />
          </nav>
          
          {/* Decorative Element */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-48 h-48 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full blur-3xl opacity-20"></div>
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