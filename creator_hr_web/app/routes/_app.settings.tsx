import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useOutletContext, redirect } from 'react-router';
import { prisma } from '~/lib/db';
import { requireUserId } from '~/lib/session.server';
import { Settings } from '~/pages/Settings';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== 'ADMIN') throw redirect('/');

  const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } });
  return {
    settings: settings ?? {
      latePenalty: 50000,
      forgetCheckOutPenalty: 100000,
      companyWifiSsid: 'CreatorHR_5G',
      companyIp: '192.168.1.1',
      companyLat: '10.776889',
      companyLng: '106.700806',
      maxDistanceMeters: 100,
      workStartTime: '08:30',
      workEndTime: '17:30',
    },
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== 'ADMIN') throw redirect('/');

  const formData = await request.formData();
  const payload = {
    latePenalty: Number(formData.get('latePenalty') || 50000),
    forgetCheckOutPenalty: Number(formData.get('forgetCheckOutPenalty') || 100000),
    companyWifiSsid: String(formData.get('companyWifiSsid') || 'CreatorHR_5G'),
    companyIp: String(formData.get('companyIp') || '192.168.1.1'),
    companyLat: String(formData.get('companyLat') || '10.776889'),
    companyLng: String(formData.get('companyLng') || '106.700806'),
    maxDistanceMeters: Number(formData.get('maxDistanceMeters') || 100),
    workStartTime: String(formData.get('workStartTime') || '08:30'),
    workEndTime: String(formData.get('workEndTime') || '17:30'),
  };

  await prisma.appSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...payload },
    update: payload,
  });
  await prisma.activityLog.create({
    data: { actorId: userId, actorName: user.name, action: 'SỬA', module: 'Cài đặt', description: 'Cập nhật cài đặt hệ thống' },
  });
  return { ok: true };
}

export default function Route() {
  const { settings } = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<any>();
  return <Settings loaderData={{ settings }} currentUser={currentUser} />;
}