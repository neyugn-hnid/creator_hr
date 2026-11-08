import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ApiService } from '../services/api';

interface NotificationScreenProps {
  token: string;
  user: any;
  onRefreshUnread?: () => void;
}

function BellCheckIcon({ color }: { color: string }) {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <Path d="M9 11l2 2 4-4" />
    </Svg>
  );
}

function CheckAllIcon({ color }: { color: string }) {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

export function NotificationScreen({ token, user, onRefreshUnread }: NotificationScreenProps) {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const formatDateText = (dateVal: any) => {
    if (!dateVal) return 'Vừa xong';
    const str = String(dateVal);
    if (str.length >= 16) {
      return `${str.slice(0, 10)} lúc ${str.slice(11, 16)}`;
    }
    return str;
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getNotifications(token);
      if (res && res.ok) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
        if (onRefreshUnread) onRefreshUnread();
      } else {
        console.warn('Notifications response not OK:', res);
      }
    } catch (err: any) {
      console.warn('Error loading notifications screen:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    const WS_URL = 'ws://192.168.1.13:3001';
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(WS_URL);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'NOTIFICATION' || data.type === 'NOTIFICATION') {
            loadNotifications();
          }
        } catch {}
      };
    } catch {}

    return () => {
      ws?.close();
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await ApiService.markAllNotificationsRead(token);
      if (res && res.ok) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        if (onRefreshUnread) onRefreshUnread();
        Alert.alert('Thành công', 'Đã đánh dấu tất cả thông báo là đã đọc.');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', 'Không thể đánh dấu thông báo.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Thông Báo Hệ Thống</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0 ? `Bạn có ${unreadCount} thông báo mới chưa đọc` : 'Bạn đã đọc tất cả thông báo'}
          </Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markReadBtn} onPress={handleMarkAllRead}>
            <CheckAllIcon color="#0284C7" />
            <Text style={styles.markReadText}>Đọc Tất Cả</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadNotifications} tintColor="#DC2626" />}
      >
        {notifications.length > 0 ? (
          notifications.map((item: any, index: number) => (
            <View key={item.id || `notif_${index}`} style={[styles.notifCard, !item.isRead && styles.unreadCard]}>
              <View style={styles.iconCol}>
                <View style={[styles.badgeIcon, !item.isRead && styles.unreadBadgeIcon]}>
                  <BellCheckIcon color={!item.isRead ? '#DC2626' : '#64748B'} />
                </View>
              </View>

              <View style={styles.contentCol}>
                <View style={styles.titleRow}>
                  <Text style={[styles.notifTitle, !item.isRead && styles.unreadTitle]}>
                    {item.title}
                  </Text>
                  {!item.isRead && <View style={styles.redDot} />}
                </View>

                <Text style={styles.notifMessage}>{item.message}</Text>
                
                <Text style={styles.notifDate}>
                  {formatDateText(item.createdAt)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <BellCheckIcon color="#94A3B8" />
            <Text style={styles.emptyTitle}>Chưa có thông báo nào.</Text>
            <Text style={styles.emptySub}>Khi có phê duyệt đơn nghỉ, cập nhật bảng lương hoặc nhắc nhở chấm công, thông báo sẽ hiển thị ở đây.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  iconCol: {
    marginRight: 12,
  },
  badgeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeIcon: {
    backgroundColor: '#FEE2E2',
  },
  contentCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  unreadTitle: {
    color: '#991B1B',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  notifMessage: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 6,
  },
  notifDate: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
