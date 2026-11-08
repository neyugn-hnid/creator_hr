import React, { useState } from 'react';
import { useFetcher } from 'react-router';
import { DataTable, Column } from '~/components/common/DataTable';
import { DetailModal } from '~/components/common/DetailModal';
import { Modal } from '~/components/ui/Modal';
import { Input } from '~/components/ui/Input';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { CalendarX, Plus, Check, X } from 'lucide-react';
import { formatDate } from '~/lib/utils';

type LeaveRequest = any;

interface Props {
  loaderData: { leaveRequests: LeaveRequest[]; users: any[]; isAdmin: boolean };
  currentUser: any;
}

export function LeavesPage({ loaderData, currentUser }: Props) {
  const { leaveRequests, users, isAdmin } = loaderData;
  const fetcher = useFetcher();

  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    userId: currentUser?.id || '',
    date: todayStr,
    type: 'LEAVE' as string,
    expectedTime: '09:00',
    reason: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetcher.submit({ intent: 'add', ...formData }, { method: 'post' });
    setFormModalOpen(false);
  };

  // Visible items (Employees see own requests, Admin sees all)
  const visibleRequests = isAdmin
    ? leaveRequests
    : leaveRequests.filter((l: any) => l.userId === currentUser?.id);

  const columns: Column<LeaveRequest>[] = [
    {
      key: 'userId',
      header: 'Nhân viên',
      sortable: true,
      accessor: (l) => {
        const u = users.find(item => item.id === l.userId);
        return (
          <div>
            <div className="font-bold text-gray-900">{u?.name || l.userId}</div>
            <div className="text-[11px] text-gray-500">{u?.department}</div>
          </div>
        );
      }
    },
    {
      key: 'type',
      header: 'Loại thông báo',
      sortable: true,
      accessor: (l) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
          l.type === 'LEAVE' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
        }`}>
          {l.type === 'LEAVE' ? 'Báo nghỉ phép' : `Báo đi muộn (${l.expectedTime || '—'})`}
        </span>
      )
    },
    {
      key: 'date',
      header: 'Ngày xin báo',
      sortable: true,
      accessor: (l) => formatDate(l.date)
    },
    {
      key: 'reason',
      header: 'Lý do xin phép',
      accessor: (l) => (
        <span className="text-xs text-gray-700 font-medium line-clamp-1 max-w-xs">
          {l.reason}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      sortable: true,
      accessor: (l) => {
        const map = {
          PENDING: { label: 'Chờ duyệt', variant: 'warning' as const },
          APPROVED: { label: 'Đã chấp thuận', variant: 'success' as const },
          REJECTED: { label: 'Bị từ chối', variant: 'danger' as const }
        };
        const item = map[l.status] || map.PENDING;
        return <Badge variant={item.variant}>{item.label}</Badge>;
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Quản lý Báo nghỉ & Báo đi muộn</h2>
          <p className="text-xs text-gray-500 mt-1">
            Gửi yêu cầu xin nghỉ hoặc báo trước giờ đến muộn để tránh bị hệ thống phạt tự động.
          </p>
        </div>

        <Button 
          onClick={() => setFormModalOpen(true)} 
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tạo đơn báo xin phép
        </Button>
      </div>

      {/* Main DataTable */}
      <DataTable
        data={visibleRequests}
        columns={columns}
        searchKey={(l) => {
          const u = users.find(item => item.id === l.userId);
          return `${u?.name || ''} ${l.reason} ${l.date}`;
        }}
        searchPlaceholder="Tìm theo tên nhân viên, lý do, ngày..."
        onView={(l) => {
          setSelectedLeave(l);
          setDetailModalOpen(true);
        }}
        onSoftDelete={isAdmin ? (id) => fetcher.submit({ intent: 'softDelete', id }, { method: 'post' }) : undefined}
        onRestore={isAdmin ? (id) => fetcher.submit({ intent: 'restore', id }, { method: 'post' }) : undefined}
        customActions={isAdmin ? (l) => (
          l.status === 'PENDING' && !l.isDeleted ? (
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={() => fetcher.submit({ intent: 'approve', id: l.id }, { method: 'post' })}
                className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                title="Duyệt đồng ý"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => fetcher.submit({ intent: 'reject', id: l.id }, { method: 'post' })}
                className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors"
                title="Từ chối đơn"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null
        ) : undefined}
      />

      {/* Form Modal */}
      <Modal 
        isOpen={isFormModalOpen} 
        onClose={() => setFormModalOpen(false)} 
        title="Tạo đơn báo nghỉ / Báo đi muộn"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {isAdmin && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nhân viên gửi</label>
              <select 
                className="w-full text-sm bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-primary-500"
                value={formData.userId}
                onChange={(e) => setFormData({...formData, userId: e.target.value})}
              >
                {users.filter(u => !u.isDeleted).map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Loại xin phép</label>
              <select 
                className="w-full text-sm bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-primary-500"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as LeaveRequest['type']})}
              >
                <option value="LEAVE">Xin nghỉ cả ngày / nửa ngày</option>
                <option value="LATE">Báo trước đi muộn</option>
              </select>
            </div>

            <Input 
              label="Ngày xin báo" 
              type="date" 
              required 
              value={formData.date} 
              onChange={(e) => setFormData({...formData, date: e.target.value})} 
            />
          </div>

          {formData.type === 'LATE' && (
            <Input 
              label="Dự kiến giờ đến công ty Check In" 
              type="time" 
              required 
              value={formData.expectedTime} 
              onChange={(e) => setFormData({...formData, expectedTime: e.target.value})} 
            />
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Lý do xin phép cụ thể</label>
            <textarea
              rows={3}
              required
              placeholder="Nhập lý do chi tiết (ví dụ: Hỏng xe trên đường, Khám bệnh định kỳ...)"
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="w-full text-sm bg-gray-50 border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => setFormModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" className="bg-primary-600 text-white font-bold">
              Gửi đơn xin phép
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {selectedLeave && (
        <DetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title="Chi tiết đơn xin phép"
          data={{
            applicant: { label: 'Người nộp đơn', value: users.find(u => u.id === selectedLeave.userId)?.name },
            type: { label: 'Loại đơn', value: selectedLeave.type === 'LEAVE' ? 'Báo nghỉ' : `Báo đi muộn (Dự kiến: ${selectedLeave.expectedTime})` },
            date: { label: 'Ngày xin phép', value: formatDate(selectedLeave.date) },
            reason: { label: 'Lý do chi tiết', value: selectedLeave.reason },
            status: { label: 'Trạng thái', value: selectedLeave.status },
            createdAt: { label: 'Thời gian nộp đơn', value: formatDate(selectedLeave.createdAt) }
          }}
        />
      )}
    </div>
  );
}
