import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { ApiService } from '../services/api';

interface PayrollScreenProps {
  token: string;
  user: any;
}

export function PayrollScreen({ token, user }: PayrollScreenProps) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [loading, setLoading] = useState(false);
  const [payrollData, setPayrollData] = useState<any>(null);

  const loadPayroll = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getPayroll(token, currentMonth, currentYear);
      if (res.ok) {
        setPayrollData(res);
      }
    } catch (err: any) {
      console.warn('Error loading payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayroll();
  }, []);

  const payroll = payrollData?.payrolls?.[0];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bảng Lương & Thưởng</Text>
        <Text style={styles.headerSubtitle}>Kỳ Lương Tháng {currentMonth}/{currentYear}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadPayroll} tintColor="#DC2626" />}
      >
        {/* Total Salary Highlight Card */}
        <View style={styles.salaryCard}>
          <Text style={styles.salaryLabel}>Tổng Lương Thực Nhận Tháng {currentMonth}:</Text>
          <Text style={styles.salaryValue}>{formatCurrency(payroll?.finalSalary || 0)}</Text>
          <Text style={styles.salaryStatus}>
            Trạng thái: {payroll?.status === 'LOCKED' ? 'Đã Chốt Lương' : 'Tạm Tính (Đang Cập Nhật)'}
          </Text>
        </View>

        {/* Breakdown Items */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Chi Tiết Các Khoản Tính Lương</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tổng số giờ làm việc:</Text>
            <Text style={styles.detailValue}>{payroll?.totalWorkHours || 0} giờ</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Đơn giá lương theo giờ:</Text>
            <Text style={styles.detailValue}>{formatCurrency(payroll?.baseHourlyWage || user?.hourlyRate || 50000)}/h</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Lương giờ làm thực tế:</Text>
            <Text style={styles.detailValue}>{formatCurrency(payroll?.totalHourlyPay || 0)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Thưởng View YouTube:</Text>
            <Text style={[styles.detailValue, { color: '#16A34A' }]}>+{formatCurrency(payroll?.youtubeBonus || 0)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Thưởng khác:</Text>
            <Text style={[styles.detailValue, { color: '#16A34A' }]}>+{formatCurrency(payroll?.otherBonus || 0)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Khấu trừ Phạt (Đi muộn/Quên Out):</Text>
            <Text style={[styles.detailValue, { color: '#DC2626' }]}>-{formatCurrency(payroll?.totalPenalty || 0)}</Text>
          </View>
        </View>

        {/* Recent Bonus/Penalty Notes */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Nhật Ký Thưởng & Phạt Gần Đây</Text>
          {payrollData?.bonusPenalties?.length > 0 ? (
            payrollData.bonusPenalties.map((item: any) => (
              <View key={item.id} style={styles.bpRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bpCategory}>{item.category}</Text>
                  <Text style={styles.bpReason}>{item.reason}</Text>
                </View>
                <Text style={[styles.bpAmount, item.type === 'BONUS' ? { color: '#16A34A' } : { color: '#DC2626' }]}>
                  {item.type === 'BONUS' ? '+' : '-'}{formatCurrency(item.amount)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Không có ghi nhận thưởng/phạt nào.</Text>
          )}
        </View>
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
  salaryCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 22,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  salaryLabel: {
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  salaryValue: {
    fontSize: 30,
    fontWeight: '900',
    color: '#7F1D1D',
    marginVertical: 10,
  },
  salaryStatus: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  bpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  bpCategory: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  bpReason: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  bpAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 14,
  },
});
