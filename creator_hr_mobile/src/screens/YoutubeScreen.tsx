import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Linking,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ApiService } from '../services/api';

interface YoutubeScreenProps {
  token: string;
  user: any;
}

function PlusIcon({ color }: { color: string }) {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

function RefreshIcon({ color }: { color: string }) {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 4v6h-6M1 20v-6h6" />
      <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </Svg>
  );
}

function CloseIcon({ color }: { color: string }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );
}

function YoutubeIcon({ color }: { color: string }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <Path d="M9.75 15.02L15.5 11.75L9.75 8.48Z" fill={color} />
    </Svg>
  );
}

export function YoutubeScreen({ token, user }: YoutubeScreenProps) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [channels, setChannels] = useState<any[]>([]);
  const [youtubeViews, setYoutubeViews] = useState<any[]>([]);
  const [oauthUrl, setOauthUrl] = useState<string>('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [handleOrUrl, setHandleOrUrl] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getYoutubeData(token, currentMonth, currentYear);
      if (res.ok) {
        setChannels(res.channels || []);
        setYoutubeViews(res.youtubeViews || []);
        setOauthUrl(res.oauthUrl || '');
      }
    } catch (err: any) {
      console.warn('Error loading youtube data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddChannel = async () => {
    if (!handleOrUrl.trim()) {
      Alert.alert('Cảnh báo', 'Vui lòng nhập Channel ID hoặc Link/Handle YouTube.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await ApiService.addYoutubeChannel(token, handleOrUrl);
      if (res.ok) {
        Alert.alert('Thành công', res.message || 'Đã kết nối kênh YouTube!');
        setHandleOrUrl('');
        setIsAddModalOpen(false);
        loadData();
      } else {
        Alert.alert('Kết nối Thất bại', res.error || 'Không thể kết nối kênh YouTube');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể kết nối kênh YouTube');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncViews = async () => {
    setSyncing(true);
    try {
      const res = await ApiService.syncYoutubeViews(token);
      if (res.ok) {
        Alert.alert('Đồng bộ thành công', res.message || 'Đã cập nhật View mới nhất từ YouTube Data API!');
        loadData();
      } else {
        Alert.alert('Đồng bộ Thất bại', res.error || 'Không thể đồng bộ View');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể đồng bộ View');
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteChannel = (channel: any) => {
    Alert.alert('Xác nhận', `Bạn có chắc muốn hủy kết nối kênh "${channel.channelName}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Hủy kết nối',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await ApiService.deleteYoutubeChannel(token, channel.id);
            if (res.ok) {
              Alert.alert('Thành công', res.message || 'Đã hủy kết nối kênh.');
              loadData();
            }
          } catch (err: any) {
            Alert.alert('Lỗi', err.message || 'Không thể hủy kết nối kênh');
          }
        },
      },
    ]);
  };

  const handleOAuthConnect = () => {
    const targetUrl = oauthUrl || `http://192.168.1.13:3000/api/youtube/auth?userId=${user?.id || ''}`;
    Linking.openURL(targetUrl).catch(() => {
      Alert.alert('Lỗi', 'Không thể mở trình duyệt xác thực Google.');
    });
  };

  const totalViews = youtubeViews.reduce((acc: number, item: any) => acc + Number(item.viewCount || 0), 0);
  const viewBonusRate = user?.viewBonusRate || 5000;
  const totalBonusAmount = Math.round((totalViews / 1000) * viewBonusRate);

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val || 0);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kênh YouTube & Thưởng</Text>
        <Text style={styles.headerSubtitle}>Quản lý kết nối kênh & đồng bộ View thưởng hàng tháng</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor="#DC2626" />}
      >
        {/* Total Views Summary Card */}
        <View style={styles.ytCard}>
          <Text style={styles.ytCardLabel}>TỔNG VIEW YOUTUBE THÁNG {currentMonth}/{currentYear}:</Text>
          <Text style={styles.ytCardValue}>{formatNumber(totalViews)} <Text style={styles.unitText}>views</Text></Text>
          
          <View style={styles.bonusDivider} />
          
          <View style={styles.bonusRow}>
            <Text style={styles.bonusLabel}>Tỷ lệ thưởng / 1,000 views:</Text>
            <Text style={styles.bonusValue}>{formatCurrency(viewBonusRate)}</Text>
          </View>

          <View style={styles.bonusRow}>
            <Text style={styles.bonusLabel}>Tiền thưởng View tạm tính:</Text>
            <Text style={styles.bonusAmount}>+{formatCurrency(totalBonusAmount)}</Text>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.primaryAddBtn} onPress={handleOAuthConnect}>
            <PlusIcon color="#FFFFFF" />
            <Text style={styles.primaryAddText}>Kết Nối Kênh Mới</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.syncBtnIconOnly, syncing && styles.btnDisabled]} onPress={handleSyncViews} disabled={syncing}>
            {syncing ? (
              <ActivityIndicator color="#DC2626" size="small" />
            ) : (
              <RefreshIcon color="#DC2626" />
            )}
          </TouchableOpacity>
        </View>

        {/* Connected Channels List */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Danh Sách Kênh YouTube Đã Kết Nối ({channels.length})</Text>
          </View>

          {channels.length > 0 ? (
            channels.map((item: any) => (
              <View key={item.id} style={styles.channelRow}>
                <View style={styles.channelBadgeIcon}>
                  <YoutubeIcon color="#DC2626" />
                </View>
                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <Text style={styles.channelName}>{item.channelName}</Text>
                  <Text style={styles.channelSubText}>
                    {formatNumber(item.subscriberCount)} người đăng ký
                  </Text>
                  {item.lastSyncAt && (
                    <Text style={styles.syncTimeText}>Đã sync: {item.lastSyncAt.slice(0, 10)}</Text>
                  )}
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteChannel(item)}>
                  <Text style={styles.deleteBtnText}>Hủy</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Chưa có kênh YouTube nào được kết nối.</Text>
              <Text style={styles.emptyDesc}>Bấm "Kết Nối Kênh Mới" ở trên để nhập Channel Handle hoặc Link kênh của bạn.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Channel Modal */}
      <Modal
        visible={isAddModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kết Nối Kênh YouTube Mới</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <CloseIcon color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nhập Handle Kênh hoặc Link YouTube:</Text>
            <TextInput
              style={styles.input}
              value={handleOrUrl}
              onChangeText={setHandleOrUrl}
              placeholder="Ví dụ: @tenkenhcuaban hoặc UC..."
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.btnDisabled]}
              onPress={handleAddChannel}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Xác Nhận Kết Nối Kênh</Text>
              )}
            </TouchableOpacity>

            <View style={styles.orDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>Hoặc</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.oauthBtn} onPress={handleOAuthConnect}>
              <YoutubeIcon color="#DC2626" />
              <Text style={styles.oauthBtnText}>Đăng Nhập Google OAuth Ủy Quyền</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  ytCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  ytCardLabel: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  ytCardValue: {
    fontSize: 30,
    fontWeight: '900',
    color: '#78350F',
    marginVertical: 8,
  },
  unitText: {
    fontSize: 15,
    color: '#D97706',
    fontWeight: '700',
  },
  bonusDivider: {
    height: 1,
    backgroundColor: '#FDE68A',
    marginVertical: 12,
  },
  bonusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  bonusLabel: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
  },
  bonusValue: {
    fontSize: 13,
    color: '#78350F',
    fontWeight: '800',
  },
  bonusAmount: {
    fontSize: 15,
    color: '#16A34A',
    fontWeight: '900',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  primaryAddBtn: {
    flex: 1.2,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryAddText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  syncBtnIconOnly: {
    width: 48,
    height: 48,
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  channelBadgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  channelSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  syncTimeText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  deleteBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  emptyBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  submitBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  oauthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 14,
    borderRadius: 14,
  },
  oauthBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
  },
});
