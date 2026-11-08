import React, { useState, useEffect } from 'react';
import { useFetcher, useNavigate, useRevalidator } from 'react-router';
import { DataTable, Column } from '~/components/common/DataTable';
import { DetailModal } from '~/components/common/DetailModal';
import { Modal } from '~/components/ui/Modal';
import { Input } from '~/components/ui/Input';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { Youtube, Plus, Check, X, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '~/lib/utils';

type YoutubeView = any;
type YoutubeChannel = any;

interface Props {
  loaderData: {
    views: YoutubeView[];
    users: any[];
    channels: YoutubeChannel[];
    hasGoogleConfig: boolean;
    googleAuthUrl?: string;
    isAdmin: boolean;
  };
  currentUser: any;
}

export function YoutubeViewPage({ loaderData, currentUser }: Props) {
  const { views: youtubeViews, users, channels = [], hasGoogleConfig = false, googleAuthUrl = '', isAdmin } = loaderData;
  const fetcher = useFetcher();
  const syncFetcher = useFetcher<any>();
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  useEffect(() => {
    if (syncFetcher.state === 'idle' && syncFetcher.data) {
      revalidator.revalidate();
      navigate('.', { replace: true });
    }
  }, [syncFetcher.state, syncFetcher.data]);

  const [syncMonth, setSyncMonth] = useState(new Date().getMonth() + 1);
  const [syncYear, setSyncYear] = useState(new Date().getFullYear());
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [editingView, setEditingView] = useState<YoutubeView | null>(null);
  const [selectedView, setSelectedView] = useState<YoutubeView | null>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({ userId: currentUser?.id || '', channelName: 'Kênh Khám Phá Creator', month: currentMonth, year: currentYear, viewCount: 1000000, note: '' });

  const handleOpenForm = (v?: YoutubeView) => {
    if (v) { setEditingView(v); setFormData({ userId: v.userId, channelName: v.channelName, month: v.month, year: v.year, viewCount: v.viewCount, note: v.note || '' }); }
    else { setEditingView(null); setFormData({ userId: currentUser?.id || '', channelName: 'Kênh Khám Phá Creator', month: currentMonth, year: currentYear, viewCount: 1000000, note: '' }); }
    setFormModalOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); fetcher.submit({ intent: editingView ? 'update' : 'add', ...(editingView ? { id: editingView.id } : {}), ...formData, viewCount: String(formData.viewCount) }, { method: 'post' }); setFormModalOpen(false); };

  const visibleViews = isAdmin ? youtubeViews : youtubeViews.filter((v: any) => v.userId === currentUser?.id);
  const selectedUserForBonus = users.find((u: any) => u.id === (formData.userId || currentUser?.id));
  const estimatedBonus = Math.round((Number(formData.viewCount || 0) / 1000) * (selectedUserForBonus?.viewBonusRate || 5000));

  const columns: Column<YoutubeView>[] = [
    { key: 'userName', header: 'Nhân viên', sortable: true, accessor: (v) => { const u = users.find((item: any) => item.id === v.userId); return <span className="font-semibold text-[13px] text-surface-800">{u?.name || v.userId}</span>; } },
    { key: 'channelName', header: 'Kênh', sortable: true, accessor: (v) => { const ch = channels.find((c: any) => c.id === v.channelId || c.channelName === v.channelName); return <span className="text-[13px] text-surface-700 flex items-center gap-2">{ch?.channelAvatar ? <img src={ch.channelAvatar} className="h-5 w-5 rounded-full" /> : <Youtube className="h-4 w-4 text-rose-500" />}{v.channelName}</span>; } },
    { key: 'month', header: 'Kỳ', sortable: true, accessor: (v) => <span className="text-[13px] text-surface-600">T{v.month}/{v.year}</span> },
    { key: 'viewCount', header: 'View', sortable: true, accessor: (v) => <span className="text-[13px] font-semibold text-surface-800">{v.viewCount.toLocaleString('vi-VN')}</span> },
    { key: 'amount', header: 'Thưởng', sortable: true, accessor: (v) => <span className="text-[13px] font-bold text-emerald-600">{formatCurrency(v.amount)}</span> },
    { key: 'status', header: 'Trạng thái', sortable: true, accessor: (v) => { const m: any = { PENDING: { l: 'Chờ duyệt', v: 'warning' }, APPROVED: { l: 'Đã duyệt', v: 'success' }, REJECTED: { l: 'Từ chối', v: 'danger' } }; const i = m[v.status] || m.PENDING; return <Badge variant={i.v}>{i.l}</Badge>; } }
  ];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-surface-900">Quản lý View YouTube</h2>
          <p className="text-[13px] text-surface-500 mt-0.5">Kết nối kênh YouTube hoặc khai báo thủ công để nhận thưởng view.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-surface-50 border border-surface-200 rounded-lg px-2.5 py-1.5 text-[12px]">
            <span className="text-surface-400">Kỳ:</span>
            <select value={syncMonth} onChange={e => setSyncMonth(Number(e.target.value))} className="bg-transparent font-semibold focus:outline-none"><>{Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>T{m}</option>)}</></select>
            <select value={syncYear} onChange={e => setSyncYear(Number(e.target.value))} className="bg-transparent font-semibold focus:outline-none"><>{[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}</></select>
          </div>
          {!isAdmin && <Button onClick={() => handleOpenForm()} size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Khai báo thủ công</Button>}
        </div>
      </div>

      {/* Google Config Warning */}
      {!hasGoogleConfig && (
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[12px]">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div><p className="font-semibold text-amber-800">Chưa cấu hình Google OAuth</p><p className="text-amber-600 mt-0.5">Thêm GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET vào .env.</p></div>
        </div>
      )}

      {/* Sync Result */}
      {syncFetcher.data && (
        <div className={`p-3 rounded-xl text-[12px] font-medium ${syncFetcher.data.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {syncFetcher.data.ok ? (syncFetcher.data.totalCount ? `Đã sync ${syncFetcher.data.successCount}/${syncFetcher.data.totalCount} kênh — ${syncFetcher.data.viewCount?.toLocaleString('vi-VN')} view — Thưởng: ${formatCurrency(syncFetcher.data.amount)}` : `Đã sync kênh "${syncFetcher.data.channelName}" — ${syncFetcher.data.viewCount?.toLocaleString('vi-VN')} view — Thưởng: ${formatCurrency(syncFetcher.data.amount)}`) : syncFetcher.data.error}
        </div>
      )}

      {/* DataTable */}
      <DataTable
        data={visibleViews}
        columns={columns}
        searchKey={(v) => { const u = users.find((item: any) => item.id === v.userId); return `${u?.name || ''} ${v.channelName}`; }}
        searchPlaceholder="Tìm theo tên, kênh..."
        hideTrashToggle={true}
        primaryAction={channels.length > 0 ? (
          <button onClick={() => syncFetcher.submit({ channelDbId: 'ALL', month: String(syncMonth), year: String(syncYear) }, { method: 'post', action: '/api/youtube/sync' })} disabled={syncFetcher.state === 'submitting'} className="p-2 bg-surface-50 border border-surface-200 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Sync tất cả kênh">
            <RefreshCw className={`h-4 w-4 ${syncFetcher.state === 'submitting' ? 'animate-spin' : ''}`} />
          </button>
        ) : undefined}
        onView={(v) => { setSelectedView(v); setDetailModalOpen(true); }}
        onEdit={undefined}
        onSoftDelete={isAdmin ? (id) => fetcher.submit({ intent: 'softDelete', id }, { method: 'post' }) : undefined}
        onRestore={isAdmin ? (id) => fetcher.submit({ intent: 'restore', id }, { method: 'post' }) : undefined}
        customActions={(v) => {
          const ch = channels.find((c: any) => c.id === v.channelId || c.channelName === v.channelName);
          return (
            <div className="flex items-center gap-1 mr-1">
              {ch && <button onClick={() => syncFetcher.submit({ channelDbId: ch.id, month: String(v.month), year: String(v.year) }, { method: 'post', action: '/api/youtube/sync' })} disabled={syncFetcher.state === 'submitting'} className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors" title="Sync kênh"><RefreshCw className={`h-3.5 w-3.5 ${syncFetcher.state === 'submitting' ? 'animate-spin' : ''}`} /></button>}
              {isAdmin && v.status === 'PENDING' && !v.isDeleted && (<><button onClick={() => fetcher.submit({ intent: 'approve', id: v.id }, { method: 'post' })} className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" title="Duyệt"><Check className="h-3.5 w-3.5" /></button><button onClick={() => fetcher.submit({ intent: 'reject', id: v.id }, { method: 'post' })} className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors" title="Từ chối"><X className="h-3.5 w-3.5" /></button></>)}
              {ch && <button onClick={() => { if(confirm(`Hủy kết nối "${ch.channelName}"?`)) fetcher.submit({ intent: 'deleteChannel', channelDbId: ch.id }, { method: 'post' }); }} className="p-1.5 bg-surface-50 text-surface-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Hủy kết nối"><Trash2 className="h-3.5 w-3.5" /></button>}
            </div>
          );
        }}
      />

      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title={editingView ? 'Cập nhật View YouTube' : 'Khai báo View YouTube'}>
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          {isAdmin && <div><label className="block text-[12px] font-semibold text-surface-700 mb-1">Nhân viên</label><select className="w-full text-[13px] bg-surface-50 border border-surface-200 rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/30" value={formData.userId} onChange={e => setFormData({...formData, userId: e.target.value})}>{users.filter((u: any) => !u.isDeleted).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>}
          <Input label="Tên kênh" required placeholder="Kênh Khám Phá Creator" value={formData.channelName} onChange={e => setFormData({...formData, channelName: e.target.value})} />
          <div className="grid grid-cols-2 gap-3"><div><label className="block text-[12px] font-semibold text-surface-700 mb-1">Tháng</label><select className="w-full text-[13px] bg-surface-50 border border-surface-200 rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/30" value={formData.month} onChange={e => setFormData({...formData, month: Number(e.target.value)})}><>{[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>T{m}</option>)}</></select></div><Input label="Năm" type="number" required value={formData.year} onChange={e => setFormData({...formData, year: Number(e.target.value)})} /></div>
          <Input label="Lượt xem" type="number" step="10000" min="0" required value={formData.viewCount} onChange={e => setFormData({...formData, viewCount: Number(e.target.value)})} />
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between"><span className="text-[12px] font-semibold text-rose-800">Thưởng ước tính:</span><span className="text-base font-bold text-rose-600">{formatCurrency(estimatedBonus)}</span></div>
          <div><label className="block text-[12px] font-semibold text-surface-700 mb-1">Ghi chú</label><textarea rows={2} placeholder="Link video hoặc ghi chú..." value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full text-[13px] bg-surface-50 border border-surface-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/30" /></div>
          <div className="flex justify-end gap-2 pt-3 border-t border-surface-100"><Button variant="outline" type="button" onClick={() => setFormModalOpen(false)}>Hủy</Button><Button type="submit">{editingView ? 'Lưu' : 'Gửi'}</Button></div>
        </form>
      </Modal>

      {selectedView && (
        <DetailModal isOpen={isDetailModalOpen} onClose={() => setDetailModalOpen(false)} title="Chi tiết View YouTube"
          data={{ employee: { label: 'Nhân viên', value: users.find((u: any) => u.id === selectedView.userId)?.name }, channel: { label: 'Kênh', value: selectedView.channelName }, period: { label: 'Kỳ', value: `T${selectedView.month}/${selectedView.year}` }, viewCount: { label: 'View', value: selectedView.viewCount.toLocaleString('vi-VN') }, bonus: { label: 'Thưởng', value: formatCurrency(selectedView.amount) }, note: { label: 'Ghi chú', value: selectedView.note || '—' }, status: { label: 'Trạng thái', value: selectedView.status } }} />
      )}
    </div>
  );
}
