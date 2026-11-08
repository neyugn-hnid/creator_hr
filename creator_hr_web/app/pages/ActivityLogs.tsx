import React from 'react';
import { DataTable, Column } from '~/components/common/DataTable';
import { History } from 'lucide-react';
import { formatDate, formatTime } from '~/lib/utils';

interface ActivityLog {
  id: string; actorName: string; action: string; module: string; description: string; timestamp: string;
}

interface Props { loaderData: { activityLogs: ActivityLog[] }; currentUser: any; }

export function ActivityLogs({ loaderData }: Props) {
  const { activityLogs } = loaderData;

  const columns: Column<ActivityLog>[] = [
    {
      key: 'actorName',
      header: 'Tài khoản thực hiện',
      sortable: true,
      accessor: (log) => (
        <span className="font-bold text-gray-900">{log.actorName}</span>
      )
    },
    {
      key: 'action',
      header: 'Hành động',
      sortable: true,
      accessor: (log) => {
        const bgMap: Record<string, string> = {
          'THÊM': 'bg-emerald-100 text-emerald-800',
          'SỬA': 'bg-blue-100 text-blue-800',
          'XÓA_MỀM': 'bg-rose-100 text-rose-800',
          'KHÔI_PHỤC': 'bg-amber-100 text-amber-800',
          'CHỐT_LƯƠNG': 'bg-purple-100 text-purple-800',
          'Duyệt': 'bg-emerald-100 text-emerald-800',
          'Từ chối': 'bg-rose-100 text-rose-800'
        };
        const cls = bgMap[log.action] || 'bg-gray-100 text-gray-800';
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cls}`}>
            {log.action}
          </span>
        );
      }
    },
    {
      key: 'module',
      header: 'Phân hệ',
      sortable: true,
      accessor: (log) => log.module
    },
    {
      key: 'description',
      header: 'Mô tả chi tiết',
      accessor: (log) => log.description
    },
    {
      key: 'timestamp',
      header: 'Thời gian',
      sortable: true,
      accessor: (log) => `${formatDate(log.timestamp)} ${formatTime(log.timestamp)}`
    }
  ];

  const filterOptions = [
    {
      label: 'Phân hệ',
      key: 'module' as keyof ActivityLog,
      options: [
        { label: 'Nhân viên', value: 'Nhân viên' },
        { label: 'Chấm công', value: 'Chấm công' },
        { label: 'Nghỉ phép', value: 'Nghỉ phép' },
        { label: 'View YouTube', value: 'View YouTube' },
        { label: 'Doanh thu', value: 'Doanh thu' },
        { label: 'Thưởng phạt', value: 'Thưởng phạt' },
        { label: 'Bảng lương', value: 'Bảng lương' },
        { label: 'Cài đặt', value: 'Cài đặt' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Nhật ký Hoạt động Hệ thống</h2>
        <p className="text-xs text-gray-500 mt-1">Ghi vết toàn bộ lịch sử thao tác thêm, sửa, xóa mềm, khôi phục và chốt lương của các tài khoản.</p>
      </div>

      <DataTable
        data={activityLogs}
        columns={columns}
        searchKey={(log) => `${log.actorName} ${log.description} ${log.module}`}
        searchPlaceholder="Tìm kiếm theo người thực hiện, nội dung..."
        filterOptions={filterOptions}
      />
    </div>
  );
}
