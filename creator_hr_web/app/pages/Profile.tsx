import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Form, useNavigation } from 'react-router';
import {
  User, Mail, Phone, Lock, CreditCard, Save, Camera,
  Eye, EyeOff, CheckCircle2, AlertCircle, Building2,
  Shield, Sparkles, ArrowUpRight, MapPin, Clock, Coins, QrCode
} from 'lucide-react';
import { formatCurrency, formatDate } from '~/lib/utils';

interface Bank {
  id: number;
  code: string;
  name: string;
  shortName: string;
  bin: string;
  logo: string;
}

interface Props {
  loaderData: { user: any; attendances: any[]; salaryHistories: any[] };
  currentUser: any;
  actionData?: { success?: string; error?: string };
}

export function ProfilePage({ loaderData, currentUser, actionData }: Props) {
  const { user } = loaderData;
  const navigation = useNavigation();
  const isSaving = navigation.state === 'submitting';

  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatar || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Bank & VietQR states
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [selectedBankBin, setSelectedBankBin] = useState(user?.bankBin || '');
  const [bankAccountInput, setBankAccountInput] = useState(user?.bankAccount || '');
  const [bankNameInput, setBankNameInput] = useState(user?.bankName || '');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  // Fetch bank list from VietQR API
  useEffect(() => {
    fetch('https://api.vietqr.io/v2/banks')
      .then(r => r.json())
      .then(data => {
        if (data.code === '00' && Array.isArray(data.data)) {
          setBanks(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setBanksLoading(false));
  }, []);

  // Auto-select bank name when bin changes
  useEffect(() => {
    if (selectedBankBin && banks.length > 0) {
      const bank = banks.find(b => b.bin === selectedBankBin);
      if (bank) setBankNameInput(`${bank.shortName} (${bank.name})`);
    }
  }, [selectedBankBin, banks]);

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).slice(-2).join('')
    : 'NV';

  // VietQR image URL
  const vietQrUrl = useMemo(() => {
    if (!selectedBankBin || !bankAccountInput) return null;
    const accountName = user?.name || '';
    return `https://img.vietqr.io/image/${selectedBankBin}-${bankAccountInput}-compact.png?accountName=${encodeURIComponent(accountName)}`;
  }, [selectedBankBin, bankAccountInput, user?.name]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File ảnh quá lớn! Vui lòng chọn tệp hình ảnh có dung lượng dưới 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const staggerClasses = (index: number) =>
    `transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`;

  return (
    <div ref={sectionRef} className="space-y-10 max-w-5xl mx-auto select-none pb-16">

      {/* ========== Page Header ========== */}
      <div
        className="space-y-3"
        style={{ transitionDelay: '0ms', ...(isVisible ? {} : { opacity: 0, transform: 'translateY(8px)' }) }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-100/80 backdrop-blur-sm px-3.5 py-1.5 border border-surface-200/60">
            <Shield className="h-3.5 w-3.5 text-primary-500" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-surface-500">
              Tài khoản · Cá nhân
            </span>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
            user?.role === 'ADMIN'
              ? 'bg-primary-50 text-primary-600 border-primary-200/60'
              : 'bg-blue-50 text-blue-600 border-blue-200/60'
          }`}>
            {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Biên tập viên'}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-surface-900 tracking-tighter leading-tight">
          Hồ sơ cá nhân
        </h1>
        <p className="text-[13px] text-surface-500 font-medium max-w-lg leading-relaxed">
          Tải ảnh đại diện trực tiếp từ thiết bị, cập nhật thông tin cá nhân, mật khẩu và tài khoản nhận lương.
        </p>
      </div>

      {/* ========== Alert Banners ========== */}
      {actionData?.error && (
        <div
          className="animate-enter p-4 bg-rose-50/80 backdrop-blur-sm border border-rose-200/60 rounded-2xl flex items-center gap-3 text-[13px] font-bold text-rose-700"
        >
          <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
          <span>{actionData.error}</span>
        </div>
      )}

      {actionData?.success && (
        <div
          className="animate-enter p-4 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/60 rounded-2xl flex items-center gap-3 text-[13px] font-bold text-emerald-700"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <span>{actionData.success}</span>
        </div>
      )}

      {/* ========== Main Grid ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">

        {/* ================================================================ */}
        {/* LEFT COLUMN – Identity & Stats Card (Double-Bezel Architecture)  */}
        {/* ================================================================ */}
        <div className="space-y-6">

          {/* Outer Shell */}
          <div className="p-1.5 bg-surface-100/60 backdrop-blur-sm ring-1 ring-surface-200/50 rounded-[2.5rem] shadow-warm">
            {/* Inner Core */}
            <div
              style={{ transitionDelay: '100ms' }}
              className={`bg-white rounded-[calc(2.5rem-0.375rem)] p-6 flex flex-col items-center text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] ${staggerClasses(1)}`}
            >
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Avatar */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer mb-5"
                title="Bấm để chọn ảnh từ máy tính / điện thoại"
              >
                {/* Avatar outer ring */}
                <div className="absolute -inset-[6px] rounded-full bg-gradient-to-br from-primary-400/30 via-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" />

                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user?.name}
                    className="relative w-32 h-32 rounded-full object-cover ring-1 ring-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] group-hover:scale-[1.02] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                    onError={() => setAvatarUrl('')}
                  />
                ) : (
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-surface-800 to-surface-900 text-white font-black text-4xl flex items-center justify-center ring-1 ring-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.18)] group-hover:scale-[1.02] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                    {initials}
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 text-white/80">
                  <Camera className="h-8 w-8" />
                </div>
              </div>

              {/* Name & Email */}
              <h3 className="text-lg font-black text-surface-900 tracking-tight">{user?.name}</h3>
              <p className="text-[12px] text-surface-400 font-medium mt-0.5">{user?.email}</p>

              {/* Divider */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-surface-200 to-transparent my-5" />

              {/* Role badge */}
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                user?.role === 'ADMIN'
                  ? 'bg-primary-50/60 text-primary-600 border-primary-200/40'
                  : 'bg-blue-50/60 text-blue-600 border-blue-200/40'
              }`}>
                <Sparkles className="h-3 w-3" />
                {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}
              </span>

              {/* Detail stats */}
              <div className="w-full mt-5 space-y-3 text-left">
                {[
                  { icon: MapPin, label: 'Phòng ban', value: user?.department || 'Sáng Tạo Nội Dung' },
                  { icon: Shield, label: 'Chức danh', value: user?.position || 'Biên Tập Viên' },
                  { icon: Coins, label: 'Đơn giá / Giờ', value: formatCurrency(user?.hourlyRate || 50000), accent: true },
                  { icon: ArrowUpRight, label: 'Thưởng 1.000 View', value: formatCurrency(user?.viewBonusRate || 5000), accent: true },
                  { icon: Clock, label: 'Ngày tham gia', value: user?.joinedDate ? formatDate(user.joinedDate) : formatDate(user?.createdAt?.slice(0, 10)) },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-2.5 px-3.5 rounded-2xl hover:bg-surface-50/70 transition-colors duration-300 group/stats"
                  >
                    <span className="flex items-center gap-2.5 text-[12px] font-semibold text-surface-400">
                      <item.icon className="h-3.5 w-3.5 text-surface-300 group-hover/stats:text-surface-500 transition-colors duration-300" />
                      {item.label}
                    </span>
                    <span className={`text-[12px] font-extrabold tracking-tight ${item.accent ? 'text-primary-600' : 'text-surface-800'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* RIGHT COLUMN – Edit Form (Double-Bezel Architecture)              */}
        {/* ================================================================ */}
        <div className="space-y-6">
          {/* Outer Shell */}
          <div className="p-1.5 bg-surface-100/60 backdrop-blur-sm ring-1 ring-surface-200/50 rounded-[2.5rem] shadow-warm">
            {/* Inner Core */}
            <div
              style={{ transitionDelay: '200ms' }}
              className={`bg-white rounded-[calc(2.5rem-0.375rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] overflow-hidden ${staggerClasses(2)}`}
            >
              {/* Card Header */}
              <div className="px-7 py-5 border-b border-surface-100 bg-surface-50/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary-50/80 ring-1 ring-primary-200/40">
                    <User className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-extrabold text-surface-900 tracking-tight">
                      Chỉnh sửa thông tin
                    </h3>
                    <p className="text-[11px] text-surface-400 font-medium mt-0.5">
                      Cập nhật hồ sơ cá nhân, mật khẩu & tài khoản ngân hàng
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-7">
                <Form method="post" className="space-y-6">
                  {/* Hidden avatar */}
                  <input type="hidden" name="avatar" value={avatarUrl} />



                  {/* ===== Name & Email ===== */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="block text-[12px] font-extrabold text-surface-700">
                        Họ và tên
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-300 pointer-events-none" />
                        <input
                          name="name"
                          type="text"
                          required
                          defaultValue={user?.name || ''}
                          placeholder="Nguyễn Văn A"
                          className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-surface-50 border border-surface-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-300 font-semibold text-surface-900 placeholder:text-surface-300 transition-all duration-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[12px] font-extrabold text-surface-700">
                        Địa chỉ Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-300 pointer-events-none" />
                        <input
                          name="email"
                          type="email"
                          required
                          defaultValue={user?.email || ''}
                          placeholder="employee@creatorhr.vn"
                          className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-surface-50 border border-surface-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-300 font-semibold text-surface-900 placeholder:text-surface-300 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ===== Phone ===== */}
                  <div className="space-y-2">
                    <label className="block text-[12px] font-extrabold text-surface-700">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-300 pointer-events-none" />
                      <input
                        name="phone"
                        type="text"
                        defaultValue={user?.phone || ''}
                        placeholder="0987 654 321"
                        className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-surface-50 border border-surface-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-300 font-semibold text-surface-900 placeholder:text-surface-300 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* ===== Password Section ===== */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-amber-50/80 ring-1 ring-amber-200/40">
                        <Lock className="h-3.5 w-3.5 text-amber-600" />
                      </div>
                      <h4 className="text-[12px] font-extrabold text-surface-900 uppercase tracking-wider">
                        Đổi mật khẩu
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[12px] font-extrabold text-surface-700">
                          Mật khẩu hiện tại
                        </label>
                        <div className="relative">
                          <input
                            name="currentPassword"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 text-[13px] bg-surface-50 border border-surface-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-300 font-medium text-surface-900 placeholder:text-surface-300 transition-all duration-300"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[12px] font-extrabold text-surface-700">
                          Mật khẩu mới
                        </label>
                        <div className="relative">
                          <input
                            name="newPassword"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 text-[13px] bg-surface-50 border border-surface-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-300 font-medium text-surface-900 placeholder:text-surface-300 transition-all duration-300"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[12px] font-extrabold text-surface-700">
                          Xác nhận mật khẩu mới
                        </label>
                        <div className="relative">
                          <input
                            name="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 text-[13px] bg-surface-50 border border-surface-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-300 font-medium text-surface-900 placeholder:text-surface-300 transition-all duration-300"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] font-bold text-surface-400 hover:text-surface-600 transition-colors flex items-center gap-1.5"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    </button>
                  </div>

                  {/* ===== Separator ===== */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-surface-200/80 to-transparent" />
                  </div>

                  {/* ===== Bank Information (VietQR) ===== */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-50/80 ring-1 ring-emerald-200/40">
                        <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <h4 className="text-[12px] font-extrabold text-surface-900 uppercase tracking-wider">
                        Tài khoản thụ hưởng
                      </h4>
                    </div>

                    {/* Hidden field for bank bin */}
                    <input type="hidden" name="bankBin" value={selectedBankBin} />

                    {/* Bank Select */}
                    <div className="space-y-2">
                      <label className="block text-[12px] font-extrabold text-surface-700">
                        Tên ngân hàng
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-300 pointer-events-none" />
                        <input
                          name="bankName"
                          type="text"
                          list="vietqr-bank-list"
                          value={bankNameInput}
                          onChange={(e) => {
                            setBankNameInput(e.target.value);
                            const match = banks.find(b => `${b.shortName} (${b.name})` === e.target.value);
                            if (match) setSelectedBankBin(match.bin);
                          }}
                          placeholder={banksLoading ? 'Đang tải danh sách ngân hàng...' : 'Chọn ngân hàng'}
                          className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-surface-50 border border-surface-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-300 font-semibold text-surface-900 placeholder:text-surface-300 transition-all duration-300"
                        />
                        <datalist id="vietqr-bank-list">
                          {banks.map(b => (
                            <option key={b.id} value={`${b.shortName} (${b.name})`} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    {/* Bank Account */}
                    <div className="space-y-2">
                      <label className="block text-[12px] font-extrabold text-surface-700">
                        Số tài khoản
                      </label>
                      <div className="relative">
                        <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-300 pointer-events-none" />
                        <input
                          name="bankAccount"
                          type="text"
                          value={bankAccountInput}
                          onChange={(e) => setBankAccountInput(e.target.value)}
                          placeholder="0123456789"
                          className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-surface-50 border border-surface-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-300 font-mono font-bold text-surface-900 placeholder:text-surface-300 transition-all duration-300"
                        />
                      </div>
                    </div>

                    {/* VietQR Preview */}
                    {vietQrUrl && (
                      <div className="pt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-[11px] font-extrabold text-surface-500 uppercase tracking-wider">
                            Mã VietQR
                          </span>
                        </div>
                        <div className="p-3 bg-white rounded-2xl border border-surface-200 inline-block">
                          <img
                            src={vietQrUrl}
                            alt="VietQR"
                            className="w-36 h-36 rounded-xl"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                        <p className="text-[10px] text-surface-400 font-medium">
                          Quét mã QR trên để nhận lương qua tài khoản {bankNameInput}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ===== Submit ===== */}
                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="group relative inline-flex items-center gap-3 rounded-full bg-surface-900 hover:bg-surface-800 text-white font-extrabold text-[13px] px-6 py-3 shadow-lg shadow-surface-900/15 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 hover:shadow-xl hover:shadow-surface-900/20 hover:-translate-y-px"
                    >
                      <Save className="h-4 w-4 transition-transform duration-500 group-hover:scale-110" />
                      <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                      {/* Button-in-button arrow */}
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/10 group-hover:bg-white/15 transition-all duration-500 group-hover:translate-x-0.5">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </div>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
