import React, { useState } from 'react';
import { Form, useNavigation, useActionData } from 'react-router';
import { Youtube, ShieldCheck, UserCheck, ArrowRight, Shield, User, CheckCircle2 } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';

export function Login() {
  const navigation = useNavigation();
  const actionData = useActionData<any>();
  const isLoading = navigation.state === 'submitting';
  const [email, setEmail] = useState('admin@creatorhr.vn');
  const [password, setPassword] = useState('123456');

  const demoAccounts = [
    { label: 'Quản trị viên', email: 'admin@creatorhr.vn', role: 'ADMIN' },
    { label: 'Nhân viên 1', email: 'nam@creatorhr.vn', role: 'EMPLOYEE' },
    { label: 'Nhân viên 2', email: 'linh@creatorhr.vn', role: 'EMPLOYEE' },
  ];



  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-4xl space-y-6">
        {/* Brand logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-rose-600 shadow-xl shadow-primary-500/20 mb-2">
            <Youtube className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Creator<span className="text-primary-500">HR</span>
          </h1>
          <p className="text-sm text-gray-300 font-medium max-w-md mx-auto">
            Hệ thống Quản trị Nhân sự & Hiệu suất Công ty Sáng tạo Nội dung YouTube
          </p>
        </div>

        {/* 2 Actor Role Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Actor Card */}
          <div className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border-2 border-purple-200 hover:border-purple-400 transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl flex items-center gap-2">
                  <Shield className="h-6 w-6" />
                  <span className="font-black text-sm uppercase tracking-wider">Tác nhân 1</span>
                </div>
                <span className="px-3 py-1 bg-purple-50 text-purple-800 rounded-full text-xs font-bold border border-purple-200">
                  Full Access
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Quản trị viên (Admin)</h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                Quyền hạn toàn diện: Quản lý danh sách nhân sự, duyệt đơn báo nghỉ/đi muộn, chốt duyệt View YouTube, xem Doanh thu công ty, chốt Bảng lương và Cấu hình hệ thống.
              </p>
              <ul className="space-y-1.5 text-xs text-gray-700 font-medium">
                <li className="flex items-center gap-2 text-purple-900">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span>Duyệt đơn, phạt tự động, quản lý chấm công</span>
                </li>
                <li className="flex items-center gap-2 text-purple-900">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span>Doanh thu YouTube & Chốt bảng lương toàn công ty</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-3 border-t border-purple-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tài khoản Admin mẫu:</span>
              {demoAccounts.filter(a => a.role === 'ADMIN').map(a => (
                <Button
                  key={a.email}
                  type="button"
                  onClick={() => setEmail(a.email)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-between"
                >
                  <span>Đăng nhập làm Admin ({a.label})</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </div>

          {/* Employee Actor Card */}
          <div className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border-2 border-blue-200 hover:border-blue-400 transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl flex items-center gap-2">
                  <User className="h-6 w-6" />
                  <span className="font-black text-sm uppercase tracking-wider">Tác nhân 2</span>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-bold border border-blue-200">
                  Self-Service
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Nhân viên (Employee)</h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                Giao diện cá nhân: Thực hiện Check In/Check Out qua WiFi công ty, nộp đơn báo nghỉ/đi muộn, khai báo View YouTube cá nhân và theo dõi lương thưởng tạm tính.
              </p>
              <ul className="space-y-1.5 text-xs text-gray-700 font-medium">
                <li className="flex items-center gap-2 text-blue-900">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span>Điểm danh WiFi chuẩn, báo đi muộn/nghỉ phép</span>
                </li>
                <li className="flex items-center gap-2 text-blue-900">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span>Khai báo View YouTube để nhận tiền thưởng</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-3 border-t border-blue-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Chọn nhân viên mẫu:</span>
              <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto pr-1">
                {demoAccounts.filter(a => a.role === 'EMPLOYEE').map(a => (
                  <button
                    key={a.email}
                    type="button"
                    onClick={() => setEmail(a.email)}
                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl text-[11px] font-bold text-left truncate border border-blue-100"
                  >
                    👤 {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Manual Login Form */}
        <div className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/10 max-w-md mx-auto space-y-4">
          <h3 className="text-sm font-bold text-gray-900 text-center uppercase tracking-wider">Hoặc nhập email đăng nhập thủ công</h3>
          <Form method="post" className="space-y-3">
            <Input
              label="Email công ty"
              type="email"
              name="email"
              required
              placeholder="nhanvien@creatorhr.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Mật khẩu truy cập"
              type="password"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {actionData?.error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold">
                {actionData.error}
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white font-bold py-2.5 rounded-xl shadow-md">
              <span>{isLoading ? 'Đang đăng nhập...' : 'Đăng nhập hệ thống'}</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Form>
        </div>

        <p className="text-center text-[11px] text-gray-400 font-medium">
          CreatorHR © 2026 • Hệ thống Quản trị HR & Hiệu suất Chuyên nghiệp
        </p>
      </div>
    </div>
  );
}

