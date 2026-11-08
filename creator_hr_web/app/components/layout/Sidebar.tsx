import React from 'react';
import { NavLink, Form } from 'react-router';
import { cn } from '~/lib/utils';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarX,
  Youtube,
  TrendingUp,
  Wallet,
  Bell,
  BarChart3,
  History,
  UserCircle,
  Settings2,
  LogOut,
  Zap,
} from 'lucide-react';

interface CurrentUser {
  id: string;
  name: string;
  role: string;
}

interface SidebarProps {
  currentUser: CurrentUser;
  unreadCount: number;
  pendingLeaves: number;
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ currentUser, unreadCount, pendingLeaves, className, onNavigate }: SidebarProps) {
  const isAdmin = currentUser?.role === 'ADMIN';

  const menuItems = [
    { name: 'Tổng quan', icon: LayoutDashboard, path: '/', exact: true },
    { name: 'Nhân viên', icon: Users, path: '/employees', show: isAdmin },
    { name: 'Chấm công', icon: Clock, path: '/attendance' },
    { name: 'Báo nghỉ & Đi muộn', icon: CalendarX, path: '/leaves', badge: pendingLeaves > 0 ? pendingLeaves : undefined },
    { name: 'View YouTube', icon: Youtube, path: '/youtube' },
    { name: 'Doanh thu', icon: TrendingUp, path: '/youtube-revenue', show: isAdmin },
    { name: 'Lương & Thưởng', icon: Wallet, path: '/payroll' },
    { name: 'Báo cáo', icon: BarChart3, path: '/reports', show: isAdmin },
    { name: 'Thông báo', icon: Bell, path: '/notifications', badge: unreadCount > 0 ? unreadCount : undefined, show: isAdmin },
    { name: 'Nhật ký', icon: History, path: '/activity-logs', show: isAdmin },
    { name: 'Hồ sơ', icon: UserCircle, path: '/profile', show: false },
    { name: 'Cài đặt', icon: Settings2, path: '/settings', show: isAdmin },
  ];

  const visibleItems = menuItems.filter(item => item.show !== false);

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(w => w[0]).slice(-2).join('')
    : 'U';

  return (
    <aside className={cn('flex h-full w-64 flex-col bg-surface-900 text-surface-100 select-none', className)}>
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-white/5">
        <img src="/images/logo.png" alt="MediaPulse" className="h-8 w-8 object-contain rounded-lg flex-shrink-0" />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-black tracking-tight text-white">
            Media<span className="text-primary-400">Pulse</span>
          </span>
          <span className="text-[10px] font-medium text-surface-500 tracking-wider uppercase">
            Quản trị hệ thống
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-0.5">
        {visibleItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              end={item.exact}
              style={{ animationDelay: `${i * 30}ms` }}
              className={({ isActive }) =>
                cn(
                  'group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 animate-enter',
                  isActive
                    ? 'bg-primary-600/15 text-primary-400 border border-primary-600/25'
                    : 'text-surface-400 hover:bg-white/5 hover:text-surface-100 border border-transparent'
                )
              }
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className="h-4 w-4 flex-shrink-0 opacity-80" />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge !== undefined && (
                <span className="bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[18px] text-center leading-none">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg mb-2 bg-white/5">
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold text-white flex-shrink-0',
            isAdmin ? 'bg-primary-600' : 'bg-gradient-to-br from-blue-500 to-cyan-600'
          )}>
            {initials}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[12px] font-semibold text-surface-100 truncate leading-tight">
              {currentUser?.name}
            </span>
            <span className="text-[10px] text-surface-500 leading-tight">
              {isAdmin ? 'Quản trị viên' : 'Nhân viên'}
            </span>
          </div>
        </div>
        <Form method="post" action="/logout">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium text-surface-500 hover:bg-rose-500/10 hover:text-rose-400 border border-transparent hover:border-rose-500/20 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Đăng xuất</span>
          </button>
        </Form>
      </div>
    </aside>
  );
}
