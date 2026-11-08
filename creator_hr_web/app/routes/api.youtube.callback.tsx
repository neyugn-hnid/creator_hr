import type { LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { prisma } from '~/lib/db';
import { getUserId, createUserSession } from '~/lib/session.server';
import { exchangeCode, getChannelsList, getMonthlyStats, getGoogleUserInfo } from '~/lib/youtube.server';

/**
 * GET /api/youtube/callback
 * Registered Authorized Redirect URI: http://localhost:3000/api/youtube/callback
 * Handles both:
 * 1. Google Login OAuth (when state is GUEST_LOGIN or no session user)
 * 2. YouTube Channel Sync OAuth (when user is logged in)
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const stateUserId = url.searchParams.get('state');

  if (error || !code) {
    return redirect('/login?error=oauth_denied');
  }

  const sessionUserId = await getUserId(request);
  const isGuestLogin = !sessionUserId && (!stateUserId || stateUserId === 'GUEST_LOGIN');

  try {
    // 1. Exchange authorization code for tokens using registered redirect_uri
    const tokens = await exchangeCode(code);
    if (!tokens.access_token) {
      return redirect('/login?error=no_access_token');
    }

    // Handle Google Login Flow
    if (isGuestLogin) {
      const userInfo = await getGoogleUserInfo(tokens.access_token);
      const email = userInfo.email?.toLowerCase().trim();
      const name = userInfo.name || 'Người dùng Google';
      const avatar = userInfo.picture || null;

      if (!email) {
        return redirect('/login?error=no_email_from_google');
      }

      let user = await prisma.user.findFirst({
        where: { email, isDeleted: false },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            name,
            email,
            avatar,
            password: '123456',
            role: 'EMPLOYEE',
            department: 'Sáng Tạo Nội Dung',
            position: 'Biên Tập Viên',
          },
        });
      } else if (avatar && !user.avatar) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatar },
        });
      }

      await prisma.activityLog.create({
        data: {
          actorId: user.id,
          actorName: user.name,
          action: 'THÊM',
          module: 'Hệ thống',
          description: `Đăng nhập Google thành công với tài khoản ${user.email}`,
        },
      });

      return createUserSession(user.id, '/');
    }

    // Handle YouTube Channel Linking Flow for logged in user
    const userId = sessionUserId || stateUserId;
    if (!userId) {
      return redirect('/login');
    }

    // 2. Get list of all channels managed by this Google account
    const channelList = await getChannelsList(tokens.access_token, tokens.refresh_token);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const rate = Number(user?.viewBonusRate ?? 5000);

    const tokenExpiryDate = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    // 3. Upsert each channel in DB & auto-sync current month's stats
    for (const channelInfo of channelList) {
      const channelDbRecord = await prisma.youtubeChannel.upsert({
        where: { userId_channelId: { userId, channelId: channelInfo.channelId } },
        update: {
          channelName: channelInfo.channelName,
          channelAvatar: channelInfo.channelAvatar,
          subscriberCount: BigInt(channelInfo.subscriberCount || 0),
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokenExpiryDate,
          isActive: true,
          lastSyncAt: now,
          updatedAt: now,
        },
        create: {
          userId,
          channelId: channelInfo.channelId,
          channelName: channelInfo.channelName,
          channelAvatar: channelInfo.channelAvatar,
          subscriberCount: BigInt(channelInfo.subscriberCount || 0),
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokenExpiryDate,
          lastSyncAt: now,
        },
      });

      // Auto-sync stats (views + subscriber count) for current month right after connection
      try {
        const stats = await getMonthlyStats(
          tokens.access_token,
          tokens.refresh_token,
          channelInfo.channelId,
          currentMonth,
          currentYear,
        );

        const subCount = stats.subscriberCount || channelInfo.subscriberCount || 0;
        const amount = Math.round((stats.viewCount / 1000) * rate);

        const existingView = await prisma.youtubeView.findFirst({
          where: { userId, channelId: channelDbRecord.id, month: currentMonth, year: currentYear, isDeleted: false },
        });

        if (existingView) {
          await prisma.youtubeView.update({
            where: { id: existingView.id },
            data: {
              viewCount: BigInt(stats.viewCount),
              subscriberCount: BigInt(subCount),
              amount,
              channelName: channelInfo.channelName,
              status: 'APPROVED',
              note: `Tự động sync từ YouTube Analytics khi kết nối kênh`,
            },
          });
        } else {
          await prisma.youtubeView.create({
            data: {
              userId,
              channelId: channelDbRecord.id,
              channelName: channelInfo.channelName,
              month: currentMonth,
              year: currentYear,
              viewCount: BigInt(stats.viewCount),
              subscriberCount: BigInt(subCount),
              amount,
              status: 'APPROVED',
              note: `Tự động sync từ YouTube Analytics khi kết nối kênh`,
            },
          });
        }
      } catch (syncErr) {
        console.error(`[Auto-sync on callback] Error for channel ${channelInfo.channelName}:`, syncErr);
      }
    }

    await prisma.activityLog.create({
      data: {
        actorId: userId,
        actorName: user?.name ?? '',
        action: 'KẾT NỐI & SYNC',
        module: 'YouTube',
        description: `Đã kết nối và sync view ${channelList.length} kênh (${channelList.map(c => c.channelName).join(', ')})`,
      },
    });

    return redirect('/youtube?success=connected');
  } catch (err: any) {
    console.error('[YouTube OAuth callback error]', err);
    return redirect(`/youtube?error=${encodeURIComponent(err.message || 'unknown')}`);
  }
}

export default function Route() {
  return null;
}
