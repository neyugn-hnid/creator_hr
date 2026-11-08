import React, { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useActionData, Form, redirect, useNavigation } from "react-router";
import {
  Eye, EyeOff, Shield, User, ArrowRight, CheckCircle2, Loader2,
  AlertCircle, Lock, Mail, UserCheck
} from "lucide-react";
import { prisma } from "~/lib/db";
import { createUserSession, getUserId } from "~/lib/session.server";

// If already logged in, redirect to home
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) throw redirect("/");
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "login");

  if (intent === "register") {
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").toLowerCase().trim();
    const password = String(formData.get("password") || "").trim();
    const confirmPassword = String(formData.get("confirmPassword") || "").trim();

    if (!name) return { error: "Vui lòng nhập Họ và tên.", activeTab: "register" };
    if (!email) return { error: "Vui lòng nhập email.", activeTab: "register" };
    if (!password || password.length < 6) return { error: "Mật khẩu phải có ít nhất 6 ký tự.", activeTab: "register" };
    if (password !== confirmPassword) return { error: "Xác nhận mật khẩu không trùng khớp.", activeTab: "register" };

    const existingUser = await prisma.user.findFirst({ where: { email, isDeleted: false } });
    if (existingUser) return { error: "Email này đã được sử dụng trên hệ thống.", activeTab: "register" };

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: password || "123456",
        role: "EMPLOYEE",
        department: "Sáng Tạo Nội Dung",
        position: "Biên Tập Viên",
      },
    });

    await prisma.activityLog.create({
      data: {
        actorId: newUser.id,
        actorName: newUser.name,
        action: "THÊM",
        module: "Hệ thống",
        description: `Tài khoản mới ${newUser.name} đã đăng ký hệ thống`,
      },
    });

    return createUserSession(newUser.id, "/");
  }

  // Handle Login intent
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "").trim();

  if (!email) {
    return { error: "Vui lòng nhập Email.", activeTab: "login" };
  }

  const user = await prisma.user.findFirst({
    where: { email, isActive: true, isDeleted: false },
  });

  if (!user) {
    return { error: "Tài khoản email không tồn tại hoặc đã bị khóa.", activeTab: "login" };
  }

  // Validate password if provided (default 123456)
  if (password && user.password && user.password !== "123456" && user.password !== password) {
    return { error: "Mật khẩu không chính xác.", activeTab: "login" };
  }

  await prisma.activityLog.create({
    data: {
      actorId: user.id,
      actorName: user.name,
      action: "THÊM",
      module: "Hệ thống",
      description: `Đăng nhập thành công tài khoản ${user.name}`,
    },
  });

  return createUserSession(user.id, "/");
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="mr-2">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
  );
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [tab, setTab] = useState<"login" | "register">(actionData?.activeTab || "login");

  // Show/Hide password states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Form input validation states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [clientError, setClientError] = useState("");

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const handleLoginValidation = (e: React.FormEvent) => {
    setClientError("");
    if (!loginEmail.trim()) {
      e.preventDefault();
      setClientError("Vui lòng nhập Email đăng nhập.");
      return;
    }
    if (!validateEmail(loginEmail)) {
      e.preventDefault();
      setClientError("Email không đúng định dạng (Ví dụ: name@company.com)");
      return;
    }
    if (!loginPassword) {
      e.preventDefault();
      setClientError("Vui lòng nhập Mật khẩu.");
      return;
    }
  };

  const handleRegisterValidation = (e: React.FormEvent) => {
    setClientError("");
    if (!regName.trim()) {
      e.preventDefault();
      setClientError("Vui lòng nhập Họ và Tên.");
      return;
    }
    if (!regEmail.trim() || !validateEmail(regEmail)) {
      e.preventDefault();
      setClientError("Vui lòng nhập Email hợp lệ.");
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      e.preventDefault();
      setClientError("Mật khẩu khởi tạo phải có ít nhất 6 ký tự.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      e.preventDefault();
      setClientError("Xác nhận mật khẩu không trùng khớp.");
      return;
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-md space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Main Auth Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-8 space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <img src="/images/logo.png" alt="MediaPulse" className="h-16 w-16 object-contain mx-auto mb-1" />
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Media<span className="text-primary-600">Pulse</span>
            </h1>
            <p className="text-xs text-gray-500 font-medium">Hệ thống quản trị nhân sự công ty sáng tạo nội dung</p>
          </div>

          {/* Error Banner */}
          {(actionData?.error || clientError) && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700 animate-in fade-in">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-500" />
              <span>{clientError || actionData?.error}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === "login" ? (
            <Form method="post" onSubmit={handleLoginValidation} className="space-y-4">
              <input type="hidden" name="intent" value="login" />

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Email đăng nhập</label>
                <div className="relative">
                  <input
                    name="email"
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="Ví dụ: nhanvien@creatorhr.vn"
                    className="w-full pl-9 pr-4 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700">Mật khẩu</label>
                  <button
                    type="button"
                    onClick={() => setClientError("Vui lòng liên hệ Quản trị viên (Admin) hoặc HR để đặt lại mật khẩu.")}
                    className="text-[11px] font-bold text-primary-600 hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <input
                    name="password"
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  <Lock className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>Đăng Nhập Ngay</span>
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setTab("register"); setClientError(""); }}
                  className="text-xs text-gray-500 hover:text-gray-900"
                >
                  Bạn chưa có tài khoản? <span className="font-bold text-primary-600 hover:underline">Đăng ký ngay</span>
                </button>
              </div>
            </Form>
          ) : (
            /* REGISTER FORM */
            <Form method="post" onSubmit={handleRegisterValidation} className="space-y-4">
              <input type="hidden" name="intent" value="register" />

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Họ và Tên</label>
                <div className="relative">
                  <input
                    name="name"
                    type="text"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full pl-9 pr-4 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  <UserCheck className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Công Ty</label>
                <div className="relative">
                  <input
                    name="email"
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="Ví dụ: nguyenvana@creatorhr.vn"
                    className="w-full pl-9 pr-4 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Mật Khẩu Khởi Tạo</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showRegPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  <Lock className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Xác Nhận Mật Khẩu</label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showRegConfirmPassword ? "text" : "password"}
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  <Lock className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showRegConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>Tạo Tài Khoản Mới</span>
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setTab("login"); setClientError(""); }}
                  className="text-xs text-gray-500 hover:text-gray-900"
                >
                  Bạn đã có tài khoản? <span className="font-bold text-primary-600 hover:underline">Đăng nhập ngay</span>
                </button>
              </div>
            </Form>
          )}

          {/* Social Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Hoặc Đăng Nhập Với</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Google OAuth Button */}
          <a
            href="/api/youtube/auth"
            className="w-full flex items-center justify-center py-2.5 px-4 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all"
          >
            <GoogleIcon />
            <span>Đăng nhập với Google</span>
          </a>
        </div>

        <p className="text-center text-xs text-gray-400 font-medium">
          MediaPulse © 2026
        </p>
      </div>
    </div>
  );
}
