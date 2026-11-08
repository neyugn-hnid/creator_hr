import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

interface CustomDatePickerProps {
  label?: string;
  name: string;
  defaultValue?: string; // Format: "YYYY-MM-DD"
  required?: boolean;
  onChange?: (value: string) => void;
}

export function CustomDatePicker({ label, name, defaultValue, required, onChange }: CustomDatePickerProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [dateValue, setDateValue] = useState(defaultValue || todayStr);

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-bold text-gray-700">{label}</label>}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-primary-600 pointer-events-none">
          <Calendar className="h-4 w-4" />
        </div>
        <input
          type="date"
          name={name}
          required={required}
          value={dateValue}
          onChange={(e) => {
            const val = e.target.value;
            setDateValue(val);
            if (onChange) onChange(val);
          }}
          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
        />
      </div>
    </div>
  );
}
