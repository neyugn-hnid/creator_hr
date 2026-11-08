import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { prisma } from '~/lib/db';

export async function loader({ request }: LoaderFunctionArgs) {
  const authHeader = request.headers.get('Authorization') || '';
  const userId = authHeader.replace('Bearer ', '').trim() || new URL(request.url).searchParams.get('userId') || '';

  if (!userId) {
    return Response.json({ ok: false, error: 'Thiếu Token xác thực Authorization' }, { status: 401 });
  }

  const attendances = await prisma.attendance.findMany({
    where: { userId, isDeleted: false },
    orderBy: { date: 'desc' },
    take: 30,
  });

  return Response.json({
    ok: true,
    attendances: attendances.map(a => ({
      ...a,
      workHours: Number(a.workHours),
      overtimeHours: Number(a.overtimeHours),
      amount: Number(a.amount),
      checkIn: a.checkIn?.toISOString() ?? null,
      checkOut: a.checkOut?.toISOString() ?? null,
    })),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ ok: false, error: 'Method Not Allowed' }, { status: 405 });
  }

  try {
    const authHeader = request.headers.get('Authorization') || '';
    const contentType = request.headers.get('content-type') || '';
    let payload: any = {};

    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else {
      const formData = await request.formData();
      payload = Object.fromEntries(formData);
    }

    const userId = authHeader.replace('Bearer ', '').trim() || String(payload.userId || '');
    if (!userId) {
      return Response.json({ ok: false, error: 'Thiếu Token xác thực Mobile User' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return Response.json({ ok: false, error: 'Người dùng không tồn tại' }, { status: 404 });
    }

    const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } });
    const companyWifiSsid = settings?.companyWifiSsid ?? 'CreatorHR_5G';
    const today = new Date().toISOString().split('T')[0];

    const intent = String(payload.intent || 'checkIn');
    const wifiSsid = String(payload.wifiSsid || '').trim();
    const lat = String(payload.latitude || '').trim();
    const lng = String(payload.longitude || '').trim();

    if (wifiSsid.toLowerCase() !== companyWifiSsid.toLowerCase()) {
      return Response.json({
        ok: false,
        error: `Mạng WiFi không hợp lệ! Vui lòng kết nối đúng WiFi nội bộ "${companyWifiSsid}".`,
      }, { status: 400 });
    }

    if (!lat || !lng) {
      return Response.json({
        ok: false,
        error: 'Không lấy được vị trí GPS trực tiếp! Vui lòng bật định vị GPS trên thiết bị.',
      }, { status: 400 });
    }

    if (intent === 'checkIn') {
      const existing = await prisma.attendance.findFirst({ where: { userId, date: today, isDeleted: false } });
      if (existing) {
        return Response.json({ ok: false, error: 'Bạn đã Check In hôm nay rồi!' }, { status: 400 });
      }

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

      const newRecord = await prisma.attendance.create({
        data: {
          userId,
          date: today,
          checkIn: now,
          workHours: 0,
          lateMinutes,
          amount: 0,
          status: isLate ? 'LATE' : 'PRESENT',
          wifiSsid: companyWifiSsid,
          ipAddress: `GPS: ${lat}, ${lng}`,
        },
      });

      await prisma.activityLog.create({
        data: { actorId: userId, actorName: user.name, action: 'THÊM', module: 'Mobile App', description: `Check In Mobile thành công (GPS: ${lat}, ${lng})` },
      });

      return Response.json({
        ok: true,
        message: `Check In thành công! Tọa độ GPS: ${lat}, ${lng}`,
        attendance: {
          ...newRecord,
          checkIn: newRecord.checkIn?.toISOString(),
        },
      });
    } else if (intent === 'checkOut') {
      const record = await prisma.attendance.findFirst({
        where: { userId, date: today, checkIn: { not: null }, checkOut: null, isDeleted: false },
      });

      if (!record) {
        return Response.json({ ok: false, error: 'Không tìm thấy lượt Check In hôm nay!' }, { status: 400 });
      }

      const now = new Date();
      const diffMs = now.getTime() - record.checkIn!.getTime();
      let workHours = Math.max(0, diffMs / (1000 * 60 * 60));
      if (workHours > 5) workHours -= 1.0;
      workHours = Math.max(0, parseFloat(workHours.toFixed(1)));
      const overtimeHours = Math.max(0, parseFloat((workHours - 8).toFixed(1)));
      const amount = Math.round(workHours * Number(user.hourlyRate ?? 50000));

      const updatedRecord = await prisma.attendance.update({
        where: { id: record.id },
        data: { checkOut: now, workHours, overtimeHours, amount },
      });

      await prisma.activityLog.create({
        data: { actorId: userId, actorName: user.name, action: 'SỬA', module: 'Mobile App', description: `Check Out Mobile thành công (${workHours}h)` },
      });

      return Response.json({
        ok: true,
        message: `Check Out thành công! ${workHours} giờ làm.`,
        attendance: {
          ...updatedRecord,
          checkIn: updatedRecord.checkIn?.toISOString(),
          checkOut: updatedRecord.checkOut?.toISOString(),
        },
      });
    }

    return Response.json({ ok: false, error: 'Intent không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    return Response.json({ ok: false, error: err.message || 'Lỗi xử lý Chấm công Mobile' }, { status: 500 });
  }
}
