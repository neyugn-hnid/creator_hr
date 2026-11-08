import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Platform,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import Svg, { Path, Circle, Rect, Polyline } from 'react-native-svg';
import { AuthService, ApiService } from './src/services/api';
import { LoginScreen } from './src/screens/LoginScreen';
import { AttendanceScreen } from './src/screens/AttendanceScreen';
import { YoutubeScreen } from './src/screens/YoutubeScreen';
import { LeaveScreen } from './src/screens/LeaveScreen';
import { PayrollScreen } from './src/screens/PayrollScreen';
import { NotificationScreen } from './src/screens/NotificationScreen';
import {
  useFonts,
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  BeVietnamPro_800ExtraBold,
  BeVietnamPro_900Black,
} from '@expo-google-fonts/be-vietnam-pro';
import * as Notifications from 'expo-notifications';

// Configure notification behavior for Lock Screen & Status Bar
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

type TabType = 'ATTENDANCE' | 'YOUTUBE' | 'LEAVE' | 'PAYROLL' | 'PROFILE' | 'NOTIFICATIONS';

// SVG Icons
function ClockIcon({ color }: { color: string }) {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Polyline points="12 6 12 12 16 14" />
    </Svg>
  );
}

function YoutubeIcon({ color }: { color: string }) {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <Path d="M9.75 15.02L15.5 11.75L9.75 8.48Z" fill={color} />
    </Svg>
  );
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  );
}

function DollarIcon({ color }: { color: string }) {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </Svg>
  );
}

function UserIcon({ color }: { color: string }) {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

function BellIcon({ color }: { color: string }) {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BeVietnamPro_800ExtraBold,
    BeVietnamPro_900Black,
  });

  const [initializing, setInitializing] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [currentTab, setCurrentTab] = useState<TabType>('ATTENDANCE');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState<boolean>(false);
  const [loadingNotifs, setLoadingNotifs] = useState<boolean>(false);

  const fetchHeaderInfo = async (userToken: string) => {
    try {
      const res = await ApiService.getNotifications(userToken);
      if (res.ok) {
        setUnreadCount(res.unreadCount || 0);
        setNotifications(res.notifications || []);
      }
    } catch (err) {
      console.warn('Error fetching header notifications:', err);
    }
  };

  const handleOpenNotifications = async () => {
    setIsNotifModalOpen(true);
    if (token) {
      setLoadingNotifs(true);
      try {
        const res = await ApiService.getNotifications(token);
        if (res.ok) {
          setNotifications(res.notifications || []);
          setUnreadCount(res.unreadCount || 0);
        }
      } catch (err) {
        console.warn('Error loading notifications modal:', err);
      } finally {
        setLoadingNotifs(false);
      }
    }
  };

  const handleMarkAllRead = async () => {
    if (token) {
      try {
        await ApiService.markAllNotificationsRead(token);
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch (err) {
        console.warn('Error marking all read:', err);
      }
    }
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const storedToken = await AuthService.getToken();
        const storedUser = await AuthService.getUser();
        if (storedToken && storedUser) {
          setToken(storedToken);
          setCurrentUser(storedUser);
          fetchHeaderInfo(storedToken);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
      } finally {
        setInitializing(false);
      }
    }
    checkAuth();
  }, []);

  // Request Push Notification permissions on launch
  useEffect(() => {
    async function requestPermissions() {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Push notification permission not granted');
        }
      } catch (err) {
        console.warn('Error requesting notification permissions:', err);
      }
    }
    requestPermissions();
  }, []);

  // WebSocket real-time notifications with Lock Screen Push
  const wsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    if (!token) return;
    const WS_URL = 'ws://192.168.1.13:3001';
    let reconnectTimer: ReturnType<typeof setTimeout>;
    function connect() {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;
        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.event === 'NOTIFICATION' || data.type === 'NOTIFICATION') {
              setUnreadCount(prev => prev + 1);

              // Broadcast Push Notification banner to Status Bar & Lock Screen
              try {
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: data.title || 'Thông báo mới',
                    body: data.message || '',
                    sound: 'default',
                  },
                  trigger: null,
                });
              } catch {
                Alert.alert(data.title || 'Thông báo mới', data.message || '');
              }
            }
          } catch {}
        };
        ws.onclose = () => { reconnectTimer = setTimeout(connect, 4000); };
        ws.onerror = () => {};
      } catch {}
    }
    connect();
    return () => {
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [token]);

  const handleLoginSuccess = (newToken: string, user: any) => {
    setToken(newToken);
    setCurrentUser(user);
    fetchHeaderInfo(newToken);
  };

  const handleLogout = async () => {
    await AuthService.clearSession();
    setToken(null);
    setCurrentUser(null);
  };

  if (initializing || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  if (!token || !currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.brandRow}>
          <Image source={require('./assets/icon.png')} style={{ width: 34, height: 34, borderRadius: 8, marginRight: 10 }} resizeMode="contain" />
          <View>
            <Text style={styles.brandName}>MediaPulse</Text>
            <Text style={styles.userName}>{currentUser.name}</Text>
          </View>
        </View>

        {/* Right Header Actions (Borderitis-free Icon Only) */}
        <View style={styles.headerActions}>
          {/* Quick Leave Request Calendar Icon */}
          <TouchableOpacity
            style={styles.iconOnlyBtn}
            onPress={() => setCurrentTab('LEAVE')}
          >
            <CalendarIcon color={currentTab === 'LEAVE' ? '#DC2626' : '#475569'} />
          </TouchableOpacity>

          {/* Notification Bell Icon (Opens Full Notification Screen) */}
          <TouchableOpacity
            style={styles.iconOnlyBtn}
            onPress={() => setCurrentTab('NOTIFICATIONS')}
          >
            <BellIcon color={currentTab === 'NOTIFICATIONS' ? '#DC2626' : '#475569'} />
            {unreadCount > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Screen Views Wrapper with Padding */}
      <View style={styles.screenContent}>
        {currentTab === 'ATTENDANCE' && <AttendanceScreen token={token} user={currentUser} />}
        {currentTab === 'YOUTUBE' && <YoutubeScreen token={token} user={currentUser} />}
        {currentTab === 'LEAVE' && <LeaveScreen token={token} user={currentUser} />}
        {currentTab === 'PAYROLL' && <PayrollScreen token={token} user={currentUser} />}
        {currentTab === 'PROFILE' && <ProfileScreen user={currentUser} onLogout={handleLogout} />}
        {currentTab === 'NOTIFICATIONS' && (
          <NotificationScreen
            token={token}
            user={currentUser}
            onRefreshUnread={() => fetchHeaderInfo(token)}
          />
        )}
      </View>

      {/* Bottom Tab Bar (4 Main Tabs) */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, currentTab === 'ATTENDANCE' && styles.tabActive]}
          onPress={() => setCurrentTab('ATTENDANCE')}
        >
          <ClockIcon color={currentTab === 'ATTENDANCE' ? '#DC2626' : '#64748B'} />
          <Text style={[styles.tabText, currentTab === 'ATTENDANCE' && styles.tabTextActive]}>
            Chấm Công
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, currentTab === 'YOUTUBE' && styles.tabActive]}
          onPress={() => setCurrentTab('YOUTUBE')}
        >
          <YoutubeIcon color={currentTab === 'YOUTUBE' ? '#DC2626' : '#64748B'} />
          <Text style={[styles.tabText, currentTab === 'YOUTUBE' && styles.tabTextActive]}>
            View YouTube
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, currentTab === 'PAYROLL' && styles.tabActive]}
          onPress={() => setCurrentTab('PAYROLL')}
        >
          <DollarIcon color={currentTab === 'PAYROLL' ? '#DC2626' : '#64748B'} />
          <Text style={[styles.tabText, currentTab === 'PAYROLL' && styles.tabTextActive]}>
            Lương Thưởng
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, currentTab === 'PROFILE' && styles.tabActive]}
          onPress={() => setCurrentTab('PROFILE')}
        >
          <UserIcon color={currentTab === 'PROFILE' ? '#DC2626' : '#64748B'} />
          <Text style={[styles.tabText, currentTab === 'PROFILE' && styles.tabTextActive]}>
            Hồ Sơ
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerBar: {
    height: 68,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 3,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'BeVietnamPro_800ExtraBold',
    color: '#0F172A',
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'BeVietnamPro_500Medium',
    color: '#64748B',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconOnlyBtn: {
    position: 'relative',
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  badgeCount: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  screenContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 6,
    paddingTop: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabActive: {
    backgroundColor: '#FEE2E2',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#DC2626',
    fontWeight: '900',
  },
  // Notification Modal Styles
  notifOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  notifContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '80%',
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  notifTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  notifSubTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  markReadBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  markReadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  notifUnreadRow: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginVertical: 2,
  },
  notifDotCol: {
    width: 20,
    paddingTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  notifItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  notifItemMsg: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 18,
  },
  notifItemDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  emptyNotifBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyNotifText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
