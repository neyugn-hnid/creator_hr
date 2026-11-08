import React, { useState } from 'react';
import { useFetcher } from 'react-router';
import { DataTable, Column } from '~/components/common/DataTable';
import { DetailModal } from '~/components/common/DetailModal';
import { ExportModal } from '~/components/common/ExportModal';
import { Modal } from '~/components/ui/Modal';
import { Input } from '~/components/ui/Input';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { Plus, Download, Lock, Unlock } from 'lucide-react';
import { formatCurrency, formatDate } from '~/lib/utils';

type BonusPenalty = any;
type PayrollRecord = any;

interface Props {
  loaderData: { payrolls: PayrollRecord[]; bonusPenalties: BonusPenalty[]; users: any[]; attendances: any[]; youtubeViews: any[]; isAdmin: boolean };
  currentUser: any;
}

export function Payroll({ loaderData, currentUser }: Props) {
  const { payrolls, bonusPenalties, users, attendances, youtubeViews, isAdmin } = loaderData;
  const fetcher = useFetcher();
  const [activeTab, setActiveTab] = useState<'PAYROLL' | 'BONUS_PENALTY'>('PAYROLL');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isBpFormModalOpen, setBpFormModalOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [bpFormData, setBpFormData] = useState({ userId: currentUser?.id || '', type: 'BONUS' as string, category: 'Sáng tạo xuất sắc', amount: 1000000, reason: '' });

  const isMonthLocked = payrolls.some((p: any) => p.month === selectedMonth && p.year === selectedYear && p.status === 'LOCKED');

  const computedPayrolls: PayrollRecord[] = users.filter((u: any) => !u.isDeleted).map((user: any) => {
    const lockedP = payrolls.find((p: any) => p.userId === user.id && p.month === selectedMonth && p.year === selectedYear);
    if (lockedP) return lockedP;
    const userAttendances = attendances.filter((a: any) => { if (a.userId !== user.id || a.isDeleted) return false; const d = new Date(a.date); return d.getMonth()+1 === selectedMonth && d.getFullYear() === selectedYear; });
    const totalWorkHours = userAttendances.reduce((acc: number, curr: any) => acc + curr.workHours, 0);
    const totalHourlyPay = userAttendances.reduce((acc: number, curr: any) => acc + curr.amount, 0);
    const userViews = youtubeViews.filter((v: any) => v.userId === user.id && v.month === selectedMonth && v.year === selectedYear && v.status === 'APPROVED' && !v.isDeleted);
    const youtubeBonus = userViews.reduce((acc: number, curr: any) => acc + curr.amount, 0);
    const userBP = bonusPenalties.filter((bp: any) => { if (bp.userId !== user.id || bp.isDeleted) return false; const d = new Date(bp.date); return d.getMonth()+1 === selectedMonth && d.getFullYear() === selectedYear; });
    const otherBonus = userBP.filter((bp: any) => bp.type === 'BONUS').reduce((acc: number, curr: any) => acc + curr.amount, 0);
    const totalPenalty = userBP.filter((bp: any) => bp.type === 'PENALTY').reduce((acc: number, curr: any) => acc + curr.amount, 0);
    return { id: `p_${user.id}_${selectedMonth}_${selectedYear}`, userId: user.id, month: selectedMonth, year: selectedYear, totalWorkHours, baseHourlyWage: user.hourlyRate, totalHourlyPay, youtubeBonus, otherBonus, totalPenalty, finalSalary: totalHourlyPay + youtubeBonus + otherBonus - totalPenalty, status: 'DRAFT', isDeleted: false };
  });

  const visiblePayrolls = isAdmin ? computedPayrolls : computedPayrolls.filter((p: any) => p.userId === currentUser?.id);
  const visibleBonusPenalties = isAdmin ? bonusPenalties : bonusPenalties.filter((bp: any) => bp.userId === currentUser?.id);

  const payrollColumns: Column<PayrollRecord>[] = [
    { key: 'userId', header: 'Nhân viên', sortable: true, accessor: (p) => { const u = users.find((i: any) => i.id === p.userId); return <div><div className="font-semibold text-[13px] text-surface-800">{u?.name || p.userId}</div><div className="text-[11px] text-surface-400">{u?.department}</div></div>; } },
    { key: 'totalWorkHours', header: 'Giờ', sortable: true, accessor: (p) => <span className="text-[13px] text-surface-700">{p.totalWorkHours}h</span> },
    { key: 'totalHourlyPay', header: 'Lương giờ', sortable: true, accessor: (p) => <span className="text-[13px] text-surface-700">{formatCurrency(p.totalHourlyPay)}</span> },
    { key: 'youtubeBonus', header: 'Thưởng View', sortable: true, accessor: (p) => <span className="text-[13px] font-medium text-rose-600">{formatCurrency(p.youtubeBonus)}</span> },
    { key: 'otherBonus', header: 'Thưởng khác', sortable: true, accessor: (p) => <span className="text-[13px]">{formatCurrency(p.otherBonus)}</span> },
    { key: 'totalPenalty', header: 'Phạt', sortable: true, accessor: (p) => <span className="text-[13px] font-medium text-rose-500">-{formatCurrency(p.totalPenalty)}</span> },
    { key: 'finalSalary', header: 'Thực lĩnh', sortable: true, accessor: (p) => <span className="text-[13px] font-bold text-emerald-600">{formatCurrency(p.finalSalary)}</span> },
    { key: 'status', header: 'Trạng thái', accessor: (p) => <Badge variant={p.status === 'LOCKED' ? 'success' : 'warning'}>{p.status === 'LOCKED' ? 'Đã khóa' : 'Dự thảo'}</Badge> }
  ];

  const bpColumns: Column<BonusPenalty>[] = [
    { key: 'userId', header: 'Nhân viên', sortable: true, accessor: (bp) => { const u = users.find((i: any) => i.id === bp.userId); return <div><div className="font-semibold text-[13px] text-surface-800">{u?.name || bp.userId}</div><div className="text-[11px] text-surface-400">{u?.department}</div></div>; } },
    { key: 'type', header: 'Loại', sortable: true, accessor: (bp) => <span className={`text-[12px] font-medium px-2 py-0.5 rounded ${bp.type === 'BONUS' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{bp.type === 'BONUS' ? 'Thưởng' : 'Phạt'}</span> },
    { key: 'category', header: 'Danh mục', accessor: (bp) => <span className="text-[13px]">{bp.category}</span> },
    { key: 'amount', header: 'Số tiền', sortable: true, accessor: (bp) => <span className={`text-[13px] font-semibold ${bp.type === 'BONUS' ? 'text-emerald-600' : 'text-rose-600'}`}>{bp.type === 'BONUS' ? '+' : '-'}{formatCurrency(bp.amount)}</span> },
    { key: 'reason', header: 'Lý do', accessor: (bp) => <span className="text-[13px] text-surface-500">{bp.reason}</span> },
    { key: 'date', header: 'Ngày', accessor: (bp) => <span className="text-[13px] text-surface-500">{formatDate(bp.date)}</span> }
  ];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-surface-900">Bảng lương & Thưởng phạt</h2>
          <p className="text-[13px] text-surface-500 mt-0.5">Tính lương tự động từ giờ làm, thưởng View, thưởng/phạt.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setExportModalOpen(true)} size="sm"><Download className="mr-1.5 h-3.5 w-3.5" />Xuất</Button>
          {isAdmin && <Button onClick={() => setBpFormModalOpen(true)} size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Thưởng / Phạt</Button>}
        </div>
      </div>

      {/* Tab bar + month picker */}
      <div className="bg-white rounded-xl border border-surface-200 p-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-surface-100 rounded-lg p-0.5">
          <button onClick={() => setActiveTab('PAYROLL')} className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${activeTab === 'PAYROLL' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}>Bảng lương</button>
          <button onClick={() => setActiveTab('BONUS_PENALTY')} className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${activeTab === 'BONUS_PENALTY' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}>Thưởng & Phạt</button>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="text-[12px] bg-surface-50 border border-surface-200 rounded-lg px-2.5 py-1.5 font-medium"><>{[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>T{m}</option>)}</></select>
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="text-[12px] bg-surface-50 border border-surface-200 rounded-lg px-2.5 py-1.5 font-medium"><>{[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}</></select>
          {isAdmin && activeTab === 'PAYROLL' && (
            isMonthLocked
              ? <Button onClick={() => fetcher.submit({ intent: 'unlockPayroll', month: String(selectedMonth), year: String(selectedYear) }, { method: 'post' })} variant="outline" size="sm"><Unlock className="mr-1.5 h-3.5 w-3.5" />Mở khóa</Button>
              : <Button onClick={() => fetcher.submit({ intent: 'lockPayroll', month: String(selectedMonth), year: String(selectedYear) }, { method: 'post' })} size="sm"><Lock className="mr-1.5 h-3.5 w-3.5" />Chốt lương</Button>
          )}
        </div>
      </div>

      {activeTab === 'PAYROLL' && (
        <DataTable data={visiblePayrolls} columns={payrollColumns} searchKey={(p) => { const u = users.find((i: any) => i.id === p.userId); return u?.name || ''; }} searchPlaceholder="Tìm nhân viên..." onView={(p) => { setSelectedItem(p); setDetailModalOpen(true); }} />
      )}

      {activeTab === 'BONUS_PENALTY' && (
        <DataTable data={visibleBonusPenalties} columns={bpColumns} searchKey={(bp) => { const u = users.find((i: any) => i.id === bp.userId); return `${u?.name || ''} ${bp.reason}`; }} searchPlaceholder="Tìm nhân viên, lý do..." onView={(bp) => { setSelectedItem(bp); setDetailModalOpen(true); }} onSoftDelete={isAdmin ? (id) => fetcher.submit({ intent: 'softDeleteBonusPenalty', id }, { method: 'post' }) : undefined} onRestore={isAdmin ? (id) => fetcher.submit({ intent: 'restoreBonusPenalty', id }, { method: 'post' }) : undefined} />
      )}

      <Modal isOpen={isBpFormModalOpen} onClose={() => setBpFormModalOpen(false)} title="Thưởng / Phạt">
        <form onSubmit={(e) => { e.preventDefault(); fetcher.submit({ intent: 'addBonusPenalty', ...bpFormData, amount: String(bpFormData.amount), month: String(selectedMonth), year: String(selectedYear) }, { method: 'post' }); setBpFormModalOpen(false); }} className="space-y-3 pt-2">
          <div><label className="block text-[12px] font-semibold text-surface-700 mb-1">Nhân viên</label><select className="w-full text-[13px] bg-surface-50 border border-surface-200 rounded-lg px-3 py-2 font-medium" value={bpFormData.userId} onChange={e => setBpFormData({...bpFormData, userId: e.target.value})}>{users.filter((u: any) => !u.isDeleted).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[12px] font-semibold text-surface-700 mb-1">Loại</label><select className="w-full text-[13px] bg-surface-50 border border-surface-200 rounded-lg px-3 py-2 font-medium" value={bpFormData.type} onChange={e => setBpFormData({...bpFormData, type: e.target.value})}><option value="BONUS">Thưởng (+)</option><option value="PENALTY">Phạt (-)</option></select></div>
            <Input label="Số tiền" type="number" step="50000" required value={bpFormData.amount} onChange={e => setBpFormData({...bpFormData, amount: Number(e.target.value)})} />
          </div>
          <Input label="Danh mục" placeholder="Sáng tạo xuất sắc..." value={bpFormData.category} onChange={e => setBpFormData({...bpFormData, category: e.target.value})} />
          <div><label className="block text-[12px] font-semibold text-surface-700 mb-1">Lý do</label><textarea rows={2} required placeholder="Mô tả lý do..." value={bpFormData.reason} onChange={e => setBpFormData({...bpFormData, reason: e.target.value})} className="w-full text-[13px] bg-surface-50 border border-surface-200 rounded-lg p-2.5" /></div>
          <div className="flex justify-end gap-2 pt-3 border-t border-surface-100"><Button variant="outline" type="button" onClick={() => setBpFormModalOpen(false)}>Hủy</Button><Button type="submit">Lưu</Button></div>
        </form>
      </Modal>

      {selectedItem && (
        <DetailModal isOpen={isDetailModalOpen} onClose={() => setDetailModalOpen(false)} title="Chi tiết"
          data={selectedItem.finalSalary !== undefined ? {
            employee: { label: 'Nhân viên', value: users.find((u: any) => u.id === selectedItem.userId)?.name },
            period: { label: 'Kỳ', value: `T${selectedItem.month}/${selectedItem.year}` },
            hours: { label: 'Giờ làm', value: `${selectedItem.totalWorkHours}h` },
            basePay: { label: 'Lương giờ', value: formatCurrency(selectedItem.totalHourlyPay) },
            youtubeBonus: { label: 'Thưởng View', value: formatCurrency(selectedItem.youtubeBonus) },
            otherBonus: { label: 'Thưởng khác', value: formatCurrency(selectedItem.otherBonus) },
            penalty: { label: 'Phạt', value: `-${formatCurrency(selectedItem.totalPenalty)}` },
            finalSalary: { label: 'Thực lĩnh', value: formatCurrency(selectedItem.finalSalary) }
          } : {
            employee: { label: 'Nhân viên', value: users.find((u: any) => u.id === selectedItem.userId)?.name },
            type: { label: 'Loại', value: selectedItem.type === 'BONUS' ? 'Thưởng' : 'Phạt' },
            category: { label: 'Danh mục', value: selectedItem.category },
            amount: { label: 'Số tiền', value: formatCurrency(selectedItem.amount) },
            reason: { label: 'Lý do', value: selectedItem.reason },
            date: { label: 'Ngày', value: formatDate(selectedItem.date) }
          }} />
      )}

      <ExportModal isOpen={isExportModalOpen} onClose={() => setExportModalOpen(false)} title={`Bảng lương T${selectedMonth}/${selectedYear}`} filename={`Bang_luong_${selectedMonth}_${selectedYear}`} data={visiblePayrolls.map((p: any) => ({ 'Họ tên': users.find((u: any) => u.id === p.userId)?.name || p.userId, 'Giờ': p.totalWorkHours, 'Lương giờ': p.totalHourlyPay, 'Thưởng View': p.youtubeBonus, 'Thưởng khác': p.otherBonus, 'Phạt': p.totalPenalty, 'Thực lĩnh': p.finalSalary, 'Trạng thái': p.status }))} />
    </div>
  );
}
