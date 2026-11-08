import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useOutletContext } from 'react-router';
import { prisma } from '~/lib/db';
import { requireUserId } from '~/lib/session.server';
import { Attendance } from '~/pages/Attendance';

function serializeAtt(a: any) {
  return {
    ...a,
    workHours: Number(a.workHours),
    overtimeHours: Number(a.overtimeHours),
    amount: Number(a.amount),
    checkIn: a.checkIn?.toISOString() ?? null,
    checkOut: a.checkOut?.toISOString() ?? null,
    createdAt: a.createdAt?.toISOString() ?? null,
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isAdmin = user?.role === 'ADMIN';

  const [attendances, users, settings] = await Promise.all([
    prisma.attendance.findMany({
      where: isAdmin ? {} : { userId },
      orderBy: { date: 'desc' },
      include: { user: { select: { name: true } } },
    }),
    isAdmin ? prisma.user.findMany({ where: { isDeleted: false, isActive: true } }) : Promise.resolve([]),
    prisma.appSettings.findUnique({ where: { id: 'singleton' } }),
  ]);

  return {
    attendances: attendances.map(serializeAtt),
    users: users.map(u => ({ ...u, hourlyRate: Number(u.hourlyRate), viewBonusRate: Number(u.viewBonusRate), createdAt: u.createdAt.toISOString(), updatedAt: u.updatedAt.toISOString() })),
    settings: settings ?? { latePenalty: 50000, forgetCheckOutPenalty: 100000, companyWifiSsid: 'CreatorHR_5G', companyIp: '192.168.1.1', workStartTime: '08:30', workEndTime: '17:30' },
    isAdmin,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const formData = await request.formData();
  const intent = String(formData.get('intent'));
  const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } });
  const wifiSsid = settings?.companyWifiSsid ?? 'CreatorHR_5G';
  const today = new Date().toISOString().split('T')[0];

  switch (intent) {
    case 'checkIn': {
      const ssid = String(formData.get('wifiSsid') || '').trim();
      const lat = String(formData.get('latitude') || '').trim();
      const lng = String(formData.get('longitude') || '').trim();

      if (ssid.toLowerCase() !== wifiSsid.toLowerCase()) {
        return { error: `Mạng WiFi không hợp lệ! Vui lòng kết nối đúng WiFi nội bộ "${wifiSsid}".` };
      }

      if (!lat || !lng) {
        return { error: `Không lấy được vị trí GPS trực tiếp! Vui lòng bật định vị GPS trên thiết bị để Check In.` };
      }

      const existing = await prisma.attendance.findFirst({ where: { userId, date: today, isDeleted: false } });
      if (existing) return { error: 'Bạn đã Check In hôm nay rồi!' };

      const now = new Date();
      const [startH, startM] = (settings?.workStartTime ?? '08:30').split(':').map(Number);
      const standardStart = startH * 60 + startM;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      const approvedLate = await prisma.leaveRequest.findFirst({
        where: { userId, date: today, type: 'LATE', status: 'APPROVED', isDeleted: false },
      });

      let allowedMinutes = standardStart;
      if (approvedLate?.expectedTime) {
        const [h, m] = approvedLate.expectedTime.split(':').map(Number);
        allowedMinutes = h * 60 + m;
      }

      const isLate = nowMinutes > allowedMinutes;
      const lateMinutes = isLate ? nowMinutes - allowedMinutes : 0;

      await prisma.attendance.create({
        data: {
          userId,
          date: today,
          checkIn: now,
          workHours: 0,
          lateMinutes,
          amount: 0,
          status: isLate ? 'LATE' : 'PRESENT',
          wifiSsid,
          ipAddress: `GPS: ${lat}, ${lng}`,
        },
      });

      if (isLate && !approvedLate) {
        const penalty = settings?.latePenalty ?? 50000;
        await prisma.bonusPenalty.create({
          data: {
            userId,
            type: 'PENALTY',
            category: 'Đi muộn không xin phép',
            amount: penalty,
            reason: `Hệ thống tự động phạt: Đi muộn ${lateMinutes} phút`,
            date: now,
          },
        });
        await prisma.notification.create({
          data: {
            userId,
            title: 'Phiếu phạt tự động',
            message: `Bạn đã bị phạt ${new Intl.NumberFormat('vi-VN').format(penalty)}đ do đi muộn ${lateMinutes} phút.`,
            type: 'ERROR',
          },
        });
      }

      await prisma.activityLog.create({
        data: { actorId: userId, actorName: user?.name ?? '', action: 'THÊM', module: 'Chấm công', description: `Check In thành công qua WiFi ${wifiSsid} (GPS: ${lat}, ${lng})` },
      });
      return { success: `Check In thành công! Tọa độ GPS: ${lat}, ${lng}` };
    }

    case 'checkOut': {
      const ssid = String(formData.get('wifiSsid') || '').trim();
      const lat = String(formData.get('latitude') || '').trim();
      const lng = String(formData.get('longitude') || '').trim();

      if (ssid.toLowerCase() !== wifiSsid.toLowerCase()) {
        return { error: `Mạng WiFi không hợp lệ! Vui lòng kết nối đúng WiFi nội bộ "${wifiSsid}".` };
      }

      if (!lat || !lng) {
        return { error: `Không lấy được vị trí GPS trực tiếp! Vui lòng bật định vị GPS trên thiết bị để Check Out.` };
      }

      const record = await prisma.attendance.findFirst({
        where: { userId, date: today, checkIn: { not: null }, checkOut: null, isDeleted: false },
      });
      if (!record) return { error: 'Không tìm thấy lượt Check In hôm nay!' };

      const now = new Date();
      const diffMs = now.getTime() - record.checkIn!.getTime();
      let workHours = Math.max(0, diffMs / (1000 * 60 * 60));
      if (workHours > 5) workHours -= 1.0;
      workHours = Math.max(0, parseFloat(workHours.toFixed(1)));
      const overtimeHours = Math.max(0, parseFloat((workHours - 8).toFixed(1)));
      const amount = Math.round(workHours * Number(user?.hourlyRate ?? 50000));

      await prisma.attendance.update({
        where: { id: record.id },
        data: { checkOut: now, workHours, overtimeHours, amount },
      });

      await prisma.activityLog.create({
        data: { actorId: userId, actorName: user?.name ?? '', action: 'SỬA', module: 'Chấm công', description: `Check Out thành công (${workHours}h, ${amount.toLocaleString('vi-VN')}đ)` },
      });
      return { success: `Check Out thành công! ${workHours} giờ làm.` };
    }

    case 'softDelete': {
      const id = String(formData.get('id'));
      await prisma.attendance.update({ where: { id }, data: { isDeleted: true } });
      return { ok: true };
    }

    case 'restore': {
      const id = String(formData.get('id'));
      await prisma.attendance.update({ where: { id }, data: { isDeleted: false } });
      return { ok: true };
    }
  }
  return { ok: true };
}

export default function Route() {
  const data = useLoaderData<typeof loader>();
  const { currentUser, settings } = useOutletContext<any>();
  return <Attendance loaderData={data} currentUser={currentUser} />;
}