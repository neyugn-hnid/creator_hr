import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { prisma } from '~/lib/db';

export async function loader({ request }: LoaderFunctionArgs) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim() || new URL(request.url).searchParams.get('token') || '';

  if (!token) {
    return Response.json({ ok: false, error: 'Thiếu Token xác thực Authorization' }, { status: 401 });
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ id: token }, { email: token }] },
  });

  if (!user) {
    return Response.json({ ok: false, error: 'Tài khoản không tồn tại' }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { OR: [{ userId: user.id }, { userId: 'ALL' }] },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.notification.count({
      where: { OR: [{ userId: user.id }, { userId: 'ALL' }], isRead: false },
    }),
  ]);

  return Response.json({
    ok: true,
    unreadCount,
    notifications: notifications.map(n => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return Response.json({ ok: false, error: 'Thiếu Token xác thực Authorization' }, { status: 401 });
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ id: token }, { email: token }] },
  });

  if (!user) {
    return Response.json({ ok: false, error: 'Tài khoản không tồn tại' }, { status: 401 });
  }

  const body = await request.json();
  const { intent, id } = body;

  if (intent === 'markAllRead') {
    await prisma.notification.updateMany({
      where: { OR: [{ userId: user.id }, { userId: 'ALL' }], isRead: false },
      data: { isRead: true },
    });
    return Response.json({ ok: true, message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
  }

  if (intent === 'markRead' && id) {
    if (!id.startsWith('live_') && !id.startsWith('sent_')) {
      await prisma.notification.updateMany({
        where: { id },
        data: { isRead: true },
      });
    }
    return Response.json({ ok: true, message: 'Đã đánh dấu là đã đọc' });
  }

  return Response.json({ ok: false, error: 'Hành động không hợp lệ' }, { status: 400 });
}
