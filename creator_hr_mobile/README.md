# Creator HR Mobile App (React Native & Expo)

Ứng dụng Di động Chấm công GPS & Quản lý Lương Nhân sự cho Creator HR.

## 📱 Các tính năng chính:
- **Đăng nhập Email & Lưu phiên tự động** (`AsyncStorage`).
- **Chấm công GPS Trực tiếp (`expo-location`)**: Tự động xin quyền và lấy tọa độ vị trí thực tế của điện thoại.
- **Xác thực Mạng WiFi Công ty**: Tự động kiểm tra mạng WiFi kết nối.
- **Xem Lịch sử Chấm công 30 Ngày**: Cập nhật trạng thái Đúng giờ / Đi muộn.
- **Bảng Lương & Thưởng View YouTube**: Xem chi tiết tổng số giờ làm, lương giờ, thưởng view YouTube và khấu trừ phạt.
- **Hồ sơ Cá nhân & Đăng xuất**.

---

## 🚀 Hướng dẫn Chạy & Tạo file APK Android:

### 1. Cài đặt các gói phụ thuộc (Dependencies):
```bash
cd "c:\Users\VanDinh\OneDrive\Máy tính\creator_hr_mobile"
npm install
```

### 2. Chạy ứng dụng trên máy ảo hoặc thiết bị thật (Expo Go):
```bash
npx expo start
```
*Quét mã QR bằng ứng dụng Expo Go trên điện thoại Android hoặc iPhone để dùng thử ngay.*

### 3. Tạo file cài đặt APK Android (.apk):
```bash
npx eas-cli build --platform android --profile preview
```
*Hệ thống Expo EAS sẽ tự động đóng gói ứng dụng thành file `app-release.apk` để tải về cài trực tiếp vào điện thoại.*
