import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useOutletContext, redirect } from 'react-router';
import { prisma } from '~/lib/db';
import { requireUserId } from '~/lib/session.server';
import { Reports } from '~/pages/Reports';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== 'ADMIN') throw redirect('/');

  const [users, attendances, youtubeViews, revenues, bonusPenalties, payrolls] = await Promise.all([
    prisma.user.findMany({ where: { isDeleted: false } }),
    prisma.attendance.findMany({ where: { isDeleted: false }, orderBy: { date: 'desc' } }),
    prisma.youtubeView.findMany({ where: { isDeleted: false } }),
    prisma.youtubeRevenue.findMany({ where: { isDeleted: false } }),
    prisma.bonusPenalty.findMany({ where: { isDeleted: false } }),
    prisma.payroll.findMany({ where: { isDeleted: false } }),
  ]);

  const serialize = (obj: any) =>
    JSON.parse(JSON.stringify(obj, (_, v) => typeof v === 'bigint' ? Number(v) : v));

  return serialize({
    users: users.map(u => ({ ...u, hourlyRate: Number(u.hourlyRate), viewBonusRate: Number(u.viewBonusRate) })),
    attendances,
    youtubeViews,
    revenues,
    bonusPenalties,
    payrolls,
  });
}

export default function Route() {
  const data = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<any>();
  return <Reports loaderData={data} currentUser={currentUser} />;
}