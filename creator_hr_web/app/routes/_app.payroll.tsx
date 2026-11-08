import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useOutletContext } from 'react-router';
import { prisma } from '~/lib/db';
import { requireUserId } from '~/lib/session.server';
import { Payroll } from '~/pages/Payroll';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isAdmin = user?.role === 'ADMIN';

  const [payrolls, bonusPenalties, users, attendances, youtubeViews] = await Promise.all([
    prisma.payroll.findMany({
      where: isAdmin ? {} : { userId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    }),
    prisma.bonusPenalty.findMany({
      where: isAdmin ? {} : { userId },
      orderBy: { date: 'desc' },
    }),
    isAdmin ? prisma.user.findMany({ where: { isDeleted: false } }) : Promise.resolve([]),
    prisma.attendance.findMany({ where: isAdmin ? {} : { userId }, orderBy: { date: 'desc' } }),
    prisma.youtubeView.findMany({ where: { status: 'APPROVED', ...(isAdmin ? {} : { userId }) } }),
  ]);

  const serialize = (obj: any) => JSON.parse(JSON.stringify(obj, (_, v) => typeof v === 'bigint' ? Number(v) : v));

  return serialize({
    payrolls,
    bonusPenalties,
    users: users.map(u => ({ ...u, hourlyRate: Number(u.hourlyRate), viewBonusRate: Number(u.viewBonusRate) })),
    attendances,
    youtubeViews,
    isAdmin,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const formData = await request.formData();
  const intent = String(formData.get('intent'));
  const month = Number(formData.get('month'));
  const year = Number(formData.get('year'));

  if (intent === 'addBonusPenalty') {
    const targetUserId = String(formData.get('userId'));
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    const bpType = String(formData.get('type')) as 'BONUS' | 'PENALTY';
    const amount = Number(formData.get('amount'));
    const reason = String(formData.get('reason'));
    const category = String(formData.get('category'));

    await prisma.bonusPenalty.create({
      data: { userId: targetUserId, type: bpType, category, amount, reason, date: new Date() },
    });
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        title: `Phiếu ${bpType === 'BONUS' ? 'thưởng' : 'phạt'} mới`,
        message: `Bạn vừa nhận phiếu ${bpType === 'BONUS' ? 'thưởng' : 'phạt'} ${amount.toLocaleString('vi-VN')}đ: ${reason}`,
        type: bpType === 'BONUS' ? 'SUCCESS' : 'WARNING',
      },
    });
    await prisma.activityLog.create({
      data: { actorId: userId, actorName: user?.name ?? '', action: 'THÊM', module: 'Thưởng phạt', description: `Thêm phiếu ${bpType === 'BONUS' ? 'thưởng' : 'phạt'} ${amount.toLocaleString('vi-VN')}đ cho ${targetUser?.name}` },
    });
  }

  if (intent === 'lockPayroll') {
    const allUsers = await prisma.user.findMany({ where: { isDeleted: false, isActive: true } });
    for (const u of allUsers) {
      const atts = await prisma.attendance.findMany({
        where: { userId: u.id, isDeleted: false },
      });
      const monthAtts = atts.filter(a => {
        const d = new Date(a.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      });
      const totalWorkHours = monthAtts.reduce((s, a) => s + Number(a.workHours), 0);
      const totalHourlyPay = Math.round(totalWorkHours * Number(u.hourlyRate));

      const views = await prisma.youtubeView.aggregate({
        where: { userId: u.id, month, year, status: 'APPROVED', isDeleted: false },
        _sum: { amount: true },
      });
      const youtubeBonus = Number(views._sum.amount ?? 0);

      const bps = await prisma.bonusPenalty.findMany({
        where: { userId: u.id, isDeleted: false },
      });
      const monthBps = bps.filter(bp => {
        const d = new Date(bp.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      });
      const otherBonus = monthBps.filter(bp => bp.type === 'BONUS').reduce((s, bp) => s + Number(bp.amount), 0);
      const totalPenalty = monthBps.filter(bp => bp.type === 'PENALTY').reduce((s, bp) => s + Number(bp.amount), 0);
      const finalSalary = totalHourlyPay + youtubeBonus + otherBonus - totalPenalty;

      await prisma.payroll.upsert({
        where: { userId_month_year: { userId: u.id, month, year } },
        create: {
          userId: u.id, month, year, totalWorkHours, baseHourlyWage: Number(u.hourlyRate),
          totalHourlyPay, youtubeBonus, otherBonus, totalPenalty, finalSalary,
          status: 'LOCKED', lockedAt: new Date(),
        },
        update: {
          totalWorkHours, totalHourlyPay, youtubeBonus, otherBonus, totalPenalty, finalSalary,
          status: 'LOCKED', lockedAt: new Date(),
        },
      });
    }
    await prisma.activityLog.create({
      data: { actorId: userId, actorName: user?.name ?? '', action: 'CHỐT_LƯƠNG', module: 'Bảng lương', description: `Chốt bảng lương tháng ${month}/${year}` },
    });
  }

  return { ok: true };
}

export default function Route() {
  const data = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<any>();
  return <Payroll loaderData={data} currentUser={currentUser} />;
}