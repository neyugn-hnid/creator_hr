import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useOutletContext } from 'react-router';
import { prisma } from '~/lib/db';
import { requireUserId } from '~/lib/session.server';
import { YoutubeViewPage } from '~/pages/Youtube';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isAdmin = user?.role === 'ADMIN';

  const [views, users, channels] = await Promise.all([
    prisma.youtubeView.findMany({
      where: isAdmin ? {} : { userId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, department: true } } },
    }),
    isAdmin ? prisma.user.findMany({ where: { isDeleted: false, isActive: true } }) : Promise.resolve([]),
    // Load channels for the current user (employees) or all channels (admin)
    prisma.youtubeChannel?.findMany ? prisma.youtubeChannel.findMany({
      where: isAdmin ? { isActive: true } : { userId, isActive: true },
      include: { user: { select: { name: true, department: true } } },
      orderBy: { createdAt: 'desc' },
    }) : Promise.resolve([]),
  ]);

  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const requestOrigin = new URL(request.url).origin;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${requestOrigin}/api/youtube/callback`;
  const hasGoogleConfig = !!(clientId && process.env.GOOGLE_CLIENT_SECRET);

  const googleAuthUrl = hasGoogleConfig
    ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly')}&access_type=offline&prompt=consent&state=${userId}`
    : '';

  return {
    views: views.map(v => ({
      ...v,
      userName: v.user?.name || '',
      userDepartment: (v.user as any)?.department || '',
      viewCount: Number(v.viewCount),
      subscriberCount: Number(v.subscriberCount || 0),
      amount: Number(v.amount),
      createdAt: v.createdAt.toISOString(),
    })),
    users: users.map(u => ({ ...u, hourlyRate: Number(u.hourlyRate), viewBonusRate: Number(u.viewBonusRate), createdAt: u.createdAt.toISOString(), updatedAt: u.updatedAt.toISOString() })),
    channels: channels.map(c => ({
      ...c,
      subscriberCount: Number(c.subscriberCount || 0),
      accessToken: '', // never send tokens to client
      refreshToken: '',
      tokenExpiry: c.tokenExpiry.toISOString(),
      lastSyncAt: c.lastSyncAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      userName: c.user?.name ?? '',
    })),
    hasGoogleConfig,
    googleAuthUrl,
    isAdmin,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const formData = await request.formData();
  const intent = String(formData.get('intent'));

  switch (intent) {
    case 'add': {
      const targetUserId = String(formData.get('userId') || userId);
      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
      const viewCount = BigInt(String(formData.get('viewCount') || '0'));
      const rate = Number(targetUser?.viewBonusRate ?? 5000);
      const amount = Math.round((Number(viewCount) / 1000) * rate);

      await prisma.youtubeView.create({
        data: {
          userId: targetUserId,
          channelName: String(formData.get('channelName') || ''),
          month: Number(formData.get('month')),
          year: Number(formData.get('year')),
          viewCount,
          amount,
          note: String(formData.get('note') || ''),
          status: 'PENDING',
        },
      });
      await prisma.activityLog.create({
        data: { actorId: userId, actorName: user?.name ?? '', action: 'THÊM', module: 'View YouTube', description: `Khai báo ${Number(viewCount).toLocaleString('vi-VN')} view` },
      });
      break;
    }
    case 'approve':
    case 'reject': {
      const id = String(formData.get('id'));
      const status = intent === 'approve' ? 'APPROVED' : 'REJECTED';
      const view = await prisma.youtubeView.update({ where: { id }, data: { status } });
      await prisma.notification.create({
        data: {
          userId: view.userId,
          title: 'Khai báo View YouTube',
          message: `Khai báo ${Number(view.viewCount).toLocaleString('vi-VN')} view tháng ${view.month}/${view.year} đã được ${status === 'APPROVED' ? 'duyệt' : 'từ chối'}.`,
          type: status === 'APPROVED' ? 'SUCCESS' : 'ERROR',
        },
      });
      await prisma.activityLog.create({
        data: { actorId: userId, actorName: user?.name ?? '', action: status === 'APPROVED' ? 'Duyệt' : 'Từ chối', module: 'View YouTube', description: `${status === 'APPROVED' ? 'Duyệt' : 'Từ chối'} view ID ${id}` },
      });
      break;
    }
    case 'softDelete': {
      await prisma.youtubeView.update({ where: { id: String(formData.get('id')) }, data: { isDeleted: true } });
      break;
    }
    case 'restore': {
      await prisma.youtubeView.update({ where: { id: String(formData.get('id')) }, data: { isDeleted: false } });
      break;
    }
    case 'deleteChannel': {
      const channelDbId = String(formData.get('channelDbId'));
      const channel = await prisma.youtubeChannel.findUnique({ where: { id: channelDbId } });
      if (channel) {
        await prisma.youtubeChannel.update({
          where: { id: channelDbId },
          data: { isActive: false },
        });
        await prisma.activityLog.create({
          data: {
            actorId: userId,
            actorName: user?.name ?? '',
            action: 'XÓA',
            module: 'YouTube',
            description: `Hủy kết nối kênh YouTube "${channel.channelName}"`,
          },
        });
      }
      break;
    }
  }
  return { ok: true };
}

export default function Route() {
  const data = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<any>();
  return <YoutubeViewPage loaderData={data} currentUser={currentUser} />;
}