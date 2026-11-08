import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useOutletContext, redirect } from 'react-router';
import { prisma } from '~/lib/db';
import { requireUserId } from '~/lib/session.server';
import { YoutubeRevenuePage } from '~/pages/YoutubeRevenue';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== 'ADMIN') throw redirect('/');

  const revenues = await prisma.youtubeRevenue.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });

  return {
    revenues: revenues.map(r => ({
      ...r,
      views: r.views ? Number(r.views) : undefined,
      revenue: Number(r.revenue),
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== 'ADMIN') throw redirect('/');

  const formData = await request.formData();
  const intent = String(formData.get('intent'));

  switch (intent) {
    case 'add': {
      await prisma.youtubeRevenue.create({
        data: {
          channelName: String(formData.get('channelName')),
          month: Number(formData.get('month')),
          year: Number(formData.get('year')),
          revenue: Number(formData.get('revenue')),
          views: formData.get('views') ? BigInt(String(formData.get('views'))) : undefined,
          notes: String(formData.get('notes') || ''),
        },
      });
      await prisma.activityLog.create({
        data: { actorId: userId, actorName: user.name, action: 'THÊM', module: 'Doanh thu', description: 'Thêm doanh thu YouTube' },
      });
      break;
    }
    case 'update': {
      const id = String(formData.get('id'));
      await prisma.youtubeRevenue.update({
        where: { id },
        data: {
          channelName: String(formData.get('channelName')),
          revenue: Number(formData.get('revenue')),
          views: formData.get('views') ? BigInt(String(formData.get('views'))) : undefined,
          notes: String(formData.get('notes') || ''),
        },
      });
      break;
    }
    case 'softDelete': {
      await prisma.youtubeRevenue.update({ where: { id: String(formData.get('id')) }, data: { isDeleted: true } });
      break;
    }
    case 'restore': {
      await prisma.youtubeRevenue.update({ where: { id: String(formData.get('id')) }, data: { isDeleted: false } });
      break;
    }
  }
  return { ok: true };
}

export default function Route() {
  const { revenues } = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<any>();
  return <YoutubeRevenuePage loaderData={{ revenues }} currentUser={currentUser} />;
}