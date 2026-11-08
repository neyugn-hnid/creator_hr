import React, { useState, useEffect } from 'react';
import { useFetcher } from 'react-router';
import { DataTable, Column } from '~/components/common/DataTable';
import { DetailModal } from '~/components/common/DetailModal';
import { ExportModal } from '~/components/common/ExportModal';
import { Modal } from '~/components/ui/Modal';
import { Input } from '~/components/ui/Input';
import { Button } from '~/components/ui/Button';
import {
  Clock, Wifi, Plus, Download, CheckCircle2, MapPin, Navigation, RefreshCw,
  AlertTriangle, Calendar, Timer, Wallet,
  ArrowUpRight, AlertCircle, Radio, UserCheck, Filter
} from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '~/lib/utils';

type AttendanceRec = any;

interface Props {
  loaderData: { attendances: AttendanceRec[]; users: any[]; settings: any; isAdmin: boolean };
  currentUser: any;
}

export function Attendance({ loaderData, currentUser }: Props) {
  const { attendances, users, settings, isAdmin } = loaderData;
  const fetcher = useFetcher();
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRec | null>(null);
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRec | null>(null);
  const [wifiSsidInput, setWifiSsidInput] = useState(settings.companyWifiSsid);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');

  const [nowTime, setNowTime] = useState<Date>(new Date());
  useEffect(() => { const t = setInterval(() => setNowTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const [gpsLocation, setGpsLocation] = useState<{ lat?: number; lng?: number; accuracy?: number; status: 'idle' | 'loading' | 'success' | 'error'; errorMsg?: string }>({ status: 'idle' });

  const getLiveLocation = () => {
    if (!navigator.geolocation) { setGpsLocation({ status: 'error', errorMsg: 'Trình duyệt không hỗ trợ GPS.' }); return; }
    setGpsLocation(p => ({ ...p, status: 'loading' }));
    navigator.geolocation.getCurrentPosition(
      (pos) => setGpsLocation({ lat: parseFloat(pos.coords.latitude.toFixed(6)), lng: parseFloat(pos.coords.longitude.toFixed(6)), accuracy: Math.round(pos.coords.accuracy), status: 'success' }),
      (err) => { let m = 'Không lấy được GPS.'; if (err.code === 1) m = 'Cần cấp quyền vị trí.'; else if (err.code === 2) m = 'GPS không khả dụng.'; else if (err.code === 3) m = 'Hết thời gian.'; setGpsLocation({ status: 'error', errorMsg: m }); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
  useEffect(() => { getLiveLocation(); }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const myTodayRecord = attendances.find((a: any) => a.userId === currentUser?.id && a.date === todayStr && !a.isDeleted);
  const activeEmployees = users.filter((u: any) => !u.isDeleted && u.isActive);
  const todayAttendances = attendances.filter((a: any) => a.date === todayStr && !a.isDeleted);
  const todayCheckedInCount = todayAttendances.filter((a: any) => a.checkIn).length;
  const todayLateCount = todayAttendances.filter((a: any) => a.status === 'LATE').length;
  const todayAbsentCount = Math.max(0, activeEmployees.length - todayCheckedInCount);
  const todayCheckedInPct = activeEmployees.length > 0 ? Math.round((todayCheckedInCount / activeEmployees.length) * 100) : 0;

  const visibleAttendances = isAdmin ? attendances : attendances.filter((a: any) => a.userId === currentUser?.id);
  const filteredAttendances = visibleAttendances.filter((a: any) => {
    if (isAdmin && selectedUserFilter !== 'ALL' && a.userId !== selectedUserFilter) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PRESENT') return a.status === 'PRESENT';
    if (statusFilter === 'LATE') return a.status === 'LATE';
    if (statusFilter === 'UNCHECKED') return a.checkIn && !a.checkOut;
    return true;
  });

  const totalRecords = visibleAttendances.length;
  const presentCount = visibleAttendances.filter((a: any) => a.status === 'PRESENT').length;
  const lateCount = visibleAttendances.filter((a: any) => a.status === 'LATE').length;
  const totalWorkedHours = visibleAttendances.reduce((acc: number, a: any) => acc + (a.workHours || 0), 0);
  const totalAmount = visibleAttendances.reduce((acc: number, a: any) => acc + (a.amount || 0), 0);
  const onTimePercentage = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 100;

  const currentMinutes = nowTime.getHours() * 60 + nowTime.getMinutes();
  const workProgressPct = Math.min(100, Math.max(0, Math.round(((currentMinutes - 510) / 540) * 100)));

  const [formData, setFormData] = useState({ userId: currentUser?.id || '', date: todayStr, checkIn: `${todayStr}T08:30:00Z`, checkOut: `${todayStr}T17:30:00Z`, workHours: 8, status: 'PRESENT' as string, wifiSsid: settings.companyWifiSsid });

  const handleOpenForm = (att?: AttendanceRec) => {
    if (att) { setEditingAttendance(att); setFormData({ userId: att.userId, date: att.date, checkIn: att.checkIn || '', checkOut: att.checkOut || '', workHours: att.workHours, status: att.status, wifiSsid: att.wifiSsid || settings.companyWifiSsid }); }
    else { setEditingAttendance(null); setFormData({ userId: currentUser?.id || '', date: todayStr, checkIn: `${todayStr}T08:30:00.000Z`, checkOut: `${todayStr}T17:30:00.000Z`, workHours: 8, status: 'PRESENT', wifiSsid: settings.companyWifiSsid }); }
    setFormModalOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); fetcher.submit({ intent: editingAttendance ? 'updateAttendance' : 'addAttendance', ...(editingAttendance ? { id: editingAttendance.id } : {}), ...formData }, { method: 'post' }); setFormModalOpen(false); };

  const handleWiFiCheckIn = () => {
    if (wifiSsidInput.trim().toLowerCase() !== settings.companyWifiSsid.toLowerCase()) { alert(`WiFi không hợp lệ! Cần kết nối: "${settings.companyWifiSsid}"`); return; }
    if (gpsLocation.status !== 'success' || !gpsLocation.lat) { alert('Chưa xác thực GPS! Vui lòng bật định vị.'); getLiveLocation(); return; }
    fetcher.submit({ intent: 'checkIn', wifiSsid: wifiSsidInput, latitude: String(gpsLocation.lat), longitude: String(gpsLocation.lng!) }, { method: 'post' });
  };
  const handleWiFiCheckOut = () => {
    if (wifiSsidInput.trim().toLowerCase() !== settings.companyWifiSsid.toLowerCase()) { alert(`WiFi không hợp lệ! Cần kết nối: "${settings.companyWifiSsid}"`); return; }
    if (gpsLocation.status !== 'success' || !gpsLocation.lat) { alert('Chưa xác thực GPS! Vui lòng bật định vị.'); getLiveLocation(); return; }
    fetcher.submit({ intent: 'checkOut', wifiSsid: wifiSsidInput, latitude: String(gpsLocation.lat), longitude: String(gpsLocation.lng!) }, { method: 'post' });
  };

  const columns: Column<AttendanceRec>[] = [
    { key: 'userId', header: 'Nhân viên', sortable: true, accessor: (a) => { const u = users.find((item: any) => item.id === a.userId); return (<div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-lg bg-surface-100 flex items-center justify-center font-bold text-[11px] text-surface-600">{(u?.name || 'NV').split(' ').map((w: string) => w[0]).slice(-2).join('')}</div><div><div className="font-semibold text-[13px] text-surface-800">{u?.name || a.userId}</div><div className="text-[11px] text-surface-400">{u?.department || '—'}</div></div></div>); } },
    { key: 'date', header: 'Ngày', sortable: true, accessor: (a) => <span className="text-[13px] font-medium text-surface-700">{formatDate(a.date)}</span> },
    { key: 'checkIn', header: 'Check In', accessor: (a) => a.checkIn ? <span className="text-[13px] font-semibold text-emerald-600">{formatTime(a.checkIn)}</span> : <span className="text-surface-300">—</span> },
    { key: 'checkOut', header: 'Check Out', accessor: (a) => a.checkOut ? <span className="text-[13px] font-semibold text-blue-600">{formatTime(a.checkOut)}</span> : <span className="text-[12px] text-amber-600 font-medium">Chưa Check Out</span> },
    { key: 'workHours', header: 'Giờ', sortable: true, accessor: (a) => <span className="text-[13px] font-semibold text-surface-700">{a.workHours || 0}h</span> },
    { key: 'amount', header: 'Thực nhận', sortable: true, accessor: (a) => <span className="text-[13px] font-bold text-emerald-600">{formatCurrency(a.amount)}</span> },
    { key: 'status', header: 'Trạng thái', sortable: true, accessor: (a) => { if (a.status === 'PRESENT') return <span className="text-[12px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Đúng giờ</span>; if (a.status === 'LATE') return <span className="text-[12px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Muộn {a.lateMinutes ? `${a.lateMinutes}p` : ''}</span>; return <span className="text-[12px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Vắng</span>; } }
  ];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-surface-900">{isAdmin ? 'Quản lý Chấm công' : 'Chấm công'}</h2>
          <p className="text-[13px] text-surface-500 mt-0.5">{isAdmin ? 'Theo dõi điểm danh toàn công ty.' : `Xin chào ${currentUser?.name}, check-in/out ca làm việc.`}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setExportModalOpen(true)} size="sm"><Download className="mr-1.5 h-3.5 w-3.5" />Xuất báo cáo</Button>
          {isAdmin && <Button onClick={() => handleOpenForm()} size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Thêm chấm công</Button>}
        </div>
      </div>

      {/* Admin: today summary */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-surface-200 p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><UserCheck className="h-4 w-4" /></div>
            <div><p className="text-[11px] text-surface-500 font-medium">Đã điểm danh</p><p className="text-base font-bold text-surface-900">{todayCheckedInCount}/{activeEmployees.length} <span className="text-[11px] font-medium text-surface-400">({todayCheckedInPct}%)</span></p></div>
          </div>
          <div className="bg-white rounded-xl border border-surface-200 p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600"><AlertTriangle className="h-4 w-4" /></div>
            <div><p className="text-[11px] text-surface-500 font-medium">Đi muộn</p><p className="text-base font-bold text-surface-900">{todayLateCount} <span className="text-[11px] font-medium text-surface-400">người</span></p></div>
          </div>
          <div className="bg-white rounded-xl border border-surface-200 p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600"><AlertCircle className="h-4 w-4" /></div>
            <div><p className="text-[11px] text-surface-500 font-medium">Chưa điểm danh</p><p className="text-base font-bold text-surface-900">{todayAbsentCount} <span className="text-[11px] font-medium text-surface-400">người</span></p></div>
          </div>
          <div className="bg-white rounded-xl border border-surface-200 p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-surface-100 text-surface-600"><Wallet className="h-4 w-4" /></div>
            <div><p className="text-[11px] text-surface-500 font-medium">Quỹ lương hôm nay</p><p className="text-base font-bold text-surface-900">{formatCurrency(todayAttendances.reduce((acc: number, a: any) => acc + (a.amount || 0), 0))}</p></div>
          </div>
        </div>
      )}

      {/* Employee: check-in widget */}
      {!isAdmin && (
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div>
              <p className="text-[11px] text-surface-500 font-medium mb-1">Giờ hiện tại</p>
              <p className="text-2xl font-bold text-surface-900 font-mono">{nowTime.toLocaleTimeString('vi-VN')}</p>
              <p className="text-[12px] text-surface-400 mt-0.5">{formatDate(todayStr)} · Ca 08:30-17:30</p>
              <div className="mt-2 w-full bg-surface-100 rounded-full h-1.5"><div className="bg-primary-500 h-full rounded-full transition-all" style={{ width: `${workProgressPct}%` }} /></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[12px] text-surface-600"><Wifi className="h-3.5 w-3.5" /><span>WiFi: <strong>{settings.companyWifiSsid}</strong></span></div>
              <div className="flex items-start gap-2 text-[12px]">
                <Navigation className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${gpsLocation.status === 'loading' ? 'animate-spin text-blue-500' : gpsLocation.status === 'success' ? 'text-emerald-500' : 'text-rose-500'}`} />
                <div>
                  {gpsLocation.status === 'loading' && <span className="text-surface-500">Đang quét GPS...</span>}
                  {gpsLocation.status === 'success' && <span className="text-emerald-600 font-medium">GPS: {gpsLocation.lat}, {gpsLocation.lng}</span>}
                  {gpsLocation.status === 'error' && <span className="text-rose-500">{gpsLocation.errorMsg}</span>}
                </div>
                <button onClick={getLiveLocation} className="text-surface-400 hover:text-surface-600"><RefreshCw className="h-3 w-3" /></button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button disabled={Boolean(myTodayRecord?.checkIn) || fetcher.state === 'submitting'} onClick={handleWiFiCheckIn} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[12px] rounded-xl transition-colors disabled:opacity-40">Check In</button>
              <button disabled={!myTodayRecord?.checkIn || Boolean(myTodayRecord?.checkOut) || fetcher.state === 'submitting'} onClick={handleWiFiCheckOut} className="flex-1 py-2.5 bg-surface-900 hover:bg-surface-800 text-white font-bold text-[12px] rounded-xl transition-colors disabled:opacity-40">Check Out</button>
            </div>
          </div>
          {fetcher.data && <p className={`mt-3 text-[12px] font-medium p-2.5 rounded-lg ${fetcher.data.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{fetcher.data.success || fetcher.data.error}</p>}
        </div>
      )}

      {/* KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          [CheckCircle2, 'Đúng giờ', `${onTimePercentage}%`, `${presentCount}/${totalRecords} lượt`, 'emerald'],
          [AlertTriangle, 'Đi muộn', `${lateCount}`, `Phạt ${formatCurrency(lateCount * Number(settings.latePenalty || 50000))}`, 'amber'],
          [Clock, 'Tổng giờ', `${totalWorkedHours}h`, '~8h/ngày', 'blue'],
          [Wallet, isAdmin ? 'Tổng lương' : 'Thu nhập', formatCurrency(totalAmount), 'Theo giờ & phạt', 'rose'],
        ].map(([Icon, label, value, sub, color], i) => (
          <div key={i} className="bg-white rounded-xl border border-surface-200 p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${color}-50 text-${color}-600`}><Icon className="h-4 w-4" /></div>
            <div><p className="text-[11px] text-surface-500 font-medium">{label}</p><p className="text-base font-bold text-surface-900">{value}</p><p className="text-[10px] text-surface-400">{sub}</p></div>
          </div>
        ))}
      </div>

      {/* DataTable with filters */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5 bg-surface-100 rounded-lg p-0.5">
              {['ALL','PRESENT','LATE','UNCHECKED'].map(k => (
                <button key={k} onClick={() => setStatusFilter(k)} className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${statusFilter === k ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}>
                  {k === 'ALL' ? 'Tất cả' : k === 'PRESENT' ? 'Đúng giờ' : k === 'LATE' ? 'Đi muộn' : 'Chưa Check Out'}
                </button>
              ))}
            </div>
            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <Filter className="h-3 w-3 text-surface-400" />
                <select value={selectedUserFilter} onChange={e => setSelectedUserFilter(e.target.value)} className="text-[12px] bg-surface-50 border border-surface-200 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                  <option value="ALL">Tất cả ({activeEmployees.length})</option>
                  {activeEmployees.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <span className="text-[12px] text-surface-400">{filteredAttendances.length}/{totalRecords} lượt</span>
        </div>
        <DataTable
          data={filteredAttendances}
          columns={columns}
          searchKey={(a) => { const u = users.find((item: any) => item.id === a.userId); return `${u?.name || ''} ${a.date}`; }}
          searchPlaceholder="Tìm theo tên, ngày..."
          onView={(a) => { setSelectedAttendance(a); setDetailModalOpen(true); }}
          onEdit={isAdmin ? (a) => handleOpenForm(a) : undefined}
          onSoftDelete={isAdmin ? (id) => fetcher.submit({ intent: 'softDelete', id }, { method: 'post' }) : undefined}
          onRestore={isAdmin ? (id) => fetcher.submit({ intent: 'restore', id }, { method: 'post' }) : undefined}
        />
      </div>

      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title={editingAttendance ? 'Cập nhật chấm công' : 'Thêm chấm công'}>
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div><label className="block text-[12px] font-semibold text-surface-700 mb-1">Nhân viên</label><select className="w-full text-[13px] bg-surface-50 border border-surface-200 rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/30" value={formData.userId} onChange={e => setFormData({...formData, userId: e.target.value})}>{users.filter((u: any) => !u.isDeleted).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
          <Input label="Ngày" type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Check In" type="datetime-local" value={formData.checkIn ? formData.checkIn.slice(0, 16) : ''} onChange={e => setFormData({...formData, checkIn: new Date(e.target.value).toISOString()})} />
            <Input label="Check Out" type="datetime-local" value={formData.checkOut ? formData.checkOut.slice(0, 16) : ''} onChange={e => setFormData({...formData, checkOut: new Date(e.target.value).toISOString()})} />
          </div>
          <Input label="WiFi" value={formData.wifiSsid} onChange={e => setFormData({...formData, wifiSsid: e.target.value})} />
          <div className="flex justify-end gap-2 pt-3 border-t border-surface-100">
            <Button variant="outline" type="button" onClick={() => setFormModalOpen(false)}>Hủy</Button>
            <Button type="submit">{editingAttendance ? 'Lưu' : 'Thêm'}</Button>
          </div>
        </form>
      </Modal>

      {selectedAttendance && (
        <DetailModal isOpen={isDetailModalOpen} onClose={() => setDetailModalOpen(false)} title={`Chi tiết: ${users.find((u: any) => u.id === selectedAttendance.userId)?.name}`}
          data={{
            employee: { label: 'Nhân viên', value: users.find((u: any) => u.id === selectedAttendance.userId)?.name },
            date: { label: 'Ngày', value: formatDate(selectedAttendance.date) },
            checkIn: { label: 'Check In', value: selectedAttendance.checkIn ? formatTime(selectedAttendance.checkIn) : '—' },
            checkOut: { label: 'Check Out', value: selectedAttendance.checkOut ? formatTime(selectedAttendance.checkOut) : '—' },
            workHours: { label: 'Giờ làm', value: `${selectedAttendance.workHours} giờ` },
            wifi: { label: 'WiFi', value: selectedAttendance.wifiSsid || settings.companyWifiSsid },
            amount: { label: 'Thực nhận', value: formatCurrency(selectedAttendance.amount) },
            status: { label: 'Trạng thái', value: selectedAttendance.status === 'PRESENT' ? 'Đúng giờ' : selectedAttendance.status === 'LATE' ? `Muộn ${selectedAttendance.lateMinutes || 0}p` : 'Vắng' }
          }} />
      )}

      <ExportModal isOpen={isExportModalOpen} onClose={() => setExportModalOpen(false)} title="Xuất báo cáo Chấm công" data={filteredAttendances} filename="Bao_Cao_Cham_Cong" />
    </div>
  );
}
