import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useOutletContext, useActionData } from 'react-router';
import { prisma } from '~/lib/db';
import { requireUserId } from '~/lib/session.server';
import { ProfilePage } from '~/pages/Profile';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const [user, attendances, salaryHistories] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.attendance.findMany({
      where: { userId, isDeleted: false },
      orderBy: { date: 'desc' },
      take: 30,
    }),
    prisma.salaryHistory.findMany({
      where: { userId },
      orderBy: { changedAt: 'desc' },
      take: 10,
    }),
  ]);

  return {
    user: user ? {
      ...user,
      hourlyRate: Number(user.hourlyRate),
      viewBonusRate: Number(user.viewBonusRate),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    } : null,
    attendances: attendances.map(a => ({
      ...a,
      workHours: Number(a.workHours),
      amount: Number(a.amount),
      checkIn: a.checkIn?.toISOString() ?? null,
      checkOut: a.checkOut?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
    })),
    salaryHistories: salaryHistories.map(s => ({
      ...s,
      changedAt: s.changedAt.toISOString(),
    })),
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();

  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').toLowerCase().trim();
  const phone = String(formData.get('phone') || '').trim();
  const bankName = String(formData.get('bankName') || '').trim();
  const bankAccount = String(formData.get('bankAccount') || '').trim();
  const bankBin = String(formData.get('bankBin') || '').trim();
  const avatar = String(formData.get('avatar') || '').trim();
  const currentPassword = String(formData.get('currentPassword') || '').trim();
  const newPassword = String(formData.get('newPassword') || '').trim();
  const confirmPassword = String(formData.get('confirmPassword') || '').trim();

  if (!name || !email) {
    return { error: 'Họ tên và Email không được để trống.' };
  }

  // Check email uniqueness
  const existingUser = await prisma.user.findFirst({
    where: { email, id: { not: userId } },
  });
  if (existingUser) {
    return { error: 'Địa chỉ Email này đã tồn tại trên hệ thống.' };
  }

  // Handle password change
  if (newPassword || confirmPassword || currentPassword) {
    if (!currentPassword) {
      return { error: 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu.' };
    }
    if (!newPassword) {
      return { error: 'Vui lòng nhập mật khẩu mới.' };
    }
    if (newPassword.length < 6) {
      return { error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' };
    }
    if (newPassword !== confirmPassword) {
      return { error: 'Mật khẩu mới và xác nhận mật khẩu không khớp.' };
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser || currentUser.password !== currentPassword) {
      return { error: 'Mật khẩu hiện tại không chính xác.' };
    }
  }

  const updateData: any = {
    name,
    email,
    phone: phone || null,
    bankName: bankName || null,
    bankAccount: bankAccount || null,
    bankBin: bankBin || null,
    avatar: avatar || null,
  };

  if (newPassword) {
    updateData.password = newPassword;
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  await prisma.activityLog.create({
    data: {
      actorId: userId,
      actorName: name,
      action: 'SỬA',
      module: 'Hồ sơ',
      description: `Cập nhật hồ sơ cá nhân thành công (${email})`,
    },
  });

  return { success: 'Đã cập nhật thông tin hồ sơ cá nhân thành công!' };
}

export default function Route() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { currentUser } = useOutletContext<any>();
  return <ProfilePage loaderData={data} currentUser={currentUser} actionData={actionData} />;
}