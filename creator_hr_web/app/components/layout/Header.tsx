import React, { useState, useRef, useEffect } from 'react';
import {
  Bell, LogOut, User, Shield, ChevronDown, Menu, Wifi, Clock,
  Search, Settings, Sparkles, CheckCircle2, Radio, Activity,
  CheckCheck, Volume2, AlertCircle, X, ExternalLink, Loader2,
  Calendar, Wallet, AlertTriangle, Zap, MessageSquare, ChevronRight
} from 'lucide-react';
import { Link, useFetcher } from 'react-router';
import { cn, formatDate, formatTime } from '~/lib/utils';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AppSettings {
  companyWifiSsid: string;
  latePenalty: number;
  forgetCheckOutPenalty: number;
  companyIp: string;
  workStartTime: string;
  workEndTime: string;
}

interface HeaderProps {
  currentUser: CurrentUser;
  settings: AppSettings;
  unreadCount: number;
  onMenuClick?: () => void;
}

export function Header({ currentUser, settings, unreadCount, onMenuClick }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifTab, setNotifTab] = useState<'ALL' | 'UNREAD'>('ALL');
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const logoutFetcher = useFetcher();
  const notifFetcher = useFetcher();

  const isAdmin = currentUser?.role === 'ADMIN';

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(w => w[0]).slice(-2).join('')
    : 'NV';

  // Fetch notifications data when popover opens
  useEffect(() => {
    if (showNotifModal) {
      notifFetcher.load('/notifications');
    }
  }, [showNotifModal]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifModal(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notificationsList = notifFetcher.data?.notifications || [];
  
  const displayList = notificationsList.filter((item: any) => {
    if (notifTab === 'UNREAD') return !item.isRead;
    return true;
  });

  const handleMarkAllRead = () => {
    notifFetcher.submit(
      { intent: 'markAllRead' },
      { method: 'post', action: '/notifications' }
    );
  };

  const handleMarkItemRead = (id: string) => {
    notifFetcher.submit(
      { intent: 'markRead', id },
      { method: 'post', action: '/notifications' }
    );
  };

  // Helper for notification type icon
  const getNotifIcon = (title: string, message: string) => {
    const t = (title + ' ' + message).toLowerCase();
    if (t.includes('chấm công') || t.includes('check-in') || t.includes('check-out')) {
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    }
    if (t.includes('lương') || t.includes('thưởng') || t.includes('phạt')) {
      return <Wallet className="h-4 w-4 text-amber-600" />;
    }
    if (t.includes('nghỉ') || t.includes('đi muộn')) {
      return <Calendar className="h-4 w-4 text-blue-600" />;
    }
    return <Zap className="h-4 w-4 text-primary-600" />;
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200/80 bg-white/85 backdrop-blur-2xl px-4 sm:px-8 select-none transition-all">
      {/* Left Section: Mobile Menu + WiFi */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-xl p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label="Mở Menu Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Verified WiFi Connection Pill */}
        <div className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/90 px-3 py-1 rounded-2xl text-xs font-bold shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Wifi className="h-3.5 w-3.5 text-emerald-600" />
          <span>{settings.companyWifiSsid}</span>
        </div>
      </div>

      {/* Center Section: Quick Search Trigger Placeholder */}
      <div className="hidden xl:flex items-center gap-2 bg-gray-100/70 border border-gray-200/80 px-3.5 py-1.5 rounded-2xl text-xs font-medium text-gray-400 w-72 transition-all hover:bg-gray-100 hover:border-gray-300 cursor-pointer">
        <Search className="h-3.5 w-3.5 text-gray-400" />
        <span className="flex-1">Tìm kiếm nhân viên, bảng lương...</span>
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-gray-500 bg-white border border-gray-200 rounded-md shadow-2xs">
          ⌘K
        </kbd>
      </div>

      {/* Right Section: Real-time Notifications Popover + User Avatar */}
      <div className="flex items-center gap-3">
        {/* Real-time Notifications Bell Modal Trigger */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifModal(!showNotifModal);
              if (showUserMenu) setShowUserMenu(false);
            }}
            className="relative rounded-2xl p-2.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all flex items-center justify-center border border-transparent hover:border-gray-200"
            aria-label="Thông báo hệ thống"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-black text-white ring-2 ring-white shadow-sm animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Premium Notifications Floating Modal / Popover */}
          {showNotifModal && (
            <div className="absolute right-0 mt-3 w-96 sm:w-[420px] rounded-3xl border border-slate-200/90 bg-white shadow-[0_25px_60px_-15px_rgba(15,23,42,0.22)] z-50 animate-in fade-in slide-in-from-top-3 duration-200 ease-out overflow-hidden select-none">
              {/* Header Bar */}
              <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-primary-500/20">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="p-2 bg-primary-600/30 text-primary-400 rounded-2xl border border-primary-500/30">
                      <Bell className="h-4.5 w-4.5" />
                    </div>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary-500 rounded-full border-2 border-slate-950 animate-ping" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                      <span>Thông Báo Hệ Thống</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-primary-600 text-white text-[10px] font-black rounded-full">
                          {unreadCount} mới
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-gray-400 font-medium">Cập nhật WebSocket thời gian thực</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-extrabold text-primary-300 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 border border-white/10"
                      title="Đánh dấu tất cả là đã đọc"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      <span>Đọc hết</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifModal(false)}
                    className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Sub-Header Tab Switcher */}
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl">
                  <button
                    onClick={() => setNotifTab('ALL')}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                      notifTab === 'ALL'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    )}
                  >
                    Tất cả ({notificationsList.length})
                  </button>
                  <button
                    onClick={() => setNotifTab('UNREAD')}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                      notifTab === 'UNREAD'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    )}
                  >
                    Chưa đọc ({unreadCount})
                  </button>
                </div>

                <span className="text-[11px] font-semibold text-slate-400">Tự động đồng bộ</span>
              </div>

              {/* Notifications List Container - Fixed Height 360px & Hidden Scrollbar */}
              <div className="h-[360px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] divide-y divide-slate-100 p-2 space-y-1">
                {notifFetcher.state === 'loading' && notificationsList.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-3 py-12">
                    <Loader2 className="h-6 w-6 text-primary-600 animate-spin" />
                    <p className="text-xs font-semibold text-slate-500">Đang nạp danh sách thông báo...</p>
                  </div>
                ) : displayList.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-2 py-12 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <Bell className="h-6 w-6 stroke-1.5" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">Không có thông báo nào</p>
                    <p className="text-[11px] text-slate-400 max-w-xs px-4">
                      {notifTab === 'UNREAD' ? 'Bạn đã đọc toàn bộ thông báo hệ thống.' : 'Chưa có thông báo gửi mới từ ban quản trị.'}
                    </p>
                  </div>
                ) : (
                  displayList.map((item: any) => {
                    const isUnread = !item.isRead;
                    return (
                      <div
                        key={item.id}
                        onClick={() => isUnread && handleMarkItemRead(item.id)}
                        className={cn(
                          'p-3.5 rounded-2xl transition-all flex items-start gap-3.5 cursor-pointer group border relative',
                          isUnread
                            ? 'bg-rose-50/40 border-rose-200/70 shadow-2xs hover:bg-rose-50/80'
                            : 'bg-white border-transparent hover:bg-slate-50/90'
                        )}
                      >
                        {/* Icon Badge */}
                        <div className={cn(
                          'p-2.5 rounded-2xl flex-shrink-0 mt-0.5 border shadow-2xs transition-transform group-hover:scale-105',
                          isUnread
                            ? 'bg-white border-rose-200/80 shadow-xs'
                            : 'bg-slate-100/80 border-slate-200/60'
                        )}>
                          {getNotifIcon(item.title, item.message)}
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-xs font-black text-slate-900 group-hover:text-primary-600 transition-colors truncate">
                              {item.title}
                            </h5>
                            {isUnread && (
                              <span className="h-2 w-2 rounded-full bg-primary-600 flex-shrink-0 animate-pulse" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                            {item.message}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-1">
                            <span>{item.createdAt ? `${formatDate(item.createdAt)} • ${formatTime(item.createdAt)}` : 'Gần đây'}</span>
                            {isUnread && (
                              <span className="text-primary-600 font-bold hover:underline">Chạm để đọc</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Popover Footer */}
              <div className="px-5 py-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <Activity className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[11px]">MediaPulse Push Live</span>
                </div>

                {isAdmin && (
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifModal(false)}
                    className="font-extrabold text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Quản lý tất cả</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-gray-200 hidden sm:block" />

        {/* User Profile Avatar Circle Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              if (showNotifModal) setShowNotifModal(false);
            }}
            className="p-1 rounded-2xl hover:bg-gray-100/80 border border-transparent hover:border-gray-200 transition-all flex items-center justify-center"
            title={currentUser?.name}
          >
            <div className={cn(
              'w-8.5 h-8.5 rounded-xl text-xs font-black flex items-center justify-center text-white flex-shrink-0 shadow-sm border',
              isAdmin 
                ? 'bg-gradient-to-br from-primary-600 to-rose-700 border-primary-500/30' 
                : 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700'
            )}>
              {initials}
            </div>
          </button>

          {/* User Menu Dropdown Panel */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-200 bg-white shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 select-none">
              <div className="px-3.5 py-3 mb-1 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-100 space-y-1">
                <p className="text-xs font-black text-gray-900">{currentUser?.name}</p>
                <p className="text-[11px] font-medium text-gray-500 truncate">{currentUser?.email}</p>
                <div className="pt-1">
                  <span className={cn(
                    'inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border',
                    isAdmin 
                      ? 'bg-primary-50 text-primary-700 border-primary-200' 
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  )}>
                    {isAdmin ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    {isAdmin ? 'Quyền Quản Trị Viên' : 'Quyền Nhân Viên'}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-1 space-y-0.5">
                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <User className="h-4 w-4 text-gray-500" />
                  <span>Hồ Sơ Cá Nhân</span>
                </Link>

                {isAdmin && (
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-gray-500" />
                    <span>Cài Đặt Hệ Thống</span>
                  </Link>
                )}

                <logoutFetcher.Form method="post" action="/logout">
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-rose-500" />
                    <span>Đăng Xuất Tài Khoản</span>
                  </button>
                </logoutFetcher.Form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
