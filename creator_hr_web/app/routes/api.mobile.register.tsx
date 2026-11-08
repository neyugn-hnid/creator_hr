import type { ActionFunctionArgs } from 'react-router';
import { prisma } from '~/lib/db';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ ok: false, error: 'Method Not Allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').toLowerCase().trim();
    const password = String(body.password || '').trim();
    const phone = String(body.phone || '').trim();

    if (!name || !email) {
      return Response.json({ ok: false, error: 'Vui lòng nhập Họ tên và Email.' }, { status: 400 });
    }

    // Check existing email
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return Response.json({ ok: false, error: 'Email này đã tồn tại trên hệ thống.' }, { status: 400 });
    }

    // Create new employee user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: password || '123456',
        phone: phone || null,
        role: 'EMPLOYEE',
        department: 'Creator Team',
        position: 'Content Creator',
        joinedDate: new Date().toISOString().slice(0, 10),
        isActive: true,
      },
    });

    // Create welcome notification
    await prisma.notification.create({
      data: {
        userId: newUser.id,
        title: 'Chào mừng thành viên mới',
        message: `Chào mừng ${newUser.name} đã gia nhập hệ thống Creator HR!`,
        type: 'SUCCESS',
      },
    });

    await prisma.activityLog.create({
      data: {
        actorId: newUser.id,
        actorName: newUser.name,
        action: 'THÊM',
        module: 'Mobile App',
        description: `Đăng ký tài khoản Mobile App thành công cho ${newUser.name}`,
      },
    });

    return Response.json({
      ok: true,
      message: 'Đăng ký tài khoản thành công',
      token: newUser.id,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        position: newUser.position,
        avatar: newUser.avatar,
      },
    });
  } catch (err: any) {
    return Response.json({ ok: false, error: err.message || 'Lỗi đăng ký tài khoản' }, { status: 500 });
  }
}
