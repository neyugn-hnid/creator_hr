// Mobile App Login Endpoint - Handles POST /api/mobile/login
import type { ActionFunctionArgs } from 'react-router';
import { prisma } from '~/lib/db';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ ok: false, error: 'Method Not Allowed' }, { status: 405 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let email = '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      email = String(body.email || '').toLowerCase().trim();
    } else {
      const formData = await request.formData();
      email = String(formData.get('email') || '').toLowerCase().trim();
    }

    if (!email) {
      return Response.json({ ok: false, error: 'Vui lòng nhập Email đăng nhập.' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email, isActive: true, isDeleted: false },
    });

    if (!user) {
      return Response.json({ ok: false, error: 'Email không tồn tại hoặc đã bị khóa.' }, { status: 401 });
    }

    await prisma.activityLog.create({
      data: {
        actorId: user.id,
        actorName: user.name,
        action: 'THÊM',
        module: 'Mobile App',
        description: `Đăng nhập Mobile App thành công cho ${user.name}`,
      },
    });

    return Response.json({
      ok: true,
      message: 'Đăng nhập thành công',
      token: user.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        avatar: user.avatar,
      },
    });
  } catch (err: any) {
    return Response.json({ ok: false, error: err.message || 'Lỗi xử lý đăng nhập' }, { status: 500 });
  }
}
