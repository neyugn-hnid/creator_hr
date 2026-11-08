import React, { useState } from 'react';
import { Clock, Check, X, Sparkles } from 'lucide-react';

interface CustomTimePickerProps {
  label: string;
  name: string;
  defaultValue?: string; // Format: "08:30"
  onChange?: (value: string) => void;
}

export function CustomTimePicker({ label, name, defaultValue = '08:30', onChange }: CustomTimePickerProps) {
  const parts = (defaultValue || '08:30').split(':');
  const [selectedHour, setSelectedHour] = useState(parts[0] || '08');
  const [selectedMinute, setSelectedMinute] = useState(parts[1] || '30');
  const [isOpen, setIsOpen] = useState(false);

  // Temporary state inside modal before clicking Confirm
  const [tempHour, setTempHour] = useState(selectedHour);
  const [tempMinute, setTempMinute] = useState(selectedMinute);
  const [activeTab, setActiveTab] = useState<'HOUR' | 'MINUTE'>('HOUR');

  const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minuteOptions = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

  const presets = [
    { label: '08:00 - Đầu ca', h: '08', m: '00' },
    { label: '08:30 - Ca chuẩn', h: '08', m: '30' },
    { label: '12:00 - Nghỉ trưa', h: '12', m: '00' },
    { label: '17:30 - Hết ca', h: '17', m: '30' },
    { label: '18:00 - Tăng ca', h: '18', m: '00' },
  ];

  const timeValue = `${selectedHour}:${selectedMinute}`;

  const handleOpen = () => {
    setTempHour(selectedHour);
    setTempMinute(selectedMinute);
    setIsOpen(true);
  };

  const handleConfirm = () => {
    setSelectedHour(tempHour);
    setSelectedMinute(tempMinute);
    const newTime = `${tempHour}:${tempMinute}`;
    if (onChange) onChange(newTime);
    setIsOpen(false);
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-700">{label}</label>
      <input type="hidden" name={name} value={timeValue} />

      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl shadow-sm hover:border-primary-300 hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-primary-600 group-hover:text-white transition-colors">
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-left">
            <div className="text-sm font-black text-gray-900 font-mono tracking-wider">{timeValue}</div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">Nhấn để đổi giờ</div>
          </div>
        </div>
        <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-100 group-hover:bg-primary-600 group-hover:text-white transition-colors">
          Chọn giờ phút
        </span>
      </button>

      {/* Interactive Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-100 shadow-2xl overflow-hidden space-y-4 p-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-600" />
                <h3 className="font-bold text-gray-900 text-sm">Bộ chọn Thời gian Chuẩn</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Display Selected Preview */}
            <div className="bg-gradient-to-r from-blue-50 to-primary-50 p-4 rounded-xl text-center border border-blue-100">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Thời gian đã chọn</div>
              <div className="text-3xl font-black text-primary-700 font-mono tracking-widest">
                {tempHour} : {tempMinute}
              </div>
            </div>

            {/* Presets Bar */}
            <div>
              <div className="text-[11px] font-bold text-gray-500 mb-1.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span>Khung giờ nhanh:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setTempHour(p.h);
                      setTempMinute(p.m);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                      tempHour === p.h && tempMinute === p.m
                        ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs Selector */}
            <div className="flex bg-gray-100 p-1 rounded-xl gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('HOUR')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeTab === 'HOUR' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Chọn Giờ ({tempHour}h)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MINUTE')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeTab === 'MINUTE' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Chọn Phút ({tempMinute}p)
              </button>
            </div>

            {/* Grid Options */}
            {activeTab === 'HOUR' ? (
              <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1 border border-gray-100 rounded-xl">
                {hourOptions.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      setTempHour(h);
                      setActiveTab('MINUTE');
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                      tempHour === h
                        ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                        : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 border border-gray-100 rounded-xl">
                {minuteOptions.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTempMinute(m)}
                    className={`py-2.5 rounded-lg text-xs font-bold transition-all border ${
                      tempMinute === m
                        ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                        : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {m} phút
                  </button>
                ))}
              </div>
            )}

            {/* Action Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                Xác nhận {tempHour}:{tempMinute}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
