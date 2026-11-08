import React, { useState } from 'react';
import { Form, useNavigation } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/Card';
import { Input } from '~/components/ui/Input';
import { Button } from '~/components/ui/Button';
import { CustomTimePicker } from '~/components/ui/CustomTimePicker';
import { Save, Wifi, Clock, DollarSign, MapPin, Navigation } from 'lucide-react';

interface AppSettings {
  latePenalty: number;
  forgetCheckOutPenalty: number;
  companyWifiSsid: string;
  companyIp: string;
  companyLat?: string;
  companyLng?: string;
  maxDistanceMeters?: number;
  workStartTime: string;
  workEndTime: string;
}

interface Props {
  loaderData: { settings: AppSettings };
  currentUser: any;
}

export function Settings({ loaderData }: Props) {
  const { settings } = loaderData;
  const navigation = useNavigation();
  const isSaving = navigation.state === 'submitting';

  const [lat, setLat] = useState(settings.companyLat || '10.776889');
  const [lng, setLng] = useState(settings.companyLng || '106.700806');
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  const [ipVal, setIpVal] = useState(settings.companyIp || '192.168.1.1');
  const [ipStatus, setIpStatus] = useState<string | null>(null);

  React.useEffect(() => {
    if (settings.companyLat) setLat(settings.companyLat);
    if (settings.companyLng) setLng(settings.companyLng);
    if (settings.companyIp) setIpVal(settings.companyIp);
  }, [settings]);

  const handleScanCurrentIp = async () => {
    setIpStatus('Đang tự động quét IP WAN...');
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      if (data.ip) {
        setIpVal(data.ip);
        setIpStatus(`Đã tự động phát hiện IP WAN mạng công ty hiện tại: ${data.ip}`);
      }
    } catch {
      setIpStatus('Không thể tự quét IP WAN. Vui lòng nhập thủ công.');
    }
  };

  const handleFetchCurrentGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Trình duyệt không hỗ trợ GPS.');
      return;
    }
    setGpsStatus('Đang lấy vị trí GPS hiện tại...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGpsStatus(`Đã lấy vị trí GPS: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
      },
      (err) => {
        setGpsStatus(`Lỗi lấy GPS: ${err.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Cài đặt Tham số Hệ thống</h2>
        <p className="text-xs text-gray-500 mt-1">Cấu hình địa chỉ IP, tên WiFi nội bộ, Tọa độ GPS Văn phòng và quy định thưởng/phạt.</p>
      </div>

      <Form method="post" className="space-y-6">
        {/* WiFi & IP Config */}
        <Card className="border-gray-100">
          <CardHeader className="border-b border-gray-100 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Wifi className="h-4 w-4 text-emerald-600" />
              <span>1. Cấu hình Mạng WiFi & IP Nội bộ</span>
            </CardTitle>
            <Button
              type="button"
              onClick={handleScanCurrentIp}
              variant="outline"
              className="text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl py-1 px-3"
            >
              <Navigation className="mr-1.5 h-3.5 w-3.5" />
              Tự quét IP hiện tại
            </Button>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Tên WiFi công ty yêu cầu (SSID)"
                name="companyWifiSsid"
                required
                defaultValue={settings.companyWifiSsid}
              />
              <Input
                label="Địa chỉ IP Tĩnh cổng WiFi (IP WAN)"
                name="companyIp"
                required
                value={ipVal}
                onChange={(e) => setIpVal(e.target.value)}
              />
            </div>
            {ipStatus && (
              <p className={`text-xs font-bold ${ipStatus.startsWith('✅') ? 'text-emerald-700' : 'text-rose-700'}`}>
                {ipStatus}
              </p>
            )}
          </CardContent>
        </Card>

        {/* GPS Location Config */}
        <Card className="border-gray-100">
          <CardHeader className="border-b border-gray-100 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-rose-600" />
              <span>2. Cấu hình Tọa độ GPS Văn phòng Trực tiếp</span>
            </CardTitle>
            <Button
              type="button"
              onClick={handleFetchCurrentGps}
              variant="outline"
              className="text-xs border-rose-200 text-rose-700 hover:bg-rose-50 font-bold rounded-xl py-1 px-3"
            >
              <Navigation className="mr-1.5 h-3.5 w-3.5" />
              Lấy vị trí hiện tại
            </Button>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Vĩ độ Văn phòng (Latitude)"
                name="companyLat"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
              <Input
                label="Kinh độ Văn phòng (Longitude)"
                name="companyLng"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
              <Input
                label="Bán kính cho phép (Mét)"
                type="number"
                name="maxDistanceMeters"
                required
                defaultValue={settings.maxDistanceMeters || 100}
              />
            </div>

            {gpsStatus && (
              <p className={`text-xs font-bold ${gpsStatus.startsWith('') ? 'text-emerald-700' : 'text-rose-700'}`}>
                {gpsStatus}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Work Time Config */}
        <Card className="border-gray-100">
          <CardHeader className="border-b border-gray-100 pb-3">
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>3. Khung giờ Làm việc Chuẩn</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomTimePicker
                label="Giờ bắt đầu làm việc"
                name="workStartTime"
                defaultValue={settings?.workStartTime || '08:30'}
              />
              <CustomTimePicker
                label="Giờ kết thúc ca làm"
                name="workEndTime"
                defaultValue={settings?.workEndTime || '17:30'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Penalty Config */}
        <Card className="border-gray-100">
          <CardHeader className="border-b border-gray-100 pb-3">
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-600" />
              <span>4. Tham số Đơn giá Thưởng & Phạt Tự động</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Mức phạt Tự động: Đi muộn không báo trước (VNĐ)"
                type="number"
                step="10000"
                name="latePenalty"
                required
                defaultValue={settings.latePenalty}
              />
              <Input
                label="Mức phạt Tự động: Quên Check Out (VNĐ)"
                type="number"
                step="10000"
                name="forgetCheckOutPenalty"
                required
                defaultValue={settings.forgetCheckOutPenalty}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl px-8 shadow-sm"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Đang lưu...' : 'Lưu tất cả Cài đặt'}
          </Button>
        </div>
      </Form>
    </div>
  );
}
