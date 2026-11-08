import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { LoaderFunctionArgs } from 'react-router';
import { Outlet, redirect, useLoaderData } from 'react-router';
import { prisma } from '~/lib/db';
import { requireUserId } from '~/lib/session.server';
import { Sidebar } from '~/components/layout/Sidebar';
import { Header } from '~/components/layout/Header';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request); // redirects to /login if no session

  const [user, settings, unreadCount, pendingLeaves] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, role: true,
        phone: true, department: true, position: true,
        joinedDate: true, avatar: true, bankAccount: true,
        bankName: true, hourlyRate: true, viewBonusRate: true,
        isActive: true, isDeleted: true,
      },
    }),
    prisma.appSettings.findUnique({ where: { id: 'singleton' } }),
    prisma.notification.count({
      where: {
        OR: [{ userId }, { userId: 'ALL' }],
        isRead: false,
      },
    }),
    prisma.leaveRequest.count({
      where: { status: 'PENDING', isDeleted: false },
    }),
  ]);

  if (!user || !user.isActive || user.isDeleted) {
    throw redirect('/login');
  }

  return {
    currentUser: {
      ...user,
      hourlyRate: Number(user.hourlyRate),
      viewBonusRate: Number(user.viewBonusRate),
    },
    settings: settings ?? {
      latePenalty: 50000,
      forgetCheckOutPenalty: 100000,
      companyWifiSsid: 'CreatorHR_5G',
      companyIp: '192.168.1.1',
      workStartTime: '08:30',
      workEndTime: '17:30',
    },
    unreadCount,
    pendingLeaves: user.role === 'ADMIN' ? pendingLeaves : 0,
  };
}

// Live Global Toast Component
function GlobalLiveToast({ msg, onClose }: { msg: { title: string; message: string; notifType: string; sentBy?: string } | null; onClose: () => void }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 7000);
    return () => clearTimeout(t);
  }, [msg, onClose]);

  if (!msg) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-4 fade-in">
      <div className={`bg-white rounded-2xl border shadow-xl p-4 flex items-start gap-3 ${
        msg.notifType === 'ERROR' ? 'border-rose-200' :
        msg.notifType === 'SUCCESS' ? 'border-emerald-200' :
        msg.notifType === 'WARNING' ? 'border-amber-200' :
        'border-blue-200'
      }`}>
        <div className="flex-shrink-0 mt-0.5">
          {msg.notifType === 'ERROR' ? <AlertCircle className="h-5 w-5 text-rose-500" /> :
           msg.notifType === 'SUCCESS' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> :
           msg.notifType === 'WARNING' ? <AlertCircle className="h-5 w-5 text-amber-500" /> :
           <Info className="h-5 w-5 text-blue-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-gray-900">{msg.title}</p>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><X className="h-4 w-4" /></button>
          </div>
          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{msg.message}</p>
          {msg.sentBy && <p className="text-[11px] text-gray-400 mt-1">Gửi bởi: {msg.sentBy}</p>}
        </div>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { currentUser, settings, unreadCount: initialUnread, pendingLeaves } = useLoaderData<typeof loader>();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [liveUnreadCount, setLiveUnreadCount] = useState(initialUnread);
  const [liveToast, setLiveToast] = useState<{ title: string; message: string; notifType: string; sentBy?: string } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setLiveUnreadCount(initialUnread);
  }, [initialUnread]);

  // Global WebSocket connection for real-time notifications on all pages
  const connectWS = useCallback(() => {
    const WS_URL = 'ws://localhost:3001';
    let reconnectTimer: ReturnType<typeof setTimeout>;
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'NOTIFICATION' || data.type === 'NOTIFICATION') {
            setLiveUnreadCount(prev => prev + 1);
            setLiveToast({
              title: data.title,
              message: data.message,
              notifType: data.notifType || data.type || 'INFO',
              sentBy: data.sentBy,
            });
          }
        } catch {}
      };

      ws.onclose = () => {
        reconnectTimer = setTimeout(connectWS, 4000);
      };
      ws.onerror = () => {};
    } catch {}

    return () => {
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    const cleanup = connectWS();
    return cleanup;
  }, [connectWS]);

  return (
    <div className="flex min-h-[100dvh] h-[100dvh] w-full bg-surface-50 overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-surface-900/60 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.28 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar
                currentUser={currentUser}
                unreadCount={liveUnreadCount}
                pendingLeaves={pendingLeaves}
                onNavigate={() => setSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar
          currentUser={currentUser}
          unreadCount={liveUnreadCount}
          pendingLeaves={pendingLeaves}
        />
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          currentUser={currentUser}
          settings={settings}
          unreadCount={liveUnreadCount}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-surface-50">
          <Outlet context={{ currentUser, settings }} />
        </main>
      </div>

      {/* Real-time Global Notification Toast */}
      <GlobalLiveToast msg={liveToast} onClose={() => setLiveToast(null)} />
    </div>
  );
}
