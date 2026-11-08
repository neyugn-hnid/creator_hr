import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.DATABASE_URL?.includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ===== App Settings =====
  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      latePenalty: 50000,
      forgetCheckOutPenalty: 100000,
      companyWifiSsid: "CreatorHR_5G",
      companyIp: "192.168.1.1",
      workStartTime: "08:30",
      workEndTime: "17:30",
    },
    update: {},
  });
  console.log("✅ Settings seeded");

  // ===== Users =====
  const admin = await prisma.user.upsert({
    where: { email: "admin@creatorhr.vn" },
    create: {
      id: "u1",
      name: "Phạm Minh Đức",
      email: "admin@creatorhr.vn",
      password: "123456",
      role: "ADMIN",
      phone: "0988123456",
      department: "Ban Giám Đốc",
      position: "Quản trị viên hệ thống",
      joinedDate: "2023-01-15",
      hourlyRate: 120000,
      viewBonusRate: 15000,
      bankAccount: "190345678910",
      bankName: "Techcombank",
      isActive: true,
      isDeleted: false,
    },
    update: {},
  });

  const nam = await prisma.user.upsert({
    where: { email: "nam.nh@creatorhr.vn" },
    create: {
      id: "u2",
      name: "Nguyễn Hoàng Nam",
      email: "nam.nh@creatorhr.vn",
      password: "123456",
      role: "EMPLOYEE",
      phone: "0912345678",
      department: "Sáng tạo nội dung",
      position: "Content Creator Senior",
      joinedDate: "2023-06-01",
      hourlyRate: 65000,
      viewBonusRate: 5000,
      bankAccount: "001100223344",
      bankName: "Vietcombank",
      isActive: true,
      isDeleted: false,
    },
    update: {},
  });

  const linh = await prisma.user.upsert({
    where: { email: "linh.tt@creatorhr.vn" },
    create: {
      id: "u3",
      name: "Trần Thảo Linh",
      email: "linh.tt@creatorhr.vn",
      password: "123456",
      role: "EMPLOYEE",
      phone: "0977888999",
      department: "Dựng phim & VFX",
      position: "Video Editor Lead",
      joinedDate: "2023-08-10",
      hourlyRate: 70000,
      viewBonusRate: 5000,
      bankAccount: "1020304050",
      bankName: "MB Bank",
      isActive: true,
      isDeleted: false,
    },
    update: {},
  });

  const anh = await prisma.user.upsert({
    where: { email: "anh.lq@creatorhr.vn" },
    create: {
      id: "u4",
      name: "Lê Quốc Anh",
      email: "anh.lq@creatorhr.vn",
      password: "123456",
      role: "EMPLOYEE",
      phone: "0933444555",
      department: "Sáng tạo nội dung",
      position: "Script Writer & Host",
      joinedDate: "2024-02-15",
      hourlyRate: 55000,
      viewBonusRate: 5000,
      bankAccount: "8888999900",
      bankName: "ACB",
      isActive: true,
      isDeleted: false,
    },
    update: {},
  });

  const phuong = await prisma.user.upsert({
    where: { email: "phuong.dm@creatorhr.vn" },
    create: {
      id: "u5",
      name: "Đặng Mai Phương",
      email: "phuong.dm@creatorhr.vn",
      password: "123456",
      role: "EMPLOYEE",
      phone: "0966111222",
      department: "Thiết kế & Thumbnail",
      position: "Graphic Designer",
      joinedDate: "2024-04-01",
      hourlyRate: 50000,
      viewBonusRate: 5000,
      bankAccount: "9900112233",
      bankName: "VPBank",
      isActive: true,
      isDeleted: false,
    },
    update: {},
  });
  console.log("✅ Users seeded:", [admin, nam, linh, anh, phuong].map(u => u.name).join(", "));

  // ===== YouTube Revenues =====
  await prisma.youtubeRevenue.createMany({
    data: [
      { id: "rev1", channelName: "Kênh Khám Phá Creator", month: 7, year: 2026, revenue: 185000000, views: 32000000n, notes: "Doanh thu tháng 7 ổn định" },
      { id: "rev2", channelName: "Kênh Giải Trí Creator Studio", month: 7, year: 2026, revenue: 142000000, views: 24000000n, notes: "Tăng trưởng tốt từ Shorts" },
      { id: "rev3", channelName: "Kênh Khám Phá Creator", month: 6, year: 2026, revenue: 170000000, views: 29000000n, notes: "Doanh thu tháng 6" },
      { id: "rev4", channelName: "Kênh Giải Trí Creator Studio", month: 6, year: 2026, revenue: 130000000, views: 21000000n, notes: "Doanh thu tháng 6" },
    ],
    skipDuplicates: true,
  });
  console.log("✅ YouTube revenues seeded");

  // ===== YouTube Views =====
  await prisma.youtubeView.createMany({
    data: [
      { id: "v1", userId: "u2", channelName: "Kênh Khám Phá Creator", month: 7, year: 2026, viewCount: 12500000n, amount: 62500000, status: "APPROVED", note: "Đạt chỉ tiêu video viral tháng 7" },
      { id: "v2", userId: "u3", channelName: "Kênh Giải Trí Creator Studio", month: 7, year: 2026, viewCount: 9800000n, amount: 49000000, status: "APPROVED", note: "Dựng series mới thành công" },
      { id: "v3", userId: "u4", channelName: "Kênh Khám Phá Creator", month: 7, year: 2026, viewCount: 6400000n, amount: 32000000, status: "APPROVED", note: "Xác nhận view đầy đủ" },
      { id: "v4", userId: "u5", channelName: "Kênh Giải Trí Creator Studio", month: 7, year: 2026, viewCount: 4200000n, amount: 21000000, status: "PENDING", note: "Khai báo view thiết kế thumbnail" },
    ],
    skipDuplicates: true,
  });
  console.log("✅ YouTube views seeded");

  // ===== Bonus/Penalties =====
  await prisma.bonusPenalty.createMany({
    data: [
      { id: "bp1", userId: "u2", type: "BONUS", category: "Sáng tạo xuất sắc", amount: 3000000, reason: "Thưởng video đạt Top 1 Trending YouTube", date: new Date("2026-07-20T10:00:00Z") },
      { id: "bp2", userId: "u3", type: "BONUS", category: "Tăng ca hoàn thành gấp", amount: 1500000, reason: "Dựng video gấp trong đêm đạt chất lượng 4K", date: new Date("2026-07-25T14:30:00Z") },
      { id: "bp3", userId: "u4", type: "PENALTY", category: "Đi muộn không báo trước", amount: 50000, reason: "Hệ thống tự động phạt: Đi muộn ngày 10/07", date: new Date("2026-07-10T09:15:00Z") },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Bonus/penalties seeded");

  // ===== Attendances =====
  await prisma.attendance.createMany({
    data: [
      { id: "att1", userId: "u2", date: "2026-08-02", checkIn: new Date("2026-08-02T08:25:00Z"), checkOut: new Date("2026-08-02T17:35:00Z"), workHours: 8, overtimeHours: 0.5, amount: 520000, status: "PRESENT", wifiSsid: "CreatorHR_5G", ipAddress: "192.168.1.1" },
      { id: "att2", userId: "u3", date: "2026-08-02", checkIn: new Date("2026-08-02T08:28:00Z"), workHours: 0, amount: 0, status: "PRESENT", wifiSsid: "CreatorHR_5G", ipAddress: "192.168.1.1" },
      { id: "att3", userId: "u4", date: "2026-08-02", checkIn: new Date("2026-08-02T08:50:00Z"), workHours: 0, lateMinutes: 20, amount: 0, status: "LATE", wifiSsid: "CreatorHR_5G", ipAddress: "192.168.1.1" },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Attendances seeded");

  // ===== Leave Requests =====
  await prisma.leaveRequest.createMany({
    data: [
      { id: "l1", userId: "u5", date: "2026-08-02", type: "LEAVE", reason: "Nghỉ ốm có giấy khám bác sĩ", status: "APPROVED", approvedBy: "u1" },
      { id: "l2", userId: "u4", date: "2026-08-02", type: "LATE", expectedTime: "09:00", reason: "Hỏng xe trên đường đến công ty", status: "APPROVED", approvedBy: "u1" },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Leave requests seeded");

  // ===== Notifications =====
  await prisma.notification.createMany({
    data: [
      { id: "n1", userId: "u1", title: "Thông báo quy định chấm công", message: "Tất cả nhân viên lưu ý kết nối đúng WiFi CreatorHR_5G khi Check In & Check Out.", isRead: false, type: "INFO" },
      { id: "n2", userId: "u4", title: "Duyệt báo đi muộn", message: "Yêu cầu báo đi muộn ngày 02/08/2026 của bạn đã được phê duyệt.", isRead: false, type: "SUCCESS" },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Notifications seeded");

  // ===== Activity Logs =====
  await prisma.activityLog.createMany({
    data: [
      { id: "log1", actorId: "u1", actorName: "Phạm Minh Đức", action: "Duyệt", module: "Nghỉ phép", description: "Đã phê duyệt đơn báo đi muộn của Lê Quốc Anh (02/08/2026)", timestamp: new Date("2026-08-02T08:10:00Z") },
      { id: "log2", actorId: "u1", actorName: "Phạm Minh Đức", action: "THÊM", module: "Thưởng phạt", description: "Đã tạo phiếu thưởng 3.000.000đ cho Nguyễn Hoàng Nam", timestamp: new Date("2026-07-20T10:00:00Z") },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Activity logs seeded");

  console.log("\n🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
