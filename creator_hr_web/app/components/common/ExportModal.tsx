import React from 'react';
import { Download, Printer, FileText, FileSpreadsheet, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  filename: string;
  data: any[];
}

export function ExportModal({ isOpen, onClose, title, filename, data }: ExportModalProps) {
  const [downloaded, setDownloaded] = React.useState(false);

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(val => `"${val}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Xuất báo cáo: ${title}`}>
      <div className="space-y-6 py-2">
        <p className="text-sm text-gray-600">
          Chọn định dạng tập tin cần kết xuất cho dữ liệu bao gồm <strong className="text-gray-900">{data.length} bản ghi</strong>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-primary-100 hover:border-primary-500 bg-primary-50/50 hover:bg-primary-50 text-left transition-all group"
          >
            <div className="p-3 bg-primary-500 text-white rounded-xl group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">Tập tin Excel (.CSV)</div>
              <div className="text-xs text-gray-500 mt-0.5">Tải file tương thích Microsoft Excel, Google Sheets</div>
            </div>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-gray-400 bg-gray-50/50 hover:bg-gray-100 text-left transition-all group"
          >
            <div className="p-3 bg-gray-800 text-white rounded-xl group-hover:scale-105 transition-transform">
              <Printer className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">In / Tải PDF (.PDF)</div>
              <div className="text-xs text-gray-500 mt-0.5">Xuất file văn bản in ấn chính thức của công ty</div>
            </div>
          </button>
        </div>

        {downloaded && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
            <Check className="h-4 w-4 text-emerald-600" />
            Đã kết xuất và tải xuống tập tin thành công!
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </Modal>
  );
}
