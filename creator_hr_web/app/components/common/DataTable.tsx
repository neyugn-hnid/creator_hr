import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  RotateCcw, 
  Eye, 
  Edit, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  Archive,
  ListFilter,
  ChevronDown,
  Check
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface Column<T> {
  key: string;
  header: string;
  accessor?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T extends { id: string; isDeleted?: boolean }> {
  data: T[];
  columns: Column<T>[];
  searchKey?: (item: T) => string;
  searchPlaceholder?: string;
  filterOptions?: {
    label: string;
    key: keyof T;
    options: { label: string; value: string }[];
  }[];
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onSoftDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  customActions?: (item: T) => React.ReactNode;
  primaryAction?: React.ReactNode;
  hideTrashToggle?: boolean;
  emptyText?: string;
}

export function DataTable<T extends { id: string; isDeleted?: boolean }>({
  data,
  columns,
  searchKey,
  searchPlaceholder = 'Tìm kiếm dữ liệu...',
  filterOptions = [],
  onView,
  onEdit,
  onSoftDelete,
  onRestore,
  customActions,
  primaryAction,
  hideTrashToggle = false,
  emptyText = 'Không tìm thấy dữ liệu nào'
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter by search & selected filters
  const filteredData = useMemo(() => {
    return data.filter(item => !item.isDeleted).filter(item => {
      // Search
      if (searchTerm && searchKey) {
        const value = searchKey(item).toLowerCase();
        if (!value.includes(searchTerm.toLowerCase())) {
          return false;
        }
      }

      // Dropdown Filters
      for (const [key, val] of Object.entries(filters)) {
        if (val && val !== 'ALL') {
          const itemVal = String(item[key as keyof T] ?? '');
          if (itemVal !== val) return false;
        }
      }

      return true;
    });
  }, [data, searchTerm, searchKey, filters]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    const col = columns.find(c => c.key === sortColumn);
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      let valA: any = a[sortColumn as keyof T];
      let valB: any = b[sortColumn as keyof T];

      if (col.accessor) {
        // Fallback string conversion for JSX accessor if needed
        valA = String(valA ?? '');
        valB = String(valB ?? '');
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      valA = String(valA ?? '').toLowerCase();
      valB = String(valB ?? '').toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection, columns]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortColumn === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(key);
      setSortDirection('asc');
    }
  };

  const trashCount = useMemo(() => {
    return data.filter(item => Boolean(item.isDeleted)).length;
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        {/* Search */}
        <div className="flex items-center gap-3 flex-1">
          {searchKey && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
              />
            </div>
          )}

          {/* Custom Sort Dropdown */}
          {columns.some(c => c.sortable) && (
            <div className="relative" ref={sortRef}>
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-all ${
                  sortColumn
                    ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-gray-500" />
                <span>
                  {sortColumn
                    ? `${columns.find(c => c.key === sortColumn)?.header}: ${sortDirection === 'desc' ? 'Giảm dần ↓' : 'Tăng dần ↑'}`
                    : 'Sắp xếp'}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSortOpen && (
                <div className="absolute left-0 mt-1.5 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 p-1.5 space-y-0.5 animate-in fade-in-80 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Tùy chọn sắp xếp
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSortColumn(null);
                      setSortDirection('asc');
                      setIsSortOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                      !sortColumn ? 'bg-rose-50 text-rose-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>Mặc định</span>
                    {!sortColumn && <Check className="h-3.5 w-3.5 text-rose-600" />}
                  </button>

                  <div className="h-px bg-gray-100 my-1" />

                  {columns.filter(c => c.sortable).flatMap(col => [
                    { key: col.key, dir: 'desc' as const, label: `${col.header} (Giảm dần ↓)` },
                    { key: col.key, dir: 'asc' as const, label: `${col.header} (Tăng dần ↑)` },
                  ]).map((item) => {
                    const isSelected = sortColumn === item.key && sortDirection === item.dir;
                    return (
                      <button
                        key={`${item.key}:${item.dir}`}
                        type="button"
                        onClick={() => {
                          setSortColumn(item.key);
                          setSortDirection(item.dir);
                          setIsSortOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
                          isSelected ? 'bg-rose-50 text-rose-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{item.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-rose-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Filters */}
          {filterOptions.map((f) => (
            <div key={String(f.key)} className="relative min-w-[140px]">
              <select
                value={filters[String(f.key)] || 'ALL'}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, [String(f.key)]: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ALL">Tất cả {f.label}</option>
                {f.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Action Controls */}
        {primaryAction && (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {primaryAction}
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar touch-pan-x">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">STT</th>
                {columns.map(col => (
                  <th
                    key={col.key}
                    className={`py-3.5 px-4 ${col.className || ''}`}
                  >
                    <span>{col.header}</span>
                  </th>
                ))}
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => {
                  const stt = (currentPage - 1) * pageSize + index + 1;
                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-gray-50/60 transition-colors ${
                        item.isDeleted ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-medium text-gray-400 text-xs">{stt}</td>
                      {columns.map(col => (
                        <td key={col.key} className={`py-3.5 px-4 ${col.className || ''}`}>
                          {col.accessor ? col.accessor(item) : String(item[col.key as keyof T] ?? '')}
                        </td>
                      ))}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {customActions && customActions(item)}

                          {/* View Detail */}
                          {onView && (
                            <button
                              onClick={() => onView(item)}
                              className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}

                          {/* Edit (only if not soft deleted) */}
                          {!item.isDeleted && onEdit && (
                            <button
                              onClick={() => onEdit(item)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}

                          {/* Soft Delete */}
                          {!item.isDeleted && onSoftDelete && (
                            <button
                              onClick={() => onSoftDelete(item.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa mềm (chuyển vào thùng rác)"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}

                          {/* Restore */}
                          {item.isDeleted && onRestore && (
                            <button
                              onClick={() => onRestore(item.id)}
                              className="p-1.5 text-amber-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Khôi phục bản ghi"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={columns.length + 2} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ListFilter className="h-8 w-8 text-gray-300 stroke-[1.5]" />
                      <p className="text-sm font-medium">{emptyText}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span>Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-gray-200 rounded-lg px-2 py-1 font-medium focus:outline-none text-gray-700"
            >
              <option value={5}>5 hàng</option>
              <option value={10}>10 hàng</option>
              <option value={20}>20 hàng</option>
              <option value={50}>50 hàng</option>
            </select>
            <span>Tổng số {sortedData.length} kết quả</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">Trang {currentPage} / {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
