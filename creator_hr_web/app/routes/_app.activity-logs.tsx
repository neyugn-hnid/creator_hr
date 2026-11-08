import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useOutletContext, redirect } from 'react-router';
import { prisma } from '~/lib/db';
import { requireUserId } from '~/lib/session.server';
import { ActivityLogs } from '~/pages/ActivityLogs';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== 'ADMIN') throw redirect('/');

  const logs = await prisma.activityLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 200,
  });

  return {
    activityLogs: logs.map(l => ({ ...l, timestamp: l.timestamp.toISOString() })),
  };
}

export default function Route() {
  const { activityLogs } = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<any>();
  return <ActivityLogs loaderData={{ activityLogs }} currentUser={currentUser} />;
}