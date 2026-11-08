import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Image,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { ApiService, AuthService, BASE_URL } from '../services/api';

interface LoginScreenProps {
  onLoginSuccess: (token: string, user: any) => void;
}

function GoogleIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function EyeIcon({ color }: { color: string }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

function EyeOffIcon({ color }: { color: string }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <Path d="M1 1l22 22" />
    </Svg>
  );
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [activeMode, setActiveMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loading, setLoading] = useState(false);

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('demo@creatorhr.vn');
  const [loginPassword, setLoginPassword] = useState('123456');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Validation errors state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleLoginSubmit = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!loginEmail.trim()) {
      newErrors.loginEmail = 'Vui lòng nhập Email đăng nhập';
    } else if (!validateEmail(loginEmail)) {
      newErrors.loginEmail = 'Email không đúng định dạng (Ví dụ: name@company.com)';
    }

    if (!loginPassword) {
      newErrors.loginPassword = 'Vui lòng nhập Mật khẩu';
    } else if (loginPassword.length < 6) {
      newErrors.loginPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const res = await ApiService.login(loginEmail);
      if (res.ok && res.token && res.user) {
        await AuthService.setSession(res.token, res.user);
        onLoginSuccess(res.token, res.user);
      } else {
        setErrors({ loginEmail: res.error || 'Email không tồn tại hoặc chưa được cấp quyền' });
      }
    } catch (err: any) {
      Alert.alert('Lỗi Kết Nối', err.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!regName.trim()) {
      newErrors.regName = 'Vui lòng nhập Họ và Tên';
    } else if (regName.trim().length < 2) {
      newErrors.regName = 'Họ và Tên quá ngắn (tối thiểu 2 ký tự)';
    }

    if (!regEmail.trim()) {
      newErrors.regEmail = 'Vui lòng nhập Email đăng ký';
    } else if (!validateEmail(regEmail)) {
      newErrors.regEmail = 'Email không đúng định dạng (Ví dụ: name@company.com)';
    }

    if (!regPassword) {
      newErrors.regPassword = 'Vui lòng nhập Mật khẩu khởi tạo';
    } else if (regPassword.length < 6) {
      newErrors.regPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!regConfirmPassword) {
      newErrors.regConfirmPassword = 'Vui lòng xác nhận Mật khẩu';
    } else if (regPassword !== regConfirmPassword) {
      newErrors.regConfirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const res = await ApiService.register({
        name: regName,
        email: regEmail,
        password: regPassword,
      });

      if (res.ok && res.token && res.user) {
        await AuthService.setSession(res.token, res.user);
        Alert.alert('Thành công', 'Đăng ký tài khoản thành công!');
        onLoginSuccess(res.token, res.user);
      } else {
        setErrors({ regEmail: res.error || 'Không thể đăng ký tài khoản' });
      }
    } catch (err: any) {
      Alert.alert('Lỗi Kết Nối', err.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOAuth = () => {
    const oauthUrl = `${BASE_URL}/api/youtube/auth`;
    Linking.openURL(oauthUrl).catch(() => {
      Alert.alert('Lỗi', 'Không thể mở trình duyệt xác thực Google.');
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Main Auth Card Container */}
        <View style={styles.authCard}>
          {/* Brand Header Inside Card */}
          <View style={styles.brandHeader}>
            <Image source={require('../../assets/icon.png')} style={{ width: 48, height: 48, borderRadius: 12, marginBottom: 8 }} resizeMode="contain" />
            <Text style={styles.appName}>MediaPulse</Text>
          </View>

          {/* Form Content */}
          {activeMode === 'LOGIN' ? (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Đăng Nhập Tài Khoản</Text>
            

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email:</Text>
                <TextInput
                  style={[styles.input, errors.loginEmail && styles.inputError]}
                  value={loginEmail}
                  onChangeText={(val) => {
                    setLoginEmail(val);
                    if (errors.loginEmail) setErrors(prev => ({ ...prev, loginEmail: '' }));
                  }}
                  placeholder="Ví dụ: nhanvien@creatorhr.vn"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.loginEmail ? <Text style={styles.errorText}>{errors.loginEmail}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={[styles.inputLabel, { marginBottom: 0 }]}>Mật Khẩu:</Text>
                  <TouchableOpacity onPress={() => Alert.alert('Quên Mật Khẩu', 'Vui lòng liên hệ Quản trị viên (Admin) hoặc bộ phận HR để được đặt lại mật khẩu tài khoản.')}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#DC2626' }}>Quên mật khẩu?</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.passwordWrapper, errors.loginPassword && styles.inputError]}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
                    value={loginPassword}
                    onChangeText={(val) => {
                      setLoginPassword(val);
                      if (errors.loginPassword) setErrors(prev => ({ ...prev, loginPassword: '' }));
                    }}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showLoginPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    {showLoginPassword ? <EyeOffIcon color="#64748B" /> : <EyeIcon color="#64748B" />}
                  </TouchableOpacity>
                </View>
                {errors.loginPassword ? <Text style={styles.errorText}>{errors.loginPassword}</Text> : null}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.btnDisabled]}
                onPress={handleLoginSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Đăng Nhập Ngay</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchModeRow}
                onPress={() => {
                  setErrors({});
                  setActiveMode('REGISTER');
                }}
              >
                <Text style={styles.switchModeText}>
                  Bạn chưa có tài khoản? <Text style={styles.switchModeHighlight}>Đăng ký ngay</Text>
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Tạo Tài Khoản Mới</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Họ và Tên:</Text>
                <TextInput
                  style={[styles.input, errors.regName && styles.inputError]}
                  value={regName}
                  onChangeText={(val) => {
                    setRegName(val);
                    if (errors.regName) setErrors(prev => ({ ...prev, regName: '' }));
                  }}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  placeholderTextColor="#94A3B8"
                />
                {errors.regName ? <Text style={styles.errorText}>{errors.regName}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Công Ty:</Text>
                <TextInput
                  style={[styles.input, errors.regEmail && styles.inputError]}
                  value={regEmail}
                  onChangeText={(val) => {
                    setRegEmail(val);
                    if (errors.regEmail) setErrors(prev => ({ ...prev, regEmail: '' }));
                  }}
                  placeholder="Ví dụ: nguyenvana@creatorhr.vn"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.regEmail ? <Text style={styles.errorText}>{errors.regEmail}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mật Khẩu Khởi Tạo:</Text>
                <View style={[styles.passwordWrapper, errors.regPassword && styles.inputError]}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
                    value={regPassword}
                    onChangeText={(val) => {
                      setRegPassword(val);
                      if (errors.regPassword) setErrors(prev => ({ ...prev, regPassword: '' }));
                    }}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showRegPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowRegPassword(!showRegPassword)}
                  >
                    {showRegPassword ? <EyeOffIcon color="#64748B" /> : <EyeIcon color="#64748B" />}
                  </TouchableOpacity>
                </View>
                {errors.regPassword ? <Text style={styles.errorText}>{errors.regPassword}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Xác Nhận Mật Khẩu:</Text>
                <View style={[styles.passwordWrapper, errors.regConfirmPassword && styles.inputError]}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
                    value={regConfirmPassword}
                    onChangeText={(val) => {
                      setRegConfirmPassword(val);
                      if (errors.regConfirmPassword) setErrors(prev => ({ ...prev, regConfirmPassword: '' }));
                    }}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showRegConfirmPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  >
                    {showRegConfirmPassword ? <EyeOffIcon color="#64748B" /> : <EyeIcon color="#64748B" />}
                  </TouchableOpacity>
                </View>
                {errors.regConfirmPassword ? <Text style={styles.errorText}>{errors.regConfirmPassword}</Text> : null}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.btnDisabled]}
                onPress={handleRegisterSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Tạo Tài Khoản Mới</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchModeRow}
                onPress={() => setActiveMode('LOGIN')}
              >
                <Text style={styles.switchModeText}>
                  Bạn đã có tài khoản? <Text style={styles.switchModeHighlight}>Đăng nhập ngay</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Social OAuth Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Hoặc Đăng Nhập Với</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google OAuth Button */}
          <TouchableOpacity style={styles.googleOAuthBtn} onPress={handleGoogleOAuth}>
            <GoogleIcon />
            <Text style={styles.googleOAuthText}>Đăng nhập với Google</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  appName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
  },
  appTagline: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  authCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#DC2626',
    fontWeight: '900',
  },
  formContainer: {
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  formSubTitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '700',
    marginTop: 4,
    paddingLeft: 2,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 6,
  },
  submitBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  googleOAuthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  googleOAuthText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  switchModeRow: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },
  switchModeText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  switchModeHighlight: {
    color: '#DC2626',
    fontWeight: '800',
  },
});
