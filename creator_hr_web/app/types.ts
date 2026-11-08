export type Role = 'ADMIN' | 'EMPLOYEE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  department?: string;
  position?: string;
  joinedDate?: string;
  avatar?: string;
  bankAccount?: string;
  bankName?: string;
  hourlyRate: number;
  viewBonusRate: number;
  isActive: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryHistory {
  id: string;
  userId: string;
  oldHourlyRate: number;
  newHourlyRate: number;
  oldViewBonusRate: number;
  newViewBonusRate: number;
  changedBy: string;
  changedAt: string;
  note?: string;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  checkIn: string | null; // ISO string
  checkOut: string | null; // ISO string
  workHours: number;
  overtimeHours?: number;
  lateMinutes?: number;
  earlyMinutes?: number;
  amount: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
  wifiSsid?: string;
  ipAddress?: string;
  note?: string;
  isDeleted?: boolean;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  type: 'LEAVE' | 'LATE';
  expectedTime?: string; // e.g. "09:30" for late arrival declaration
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  approvedBy?: string;
  isDeleted?: boolean;
}

export interface YoutubeView {
  id: string;
  userId: string;
  channelName?: string;
  month: number;
  year: number;
  viewCount: number;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note?: string;
  createdAt?: string;
  isDeleted?: boolean;
}

export interface YoutubeRevenue {
  id: string;
  channelName: string;
  month: number;
  year: number;
  revenue: number; // VNĐ
  views?: number;
  notes?: string;
  createdAt: string;
  isDeleted?: boolean;
}

export interface BonusPenalty {
  id: string;
  userId: string;
  type: 'BONUS' | 'PENALTY';
  category: string; // e.g., 'Sáng tạo nội dung', 'Vượt chỉ tiêu', 'Đi muộn', 'Quên Check-out', 'Khác'
  amount: number;
  reason: string;
  date: string; // ISO string
  isDeleted?: boolean;
}

export interface Payroll {
  id: string;
  userId: string;
  month: number;
  year: number;
  totalWorkHours: number;
  baseHourlyWage: number;
  totalHourlyPay: number;
  youtubeBonus: number;
  otherBonus: number;
  totalPenalty: number;
  finalSalary: number;
  status: 'DRAFT' | 'LOCKED';
  lockedAt?: string;
  note?: string;
  isDeleted?: boolean;
}

export interface AppSettings {
  latePenalty: number; // default 50000
  forgetCheckOutPenalty: number; // default 100000
  companyWifiSsid: string; // default "CreatorHR_5G"
  companyIp: string; // default "192.168.1.1"
  workStartTime: string; // default "08:30"
  workEndTime: string; // default "17:30"
}

export interface Notification {
  id: string;
  userId: string; // 'ALL' or specific user ID
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  action: 'THÊM' | 'SỬA' | 'XÓA_MỀM' | 'KHÔI_PHỤC' | 'CHỐT_LƯƠNG' | 'Duyệt' | 'Từ chối' | 'CẤP_DUYỆT';
  module: 'Nhân viên' | 'Chấm công' | 'Nghỉ phép' | 'View YouTube' | 'Doanh thu' | 'Thưởng phạt' | 'Bảng lương' | 'Cài đặt' | 'Hệ thống';
  description: string;
  timestamp: string;
}
