import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useOutletContext } from 'react-router';
import { prisma } from '~/lib/db';
import { requireUserId } from '~/lib/session.server';
import { Dashboard } from '~/pages/Dashboard';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isAdmin = user?.role === 'ADMIN';

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const today = now.toISOString().split('T')[0];

  const [
    totalEmployees,
    todayAttendances,
    pendingLeaves,
    myAttendance,
    myLeaves,
    recentNotifications,
    recentLogs,
    monthRevenue,
    myViewsThisMonth,
  ] = await Promise.all([
    // Total active employees (admin only)
    isAdmin ? prisma.user.count({ where: { isActive: true, isDeleted: false, role: 'EMPLOYEE' } }) : Promise.resolve(0),

    // Today attendance count (admin: all, employee: own)
    isAdmin
      ? prisma.attendance.count({ where: { date: today, isDeleted: false } })
      : prisma.attendance.count({ where: { userId, date: today, isDeleted: false } }),

    // Pending leave requests
    isAdmin
      ? prisma.leaveRequest.count({ where: { status: 'PENDING', isDeleted: false } })
      : prisma.leaveRequest.count({ where: { userId, status: 'PENDING', isDeleted: false } }),

    // My today's attendance
    prisma.attendance.findFirst({ where: { userId, date: today, isDeleted: false } }),

    // My recent leaves
    prisma.leaveRequest.findMany({
      where: { userId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),

    // Recent notifications for user
    prisma.notification.findMany({
      where: { OR: [{ userId }, { userId: 'ALL' }], isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),

    // Recent activity logs (admin only)
    isAdmin
      ? prisma.activityLog.findMany({ orderBy: { timestamp: 'desc' }, take: 10 })
      : Promise.resolve([]),

    // This month total revenue (admin only)
    isAdmin
      ? prisma.youtubeRevenue.aggregate({
          where: { month: currentMonth, year: currentYear, isDeleted: false },
          _sum: { revenue: true },
        })
      : Promise.resolve({ _sum: { revenue: 0 } }),

    // My youtube views this month
    prisma.youtubeView.findFirst({
      where: { userId, month: currentMonth, year: currentYear, isDeleted: false },
    }),
  ]);

  // Serialize BigInt fields
  const serializeAttendance = (a: typeof myAttendance) => a ? {
    ...a,
    checkIn: a.checkIn?.toISOString() ?? null,
    checkOut: a.checkOut?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  } : null;

  return {
    stats: {
      totalEmployees,
      todayAttendances,
      pendingLeaves,
      monthRevenue: Number(monthRevenue._sum.revenue ?? 0),
      myViewsThisMonth: myViewsThisMonth ? Number(myViewsThisMonth.viewCount) : 0,
      myViewsBonusThisMonth: myViewsThisMonth ? Number(myViewsThisMonth.amount) : 0,
    },
    myAttendance: serializeAttendance(myAttendance),
    myLeaves: myLeaves.map(l => ({ ...l, createdAt: l.createdAt.toISOString() })),
    recentNotifications: recentNotifications.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })),
    recentLogs: recentLogs.map(l => ({ ...l, timestamp: l.timestamp.toISOString() })),
    currentMonth,
    currentYear,
  };
}

export default function IndexRoute() {
  const data = useLoaderData<typeof loader>();
  const { currentUser, settings } = useOutletContext<any>();
  return <Dashboard loaderData={data} currentUser={currentUser} settings={settings} />;
}