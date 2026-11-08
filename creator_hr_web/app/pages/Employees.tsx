import React, { useState } from 'react';
import { useFetcher } from 'react-router';
import { DataTable, Column } from '~/components/common/DataTable';
import { DetailModal } from '~/components/common/DetailModal';
import { Modal } from '~/components/ui/Modal';
import { Input } from '~/components/ui/Input';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { UserPlus, Shield, Users, UserCheck } from 'lucide-react';
import { formatCurrency, formatDate } from '~/lib/utils';

type User = any;
type SalaryHistory = any;

interface Props { loaderData: { users: User[]; salaryHistories: SalaryHistory[] }; currentUser: User; }

export function Employees({ loaderData, currentUser }: Props) {
  const { users, salaryHistories } = loaderData;
  const fetcher = useFetcher();
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
  const isAdmin = currentUser?.role === 'ADMIN';

  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const activeUsers = users.filter((u: User) => u.isActive && !u.isDeleted).length;
  const adminCount = users.filter((u: User) => u.role === 'ADMIN').length;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'EMPLOYEE' as User['role'],
    hourlyRate: 50000,
    viewBonusRate: 5000,
    bankAccount: '',
    bankName: 'Vietcombank',
    joinedDate: new Date().toISOString().split('T')[0]
  });

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-rose-600 font-bold bg-rose-50 rounded-2xl border border-rose-200">
        Bạn không có quyền truy cập trang Quản lý Nhân viên.
      </div>
    );
  }

  const handleOpenForm = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        hourlyRate: user.hourlyRate,
        viewBonusRate: user.viewBonusRate || 5000,
        bankAccount: user.bankAccount || '',
        bankName: user.bankName || 'Vietcombank',
        joinedDate: user.joinedDate || new Date().toISOString().split('T')[0]
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'EMPLOYEE',
        hourlyRate: 50000,
        viewBonusRate: 5000,
        bankAccount: '',
        bankName: 'Vietcombank',
        joinedDate: new Date().toISOString().split('T')[0]
      });
    }
    setFormModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      fetcher.submit({ intent: 'update', id: editingUser.id, ...formData }, { method: 'post' });
    } else {
      fetcher.submit({ intent: 'add', ...formData }, { method: 'post' });
    }
    setFormModalOpen(false);
  };

  const handleViewDetail = (user: User) => {
    setSelectedUser(user);
    setDetailModalOpen(true);
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Họ và Tên',
      sortable: true,
      accessor: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-700 font-bold text-sm">
            {u.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-gray-900">{u.name}</div>
            <div className="text-xs text-gray-500">{u.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Vai trò',
      sortable: true,
      accessor: (u) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
        }`}>
          <Shield className="h-3 w-3" />
          {u.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}
        </span>
      )
    },
    {
      key: 'viewBonusRate',
      header: 'Thưởng / 1k View',
      sortable: true,
      accessor: (u) => (
        <span className="font-bold text-blue-600">
          {formatCurrency(u.viewBonusRate || 5000)}
        </span>
      )
    },
    {
      key: 'hourlyRate',
      header: 'Lương / Giờ',
      sortable: true,
      accessor: (u) => (
        <span className="font-bold text-emerald-600">
          {formatCurrency(u.hourlyRate)}
        </span>
      )
    },
    {
      key: 'phone',
      header: 'Số điện thoại',
      accessor: (u) => u.phone || '—'
    },
    {
      key: 'joinedDate',
      header: 'Ngày vào làm',
      sortable: true,
      accessor: (u) => (
        <span className="font-semibold text-gray-800">
          {u.joinedDate ? formatDate(u.joinedDate) : '—'}
        </span>
      )
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      accessor: (u) => (
        <Badge variant={u.isActive && !u.isDeleted ? 'success' : 'warning'}>
          {u.isDeleted ? 'Đã xóa mềm' : u.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
        </Badge>
      )
    }
  ];

  const filterOptions = [
    {
      label: 'Vai trò',
      key: 'role' as keyof User,
      options: [
        { label: 'Quản trị viên', value: 'ADMIN' },
        { label: 'Nhân viên', value: 'EMPLOYEE' }
      ]
    }
  ];

  return (
    <div className="space-y-5">
      {/* Header + stat bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-surface-900">Quản lý Nhân viên</h2>
          <p className="text-[13px] text-surface-500 mt-0.5">Danh sách nhân sự, phân quyền và cấu hình lương.</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl">
          <UserPlus className="mr-2 h-4 w-4" />
          Thêm nhân viên
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-surface-200 p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-surface-100 text-surface-600"><Users className="h-4 w-4" /></div>
          <div><p className="text-[11px] text-surface-500 font-medium">Tổng</p><p className="text-base font-bold text-surface-900">{users.length}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-surface-200 p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><UserCheck className="h-4 w-4" /></div>
          <div><p className="text-[11px] text-surface-500 font-medium">Đang hoạt động</p><p className="text-base font-bold text-surface-900">{activeUsers}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-surface-200 p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600"><Shield className="h-4 w-4" /></div>
          <div><p className="text-[11px] text-surface-500 font-medium">Quản trị viên</p><p className="text-base font-bold text-surface-900">{adminCount}</p></div>
        </div>
      </div>

      {/* Main DataTable */}
      <DataTable
        data={users}
        columns={columns}
        searchKey={(u) => `${u.name} ${u.email} ${u.phone} ${u.joinedDate || ''}`}
        searchPlaceholder="Tìm theo tên, email, sđt, ngày vào làm..."
        filterOptions={filterOptions}
        onView={handleViewDetail}
        onEdit={(u) => handleOpenForm(u)}
        onSoftDelete={(id) => fetcher.submit({ intent: 'softDelete', id }, { method: 'post' })}
        onRestore={(id) => fetcher.submit({ intent: 'restore', id }, { method: 'post' })}
      />

      {/* Add / Edit Form Modal */}
      <Modal 
        isOpen={isFormModalOpen} 
        onClose={() => setFormModalOpen(false)} 
        title={editingUser ? "Cập nhật hồ sơ nhân viên" : "Thêm nhân viên mới"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Input 
            label="Họ và Tên" 
            required 
            placeholder="Nguyễn Văn A" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Email công ty" 
              type="email" 
              required 
              placeholder="nva@creatorhr.vn" 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
            />
            <Input 
              label="Số điện thoại" 
              placeholder="0912345678" 
              value={formData.phone} 
              onChange={(e) => setFormData({...formData, phone: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Ngày vào làm" 
              type="date" 
              required
              value={formData.joinedDate} 
              onChange={(e) => setFormData({...formData, joinedDate: e.target.value})} 
            />

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Phân quyền vai trò</label>
              <select 
                className="w-full text-sm bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-primary-500"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value as User['role']})}
              >
                <option value="EMPLOYEE">Nhân viên</option>
                <option value="ADMIN">Quản trị viên (Admin)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Lương theo giờ (VNĐ)" 
              type="number" 
              step="5000" 
              min="0" 
              required 
              value={formData.hourlyRate} 
              onChange={(e) => setFormData({...formData, hourlyRate: Number(e.target.value)})} 
            />
            <Input 
              label="Mức thưởng View (VNĐ / 1.000 View)" 
              type="number" 
              step="500" 
              min="0" 
              required 
              value={formData.viewBonusRate} 
              onChange={(e) => setFormData({...formData, viewBonusRate: Number(e.target.value)})} 
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Ngân hàng thụ hưởng" 
              placeholder="Vietcombank / Techcombank" 
              value={formData.bankName} 
              onChange={(e) => setFormData({...formData, bankName: e.target.value})} 
            />
            <Input 
              label="Số tài khoản ngân hàng" 
              placeholder="190300112233" 
              value={formData.bankAccount} 
              onChange={(e) => setFormData({...formData, bankAccount: e.target.value})} 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" type="button" onClick={() => setFormModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" className="bg-primary-600 text-white font-bold">
              {editingUser ? "Lưu thay đổi" : "Thêm mới"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Salary History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Lịch sử thay đổi lương - ${selectedUser?.name}`}
      >
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Thời gian</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Lương giờ (Cũ -&gt; Mới)</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Thưởng 1k View (Cũ -&gt; Mới)</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Người đổi</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salaryHistories.filter(h => h.userId === selectedUser?.id).length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 font-medium">Chưa có lịch sử thay đổi lương</td></tr>
                ) : (
                  salaryHistories.filter(h => h.userId === selectedUser?.id).map(h => (
                    <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-900 font-medium whitespace-nowrap">{formatDate(h.changedAt)} {new Date(h.changedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit'})}</td>
                      <td className="px-4 py-3 text-xs text-gray-900">
                        <span className="text-gray-500 line-through mr-2">{formatCurrency(h.oldHourlyRate)}</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(h.newHourlyRate)}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900">
                        <span className="text-gray-500 line-through mr-2">{formatCurrency(h.oldViewBonusRate)}</span>
                        <span className="font-bold text-blue-600">{formatCurrency(h.newViewBonusRate)}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900 font-medium">{h.changedBy}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{h.note || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setHistoryModalOpen(false)}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>

      {selectedUser && (
        <DetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Hồ sơ chi tiết: ${selectedUser.name}`}
          data={{
            name: { label: 'Họ và tên', value: selectedUser.name },
            email: { label: 'Email công ty', value: selectedUser.email },
            phone: { label: 'Số điện thoại', value: selectedUser.phone || 'Chưa cập nhật' },
            joinedDate: { label: 'Ngày vào làm', value: selectedUser.joinedDate ? formatDate(selectedUser.joinedDate) : 'Chưa cập nhật' },
            role: { label: 'Vai trò tài khoản', value: selectedUser.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên' },
            hourlyRate: { label: 'Mức lương theo giờ', value: formatCurrency(selectedUser.hourlyRate) },
            viewBonusRate: { label: 'Thưởng KPI 1.000 View', value: formatCurrency(selectedUser.viewBonusRate || 5000) },
            bank: { label: 'Tài khoản ngân hàng', value: `${selectedUser.bankName || ''} - ${selectedUser.bankAccount || 'Chưa có'}` },
            status: { label: 'Trạng thái', value: selectedUser.isDeleted ? 'Đã xóa mềm' : selectedUser.isActive ? 'Đang hoạt động' : 'Tạm khóa' }
          }}
        />
      )}
    </div>
  );
}
