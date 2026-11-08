import type { ActionFunctionArgs } from "react-router";
import { requireUserId } from "~/lib/session.server";
import { prisma } from "~/lib/db";

const WS_SERVER_URL = process.env.WS_SERVER_URL || "http://localhost:3001";

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);

  // Check admin role
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, name: true } });
  if (!user || user.role !== "ADMIN") {
    return { ok: false, error: "Chỉ Admin mới có thể gửi thông báo broadcast" };
  }

  const body = await request.json() as { title: string; message: string; type: string; targetUserId?: string };
  const { title, message, type = "INFO", targetUserId } = body;

  if (!title?.trim() || !message?.trim()) {
    return { ok: false, error: "Thiếu tiêu đề hoặc nội dung thông báo" };
  }

  // Save to DB — ALL means broadcast to everyone
  const notifUserId = targetUserId || "ALL";

  if (notifUserId === "ALL") {
    // Create one notification per active employee
    const employees = await prisma.user.findMany({
      where: { isActive: true, isDeleted: false },
      select: { id: true },
    });
    await prisma.notification.createMany({
      data: employees.map(emp => ({
        userId: emp.id,
        title,
        message,
        type: type as any,
      })),
    });
  } else {
    await prisma.notification.create({
      data: { userId: notifUserId, title, message, type: type as any },
    });
  }

  // Broadcast to WS server
  try {
    const wsRes = await fetch(`${WS_SERVER_URL}/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, type, targetUserId, sentBy: user.name }),
    });
    const wsData = await wsRes.json() as { ok: boolean; sent: number; total: number };
    return { ok: true, saved: true, wsClients: wsData.sent };
  } catch {
    // WS server may not be running — still return ok since DB save succeeded
    return { ok: true, saved: true, wsClients: 0, wsError: "WS server không hoạt động" };
  }
}
