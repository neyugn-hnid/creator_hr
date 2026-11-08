import React, { useState, useEffect, useRef, useCallback } from "react";
import { useFetcher } from "react-router";
import {
  Bell, CheckCircle2, AlertCircle, Info, CheckCheck,
  Send, X, Megaphone, Wifi, WifiOff,
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import { formatDate, formatTime } from "~/lib/utils";

interface Notification {
  id: string; userId: string; title: string; message: string;
  isRead: boolean; type: string; createdAt: string;
}

interface Props {
  loaderData: { notifications: Notification[] };
  currentUser: { id: string; name: string; role: string };
}

const WS_NOTIF_TYPES = [
  { value: "INFO", label: "Thông tin", color: "text-blue-500" },
  { value: "SUCCESS", label: "Thành công", color: "text-emerald-500" },
  { value: "WARNING", label: "Cảnh báo", color: "text-amber-500" },
  { value: "ERROR", label: "Quan trọng", color: "text-rose-500" },
];

// Toast notification shown when WS message received
function LiveToast({ msg, onClose }: { msg: { title: string; message: string; type: string; sentBy?: string } | null; onClose: () => void }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [msg, onClose]);

  if (!msg) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-4 fade-in">
      <div className={`bg-white rounded-2xl border shadow-xl p-4 flex items-start gap-3 ${msg.type === "ERROR" ? "border-rose-200" : msg.type === "SUCCESS" ? "border-emerald-200" : msg.type === "WARNING" ? "border-amber-200" : "border-blue-200"}`}>
        <div className="flex-shrink-0 mt-0.5">
          {msg.type === "ERROR" ? <AlertCircle className="h-5 w-5 text-rose-500" /> :
            msg.type === "SUCCESS" ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> :
            msg.type === "WARNING" ? <AlertCircle className="h-5 w-5 text-amber-500" /> :
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

export function NotificationsPage({ loaderData, currentUser }: Props) {
  const initialNotifications = loaderData.notifications;
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const fetcher = useFetcher();
  const broadcastFetcher = useFetcher<{ ok: boolean; wsClients?: number; wsError?: string }>();

  // Admin form state
  const [showForm, setShowForm] = useState(false);
  const [bTitle, setBTitle] = useState("");
  const [bMessage, setBMessage] = useState("");
  const [bType, setBType] = useState("INFO");

  // WebSocket state
  const [wsConnected, setWsConnected] = useState(false);
  const [liveToast, setLiveToast] = useState<{ title: string; message: string; type: string; sentBy?: string } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to WS server
  const connectWS = useCallback(() => {
    const WS_URL = "ws://localhost:3001";
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => {
        setWsConnected(false);
        // Reconnect after 3s
        setTimeout(connectWS, 3000);
      };
      ws.onerror = () => setWsConnected(false);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === "NOTIFICATION" || data.type === "NOTIFICATION") {
            // Show live toast
            setLiveToast({ title: data.title, message: data.message, type: data.notifType || "INFO", sentBy: data.sentBy });
            // Add to local list
            const newNotif: Notification = {
              id: `live_${Date.now()}`,
              userId: currentUser.id,
              title: data.title,
              message: data.message,
              isRead: false,
              type: data.notifType || "INFO",
              createdAt: new Date().toISOString(),
            };
            setNotifications(prev => [newNotif, ...prev]);
          }
        } catch {}
      };
    } catch {
      setWsConnected(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    connectWS();
    return () => wsRef.current?.close();
  }, [connectWS]);

  // Update notifications list when fetcher reloads
  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  const myNotifications = notifications
    .filter(n => filter === "ALL" ? true : !n.isRead)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markRead = (id: string) => {
    fetcher.submit({ intent: "markRead", id }, { method: "post" });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = () => {
    fetcher.submit({ intent: "markAllRead" }, { method: "post" });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleBroadcast = () => {
    if (!bTitle.trim() || !bMessage.trim()) return;
    const title = bTitle.trim();
    const message = bMessage.trim();
    const type = bType;

    broadcastFetcher.submit(
      JSON.stringify({ title, message, type }),
      { method: "post", action: "/api/ws/broadcast", encType: "application/json" }
    );

    // Optimistically insert into local notification list immediately
    const newNotif: Notification = {
      id: `sent_${Date.now()}`,
      userId: currentUser.id,
      title,
      message,
      isRead: false,
      type,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);

    setBTitle(""); setBMessage(""); setBType("INFO");
    setShowForm(false);
  };

  const isSending = broadcastFetcher.state !== "idle";
  const lastResult = broadcastFetcher.data;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Thông báo Hệ thống</h2>
          <p className="text-xs text-gray-500 mt-1">Thông báo về chấm công, phê duyệt nghỉ, phiếu lương và thưởng.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* WS Status Indicator */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${wsConnected ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
            {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {wsConnected ? "Live" : "Offline"}
          </span>

          {unreadCount > 0 && (
            <Button onClick={markAllRead} variant="outline" className="rounded-xl border-gray-200 text-xs font-bold">
              <CheckCheck className="mr-2 h-4 w-4 text-emerald-600" />
              Đánh dấu đã đọc tất cả
            </Button>
          )}

          {/* Admin Only: Broadcast Button */}
          {currentUser.role === "ADMIN" && (
            <Button onClick={() => setShowForm(true)} className="rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white">
              <Megaphone className="mr-2 h-4 w-4" />
              Tạo & Gửi Thông Báo
            </Button>
          )}
        </div>
      </div>

      {/* Broadcast Result Banner */}
      {lastResult && (
        <div className={`rounded-xl p-3 flex items-center gap-2 text-sm font-semibold ${lastResult.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
          {lastResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {lastResult.ok
            ? `Đã gửi thành công đến ${lastResult.wsClients ?? 0} thiết bị đang online${lastResult.wsError ? " (WS offline)" : ""}`
            : "Gửi thất bại"}
        </div>
      )}

      {/* Admin Broadcast Form Modal */}
      {showForm && currentUser.role === "ADMIN" && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-900">Tạo & Gửi Thông Báo</h3>
                <p className="text-xs text-gray-500 mt-0.5">Gửi real-time đến tất cả nhân viên đang online</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Loại thông báo</label>
                <div className="flex gap-2 flex-wrap">
                  {WS_NOTIF_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setBType(t.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${bType === t.value ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Tiêu đề thông báo</label>
                <input
                  value={bTitle}
                  onChange={e => setBTitle(e.target.value)}
                  placeholder="Ví dụ: Thông báo nghỉ lễ 2/9"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Nội dung</label>
                <textarea
                  value={bMessage}
                  onChange={e => setBMessage(e.target.value)}
                  placeholder="Nhập nội dung thông báo chi tiết..."
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3 justify-end">
              <Button onClick={() => setShowForm(false)} variant="outline" className="rounded-xl text-xs font-bold">Hủy</Button>
              <Button
                onClick={handleBroadcast}
                disabled={!bTitle.trim() || !bMessage.trim() || isSending}
                className="rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white"
              >
                <Send className="mr-2 h-4 w-4" />
                {isSending ? "Đang gửi..." : "Gửi tất cả nhân viên"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-100 shadow-xs w-fit">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === "ALL" ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:text-gray-900"}`}
        >
          Tất cả ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("UNREAD")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === "UNREAD" ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:text-gray-900"}`}
        >
          Chưa đọc ({unreadCount})
        </button>
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
        {myNotifications.length > 0 ? (
          myNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={`p-5 flex items-start gap-4 transition-colors cursor-pointer hover:bg-gray-50/80 ${!n.isRead ? "bg-primary-50/20" : ""}`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {n.type === "ERROR" ? <AlertCircle className="h-6 w-6 text-rose-500" /> :
                  n.type === "SUCCESS" ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> :
                  n.type === "WARNING" ? <AlertCircle className="h-6 w-6 text-amber-500" /> :
                  <Info className="h-6 w-6 text-blue-500" />}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-sm font-bold ${!n.isRead ? "text-gray-900" : "text-gray-700"}`}>{n.title}</h4>
                  <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">
                    {formatDate(n.createdAt)} • {formatTime(n.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
              </div>
              {!n.isRead && <div className="mt-2 h-2.5 w-2.5 rounded-full bg-primary-600 flex-shrink-0" />}
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-sm text-gray-400 flex flex-col items-center justify-center gap-2">
            <Bell className="h-8 w-8 text-gray-300 stroke-[1.5]" />
            <span>Không có thông báo nào trong danh mục này.</span>
          </div>
        )}
      </div>

      {/* Live Toast */}
      <LiveToast msg={liveToast} onClose={() => setLiveToast(null)} />
    </div>
  );
}
