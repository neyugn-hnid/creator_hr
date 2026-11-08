import type { LoaderFunctionArgs } from 'react-router';
import { prisma } from '~/lib/db';

export async function loader({ request }: LoaderFunctionArgs) {
  const authHeader = request.headers.get('Authorization') || '';
  const userId = authHeader.replace('Bearer ', '').trim() || new URL(request.url).searchParams.get('userId') || '';

  if (!userId) {
    return Response.json({ ok: false, error: 'Thiếu Token xác thực Authorization' }, { status: 401 });
  }

  const [user, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, role: true,
        phone: true, department: true, position: true,
        joinedDate: true, avatar: true, bankAccount: true,
        bankName: true, hourlyRate: true, viewBonusRate: true,
      },
    }),
    prisma.appSettings.findUnique({ where: { id: 'singleton' } }),
  ]);

  if (!user) {
    return Response.json({ ok: false, error: 'Tài khoản không tồn tại' }, { status: 404 });
  }

  return Response.json({
    ok: true,
    user: {
      ...user,
      hourlyRate: Number(user.hourlyRate),
      viewBonusRate: Number(user.viewBonusRate),
    },
    settings: settings ?? {
      latePenalty: 50000,
      forgetCheckOutPenalty: 100000,
      companyWifiSsid: 'CreatorHR_5G',
      companyIp: '192.168.1.1',
      companyLat: '10.776889',
      companyLng: '106.700806',
      maxDistanceMeters: 100,
      workStartTime: '08:30',
      workEndTime: '17:30',
    },
  });
}
