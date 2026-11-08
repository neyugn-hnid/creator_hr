import React, { useState } from 'react';
import { useFetcher } from 'react-router';
import { DataTable, Column } from '~/components/common/DataTable';
import { DetailModal } from '~/components/common/DetailModal';
import { ExportModal } from '~/components/common/ExportModal';
import { Modal } from '~/components/ui/Modal';
import { Input } from '~/components/ui/Input';
import { Button } from '~/components/ui/Button';
import { TrendingUp, Plus, Download, Youtube } from 'lucide-react';
import { formatCurrency, formatDate } from '~/lib/utils';

type YoutubeRevenue = any;

interface Props {
  loaderData: { revenues: YoutubeRevenue[] };
  currentUser: any;
}

export function YoutubeRevenuePage({ loaderData, currentUser }: Props) {
  const { revenues: youtubeRevenues } = loaderData;
  const fetcher = useFetcher();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [editingRev, setEditingRev] = useState<YoutubeRevenue | null>(null);
  const [selectedRev, setSelectedRev] = useState<YoutubeRevenue | null>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({ channelName: 'Kênh Khám Phá Creator', month: currentMonth, year: currentYear, revenue: 150000000, views: 25000000, notes: '' });

  if (!isAdmin) return <div className="p-8 text-center font-semibold text-surface-500 bg-surface-50 rounded-xl border border-surface-200">Bạn không có quyền truy cập.</div>;

  const handleOpenForm = (r?: YoutubeRevenue) => {
    if (r) { setEditingRev(r); setFormData({ channelName: r.channelName, month: r.month, year: r.year, revenue: r.revenue, views: r.views || 0, notes: r.notes || '' }); }
    else { setEditingRev(null); setFormData({ channelName: 'Kênh Khám Phá Creator', month: currentMonth, year: currentYear, revenue: 150000000, views: 25000000, notes: '' }); }
    setFormModalOpen(true);
  };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); fetcher.submit({ intent: editingRev ? 'update' : 'add', ...(editingRev ? { id: editingRev.id } : {}), ...formData, views: String(formData.views) }, { method: 'post' }); setFormModalOpen(false); };

  const totalRevenueAll = youtubeRevenues.filter((r: any) => !r.isDeleted).reduce((acc: number, r: any) => acc + Number(r.revenue), 0);

  const columns: Column<YoutubeRevenue>[] = [
    { key: 'channelName', header: 'Kênh', sortable: true, accessor: (r) => <span className="text-[13px] font-semibold text-surface-800 flex items-center gap-2"><Youtube className="h-4 w-4 text-rose-500" />{r.channelName}</span> },
    { key: 'month', header: 'Kỳ', sortable: true, accessor: (r) => <span className="text-[13px] text-surface-600">T{r.month}/{r.year}</span> },
    { key: 'views', header: 'View', sortable: true, accessor: (r) => <span className="text-[13px] text-surface-700">{r.views ? `${(r.views/1000000).toFixed(1)}M` : '—'}</span> },
    { key: 'revenue', header: 'Doanh thu', sortable: true, accessor: (r) => <span className="text-[13px] font-bold text-emerald-600">{formatCurrency(r.revenue)}</span> },
    { key: 'notes', header: 'Ghi chú', accessor: (r) => <span className="text-[13px] text-surface-500">{r.notes || '—'}</span> }
  ];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-surface-900">Doanh thu YouTube</h2>
          <p className="text-[13px] text-surface-500 mt-0.5">Ghi nhận doanh thu từ AdSense và hợp tác tài trợ.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setExportModalOpen(true)} size="sm"><Download className="mr-1.5 h-3.5 w-3.5" />Xuất</Button>
          <Button onClick={() => handleOpenForm()} size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Ghi nhận mới</Button>
        </div>
      </div>

      {/* Total Banner */}
      <div className="bg-white rounded-xl border border-surface-200 p-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-surface-500 font-medium uppercase tracking-wider">Tổng doanh thu đã ghi nhận</p>
          <p className="text-2xl font-bold text-surface-900 mt-0.5">{formatCurrency(totalRevenueAll)}</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><TrendingUp className="h-6 w-6" /></div>
      </div>

      {/* DataTable */}
      <DataTable
        data={youtubeRevenues}
        columns={columns}
        searchKey={(r) => `${r.channelName} ${r.notes || ''}`}
        searchPlaceholder="Tìm kênh, ghi chú..."
        onView={(r) => { setSelectedRev(r); setDetailModalOpen(true); }}
        onEdit={(r) => handleOpenForm(r)}
        onSoftDelete={(id) => fetcher.submit({ intent: 'softDelete', id }, { method: 'post' })}
        onRestore={(id) => fetcher.submit({ intent: 'restore', id }, { method: 'post' })}
      />

      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title={editingRev ? 'Cập nhật doanh thu' : 'Ghi nhận doanh thu'}>
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <Input label="Nguồn" required value={formData.channelName} onChange={e => setFormData({...formData, channelName: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[12px] font-semibold text-surface-700 mb-1">Tháng</label><select className="w-full text-[13px] bg-surface-50 border border-surface-200 rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/30" value={formData.month} onChange={e => setFormData({...formData, month: Number(e.target.value)})}><>{[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>T{m}</option>)}</></select></div>
            <Input label="Năm" type="number" required value={formData.year} onChange={e => setFormData({...formData, year: Number(e.target.value)})} />
          </div>
          <Input label="Doanh thu (VNĐ)" type="number" step="1000000" required value={formData.revenue} onChange={e => setFormData({...formData, revenue: Number(e.target.value)})} />
          <Input label="Lượt xem" type="number" value={formData.views} onChange={e => setFormData({...formData, views: Number(e.target.value)})} />
          <div><label className="block text-[12px] font-semibold text-surface-700 mb-1">Ghi chú</label><textarea rows={2} placeholder="AdSense, tài trợ..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full text-[13px] bg-surface-50 border border-surface-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/30" /></div>
          <div className="flex justify-end gap-2 pt-3 border-t border-surface-100"><Button variant="outline" type="button" onClick={() => setFormModalOpen(false)}>Hủy</Button><Button type="submit">{editingRev ? 'Lưu' : 'Lưu'}</Button></div>
        </form>
      </Modal>

      {selectedRev && (
        <DetailModal isOpen={isDetailModalOpen} onClose={() => setDetailModalOpen(false)} title="Chi tiết doanh thu"
          data={{ channel: { label: 'Kênh', value: selectedRev.channelName }, period: { label: 'Kỳ', value: `T${selectedRev.month}/${selectedRev.year}` }, views: { label: 'View', value: selectedRev.views ? selectedRev.views.toLocaleString('vi-VN') : '—' }, revenue: { label: 'Doanh thu', value: formatCurrency(selectedRev.revenue) }, notes: { label: 'Ghi chú', value: selectedRev.notes || '—' }, createdAt: { label: 'Thời gian', value: formatDate(selectedRev.createdAt) } }} />
      )}

      <ExportModal isOpen={isExportModalOpen} onClose={() => setExportModalOpen(false)} title="Báo cáo Doanh thu" filename="Doanh_thu_YouTube" data={youtubeRevenues.map((r: any) => ({ 'Kênh': r.channelName, 'Tháng': r.month, 'Năm': r.year, 'View': r.views || 0, 'Doanh thu': r.revenue, 'Ghi chú': r.notes || '' }))} />
    </div>
  );
}
