import React, { useState } from 'react';
import { useFetcher } from 'react-router';
import { 
  Users, UserCheck, UserX, Clock, CalendarX, AlertTriangle, DollarSign,
  Youtube, TrendingUp, Award, Flame, Activity, CheckCircle2, Wifi,
  Briefcase, ArrowUpRight, ShieldCheck, Bell
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/Card';
import { Button } from '~/components/ui/Button';
import { formatCurrency, formatDate, formatTime } from '~/lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

interface Props {
  loaderData: any;
  currentUser: any;
  settings: any;
}

export function Dashboard({ loaderData, currentUser, settings }: Props) {
  const { stats, myAttendance: myTodayRecord, myLeaves, recentNotifications, recentLogs } = loaderData || {};
  const fetcher = useFetcher();
  const isAdmin = currentUser?.role === 'ADMIN';
  const [wifiSsidInput, setWifiSsidInput] = useState(settings?.companyWifiSsid || '');
  const [wifiMessage, setWifiMessage] = useState<{ success?: boolean; text?: string } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth() + 1;

  const totalEmployees = stats?.totalEmployees || 0;
  const checkedInUsersCount = stats?.todayAttendances || 0;
  const workingNowCount = checkedInUsersCount;
  const notCheckedInCount = Math.max(0, totalEmployees - checkedInUsersCount);
  const totalCompanyRevenue = stats?.monthRevenue || 0;
  const totalViewBonus = stats?.myViewsBonusThisMonth || 0;
  const totalCompanyViews = stats?.myViewsThisMonth || 0;
  const totalPayrollToPay = totalCompanyRevenue;

  const myMonthWorkHours = Number(myTodayRecord?.workHours || 0);
  const myMonthDailyPay = Number(myTodayRecord?.amount || 0);
  const myMonthViews = stats?.myViewsBonusThisMonth || 0;
  const myEstimatedSalary = myMonthDailyPay + myMonthViews;

  const monthlyChartData = [
    { name: 'T3', view: 18, revenue: 140, payroll: 75 },
    { name: 'T4', view: 22, revenue: 165, payroll: 82 },
    { name: 'T5', view: 28, revenue: 210, payroll: 95 },
    { name: 'T6', view: 35, revenue: 260, payroll: 110 },
    { name: 'T7', view: 42, revenue: 327, payroll: 135 },
    { name: `T${currentMonth}`, view: Math.round(totalCompanyViews / 1000000), revenue: Math.round(totalCompanyRevenue / 1000000), payroll: Math.round(totalPayrollToPay / 1000000) }
  ];

  const topViewUsers: any[] = [];
  const topEarnerUsers: any[] = [];
  const topLateUsers: any[] = [];
  const todayWorkHours = Number(myTodayRecord?.workHours || 0);
  const todayDailyWage = Number(myTodayRecord?.amount || 0);
  const monthWorkHours = myMonthWorkHours;
  const monthDailyWage = myMonthDailyPay;

  const handleWiFiCheckIn = () => {
    if (!currentUser) return;
    fetcher.submit({ intent: 'checkIn', wifiSsid: wifiSsidInput }, { method: 'post', action: '/attendance' });
    setWifiMessage({ text: 'Đang xử lý Check In...' });
  };
  const handleWiFiCheckOut = () => {
    if (!currentUser) return;
    fetcher.submit({ intent: 'checkOut', wifiSsid: wifiSsidInput }, { method: 'post', action: '/attendance' });
    setWifiMessage({ text: 'Đang xử lý Check Out...' });
  };

  return (
    <div className="space-y-6 pb-8">

      {/* Welcome */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-surface-900">
              Xin chào, {currentUser?.name}
            </h1>
            <p className="text-[13px] text-surface-500 mt-1 max-w-lg">
              {isAdmin 
                ? 'Tổng quan nhân sự, chấm công, hiệu suất YouTube và doanh thu toàn công ty.'
                : 'Theo dõi chấm công, giờ làm, thưởng view YouTube và thu nhập tháng này.'}
            </p>
          </div>
          <div className="flex items-center gap-3 text-[13px] text-surface-500 bg-surface-50 rounded-xl px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{formatDate(todayStr)}</span>
            <span className="text-surface-300">·</span>
            <span className="font-semibold text-surface-700">{workingNowCount} người đang làm</span>
          </div>
        </div>
      </div>

      {isAdmin ? (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              [Users, 'Nhân viên', `${totalEmployees}`, 'surface'],
              [UserCheck, 'Đang làm', `${workingNowCount}`, 'emerald'],
              [UserX, 'Chưa Check In', `${notCheckedInCount}`, 'amber'],
              [Youtube, 'Tổng View', `${(totalCompanyViews / 1000000).toFixed(1)}M`, 'rose'],
              [Clock, 'Giờ hôm nay', `${todayWorkHours}h`, 'blue'],
              [Activity, `Giờ T${currentMonth}`, `${monthWorkHours}h`, 'indigo'],
              [DollarSign, 'Doanh thu', formatCurrency(totalCompanyRevenue), 'emerald'],
              [TrendingUp, 'Lương dự kiến', formatCurrency(totalPayrollToPay), 'surface'],
            ].map(([Icon, label, value, color], i) => (
              <Card key={i} className="border-surface-200 hover:border-surface-300 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${color}-50 text-${color}-600`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-surface-500 font-medium truncate">{label}</p>
                    <p className="text-base font-bold text-surface-900 truncate">{value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card className="border-surface-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Doanh thu vs Lương (Triệu VNĐ)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="payroll" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="border-surface-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Tăng trưởng View (Triệu)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer>
                    <AreaChart data={monthlyChartData}>
                      <defs>
                        <linearGradient id="cv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="view" stroke="#e11d48" strokeWidth={2} fill="url(#cv)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              [Flame, 'Top View', topViewUsers, (u: any) => `${(u.totalViews / 1000000).toFixed(1)}M View`],
              [Award, 'Top Thu nhập', topEarnerUsers, (u: any) => formatCurrency(u.estimatedSalary)],
              [AlertTriangle, 'Đi muộn', topLateUsers, (u: any) => `${u.lateCount} lần`],
            ].map(([Icon, title, data, fmt], i) => (
              <Card key={i} className="border-surface-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Icon className="h-4 w-4 text-surface-400" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {data.length === 0 ? (
                    <p className="text-[12px] text-surface-400 py-6 text-center">Chưa có dữ liệu</p>
                  ) : data.map((u: any, j: number) => (
                    <div key={u.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-surface-50 text-[13px]">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-surface-100 flex items-center justify-center text-[11px] font-bold text-surface-500">{j + 1}</span>
                        <span className="font-medium text-surface-800">{u.name}</span>
                      </div>
                      <span className="font-semibold text-surface-600">{fmt(u)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Activity & Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card className="border-surface-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Hoạt động gần đây</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 max-h-64 overflow-y-auto">
                {(recentLogs || []).slice(0, 6).map((log: any) => (
                  <div key={log.id} className="flex items-start justify-between py-1.5 text-[12px]">
                    <span>
                      <span className="font-semibold text-surface-800">{log.actorName}</span>
                      <span className="text-surface-500"> — {log.description}</span>
                    </span>
                    <span className="text-surface-400 ml-2 whitespace-nowrap">{formatTime(log.timestamp)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-surface-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Thông báo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {(recentNotifications || []).slice(0, 5).map((n: any) => (
                  <div key={n.id} className="p-2.5 bg-blue-50/50 rounded-lg text-[12px]">
                    <p className="font-semibold text-blue-900">{n.title}</p>
                    <p className="text-blue-700 mt-0.5">{n.message}</p>
                    <p className="text-blue-400 mt-1">{formatDate(n.createdAt)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* WiFi Check-in */}
          <Card className="border-surface-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Điểm danh chấm công
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-semibold text-surface-600">WiFi / IP thiết bị</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={wifiSsidInput}
                      onChange={(e) => setWifiSsidInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-[13px] border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    />
                    <button 
                      onClick={() => setWifiSsidInput(settings.companyWifiSsid)}
                      className="px-3 py-2 text-[12px] font-medium bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors"
                    >WiFi chuẩn</button>
                  </div>
                  <p className="text-[11px] text-surface-400">WiFi yêu cầu: <strong>{settings.companyWifiSsid}</strong></p>
                </div>
                <div className="space-y-1.5 text-[12px]">
                  {[
                    ['Check In', myTodayRecord?.checkIn ? formatTime(myTodayRecord.checkIn) : '—'],
                    ['Check Out', myTodayRecord?.checkOut ? formatTime(myTodayRecord.checkOut) : '—'],
                    ['Giờ làm', `${myTodayRecord?.workHours || 0} giờ`],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between"><span className="text-surface-500">{l}</span><span className="font-semibold">{v}</span></div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button disabled={Boolean(myTodayRecord?.checkIn)} onClick={handleWiFiCheckIn} size="md">
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />Check In
                </Button>
                <Button disabled={!myTodayRecord?.checkIn || Boolean(myTodayRecord?.checkOut)} onClick={handleWiFiCheckOut} variant="outline" size="md">
                  <Clock className="mr-1.5 h-4 w-4" />Check Out
                </Button>
              </div>
              {wifiMessage && <p className="text-[12px] text-surface-500 bg-surface-50 rounded-lg p-2.5">{wifiMessage.text}</p>}
            </CardContent>
          </Card>

          {/* Employee stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              [Clock, 'Giờ làm tháng', `${myMonthWorkHours} giờ`, `${formatCurrency(currentUser?.hourlyRate || 0)}/h`],
              [DollarSign, 'Tiền công', formatCurrency(myMonthDailyPay), 'Theo giờ'],
              [Youtube, 'Thưởng View', formatCurrency(myMonthViews), ''],
              [Award, 'Tạm tính', formatCurrency(myEstimatedSalary), `Tháng ${currentMonth}`],
            ].map(([Icon, label, value, sub], i) => (
              <Card key={i} className="border-surface-200">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-surface-100 text-surface-500">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-surface-500 font-medium">{label}</p>
                    <p className="text-base font-bold text-surface-900">{value}</p>
                    {sub ? <p className="text-[10px] text-surface-400">{sub}</p> : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
