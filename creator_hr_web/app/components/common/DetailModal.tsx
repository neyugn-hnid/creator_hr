import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Record<string, { label: string; value: React.ReactNode }>;
}

export function DetailModal({ isOpen, onClose, title, data }: DetailModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-5 pt-2">
        {/* Detail Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {Object.entries(data).map(([key, item]) => (
            <div 
              key={key} 
              className="group p-3.5 bg-gradient-to-br from-gray-50/80 to-white rounded-2xl border border-gray-100/90 shadow-sm hover:border-primary-200 hover:shadow-md transition-all duration-200"
            >
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-500/60 group-hover:bg-primary-600 transition-colors" />
                {item.label}
              </div>
              <div className="text-sm font-bold text-gray-900 break-words">
                {item.value ?? <span className="text-gray-400 font-normal italic">Chưa cập nhật</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-3 border-t border-gray-100">
          <Button 
            onClick={onClose}
            className="bg-gray-900 hover:bg-black text-white font-bold px-6 py-2 rounded-xl shadow-sm transition-all active:scale-[0.98] text-xs sm:text-sm"
          >
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
