import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useOutletContext, redirect } from 'react-router';
import { prisma } from '~/lib/db';
import { requireUserId } from '~/lib/session.server';
import { NotificationsPage } from '~/pages/NotificationsPage';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  const notifications = await prisma.notification.findMany({
    where: { OR: [{ userId }, { userId: 'ALL' }] },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return {
    notifications: notifications.map(n => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = String(formData.get('intent'));

  if (intent === 'markRead') {
    const id = String(formData.get('id'));
    if (id && !id.startsWith('live_') && !id.startsWith('sent_')) {
      await prisma.notification.updateMany({ where: { id }, data: { isRead: true } });
    }
  } else if (intent === 'markAllRead') {
    await prisma.notification.updateMany({
      where: { OR: [{ userId }, { userId: 'ALL' }], isRead: false },
      data: { isRead: true },
    });
  }
  return { ok: true };
}

export default function Route() {
  const { notifications } = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<any>();
  return <NotificationsPage loaderData={{ notifications }} currentUser={currentUser} />;
}