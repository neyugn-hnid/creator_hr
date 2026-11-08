import type { ActionFunctionArgs } from 'react-router';
import { prisma } from '~/lib/db';
import { requireUserId } from '~/lib/session.server';
import { getMonthlyStats, refreshAccessToken } from '~/lib/youtube.server';

/**
 * POST /api/youtube/sync
 * Sync view count for a specific channel or ALL channels + month/year from YouTube Analytics API.
 * Body: { channelDbId: 'ALL' | string, month, year }
 */
export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();

  const channelDbId = String(formData.get('channelDbId') || '');
  const month = Number(formData.get('month') || new Date().getMonth() + 1);
  const year = Number(formData.get('year') || new Date().getFullYear());

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isAdmin = user?.role === 'ADMIN';

  // Load target channels
  let targetChannels: any[] = [];
  if (channelDbId === 'ALL') {
    targetChannels = await prisma.youtubeChannel.findMany({
      where: isAdmin ? { isActive: true } : { userId, isActive: true },
    });
  } else {
    const ch = await prisma.youtubeChannel.findFirst({
      where: { id: channelDbId, isActive: true },
    });
    if (ch) targetChannels = [ch];
  }

  if (targetChannels.length === 0) {
    return { error: 'Không tìm thấy kênh nào để sync.' };
  }

  let successCount = 0;
  let totalViews = 0;
  let totalBonus = 0;

  for (const channel of targetChannels) {
    try {
      let accessToken = channel.accessToken;
      const refreshToken = channel.refreshToken;

      // Safe token refresh if expired
      if (refreshToken && channel.tokenExpiry && new Date(channel.tokenExpiry) <= new Date()) {
        try {
          const refreshed = await refreshAccessToken(refreshToken);
          accessToken = refreshed.accessToken;
          await prisma.youtubeChannel.update({
            where: { id: channel.id },
            data: { accessToken: refreshed.accessToken, tokenExpiry: refreshed.expiry },
          });
        } catch (refreshErr) {
          console.warn(`[YouTube Sync] Token refresh warning for ${channel.channelName}:`, refreshErr);
        }
      }

      // Fetch views & subscriber count from YouTube API
      const stats = await getMonthlyStats(accessToken, refreshToken, channel.channelId, month, year);

      // Channel owner's rate
      const channelOwner = await prisma.user.findUnique({ where: { id: channel.userId } });
      const rate = Number(channelOwner?.viewBonusRate ?? 5000);
      const amount = Math.round((stats.viewCount / 1000) * rate);
      const subCount = stats.subscriberCount || Number(channel.subscriberCount || 0);

      // Upsert YoutubeView record
      const existing = await prisma.youtubeView.findFirst({
        where: { userId: channel.userId, channelId: channel.id, month, year, isDeleted: false },
      });

      if (existing) {
        await prisma.youtubeView.update({
          where: { id: existing.id },
          data: {
            viewCount: BigInt(stats.viewCount),
            subscriberCount: BigInt(subCount),
            amount,
            channelName: channel.channelName,
            status: 'APPROVED',
            note: `Tự động sync từ YouTube Analytics lúc ${new Date().toLocaleString('vi-VN')}`,
          },
        });
      } else {
        await prisma.youtubeView.create({
          data: {
            userId: channel.userId,
            channelId: channel.id,
            channelName: channel.channelName,
            month,
            year,
            viewCount: BigInt(stats.viewCount),
            subscriberCount: BigInt(subCount),
            amount,
            status: 'APPROVED',
            note: `Tự động sync từ YouTube Analytics lúc ${new Date().toLocaleString('vi-VN')}`,
          },
        });
      }

      await prisma.youtubeChannel.update({
        where: { id: channel.id },
        data: {
          subscriberCount: subCount > 0 ? BigInt(subCount) : channel.subscriberCount,
          lastSyncAt: new Date(),
        },
      });

      successCount++;
      totalViews += stats.viewCount;
      totalBonus += amount;
    } catch (err: any) {
      console.error(`[YouTube Sync] Error syncing channel ${channel.channelName}:`, err);
    }
  }

  await prisma.activityLog.create({
    data: {
      actorId: userId,
      actorName: user?.name ?? '',
      action: 'SYNC',
      module: 'YouTube',
      description: `Sync ${successCount}/${targetChannels.length} kênh (${totalViews.toLocaleString('vi-VN')} views) tháng ${month}/${year}`,
    },
  });

  return {
    ok: true,
    successCount,
    totalCount: targetChannels.length,
    viewCount: totalViews,
    amount: totalBonus,
    month,
    year,
  };
}

export default function Route() {
  return null;
}
