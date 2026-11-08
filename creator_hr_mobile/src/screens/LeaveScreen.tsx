import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ApiService } from '../services/api';

interface LeaveScreenProps {
  token: string;
  user: any;
}

function ChevronLeftIcon({ color }: { color: string }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 18l-6-6 6-6" />
    </Svg>
  );
}

function ChevronRightIcon({ color }: { color: string }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 18l6-6-6-6" />
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

// 24 Hours & 60 Minutes Arrays
const SINGLE_HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const SINGLE_MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// Loop 5 times for seamless circular infinite scrolling
const HOURS_LOOP = [...SINGLE_HOURS, ...SINGLE_HOURS, ...SINGLE_HOURS, ...SINGLE_HOURS, ...SINGLE_HOURS];
const MINUTES_LOOP = [...SINGLE_MINUTES, ...SINGLE_MINUTES, ...SINGLE_MINUTES, ...SINGLE_MINUTES, ...SINGLE_MINUTES];

const ITEM_HEIGHT = 44;

export function LeaveScreen({ token, user }: LeaveScreenProps) {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Calendar State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionMode, setActionMode] = useState<'VIEW' | 'LEAVE' | 'LATE'>('VIEW');

  // Form State
  const [leaveType, setLeaveType] = useState<'FULL' | 'HALF_MORNING' | 'HALF_AFTERNOON'>('FULL');
  const [selectedHour, setSelectedHour] = useState<string>('09');
  const [selectedMinute, setSelectedMinute] = useState<string>('00');
  const [reason, setReason] = useState<string>('');

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  const expectedTime = `${selectedHour}:${selectedMinute}`;

  const loadData = async () => {
    setLoading(true);
    try {
      const [leaveRes, attRes] = await Promise.all([
        ApiService.getLeaves(token),
        ApiService.getAttendances(token),
      ]);

      if (leaveRes.ok) {
        setLeaves(leaveRes.leaves || []);
      }
      if (attRes.ok) {
        setAttendances(attRes.attendances || []);
      }
    } catch (err: any) {
      console.warn('Error loading calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Initialize infinite scroll positions to middle loop block
  useEffect(() => {
    if (actionMode === 'LATE') {
      setTimeout(() => {
        const hourIdx = SINGLE_HOURS.indexOf(selectedHour);
        if (hourIdx !== -1 && hourScrollRef.current) {
          hourScrollRef.current.scrollTo({ y: (24 * 2 + hourIdx) * ITEM_HEIGHT, animated: false });
        }

        const minIdx = SINGLE_MINUTES.indexOf(selectedMinute);
        if (minIdx !== -1 && minuteScrollRef.current) {
          minuteScrollRef.current.scrollTo({ y: (60 * 2 + minIdx) * ITEM_HEIGHT, animated: false });
        }
      }, 100);
    }
  }, [actionMode]);

  const handleHourScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT) % 24;
    const hourVal = SINGLE_HOURS[(index + 24) % 24];
    if (hourVal && hourVal !== selectedHour) {
      setSelectedHour(hourVal);
    }

    // Circular loop reset logic
    const totalHeight = 24 * 5 * ITEM_HEIGHT;
    if (y < ITEM_HEIGHT * 10) {
      hourScrollRef.current?.scrollTo({ y: y + 24 * 2 * ITEM_HEIGHT, animated: false });
    } else if (y > totalHeight - ITEM_HEIGHT * 15) {
      hourScrollRef.current?.scrollTo({ y: y - 24 * 2 * ITEM_HEIGHT, animated: false });
    }
  };

  const handleMinuteScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT) % 60;
    const minVal = SINGLE_MINUTES[(index + 60) % 60];
    if (minVal && minVal !== selectedMinute) {
      setSelectedMinute(minVal);
    }

    // Circular loop reset logic
    const totalHeight = 60 * 5 * ITEM_HEIGHT;
    if (y < ITEM_HEIGHT * 15) {
      minuteScrollRef.current?.scrollTo({ y: y + 60 * 2 * ITEM_HEIGHT, animated: false });
    } else if (y > totalHeight - ITEM_HEIGHT * 20) {
      minuteScrollRef.current?.scrollTo({ y: y - 60 * 2 * ITEM_HEIGHT, animated: false });
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDay = (dayString: string) => {
    setSelectedDate(dayString);
    setActionMode('VIEW');
    setReason('');
    setIsModalOpen(true);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isPastDate = selectedDate ? selectedDate < todayStr : false;

  const selectedAttendance = selectedDate ? attendances.find(a => a.date === selectedDate) : null;
  const selectedLeave = selectedDate ? leaves.find(l => l.date === selectedDate) : null;

  const handleSubmitLeave = async (submitType: 'FULL' | 'HALF_MORNING' | 'HALF_AFTERNOON' | 'LATE') => {
    if (!selectedDate || !reason.trim()) {
      Alert.alert('Cảnh báo', 'Vui lòng nhập lý do báo nghỉ / báo muộn.');
      return;
    }

    if (isPastDate) {
      Alert.alert('Cảnh báo', 'Ngày trong quá khứ không thể tạo đơn báo nghỉ/báo muộn.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await ApiService.submitLeave(token, {
        type: submitType,
        date: selectedDate,
        expectedTime: submitType === 'LATE' ? expectedTime : undefined,
        reason,
      });

      if (res.ok) {
        Alert.alert('Thành công', res.message || 'Đơn đăng ký đã được gửi!');
        setReason('');
        setIsModalOpen(false);
        loadData();
      } else {
        Alert.alert('Thất bại', res.error || 'Không thể gửi đơn đăng ký');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể gửi đơn đăng ký');
    } finally {
      setSubmitting(false);
    }
  };

  // Build calendar month cells
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const calendarCells = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    calendarCells.push(`${year}-${monthStr}-${dayStr}`);
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <View style={[styles.badge, styles.badgeSuccess]}>
            <Text style={styles.badgeTextSuccess}>Đã Duyệt</Text>
          </View>
        );
      case 'REJECTED':
        return (
          <View style={[styles.badge, styles.badgeDanger]}>
            <Text style={styles.badgeTextDanger}>Từ Chối</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.badge, styles.badgeWarning]}>
            <Text style={styles.badgeTextWarning}>Đang Chờ</Text>
          </View>
        );
    }
  };

  const getTypeName = (t: string) => {
    switch (t) {
      case 'FULL': return 'Nghỉ cả ngày';
      case 'HALF_MORNING': return 'Nghỉ sáng';
      case 'HALF_AFTERNOON': return 'Nghỉ chiều';
      case 'LATE': return 'Xin đi muộn';
      default: return t;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch Báo Nghỉ & Chấm Công</Text>
        <Text style={styles.headerSubtitle}>Bấm chọn ngày để xem chi tiết chấm công & báo nghỉ</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Month Header Navigation */}
          <View style={styles.monthHeader}>
            <TouchableOpacity style={styles.navBtn} onPress={handlePrevMonth}>
              <ChevronLeftIcon color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>Tháng {month + 1} / {year}</Text>
            <TouchableOpacity style={styles.navBtn} onPress={handleNextMonth}>
              <ChevronRightIcon color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* Days of Week Header */}
          <View style={styles.weekRow}>
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, index) => (
              <Text key={d} style={[styles.weekDayText, index >= 5 && styles.weekendText]}>{d}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.gridContainer}>
            {calendarCells.map((dateStr, index) => {
              if (!dateStr) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const dayNum = parseInt(dateStr.split('-')[2]);
              const leaveRecord = leaves.find(l => l.date === dateStr);
              const attRecord = attendances.find(a => a.date === dateStr);
              const isToday = dateStr === todayStr;

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    styles.dayCell,
                    isToday && styles.todayCell,
                    leaveRecord?.status === 'APPROVED' && styles.approvedCell,
                    leaveRecord?.status === 'PENDING' && styles.pendingCell,
                    leaveRecord?.status === 'REJECTED' && styles.rejectedCell,
                    attRecord?.checkIn && !leaveRecord && styles.attPresentCell,
                  ]}
                  onPress={() => handleSelectDay(dateStr)}
                >
                  <Text style={[
                    styles.dayNumText,
                    isToday && styles.todayNumText,
                    (leaveRecord || attRecord) && styles.leaveNumText,
                  ]}>
                    {dayNum}
                  </Text>

                  {/* Status Indicator Dot */}
                  {leaveRecord && (
                    <View style={[
                      styles.dot,
                      leaveRecord.status === 'APPROVED' && styles.dotGreen,
                      leaveRecord.status === 'PENDING' && styles.dotAmber,
                      leaveRecord.status === 'REJECTED' && styles.dotRed,
                    ]} />
                  )}
                  {!leaveRecord && attRecord?.checkIn && (
                    <View style={[styles.dot, styles.dotBlue]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Previous Leaves List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Danh Sách Đơn Xin Nghỉ Trong Năm</Text>
          {leaves.length > 0 ? (
            leaves.map((item: any) => (
              <View key={item.id} style={styles.leaveRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.leaveMeta}>
                    <Text style={styles.leaveType}>{getTypeName(item.type)}</Text>
                    <Text style={styles.leaveDate}> - Ngày {item.date}</Text>
                  </View>
                  <Text style={styles.leaveReason}>{item.reason}</Text>
                </View>
                {renderStatusBadge(item.status)}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Chưa có đơn báo nghỉ nào.</Text>
          )}
        </View>
      </ScrollView>

      {/* Date Detail & Action Modal */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalOpen(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            style={{ width: '100%' }}
          >
            <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Chi Tiết Ngày {selectedDate}</Text>
                {isPastDate && (
                  <Text style={styles.pastDateTag}>Lịch sử quá khứ (Khóa tạo đơn)</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <CloseIcon color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Attendance & Leave Summary Box */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Giờ Check In:</Text>
                <Text style={styles.summaryValue}>
                  {selectedAttendance?.checkIn ? selectedAttendance.checkIn.slice(11, 16) : '—'}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Giờ Check Out:</Text>
                <Text style={styles.summaryValue}>
                  {selectedAttendance?.checkOut ? selectedAttendance.checkOut.slice(11, 16) : '—'}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tổng số giờ làm:</Text>
                <Text style={[styles.summaryValue, { color: '#16A34A' }]}>
                  {selectedAttendance?.workHours ? `${selectedAttendance.workHours}h` : '0h'}
                </Text>
              </View>

              {selectedLeave && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Đơn đã đăng ký:</Text>
                  <Text style={[styles.summaryValue, { color: '#DC2626' }]}>
                    {getTypeName(selectedLeave.type)} ({selectedLeave.status})
                  </Text>
                </View>
              )}
            </View>

            {/* Default View Mode: 2 Main Action Buttons (Báo Nghỉ & Báo Muộn) */}
            {actionMode === 'VIEW' && (
              <View style={styles.actionButtonGroup}>
                {isPastDate ? (
                  <View style={styles.lockedBox}>
                    <Text style={styles.lockedText}>
                      Ngày trong quá khứ không thể tạo đơn báo nghỉ hoặc báo muộn.
                    </Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.btnActionLeave}
                      onPress={() => setActionMode('LEAVE')}
                    >
                      <Text style={styles.btnActionLeaveText}>Báo Nghỉ</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnActionLate}
                      onPress={() => setActionMode('LATE')}
                    >
                      <Text style={styles.btnActionLateText}>Báo Muộn</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* Leave Request Form */}
            {actionMode === 'LEAVE' && (
              <View style={styles.formBox}>
                <Text style={styles.formBoxTitle}>Tạo Đơn Báo Nghỉ (Ngày {selectedDate})</Text>

                <Text style={styles.label}>Loại hình nghỉ:</Text>
                <View style={styles.typeGrid}>
                  <TouchableOpacity
                    style={[styles.typeBtn, leaveType === 'FULL' && styles.typeBtnActive]}
                    onPress={() => setLeaveType('FULL')}
                  >
                    <Text style={[styles.typeBtnText, leaveType === 'FULL' && styles.typeBtnTextActive]}>Cả Ngày</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typeBtn, leaveType === 'HALF_MORNING' && styles.typeBtnActive]}
                    onPress={() => setLeaveType('HALF_MORNING')}
                  >
                    <Text style={[styles.typeBtnText, leaveType === 'HALF_MORNING' && styles.typeBtnTextActive]}>Nghỉ Sáng</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typeBtn, leaveType === 'HALF_AFTERNOON' && styles.typeBtnActive]}
                    onPress={() => setLeaveType('HALF_AFTERNOON')}
                  >
                    <Text style={[styles.typeBtnText, leaveType === 'HALF_AFTERNOON' && styles.typeBtnTextActive]}>Nghỉ Chiều</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Lý do xin nghỉ:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Nhập lý do chi tiết..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setActionMode('VIEW')}>
                    <Text style={styles.cancelBtnText}>Quay Lại</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.submitBtn, submitting && styles.btnDisabled]}
                    onPress={() => handleSubmitLeave(leaveType)}
                    disabled={submitting}
                  >
                    {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Gửi Đơn Báo Nghỉ</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Late Arrival Form with Circular Infinite Scroll Wheel */}
            {actionMode === 'LATE' && (
              <View style={styles.formBox}>
                <Text style={styles.formBoxTitle}>Thông Báo Đi Muộn (Ngày {selectedDate})</Text>

                
                
                {/* Live Banner */}
                <View style={styles.timeDisplayBanner}>
                  <Text style={styles.timeDisplayText}>{expectedTime}</Text>
                  <Text style={styles.timeDisplaySub}>Giờ dự kiến tới văn phòng</Text>
                </View>

                {/* Circular Wheel Picker Container */}
                <View style={styles.circularWheelWrapper}>

                  {/* Hours Infinite Column */}
                  <View style={styles.wheelColContainer}>
                    <Text style={styles.wheelColHeader}>Giờ (24h)</Text>
                    <ScrollView
                      ref={hourScrollRef}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      decelerationRate="fast"
                      onScroll={handleHourScroll}
                      scrollEventThrottle={16}
                      contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                    >
                      {HOURS_LOOP.map((h, i) => (
                        <TouchableOpacity
                          key={`h-${i}`}
                          style={styles.wheelItemRow}
                          onPress={() => {
                            setSelectedHour(h);
                            hourScrollRef.current?.scrollTo({ y: i * ITEM_HEIGHT, animated: true });
                          }}
                        >
                          <Text style={[styles.wheelItemLabel, selectedHour === h && styles.wheelItemLabelActive]}>
                            {h}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <Text style={styles.wheelColonSeparator}>:</Text>

                  {/* Minutes Infinite Column */}
                  <View style={styles.wheelColContainer}>
                    <Text style={styles.wheelColHeader}>Phút (60p)</Text>
                    <ScrollView
                      ref={minuteScrollRef}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      decelerationRate="fast"
                      onScroll={handleMinuteScroll}
                      scrollEventThrottle={16}
                      contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                    >
                      {MINUTES_LOOP.map((m, i) => (
                        <TouchableOpacity
                          key={`m-${i}`}
                          style={styles.wheelItemRow}
                          onPress={() => {
                            setSelectedMinute(m);
                            minuteScrollRef.current?.scrollTo({ y: i * ITEM_HEIGHT, animated: true });
                          }}
                        >
                          <Text style={[styles.wheelItemLabel, selectedMinute === m && styles.wheelItemLabelActive]}>
                            {m}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Reason Input */}
                <Text style={styles.label}>Lý do xin đi muộn:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Nhập lý do xin đi muộn..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setActionMode('VIEW')}>
                    <Text style={styles.cancelBtnText}>Quay Lại</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.submitBtn, submitting && styles.btnDisabled]}
                    onPress={() => handleSubmitLeave('LATE')}
                    disabled={submitting}
                  >
                    {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Gửi Báo Muộn ({expectedTime})</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </TouchableOpacity>
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
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  weekendText: {
    color: '#DC2626',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
    borderRadius: 12,
    position: 'relative',
  },
  todayCell: {
    borderWidth: 2,
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  approvedCell: {
    backgroundColor: '#DCFCE7',
  },
  pendingCell: {
    backgroundColor: '#FEF3C7',
  },
  rejectedCell: {
    backgroundColor: '#FEE2E2',
  },
  attPresentCell: {
    backgroundColor: '#EFF6FF',
  },
  dayNumText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  todayNumText: {
    fontWeight: '900',
    color: '#DC2626',
  },
  leaveNumText: {
    fontWeight: '900',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    position: 'absolute',
    bottom: 4,
  },
  dotGreen: { backgroundColor: '#16A34A' },
  dotAmber: { backgroundColor: '#D97706' },
  dotRed: { backgroundColor: '#DC2626' },
  dotBlue: { backgroundColor: '#2563EB' },
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  leaveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  leaveMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaveType: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  leaveDate: {
    fontSize: 12,
    color: '#64748B',
  },
  leaveReason: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeSuccess: { backgroundColor: '#DCFCE7' },
  badgeWarning: { backgroundColor: '#FEF3C7' },
  badgeDanger: { backgroundColor: '#FEE2E2' },
  badgeTextSuccess: { fontSize: 11, fontWeight: '700', color: '#15803D' },
  badgeTextWarning: { fontSize: 11, fontWeight: '700', color: '#B45309' },
  badgeTextDanger: { fontSize: 11, fontWeight: '700', color: '#B91C1C' },
  emptyText: { color: '#94A3B8', fontSize: 13, textAlign: 'center', marginVertical: 14 },
  
  // Modal styles
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  pastDateTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 2,
  },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  actionButtonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  btnActionLeave: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnActionLeaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  btnActionLate: {
    flex: 1,
    backgroundColor: '#D97706',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnActionLateText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  lockedBox: {
    backgroundColor: '#F1F5F9',
    padding: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  lockedText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  formBox: {
    marginTop: 2,
  },
  formBoxTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  timeDisplayBanner: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  timeDisplayText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  timeDisplaySub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  // Circular Infinite Wheel Styles
  circularWheelWrapper: {
    height: 132,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    marginBottom: 10,
    overflow: 'hidden',
  },
  wheelColContainer: {
    flex: 1,
    height: 132,
    alignItems: 'center',
  },
  wheelColHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  wheelItemRow: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  wheelItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CBD5E1',
  },
  wheelItemLabelActive: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
  },
  wheelColonSeparator: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginHorizontal: 8,
    marginTop: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  typeBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  typeBtnActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  textArea: {
    height: 55,
    textAlignVertical: 'top',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
