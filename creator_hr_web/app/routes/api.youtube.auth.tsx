import type { LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { getUserId } from '~/lib/session.server';
import { getAuthUrl } from '~/lib/youtube.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return redirect('/login?error=missing_google_credentials');
  }

  // If unauthenticated, pass GUEST_LOGIN state to redirect back to login callback
  const authUrl = getAuthUrl(userId || 'GUEST_LOGIN');
  return redirect(authUrl);
}

export default function Route() {
  return null;
}
