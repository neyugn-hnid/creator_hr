import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useOutletContext } from 'react-router';
import { prisma } from '~/lib/db';
import { requireUserId } from '~/lib/session.server';
import { LeavesPage } from '~/pages/Leaves';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isAdmin = user?.role === 'ADMIN';

  const [leaveRequests, users] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: isAdmin ? {} : { userId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    }),
    isAdmin ? prisma.user.findMany({ where: { isDeleted: false } }) : Promise.resolve([]),
  ]);

  return {
    leaveRequests: leaveRequests.map(l => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    })),
    users: users.map(u => ({ ...u, hourlyRate: Number(u.hourlyRate), viewBonusRate: Number(u.viewBonusRate), createdAt: u.createdAt.toISOString(), updatedAt: u.updatedAt.toISOString() })),
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
      await prisma.leaveRequest.create({
        data: {
          userId,
          date: String(formData.get('date')),
          type: formData.get('type') as any,
          expectedTime: String(formData.get('expectedTime') || ''),
          reason: String(formData.get('reason')),
          status: 'PENDING',
        },
      });
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'Yêu cầu nghỉ phép mới',
            message: `${user?.name} vừa gửi đơn báo nghỉ/đi muộn.`,
            type: 'INFO',
          },
        });
      }
      await prisma.activityLog.create({
        data: { actorId: userId, actorName: user?.name ?? '', action: 'THÊM', module: 'Nghỉ phép', description: `Tạo đơn báo nghỉ/đi muộn` },
      });
      break;
    }
    case 'approve':
    case 'reject': {
      const id = String(formData.get('id'));
      const status = intent === 'approve' ? 'APPROVED' : 'REJECTED';
      const req = await prisma.leaveRequest.update({
        where: { id },
        data: { status, approvedBy: userId },
      });
      await prisma.notification.create({
        data: {
          userId: req.userId,
          title: 'Kết quả đơn nghỉ phép',
          message: `Đơn ngày ${req.date} của bạn đã được ${status === 'APPROVED' ? 'phê duyệt' : 'từ chối'}.`,
          type: status === 'APPROVED' ? 'SUCCESS' : 'ERROR',
        },
      });
      await prisma.activityLog.create({
        data: { actorId: userId, actorName: user?.name ?? '', action: status === 'APPROVED' ? 'Duyệt' : 'Từ chối', module: 'Nghỉ phép', description: `${status === 'APPROVED' ? 'Duyệt' : 'Từ chối'} đơn nghỉ phép ID ${id}` },
      });
      break;
    }
    case 'softDelete': {
      const id = String(formData.get('id'));
      await prisma.leaveRequest.update({ where: { id }, data: { isDeleted: true } });
      break;
    }
    case 'restore': {
      const id = String(formData.get('id'));
      await prisma.leaveRequest.update({ where: { id }, data: { isDeleted: false } });
      break;
    }
  }
  return { ok: true };
}

export default function Route() {
  const data = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<any>();
  return <LeavesPage loaderData={data} currentUser={currentUser} />;
}