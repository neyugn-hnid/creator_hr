/**
 * YouTube OAuth2 + Analytics helper
 * Uses googleapis to fetch view & subscriber data from YouTube Data & Analytics API
 */
import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/youtube/callback';

export function createOAuth2Client() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

/**
 * Generate Google OAuth consent URL for the user
 * Scopes: read YouTube channel info + analytics
 */
export function getAuthUrl(stateParam: string): string {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // always get refresh_token
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
    ],
    state: stateParam,
  });
}

export async function getGoogleUserInfo(accessToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const res = await oauth2.userinfo.get();
  return res.data;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCode(code: string) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Get all channels info (ID, name, avatar, subscriberCount) for the authenticated Google user
 */
export async function getChannelsList(accessToken: string, refreshToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  const res = await youtube.channels.list({
    part: ['snippet', 'statistics'],
    mine: true,
  });

  const items = res.data.items || [];
  if (items.length === 0) throw new Error('Không tìm thấy kênh YouTube nào thuộc tài khoản này.');

  return items.map((channel) => ({
    channelId: channel.id!,
    channelName: channel.snippet?.title || 'Kênh YouTube',
    channelAvatar: channel.snippet?.thumbnails?.default?.url || null,
    subscriberCount: Number(channel.statistics?.subscriberCount || 0),
  }));
}

/**
 * Fetch monthly views + current subscriber count for a channel
 */
export async function getMonthlyStats(
  accessToken: string,
  refreshToken: string,
  channelId: string,
  month: number,
  year: number,
): Promise<{ viewCount: number; subscriberCount: number }> {
  let viewCount = 0;
  let subscriberCount = 0;

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

  try {
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const channelRes = await youtube.channels.list({
      part: ['statistics'],
      mine: true,
    });
    if (channelRes.data.items?.[0]?.statistics?.subscriberCount) {
      subscriberCount = Number(channelRes.data.items[0].statistics.subscriberCount);
    }
  } catch (e) {
    console.error('[getMonthlyStats subscriberCount error]', e);
  }

  try {
    const analytics = google.youtubeAnalytics({ version: 'v2', auth: oauth2Client });

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const res = await analytics.reports.query({
      ids: 'channel==MINE',
      startDate,
      endDate,
      metrics: 'views',
    });

    const rows = res.data.rows;
    if (rows && rows.length > 0) {
      viewCount = Math.round(rows.reduce((acc, row) => acc + Number(row[0] ?? row[1] ?? 0), 0));
    }
  } catch (err) {
    console.error(`[getMonthlyStats views error] Month ${month}/${year}:`, err);
  }

  return { viewCount, subscriberCount };
}

export async function getMonthlyViews(
  accessToken: string,
  refreshToken: string,
  channelId: string,
  month: number,
  year: number,
): Promise<number> {
  const stats = await getMonthlyStats(accessToken, refreshToken, channelId, month, year);
  return stats.viewCount;
}

/**
 * Refresh expired access token and return new credentials
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiry: Date;
}> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return {
    accessToken: credentials.access_token!,
    expiry: new Date(credentials.expiry_date!),
  };
}
