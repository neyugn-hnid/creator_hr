import type { LoaderFunctionArgs } from 'react-router';
import { prisma } from '~/lib/db';

export async function loader({ request }: LoaderFunctionArgs) {
  const authHeader = request.headers.get('Authorization') || '';
  const userId = authHeader.replace('Bearer ', '').trim() || new URL(request.url).searchParams.get('userId') || '';

  if (!userId) {
    return Response.json({ ok: false, error: 'Thiếu Token xác thực Authorization' }, { status: 401 });
  }

  const url = new URL(request.url);
  const month = Number(url.searchParams.get('month') || new Date().getMonth() + 1);
  const year = Number(url.searchParams.get('year') || new Date().getFullYear());

  const [payrolls, bonusPenalties, youtubeViews] = await Promise.all([
    prisma.payroll.findMany({
      where: { userId, month, year, isDeleted: false },
    }),
    prisma.bonusPenalty.findMany({
      where: { userId, isDeleted: false },
      orderBy: { date: 'desc' },
      take: 20,
    }),
    prisma.youtubeView.findMany({
      where: { userId, month, year, isDeleted: false },
    }),
  ]);

  return Response.json({
    ok: true,
    month,
    year,
    payrolls: payrolls.map(p => ({
      ...p,
      totalWorkHours: Number(p.totalWorkHours),
      baseHourlyWage: Number(p.baseHourlyWage),
      totalHourlyPay: Number(p.totalHourlyPay),
      youtubeBonus: Number(p.youtubeBonus),
      otherBonus: Number(p.otherBonus),
      totalPenalty: Number(p.totalPenalty),
      finalSalary: Number(p.finalSalary),
    })),
    bonusPenalties: bonusPenalties.map(b => ({
      ...b,
      amount: Number(b.amount),
      date: b.date.toISOString(),
    })),
    youtubeViews: youtubeViews.map(y => ({
      ...y,
      viewCount: Number(y.viewCount),
      subscriberCount: Number(y.subscriberCount),
      amount: Number(y.amount),
    })),
  });
}
