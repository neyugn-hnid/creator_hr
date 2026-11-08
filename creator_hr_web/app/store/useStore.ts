import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  User, 
  Attendance, 
  LeaveRequest, 
  YoutubeView, 
  YoutubeRevenue,
  BonusPenalty, 
  Payroll,
  AppSettings, 
  Notification,
  ActivityLog,
  SalaryHistory
} from '~/types';

interface AppState {
  currentUser: User | null;
  users: User[];
  salaryHistories: SalaryHistory[];
  attendances: Attendance[];
  leaveRequests: LeaveRequest[];
  youtubeViews: YoutubeView[];
  youtubeRevenues: YoutubeRevenue[];
  bonusPenalties: BonusPenalty[];
  payrolls: Payroll[];
  settings: AppSettings;
  notifications: Notification[];
  activityLogs: ActivityLog[];
  
  // Auth & System Actions
  login: (email: string) => void;
  logout: () => void;
  runDailyCheck: () => void;
  logActivity: (action: ActivityLog['action'], module: ActivityLog['module'], description: string) => void;
  
  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: (userId: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  
  // Users (Nhân viên)
  addUser: (user: Omit<User, 'id' | 'isDeleted'>) => void;
  updateUser: (id: string, data: Partial<User> & { note?: string }) => void;
  softDeleteUser: (id: string) => void;
  restoreUser: (id: string) => void;

  // Attendance (Chấm công WiFi)
  checkIn: (userId: string, wifiSsid?: string) => { success: boolean; message: string };
  checkOut: (userId: string, wifiSsid?: string) => { success: boolean; message: string };
  addAttendance: (record: Omit<Attendance, 'id'>) => void;
  updateAttendance: (id: string, record: Partial<Attendance>) => void;
  softDeleteAttendance: (id: string) => void;
  restoreAttendance: (id: string) => void;
  
  // Leaves & Late Notifications (Báo nghỉ & Báo đi muộn)
  addLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>) => void;
  updateLeaveRequestStatus: (id: string, status: LeaveRequest['status']) => void;
  updateLeaveRequest: (id: string, request: Partial<LeaveRequest>) => void;
  softDeleteLeaveRequest: (id: string) => void;
  restoreLeaveRequest: (id: string) => void;
  
  // Youtube Views (Quản lý View)
  addYoutubeView: (view: Omit<YoutubeView, 'id' | 'status' | 'amount'>) => void;
  updateYoutubeViewStatus: (id: string, status: YoutubeView['status']) => void;
  updateYoutubeView: (id: string, view: Partial<YoutubeView>) => void;
  softDeleteYoutubeView: (id: string) => void;
  restoreYoutubeView: (id: string) => void;

  // Youtube Revenues (Quản lý Doanh thu Công ty)
  addYoutubeRevenue: (revenue: Omit<YoutubeRevenue, 'id' | 'createdAt'>) => void;
  updateYoutubeRevenue: (id: string, revenue: Partial<YoutubeRevenue>) => void;
  softDeleteYoutubeRevenue: (id: string) => void;
  restoreYoutubeRevenue: (id: string) => void;
  
  // Bonus/Penalty (Thưởng & Phạt)
  addBonusPenalty: (record: Omit<BonusPenalty, 'id'>) => void;
  updateBonusPenalty: (id: string, record: Partial<BonusPenalty>) => void;
  softDeleteBonusPenalty: (id: string) => void;
  restoreBonusPenalty: (id: string) => void;

  // Payroll (Chốt & Quản lý bảng lương)
  lockPayroll: (month: number, year: number) => void;
  unlockPayroll: (month: number, year: number) => void;
  
  // Settings
  updateSettings: (settings: Partial<AppSettings>) => void;
}

const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Phạm Minh Đức',
    email: 'admin@creatorhr.vn',
    role: 'ADMIN',
    phone: '0988123456',
    department: 'Ban Giám Đốc',
    position: 'Quản trị viên hệ thống',
    joinedDate: '2023-01-15',
    hourlyRate: 120000,
    viewBonusRate: 15000,
    bankAccount: '190345678910',
    bankName: 'Techcombank',
    isActive: true,
    isDeleted: false,
  },
  {
    id: 'u2',
    name: 'Nguyễn Hoàng Nam',
    email: 'nam.nh@creatorhr.vn',
    role: 'EMPLOYEE',
    phone: '0912345678',
    department: 'Sáng tạo nội dung',
    position: 'Content Creator Senior',
    joinedDate: '2023-06-01',
    hourlyRate: 65000,
    viewBonusRate: 5000,
    bankAccount: '001100223344',
    bankName: 'Vietcombank',
    isActive: true,
    isDeleted: false,
  },
  {
    id: 'u3',
    name: 'Trần Thảo Linh',
    email: 'linh.tt@creatorhr.vn',
    role: 'EMPLOYEE',
    phone: '0977888999',
    department: 'Dựng phim & VFX',
    position: 'Video Editor Lead',
    joinedDate: '2023-08-10',
    hourlyRate: 70000,
    viewBonusRate: 5000,
    bankAccount: '1020304050',
    bankName: 'MB Bank',
    isActive: true,
    isDeleted: false,
  },
  {
    id: 'u4',
    name: 'Lê Quốc Anh',
    email: 'anh.lq@creatorhr.vn',
    role: 'EMPLOYEE',
    phone: '0933444555',
    department: 'Sáng tạo nội dung',
    position: 'Script Writer & Host',
    joinedDate: '2024-02-15',
    hourlyRate: 55000,
    viewBonusRate: 5000,
    bankAccount: '8888999900',
    bankName: 'ACB',
    isActive: true,
    isDeleted: false,
  },
  {
    id: 'u5',
    name: 'Đặng Mai Phương',
    email: 'phuong.dm@creatorhr.vn',
    role: 'EMPLOYEE',
    phone: '0966111222',
    department: 'Thiết kế & Thumbnail',
    position: 'Graphic Designer',
    joinedDate: '2024-04-01',
    hourlyRate: 50000,
    viewBonusRate: 5000,
    bankAccount: '9900112233',
    bankName: 'VPBank',
    isActive: true,
    isDeleted: false,
  }
];

const mockRevenues: YoutubeRevenue[] = [
  { id: 'rev1', channelName: 'Kênh Khám Phá Creator', month: 7, year: 2026, revenue: 185000000, views: 32000000, notes: 'Doanh thu tháng 7 ổn định', createdAt: '2026-07-31T18:00:00Z', isDeleted: false },
  { id: 'rev2', channelName: 'Kênh Giải Trí Creator Studio', month: 7, year: 2026, revenue: 142000000, views: 24000000, notes: 'Tăng trưởng tốt từ Shorts', createdAt: '2026-07-31T18:00:00Z', isDeleted: false },
  { id: 'rev3', channelName: 'Kênh Khám Phá Creator', month: 6, year: 2026, revenue: 170000000, views: 29000000, notes: 'Doanh thu tháng 6', createdAt: '2026-06-30T18:00:00Z', isDeleted: false },
  { id: 'rev4', channelName: 'Kênh Giải Trí Creator Studio', month: 6, year: 2026, revenue: 130000000, views: 21000000, notes: 'Doanh thu tháng 6', createdAt: '2026-06-30T18:00:00Z', isDeleted: false }
];

const mockYoutubeViews: YoutubeView[] = [
  { id: 'v1', userId: 'u2', channelName: 'Kênh Khám Phá Creator', month: 7, year: 2026, viewCount: 12500000, amount: 62500000, status: 'APPROVED', note: 'Đạt chỉ tiêu video viral tháng 7', createdAt: '2026-07-28T10:00:00Z', isDeleted: false },
  { id: 'v2', userId: 'u3', channelName: 'Kênh Giải Trí Creator Studio', month: 7, year: 2026, viewCount: 9800000, amount: 49000000, status: 'APPROVED', note: 'Dựng series mới thành công', createdAt: '2026-07-28T11:00:00Z', isDeleted: false },
  { id: 'v3', userId: 'u4', channelName: 'Kênh Khám Phá Creator', month: 7, year: 2026, viewCount: 6400000, amount: 32000000, status: 'APPROVED', note: 'Xác nhận view đầy đủ', createdAt: '2026-07-29T09:00:00Z', isDeleted: false },
  { id: 'v4', userId: 'u5', channelName: 'Kênh Giải Trí Creator Studio', month: 7, year: 2026, viewCount: 4200000, amount: 21000000, status: 'PENDING', note: 'Khai báo view thiết kế thumbnail', createdAt: '2026-08-01T08:30:00Z', isDeleted: false }
];

const mockBonusPenalties: BonusPenalty[] = [
  { id: 'bp1', userId: 'u2', type: 'BONUS', category: 'Sáng tạo xuất sắc', amount: 3000000, reason: 'Thưởng video đạt Top 1 Trending YouTube', date: '2026-07-20T10:00:00Z', isDeleted: false },
  { id: 'bp2', userId: 'u3', type: 'BONUS', category: 'Tăng ca hoàn thành gấp', amount: 1500000, reason: 'Dựng dựng video gấp trong đêm đạt chất lượng 4K', date: '2026-07-25T14:30:00Z', isDeleted: false },
  { id: 'bp3', userId: 'u4', type: 'PENALTY', category: 'Đi muộn không báo trước', amount: 50000, reason: 'Hệ thống tự động phạt: Đi muộn ngày 10/07', date: '2026-07-10T09:15:00Z', isDeleted: false }
];

const mockAttendances: Attendance[] = [
  { id: 'att1', userId: 'u2', date: '2026-08-02', checkIn: '2026-08-02T08:25:00Z', checkOut: '2026-08-02T17:35:00Z', workHours: 8, overtimeHours: 0.5, lateMinutes: 0, earlyMinutes: 0, amount: 520000, status: 'PRESENT', wifiSsid: 'CreatorHR_5G', ipAddress: '192.168.1.1', isDeleted: false },
  { id: 'att2', userId: 'u3', date: '2026-08-02', checkIn: '2026-08-02T08:28:00Z', checkOut: null, workHours: 0, overtimeHours: 0, lateMinutes: 0, earlyMinutes: 0, amount: 0, status: 'PRESENT', wifiSsid: 'CreatorHR_5G', ipAddress: '192.168.1.1', isDeleted: false },
  { id: 'att3', userId: 'u4', date: '2026-08-02', checkIn: '2026-08-02T08:50:00Z', checkOut: null, workHours: 0, overtimeHours: 0, lateMinutes: 20, earlyMinutes: 0, amount: 0, status: 'LATE', wifiSsid: 'CreatorHR_5G', ipAddress: '192.168.1.1', isDeleted: false },
];

const mockLeaveRequests: LeaveRequest[] = [
  { id: 'l1', userId: 'u5', date: '2026-08-02', type: 'LEAVE', reason: 'Nghỉ ốm có giấy khám bác sĩ', status: 'APPROVED', createdAt: '2026-08-01T15:00:00Z', approvedBy: 'u1', isDeleted: false },
  { id: 'l2', userId: 'u4', date: '2026-08-02', type: 'LATE', expectedTime: '09:00', reason: 'Hỏng xe trên đường đến công ty', status: 'APPROVED', createdAt: '2026-08-02T08:00:00Z', approvedBy: 'u1', isDeleted: false }
];

const mockNotifications: Notification[] = [
  { id: 'n1', userId: 'ALL', title: 'Thông báo quy định chấm công', message: 'Tất cả nhân viên lưu ý kết nối đúng WiFi CreatorHR_5G khi Check In & Check Out.', isRead: false, createdAt: '2026-08-01T08:00:00Z', type: 'INFO' },
  { id: 'n2', userId: 'u4', title: 'Duyệt báo đi muộn', message: 'Yêu cầu báo đi muộn ngày 02/08/2026 của bạn đã được phê duyệt.', isRead: false, createdAt: '2026-08-02T08:10:00Z', type: 'SUCCESS' }
];

const mockActivityLogs: ActivityLog[] = [
  { id: 'log1', actorId: 'u1', actorName: 'Phạm Minh Đức', action: 'Duyệt', module: 'Nghỉ phép', description: 'Đã phê duyệt đơn báo đi muộn của Lê Quốc Anh (02/08/2026)', timestamp: '2026-08-02T08:10:00Z' },
  { id: 'log2', actorId: 'u1', actorName: 'Phạm Minh Đức', action: 'THÊM', module: 'Thưởng phạt', description: 'Đã tạo phiếu thưởng 3.000.000đ cho Nguyễn Hoàng Nam', timestamp: '2026-07-20T10:00:00Z' }
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: mockUsers[0], // Default logged in as Admin for easy evaluation
      users: mockUsers,
      salaryHistories: [],
      attendances: mockAttendances,
      leaveRequests: mockLeaveRequests,
      youtubeViews: mockYoutubeViews,
      youtubeRevenues: mockRevenues,
      bonusPenalties: mockBonusPenalties,
      payrolls: [],
      notifications: mockNotifications,
      activityLogs: mockActivityLogs,
      settings: {
        latePenalty: 50000,
        forgetCheckOutPenalty: 100000,
        companyWifiSsid: 'CreatorHR_5G',
        companyIp: '192.168.1.1',
        workStartTime: '08:30',
        workEndTime: '17:30',
      },

      logActivity: (action, module, description) => set((state) => {
        const currentUser = state.currentUser;
        const newLog: ActivityLog = {
          id: 'log_' + Math.random().toString(36).substring(2, 9),
          actorId: currentUser?.id || 'system',
          actorName: currentUser?.name || 'Hệ thống',
          action,
          module,
          description,
          timestamp: new Date().toISOString()
        };
        return { activityLogs: [newLog, ...state.activityLogs] };
      }),
      
      login: (email) => {
        const user = get().users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.isActive && !u.isDeleted);
        if (user) {
          set({ currentUser: user });
          get().logActivity('THÊM', 'Hệ thống', `Đăng nhập thành công tài khoản ${user.name}`);
        }
      },
      
      logout: () => {
        const user = get().currentUser;
        if (user) {
          get().logActivity('THÊM', 'Hệ thống', `Đăng xuất tài khoản ${user.name}`);
        }
        set({ currentUser: null });
      },
      
      runDailyCheck: () => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        let newBonusPenalties = [...state.bonusPenalties];
        let newNotifications = [...state.notifications];
        let hasChanges = false;
        
        const updatedAttendances = state.attendances.map(a => {
          if (a.date < today && a.checkIn && !a.checkOut && !a.isDeleted) {
            hasChanges = true;
            const penaltyAmount = state.settings.forgetCheckOutPenalty || 100000;
            const dateStr = new Date(a.date).toLocaleDateString('vi-VN');
            
            newBonusPenalties.push({
              id: 'bp_' + Math.random().toString(36).substring(2, 9),
              userId: a.userId,
              type: 'PENALTY',
              category: 'Quên Check-out',
              amount: penaltyAmount,
              reason: `Hệ thống tự động phạt: Quên Check-out ngày ${dateStr}`,
              date: new Date().toISOString(),
              isDeleted: false,
            });

            newNotifications.push({
              id: 'notif_' + Math.random().toString(36).substring(2, 9),
              userId: a.userId,
              title: 'Phiếu phạt tự động',
              message: `Bạn đã bị phạt ${new Intl.NumberFormat('vi-VN').format(penaltyAmount)}đ do quên Check-out ngày ${dateStr}.`,
              isRead: false,
              createdAt: new Date().toISOString(),
              type: 'ERROR',
            });

            return {
              ...a,
              checkOut: a.checkIn,
              workHours: 0,
              amount: 0,
            };
          }
          return a;
        });

        if (!hasChanges) return state;

        return {
          attendances: updatedAttendances,
          bonusPenalties: newBonusPenalties,
          notifications: newNotifications
        };
      }),

      addNotification: (notif) => set((state) => ({
        notifications: [
          {
            ...notif,
            id: 'n_' + Math.random().toString(36).substring(2, 9),
            isRead: false,
            createdAt: new Date().toISOString()
          },
          ...state.notifications
        ]
      })),
      
      markNotificationAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
      })),
      
      markAllNotificationsAsRead: (userId) => set((state) => ({
        notifications: state.notifications.map(n => (n.userId === userId || n.userId === 'ALL') ? { ...n, isRead: true } : n)
      })),
      
      addUser: (user) => {
        const id = 'u_' + Math.random().toString(36).substring(2, 9);
        set((state) => ({
          users: [...state.users, { ...user, id, isActive: true, isDeleted: false, createdAt: new Date().toISOString() }]
        }));
        get().logActivity('THÊM', 'Nhân viên', `Đã thêm nhân viên mới: ${user.name} (${user.email})`);
      },
      
      updateUser: (id, data) => {
        const user = get().users.find(u => u.id === id);
        
        // Track salary history if rate changes
        if (user && (data.hourlyRate !== undefined || data.viewBonusRate !== undefined)) {
          const newHourlyRate = data.hourlyRate !== undefined ? data.hourlyRate : user.hourlyRate;
          const newViewBonusRate = data.viewBonusRate !== undefined ? data.viewBonusRate : user.viewBonusRate;
          
          if (newHourlyRate !== user.hourlyRate || newViewBonusRate !== user.viewBonusRate) {
            const currentUser = get().currentUser;
            const history: SalaryHistory = {
              id: 'sh_' + Math.random().toString(36).substring(2, 9),
              userId: user.id,
              oldHourlyRate: user.hourlyRate,
              newHourlyRate: newHourlyRate,
              oldViewBonusRate: user.viewBonusRate,
              newViewBonusRate: newViewBonusRate,
              changedBy: currentUser?.name || 'Hệ thống',
              changedAt: new Date().toISOString(),
              note: data.note || undefined, // Allow passing a note via data, even if it's not on User
            };
            set((state) => ({
              salaryHistories: [history, ...state.salaryHistories]
            }));
          }
        }

        set((state) => ({
          users: state.users.map(u => u.id === id ? { ...u, ...data, updatedAt: new Date().toISOString() } : u),
          currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...data } : state.currentUser
        }));
        if (user) {
          get().logActivity('SỬA', 'Nhân viên', `Cập nhật thông tin nhân viên: ${user.name}`);
        }
      },
      
      softDeleteUser: (id) => {
        const user = get().users.find(u => u.id === id);
        set((state) => ({
          users: state.users.map(u => u.id === id ? { ...u, isDeleted: true, isActive: false } : u)
        }));
        if (user) {
          get().logActivity('XÓA_MỀM', 'Nhân viên', `Đã chuyển nhân viên ${user.name} vào thùng rác`);
        }
      },

      restoreUser: (id) => {
        const user = get().users.find(u => u.id === id);
        set((state) => ({
          users: state.users.map(u => u.id === id ? { ...u, isDeleted: false, isActive: true } : u)
        }));
        if (user) {
          get().logActivity('KHÔI_PHỤC', 'Nhân viên', `Đã khôi phục nhân viên: ${user.name}`);
        }
      },
      
      checkIn: (userId, wifiSsid = 'CreatorHR_5G') => {
        const state = get();
        // Check WiFi verification requirement
        if (wifiSsid !== state.settings.companyWifiSsid) {
          return { 
            success: false, 
            message: `Kết nối mạng không hợp lệ! Vui lòng kết nối đúng WiFi công ty (${state.settings.companyWifiSsid}) để điểm danh.` 
          };
        }

        const today = new Date().toISOString().split('T')[0];
        const existing = state.attendances.find(a => a.userId === userId && a.date === today && !a.isDeleted);
        if (existing) {
          return { success: false, message: 'Bạn đã điểm danh Check In hôm nay rồi!' };
        }
        
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const [startH, startM] = state.settings.workStartTime.split(':').map(Number);
        const standardStartMinutes = startH * 60 + startM;

        // Check approved late declaration
        const approvedLateReq = state.leaveRequests.find(
          req => req.userId === userId && req.date === today && req.type === 'LATE' && req.status === 'APPROVED' && !req.isDeleted
        );

        let allowedMinutes = standardStartMinutes;
        if (approvedLateReq && approvedLateReq.expectedTime) {
          const [expH, expM] = approvedLateReq.expectedTime.split(':').map(Number);
          allowedMinutes = expH * 60 + expM;
        }

        let isLate = false;
        let lateMinutes = 0;
        if (nowMinutes > allowedMinutes) {
          isLate = true;
          lateMinutes = nowMinutes - allowedMinutes;
        }

        let status: Attendance['status'] = isLate ? 'LATE' : 'PRESENT';
        let newBonusPenalties = [...state.bonusPenalties];
        let newNotifications = [...state.notifications];

        if (isLate && !approvedLateReq) {
          const penaltyAmount = state.settings.latePenalty || 50000;
          newBonusPenalties.push({
            id: 'bp_' + Math.random().toString(36).substring(2, 9),
            userId,
            type: 'PENALTY',
            category: 'Đi muộn không xin phép',
            amount: penaltyAmount,
            reason: `Hệ thống tự động phạt: Đi muộn ${lateMinutes} phút không báo trước`,
            date: now.toISOString(),
            isDeleted: false,
          });

          newNotifications.push({
            id: 'n_' + Math.random().toString(36).substring(2, 9),
            userId,
            title: 'Phiếu phạt tự động',
            message: `Bạn đã bị phạt ${new Intl.NumberFormat('vi-VN').format(penaltyAmount)}đ do đi muộn ${lateMinutes} phút không xin phép trước.`,
            isRead: false,
            createdAt: now.toISOString(),
            type: 'ERROR',
          });
        }
        
        const newRecord: Attendance = {
          id: 'att_' + Math.random().toString(36).substring(2, 9),
          userId,
          date: today,
          checkIn: now.toISOString(),
          checkOut: null,
          workHours: 0,
          overtimeHours: 0,
          lateMinutes,
          earlyMinutes: 0,
          amount: 0,
          status,
          wifiSsid,
          ipAddress: state.settings.companyIp,
          isDeleted: false
        };

        set({ 
          attendances: [...state.attendances, newRecord],
          bonusPenalties: newBonusPenalties,
          notifications: newNotifications
        });

        const user = state.users.find(u => u.id === userId);
        get().logActivity('THÊM', 'Chấm công', `Nhân viên ${user?.name || userId} đã Check In thành công qua WiFi ${wifiSsid}`);

        return { success: true, message: 'Check In thành công!' };
      },
      
      checkOut: (userId, wifiSsid = 'CreatorHR_5G') => {
        const state = get();
        if (wifiSsid !== state.settings.companyWifiSsid) {
          return { 
            success: false, 
            message: `Kết nối mạng không hợp lệ! Vui lòng kết nối đúng WiFi công ty (${state.settings.companyWifiSsid}) để điểm danh Check Out.` 
          };
        }

        const today = new Date().toISOString().split('T')[0];
        const record = state.attendances.find(a => a.userId === userId && a.date === today && a.checkIn && !a.checkOut && !a.isDeleted);
        
        if (!record) {
          return { success: false, message: 'Không tìm thấy lượt Check In cần Check Out của ngày hôm nay!' };
        }

        const user = state.users.find(u => u.id === userId);
        const checkOutTime = new Date();
        const checkInTime = new Date(record.checkIn!);
        const diffMs = checkOutTime.getTime() - checkInTime.getTime();
        const totalHours = Math.max(0, diffMs / (1000 * 60 * 60));
        
        let workHours = totalHours;
        if (totalHours > 5) workHours -= 1.0; // Rest break deduction
        workHours = Math.max(0, parseFloat(workHours.toFixed(1)));
        
        const standardHours = 8;
        const overtimeHours = Math.max(0, parseFloat((workHours - standardHours).toFixed(1)));
        const amount = Math.round(workHours * (user?.hourlyRate || 50000));

        set({
          attendances: state.attendances.map(a => {
            if (a.id === record.id) {
              return { 
                ...a, 
                checkOut: checkOutTime.toISOString(), 
                workHours, 
                overtimeHours,
                amount 
              };
            }
            return a;
          })
        });

        get().logActivity('SỬA', 'Chấm công', `Nhân viên ${user?.name} Check Out thành công (${workHours} giờ làm, tiền công: ${amount.toLocaleString('vi-VN')}đ)`);

        return { success: true, message: `Check Out thành công! Bạn đã làm ${workHours} giờ.` };
      },

      addAttendance: (record) => {
        const id = 'att_' + Math.random().toString(36).substring(2, 9);
        set((state) => ({
          attendances: [...state.attendances, { ...record, id, isDeleted: false }]
        }));
        get().logActivity('THÊM', 'Chấm công', `Admin tạo thủ công lượt chấm công cho ngày ${record.date}`);
      },

      updateAttendance: (id, record) => {
        set((state) => ({
          attendances: state.attendances.map(a => a.id === id ? { ...a, ...record } : a)
        }));
        get().logActivity('SỬA', 'Chấm công', `Cập nhật dữ liệu chấm công mã ID ${id}`);
      },

      softDeleteAttendance: (id) => {
        set((state) => ({
          attendances: state.attendances.map(a => a.id === id ? { ...a, isDeleted: true } : a)
        }));
        get().logActivity('XÓA_MỀM', 'Chấm công', `Đã chuyển lượt chấm công vào thùng rác`);
      },

      restoreAttendance: (id) => {
        set((state) => ({
          attendances: state.attendances.map(a => a.id === id ? { ...a, isDeleted: false } : a)
        }));
        get().logActivity('KHÔI_PHỤC', 'Chấm công', `Khôi phục lượt chấm công từ thùng rác`);
      },
      
      addLeaveRequest: (req) => {
        const id = 'l_' + Math.random().toString(36).substring(2, 9);
        set((state) => ({
          leaveRequests: [...state.leaveRequests, {
            ...req,
            id,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            isDeleted: false
          }]
        }));
        const user = get().users.find(u => u.id === req.userId);
        get().logActivity('THÊM', 'Nghỉ phép', `Tạo thông báo ${req.type === 'LEAVE' ? 'báo nghỉ' : 'báo đi muộn'} cho ngày ${req.date} (${user?.name})`);

        // Notify Admins
        const admins = get().users.filter(u => u.role === 'ADMIN');
        admins.forEach(admin => {
          get().addNotification({
            userId: admin.id,
            title: `Yêu cầu ${req.type === 'LEAVE' ? 'nghỉ phép' : 'đi muộn/về sớm'} mới`,
            message: `Nhân viên ${user?.name} vừa gửi đơn ${req.type === 'LEAVE' ? 'báo nghỉ' : 'báo đi muộn/về sớm'} cho ngày ${req.date}.`,
            type: 'INFO'
          });
        });
      },
      
      updateLeaveRequestStatus: (id, status) => {
        const req = get().leaveRequests.find(l => l.id === id);
        const currentUser = get().currentUser;
        
        set((state) => ({
          leaveRequests: state.leaveRequests.map(l => l.id === id ? { ...l, status, approvedBy: currentUser?.id } : l)
        }));

        if (req) {
          const statusText = status === 'APPROVED' ? 'Đồng ý' : 'Từ chối';
          get().addNotification({
            userId: req.userId,
            title: `Kết quả ${req.type === 'LEAVE' ? 'báo nghỉ' : 'báo đi muộn'}`,
            message: `Yêu cầu ngày ${req.date} của bạn đã được Admin ${statusText.toLowerCase()}.`,
            type: status === 'APPROVED' ? 'SUCCESS' : 'ERROR'
          });

          get().logActivity(status === 'APPROVED' ? 'Duyệt' : 'Từ chối', 'Nghỉ phép', `Admin đã ${statusText.toLowerCase()} đơn ${req.type === 'LEAVE' ? 'báo nghỉ' : 'báo đi muộn'} ngày ${req.date}`);
        }
      },

      updateLeaveRequest: (id, request) => {
        set((state) => ({
          leaveRequests: state.leaveRequests.map(l => l.id === id ? { ...l, ...request } : l)
        }));
        get().logActivity('SỬA', 'Nghỉ phép', `Cập nhật thông báo báo nghỉ/đi muộn mã ${id}`);
      },

      softDeleteLeaveRequest: (id) => {
        set((state) => ({
          leaveRequests: state.leaveRequests.map(l => l.id === id ? { ...l, isDeleted: true } : l)
        }));
        get().logActivity('XÓA_MỀM', 'Nghỉ phép', `Xóa mềm đơn báo nghỉ/đi muộn`);
      },

      restoreLeaveRequest: (id) => {
        set((state) => ({
          leaveRequests: state.leaveRequests.map(l => l.id === id ? { ...l, isDeleted: false } : l)
        }));
        get().logActivity('KHÔI_PHỤC', 'Nghỉ phép', `Khôi phục đơn báo nghỉ/đi muộn`);
      },
      
      addYoutubeView: (view) => {
        const user = get().users.find(u => u.id === view.userId);
        const rate = user?.viewBonusRate || 5000;
        const amount = Math.round((view.viewCount / 1000) * rate);
        const id = 'v_' + Math.random().toString(36).substring(2, 9);
        
        set((state) => ({
          youtubeViews: [...state.youtubeViews, {
            ...view,
            id,
            amount,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            isDeleted: false
          }]
        }));

        
        get().logActivity('THÊM', 'View YouTube', `Khai báo ${view.viewCount.toLocaleString('vi-VN')} lượt xem tháng ${view.month}/${view.year} (${user?.name})`);
      },
      
      updateYoutubeViewStatus: (id, status) => {
        const v = get().youtubeViews.find(item => item.id === id);
        set((state) => ({
          youtubeViews: state.youtubeViews.map(item => item.id === id ? { ...item, status } : item)
        }));

        if (v) {
          const statusText = status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối';
          get().addNotification({
            userId: v.userId,
            title: 'Khai báo View YouTube',
            message: `Khai báo ${v.viewCount.toLocaleString('vi-VN')} View tháng ${v.month}/${v.year} của bạn đã được ${statusText}.`,
            type: status === 'APPROVED' ? 'SUCCESS' : 'ERROR'
          });

          get().logActivity(status === 'APPROVED' ? 'Duyệt' : 'Từ chối', 'View YouTube', `Admin ${statusText.toLowerCase()} khai báo View YouTube tháng ${v.month}/${v.year}`);
        }
      },

      updateYoutubeView: (id, view) => {
        set((state) => ({
          youtubeViews: state.youtubeViews.map(v => {
            if (v.id === id) {
              const newViewCount = view.viewCount !== undefined ? view.viewCount : v.viewCount;
              const user = state.users.find(u => u.id === v.userId);
        const rate = user?.viewBonusRate || 5000;
              const newAmount = Math.round((newViewCount / 1000) * rate);
              return { ...v, ...view, amount: newAmount };
            }
            return v;
          })
        }));
        get().logActivity('SỬA', 'View YouTube', `Sửa thông tin khai báo View mã ${id}`);
      },

      softDeleteYoutubeView: (id) => {
        set((state) => ({
          youtubeViews: state.youtubeViews.map(v => v.id === id ? { ...v, isDeleted: true } : v)
        }));
        get().logActivity('XÓA_MỀM', 'View YouTube', `Xóa mềm khai báo View YouTube mã ${id}`);
      },

      restoreYoutubeView: (id) => {
        set((state) => ({
          youtubeViews: state.youtubeViews.map(v => v.id === id ? { ...v, isDeleted: false } : v)
        }));
        get().logActivity('KHÔI_PHỤC', 'View YouTube', `Khôi phục khai báo View YouTube mã ${id}`);
      },

      addYoutubeRevenue: (revenue) => {
        const id = 'rev_' + Math.random().toString(36).substring(2, 9);
        set((state) => ({
          youtubeRevenues: [...state.youtubeRevenues, {
            ...revenue,
            id,
            createdAt: new Date().toISOString(),
            isDeleted: false
          }]
        }));
        get().logActivity('THÊM', 'Doanh thu', `Thêm doanh thu YouTube tháng ${revenue.month}/${revenue.year}: ${revenue.revenue.toLocaleString('vi-VN')}đ`);
      },

      updateYoutubeRevenue: (id, revenue) => {
        set((state) => ({
          youtubeRevenues: state.youtubeRevenues.map(r => r.id === id ? { ...r, ...revenue } : r)
        }));
        get().logActivity('SỬA', 'Doanh thu', `Cập nhật dữ liệu doanh thu công ty mã ${id}`);
      },

      softDeleteYoutubeRevenue: (id) => {
        set((state) => ({
          youtubeRevenues: state.youtubeRevenues.map(r => r.id === id ? { ...r, isDeleted: true } : r)
        }));
        get().logActivity('XÓA_MỀM', 'Doanh thu', `Xóa mềm doanh thu công ty`);
      },

      restoreYoutubeRevenue: (id) => {
        set((state) => ({
          youtubeRevenues: state.youtubeRevenues.map(r => r.id === id ? { ...r, isDeleted: false } : r)
        }));
        get().logActivity('KHÔI_PHỤC', 'Doanh thu', `Khôi phục doanh thu công ty`);
      },
      
      addBonusPenalty: (record) => {
        const id = 'bp_' + Math.random().toString(36).substring(2, 9);
        set((state) => ({
          bonusPenalties: [...state.bonusPenalties, {
            ...record,
            id,
            isDeleted: false
          }]
        }));

        const user = get().users.find(u => u.id === record.userId);
        const typeText = record.type === 'BONUS' ? 'Thưởng' : 'Phạt';
        get().addNotification({
          userId: record.userId,
          title: `Phiếu ${typeText} mới`,
          message: `Bạn vừa nhận được phiếu ${typeText.toLowerCase()} ${record.amount.toLocaleString('vi-VN')}đ do: ${record.reason}`,
          type: record.type === 'BONUS' ? 'SUCCESS' : 'WARNING'
        });

        get().logActivity('THÊM', 'Thưởng phạt', `Thêm phiếu ${typeText.toLowerCase()} cho ${user?.name}: ${record.amount.toLocaleString('vi-VN')}đ`);
      },

      updateBonusPenalty: (id, record) => {
        set((state) => ({
          bonusPenalties: state.bonusPenalties.map(bp => bp.id === id ? { ...bp, ...record } : bp)
        }));
        get().logActivity('SỬA', 'Thưởng phạt', `Sửa thông tin phiếu thưởng phạt mã ${id}`);
      },

      softDeleteBonusPenalty: (id) => {
        set((state) => ({
          bonusPenalties: state.bonusPenalties.map(bp => bp.id === id ? { ...bp, isDeleted: true } : bp)
        }));
        get().logActivity('XÓA_MỀM', 'Thưởng phạt', `Xóa mềm phiếu thưởng phạt mã ${id}`);
      },

      restoreBonusPenalty: (id) => {
        set((state) => ({
          bonusPenalties: state.bonusPenalties.map(bp => bp.id === id ? { ...bp, isDeleted: false } : bp)
        }));
        get().logActivity('KHÔI_PHỤC', 'Thưởng phạt', `Khôi phục phiếu thưởng phạt mã ${id}`);
      },

      lockPayroll: (month, year) => {
        const state = get();
        // Compute payrolls for all active employees
        const newPayrolls: Payroll[] = state.users.filter(u => !u.isDeleted).map(user => {
          const userAttendances = state.attendances.filter(a => {
            if (a.userId !== user.id || a.isDeleted) return false;
            const d = new Date(a.date);
            return d.getMonth() + 1 === month && d.getFullYear() === year;
          });
          const totalWorkHours = userAttendances.reduce((acc, curr) => acc + curr.workHours, 0);
          const totalHourlyPay = userAttendances.reduce((acc, curr) => acc + curr.amount, 0);

          const userViews = state.youtubeViews.filter(v => {
            return v.userId === user.id && v.month === month && v.year === year && v.status === 'APPROVED' && !v.isDeleted;
          });
          const youtubeBonus = userViews.reduce((acc, curr) => acc + curr.amount, 0);

          const userBonusPenalties = state.bonusPenalties.filter(bp => {
            if (bp.userId !== user.id || bp.isDeleted) return false;
            const d = new Date(bp.date);
            return d.getMonth() + 1 === month && d.getFullYear() === year;
          });
          const otherBonus = userBonusPenalties.filter(bp => bp.type === 'BONUS').reduce((acc, curr) => acc + curr.amount, 0);
          const totalPenalty = userBonusPenalties.filter(bp => bp.type === 'PENALTY').reduce((acc, curr) => acc + curr.amount, 0);

          const finalSalary = totalHourlyPay + youtubeBonus + otherBonus - totalPenalty;

          return {
            id: `p_${user.id}_${month}_${year}`,
            userId: user.id,
            month,
            year,
            totalWorkHours,
            baseHourlyWage: user.hourlyRate,
            totalHourlyPay,
            youtubeBonus,
            otherBonus,
            totalPenalty,
            finalSalary,
            status: 'LOCKED',
            lockedAt: new Date().toISOString(),
            isDeleted: false
          };
        });

        set({
          payrolls: [
            ...state.payrolls.filter(p => !(p.month === month && p.year === year)),
            ...newPayrolls
          ]
        });

        get().addNotification({
          userId: 'ALL',
          title: 'Chốt bảng lương',
          message: `Bảng lương tháng ${month}/${year} đã được Ban Giám Đốc chính thức khóa và chốt duyệt.`,
          type: 'SUCCESS'
        });

        get().logActivity('CHỐT_LƯƠNG', 'Bảng lương', `Admin đã chốt duyệt chính thức bảng lương tháng ${month}/${year}`);
      },

      unlockPayroll: (month, year) => {
        set((state) => ({
          payrolls: state.payrolls.map(p => {
            if (p.month === month && p.year === year) {
              return { ...p, status: 'DRAFT' };
            }
            return p;
          })
        }));

        get().logActivity('SỬA', 'Bảng lương', `Admin mở khóa bảng lương tháng ${month}/${year} để hiệu chỉnh`);
      },
      
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }));
        get().logActivity('SỬA', 'Cài đặt', `Cập nhật tham số cấu hình hệ thống (Đơn giá view, tiền phạt, WiFi...)`);
      }
    }),
    {
      name: 'creatorhr-storage-v2',
    }
  )
);
