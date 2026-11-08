import type { ActionFunctionArgs } from 'react-router';
import { logout } from '~/lib/session.server';
import { prisma } from '~/lib/db';
import { getUserId } from '~/lib/session.server';

export async function action({ request }: ActionFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    if (user) {
      await prisma.activityLog.create({
        data: {
          actorId: userId,
          actorName: user.name,
          action: 'THÊM',
          module: 'Hệ thống',
          description: `Đăng xuất tài khoản ${user.name}`,
        },
      });
    }
  }
  return logout(request);
}
