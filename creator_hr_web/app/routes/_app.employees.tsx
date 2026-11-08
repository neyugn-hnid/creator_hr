import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useOutletContext, redirect } from 'react-router';
import { prisma } from '~/lib/db';
import { requireUserId } from '~/lib/session.server';
import { Employees } from '~/pages/Employees';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (currentUser?.role !== 'ADMIN') throw redirect('/');

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const salaryHistories = await prisma.salaryHistory.findMany({
    orderBy: { changedAt: 'desc' },
  });

  return {
    users: users.map(u => ({
      ...u,
      hourlyRate: Number(u.hourlyRate),
      viewBonusRate: Number(u.viewBonusRate),
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      joinedDate: u.joinedDate ?? undefined,
    })),
    salaryHistories: salaryHistories.map(s => ({
      ...s,
      oldHourlyRate: Number(s.oldHourlyRate),
      newHourlyRate: Number(s.newHourlyRate),
      oldViewBonusRate: Number(s.oldViewBonusRate),
      newViewBonusRate: Number(s.newViewBonusRate),
      changedAt: s.changedAt.toISOString(),
    })),
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (currentUser?.role !== 'ADMIN') throw redirect('/');

  const formData = await request.formData();
  const intent = String(formData.get('intent'));

  switch (intent) {
    case 'add': {
      const name = String(formData.get('name'));
      const email = String(formData.get('email'));
      await prisma.user.create({
        data: {
          name,
          email,
          password: '123456',
          role: formData.get('role') as any ?? 'EMPLOYEE',
          phone: String(formData.get('phone') || ''),
          department: String(formData.get('department') || ''),
          position: String(formData.get('position') || ''),
          joinedDate: String(formData.get('joinedDate') || ''),
          hourlyRate: Number(formData.get('hourlyRate') || 50000),
          viewBonusRate: Number(formData.get('viewBonusRate') || 5000),
          bankAccount: String(formData.get('bankAccount') || ''),
          bankName: String(formData.get('bankName') || ''),
          isActive: true,
          isDeleted: false,
        },
      });
      await prisma.activityLog.create({
        data: { actorId: userId, actorName: currentUser.name, action: 'THÊM', module: 'Nhân viên', description: `Đã thêm nhân viên: ${name}` },
      });
      break;
    }
    case 'update': {
      const id = String(formData.get('id'));
      const existing = await prisma.user.findUnique({ where: { id } });
      const newHourlyRate = Number(formData.get('hourlyRate'));
      const newViewBonusRate = Number(formData.get('viewBonusRate'));

      if (existing && (newHourlyRate !== Number(existing.hourlyRate) || newViewBonusRate !== Number(existing.viewBonusRate))) {
        await prisma.salaryHistory.create({
          data: {
            userId: id,
            oldHourlyRate: Number(existing.hourlyRate),
            newHourlyRate,
            oldViewBonusRate: Number(existing.viewBonusRate),
            newViewBonusRate,
            changedBy: currentUser.name,
            note: String(formData.get('note') || ''),
          },
        });
      }

      await prisma.user.update({
        where: { id },
        data: {
          name: String(formData.get('name')),
          phone: String(formData.get('phone') || ''),
          department: String(formData.get('department') || ''),
          position: String(formData.get('position') || ''),
          hourlyRate: newHourlyRate,
          viewBonusRate: newViewBonusRate,
          bankAccount: String(formData.get('bankAccount') || ''),
          bankName: String(formData.get('bankName') || ''),
        },
      });
      await prisma.activityLog.create({
        data: { actorId: userId, actorName: currentUser.name, action: 'SỬA', module: 'Nhân viên', description: `Cập nhật nhân viên ID ${id}` },
      });
      break;
    }
    case 'softDelete': {
      const id = String(formData.get('id'));
      await prisma.user.update({ where: { id }, data: { isDeleted: true, isActive: false } });
      await prisma.activityLog.create({
        data: { actorId: userId, actorName: currentUser.name, action: 'XÓA_MỀM', module: 'Nhân viên', description: `Xóa mềm nhân viên ID ${id}` },
      });
      break;
    }
    case 'restore': {
      const id = String(formData.get('id'));
      await prisma.user.update({ where: { id }, data: { isDeleted: false, isActive: true } });
      await prisma.activityLog.create({
        data: { actorId: userId, actorName: currentUser.name, action: 'KHÔI_PHỤC', module: 'Nhân viên', description: `Khôi phục nhân viên ID ${id}` },
      });
      break;
    }
  }

  return { ok: true };
}

export default function Route() {
  const { users, salaryHistories } = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<any>();
  return <Employees loaderData={{ users, salaryHistories }} currentUser={currentUser} />;
}