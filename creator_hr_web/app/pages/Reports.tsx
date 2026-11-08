import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { Download, BarChart3, PieChart as PieIcon } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { formatCurrency } from '~/lib/utils';

interface Props {
  loaderData: {
    users: any[];
    attendances: any[];
    youtubeViews: any[];
    revenues: any[];
    bonusPenalties: any[];
    payrolls: any[];
  };
  currentUser: any;
}

export function Reports({ loaderData }: Props) {
  const { users, attendances, youtubeViews, revenues, bonusPenalties } = loaderData;

  const COLORS = ['#FF0000', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

  // Department payroll distribution
  const deptDataMap: Record<string, number> = {};
  users.filter(u => !u.isDeleted).forEach(u => {
    const dept = u.department || 'Khác';
    const uPay = attendances.filter((a: any) => a.userId === u.id && !a.isDeleted)
      .reduce((acc: number, a: any) => acc + Number(a.amount), 0);
    deptDataMap[dept] = (deptDataMap[dept] || 0) + uPay;
  });
  const deptChartData = Object.entries(deptDataMap).map(([name, value]) => ({ name, value }));

  // Punctuality
  const onTimeCount = attendances.filter((a: any) => a.status === 'PRESENT' && !a.isDeleted).length;
  const lateCount = attendances.filter((a: any) => a.status === 'LATE' && !a.isDeleted).length;
  const punctualityData = [
    { name: 'Đúng giờ', value: onTimeCount },
    { name: 'Đi muộn', value: lateCount }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Báo cáo & Thống kê Chuyên sâu</h2>
          <p className="text-xs text-gray-500 mt-1">Phân tích chi phí quỹ lương, kỷ luật chấm công và hiệu suất tăng trưởng công ty.</p>
        </div>
        <Button onClick={() => window.print()} className="bg-gray-900 hover:bg-black text-white font-bold rounded-xl">
          <Download className="mr-2 h-4 w-4" />
          In báo cáo tổng hợp
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Salary */}
        <Card className="border-gray-100">
          <CardHeader className="border-b border-gray-100 pb-3">
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-primary-600" />
              <span>Phân bổ Chi phí Lương theo Phòng ban</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deptChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {deptChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => [formatCurrency(val), 'Chi phí lương']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
              {deptChartData.map((d, idx) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="font-semibold text-gray-700">{d.name}:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(d.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Punctuality Chart */}
        <Card className="border-gray-100">
          <CardHeader className="border-b border-gray-100 pb-3">
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              <span>Tỷ lệ Đi làm Đúng giờ vs Đi muộn</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col items-center justify-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={punctualityData}
                    cx="50%" cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2 text-xs font-bold">
              <span className="text-emerald-700">Đúng giờ: {onTimeCount} lượt</span>
              <span className="text-amber-700">Đi muộn: {lateCount} lượt</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
