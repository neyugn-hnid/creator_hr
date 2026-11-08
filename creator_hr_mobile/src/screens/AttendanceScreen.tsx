import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import { ApiService } from '../services/api';

interface AttendanceScreenProps {
  token: string;
  user: any;
}

export function AttendanceScreen({ token, user }: AttendanceScreenProps) {
  const [gpsLocation, setGpsLocation] = useState<{ lat?: number; lng?: number; accuracy?: number; status: string; errorMsg?: string }>({ status: 'idle' });
  const [currentWifi, setCurrentWifi] = useState<string>('CreatorHR_5G');
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchGpsLocation = async () => {
    try {
      setGpsLocation({ status: 'loading' });
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsLocation({ status: 'error', errorMsg: 'Vui lòng cấp quyền vị trí GPS trong Cài đặt thiết bị.' });
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setGpsLocation({
        lat: parseFloat(location.coords.latitude.toFixed(6)),
        lng: parseFloat(location.coords.longitude.toFixed(6)),
        accuracy: Math.round(location.coords.accuracy),
        status: 'success',
      });
    } catch (err: any) {
      setGpsLocation({ status: 'error', errorMsg: err.message || 'Không thể lấy tọa độ GPS' });
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, attRes] = await Promise.all([
        ApiService.getProfile(token),
        ApiService.getAttendances(token),
      ]);

      if (profileRes.ok) {
        if (profileRes.settings?.companyWifiSsid) {
          setCurrentWifi(profileRes.settings.companyWifiSsid);
        }
      }

      if (attRes.ok) {
        setAttendances(attRes.attendances || []);
      }
    } catch (err: any) {
      console.warn('Error loading attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGpsLocation();
    loadData();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const myTodayRecord = attendances.find((a: any) => a.date === todayStr && !a.isDeleted);

  const handleCheckIn = async () => {
    if (gpsLocation.status !== 'success' || !gpsLocation.lat || !gpsLocation.lng) {
      Alert.alert('Cảnh báo GPS', 'Chưa định vị được GPS. Vui lòng bấm Cập nhật GPS.');
      fetchGpsLocation();
      return;
    }

    setSubmitting(true);
    try {
      const res = await ApiService.submitAttendance(token, {
        intent: 'checkIn',
        wifiSsid: currentWifi,
        latitude: String(gpsLocation.lat),
        longitude: String(gpsLocation.lng),
      });

      if (res.ok) {
        Alert.alert('Thành công', res.message || 'Check In thành công!');
        loadData();
      } else {
        Alert.alert('Check In Thất bại', res.error || 'Vui lòng kiểm tra WiFi & GPS');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể gửi yêu cầu Check In');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (gpsLocation.status !== 'success' || !gpsLocation.lat || !gpsLocation.lng) {
      Alert.alert('Cảnh báo GPS', 'Chưa định vị được GPS. Vui lòng bấm Cập nhật GPS.');
      fetchGpsLocation();
      return;
    }

    setSubmitting(true);
    try {
      const res = await ApiService.submitAttendance(token, {
        intent: 'checkOut',
        wifiSsid: currentWifi,
        latitude: String(gpsLocation.lat),
        longitude: String(gpsLocation.lng),
      });

      if (res.ok) {
        Alert.alert('Thành công', res.message || 'Check Out thành công!');
        loadData();
      } else {
        Alert.alert('Check Out Thất bại', res.error || 'Không tìm thấy lượt Check In');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể gửi yêu cầu Check Out');
    } finally {
      setSubmitting(false);
    }
  };

  const renderAttendanceItem = ({ item }: { item: any }) => (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordDate}>{item.date}</Text>
        <View style={[
          styles.badge,
          item.status === 'PRESENT' ? styles.badgeSuccess : styles.badgeDanger
        ]}>
          <Text style={[
            styles.badgeText,
            item.status === 'PRESENT' ? styles.badgeTextSuccess : styles.badgeTextDanger
          ]}>
            {item.status === 'PRESENT' ? 'Đúng giờ' : `Đi muộn ${item.lateMinutes || 0}p`}
          </Text>
        </View>
      </View>
      <View style={styles.recordDetails}>
        <Text style={styles.recordTime}>In: {item.checkIn ? item.checkIn.slice(11, 16) : '—'}</Text>
        <Text style={styles.recordTime}>Out: {item.checkOut ? item.checkOut.slice(11, 16) : '—'}</Text>
        <Text style={styles.recordHours}>{item.workHours || 0}h</Text>
      </View>
      <Text style={styles.recordWifi}>WiFi: {item.wifiSsid || 'Văn phòng chính'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chấm Công</Text>
      </View>

      {/* Check in Card */}
      <View style={styles.widgetCard}>
        <View style={styles.widgetRow}>
          <Text style={styles.widgetLabel}>Vị trí:</Text>
          <TouchableOpacity onPress={fetchGpsLocation} style={styles.reloadGpsBtn}>
            <Text style={styles.reloadGpsText}>Cập nhật</Text>
          </TouchableOpacity>
        </View>

        {gpsLocation.status === 'loading' && (
          <Text style={styles.gpsLoading}>Đang định vị...</Text>
        )}
        {gpsLocation.status === 'success' && (
          <Text style={styles.gpsSuccess}>
            Tọa độ: {gpsLocation.lat}, {gpsLocation.lng} (±{gpsLocation.accuracy}m)
          </Text>
        )}
        {gpsLocation.status === 'error' && (
          <Text style={styles.gpsError}>{gpsLocation.errorMsg}</Text>
        )}

        <View style={styles.wifiRow}>
          <Text style={styles.wifiLabel}>Mạng WiFi:</Text>
          <Text style={styles.wifiValue}>{currentWifi}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.btnCheckIn, (myTodayRecord?.checkIn || submitting) && styles.btnDisabled]}
            onPress={handleCheckIn}
            disabled={Boolean(myTodayRecord?.checkIn) || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnText}>Check In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnCheckOut, (!myTodayRecord?.checkIn || myTodayRecord?.checkOut || submitting) && styles.btnDisabled]}
            onPress={handleCheckOut}
            disabled={!myTodayRecord?.checkIn || Boolean(myTodayRecord?.checkOut) || submitting}
          >
            <Text style={styles.btnText}>Check Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* History List */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Nhật Ký Chấm Công 30 Ngày Gần Nhất</Text>
        <FlatList
          data={attendances}
          keyExtractor={(item) => item.id}
          renderItem={renderAttendanceItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor="#DC2626" />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Chưa có lịch sử chấm công nào.</Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerUser: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  widgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    width: '100%',
  },
  widgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  widgetLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  reloadGpsBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  reloadGpsText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '700',
  },
  gpsLoading: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
    marginBottom: 14,
  },
  gpsSuccess: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '700',
    marginBottom: 14,
  },
  gpsError: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    marginBottom: 14,
  },
  wifiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  wifiLabel: {
    fontSize: 13,
    color: '#64748B',
    marginRight: 8,
  },
  wifiValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnCheckIn: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnCheckOut: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.3,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  historySection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 14,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recordDate: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  badgeDanger: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextSuccess: { color: '#15803D' },
  badgeTextDanger: { color: '#B91C1C' },
  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recordTime: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  recordHours: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16A34A',
  },
  recordWifi: {
    fontSize: 11,
    color: '#94A3B8',
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 13,
  },
});
