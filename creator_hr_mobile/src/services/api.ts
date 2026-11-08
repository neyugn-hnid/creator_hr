import AsyncStorage from '@react-native-async-storage/async-storage';

// Local Network Server IP for physical mobile phone or simulator
export const BASE_URL = 'http://192.168.1.13:3000';

const TOKEN_KEY = 'creator_hr_mobile_token';
const USER_KEY = 'creator_hr_mobile_user';

export const AuthService = {
  async setSession(token: string, user: any) {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (err) {
      console.error('Error saving session:', err);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (err) {
      console.error('Error getting token:', err);
      return null;
    }
  },

  async getUser(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Error getting user:', err);
      return null;
    }
  },

  async clearSession() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (err) {
      console.error('Error clearing session:', err);
    }
  },
};

export const ApiService = {
  async login(email: string) {
    const res = await fetch(`${BASE_URL}/api/mobile/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  async register(data: { name: string; email: string; password?: string; phone?: string }) {
    const res = await fetch(`${BASE_URL}/api/mobile/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getProfile(token: string) {
    const res = await fetch(`${BASE_URL}/api/mobile/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getAttendances(token: string) {
    const res = await fetch(`${BASE_URL}/api/mobile/attendance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async submitAttendance(token: string, data: { intent: 'checkIn' | 'checkOut'; wifiSsid?: string; latitude?: string; longitude?: string }) {
    const res = await fetch(`${BASE_URL}/api/mobile/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getPayroll(token: string, month: number, year: number) {
    const res = await fetch(`${BASE_URL}/api/mobile/payroll?month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getLeaves(token: string) {
    const res = await fetch(`${BASE_URL}/api/mobile/leaves`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async submitLeave(token: string, data: { type: string; date: string; expectedTime?: string; reason: string }) {
    const res = await fetch(`${BASE_URL}/api/mobile/leaves`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getYoutubeData(token: string, month: number, year: number) {
    const res = await fetch(`${BASE_URL}/api/mobile/youtube?month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async addYoutubeChannel(token: string, handleOrUrl: string) {
    const res = await fetch(`${BASE_URL}/api/mobile/youtube`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ intent: 'addChannel', handleOrUrl }),
    });
    return res.json();
  },

  async syncYoutubeViews(token: string) {
    const res = await fetch(`${BASE_URL}/api/mobile/youtube`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ intent: 'syncViews' }),
    });
    return res.json();
  },

  async deleteYoutubeChannel(token: string, channelDbId: string) {
    const res = await fetch(`${BASE_URL}/api/mobile/youtube`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ intent: 'deleteChannel', channelDbId }),
    });
    return res.json();
  },

  async getNotifications(token: string) {
    try {
      const res = await fetch(`${BASE_URL}/api/mobile/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return { ok: false, error: text || 'Phản hồi không hợp lệ từ máy chủ' };
      }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Lỗi kết nối máy chủ' };
    }
  },

  async markAllNotificationsRead(token: string) {
    try {
      const res = await fetch(`${BASE_URL}/api/mobile/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ intent: 'markAllRead' }),
      });
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return { ok: false, error: text || 'Phản hồi không hợp lệ từ máy chủ' };
      }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Lỗi kết nối máy chủ' };
    }
  },
};
