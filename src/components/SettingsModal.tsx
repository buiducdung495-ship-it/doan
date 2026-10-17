import React, { useState } from 'react';
import { Sun, Moon, ArrowUp, ArrowDown, Eye, EyeOff, RotateCcw, Settings } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  menuOrder: string[];
  setMenuOrder: (order: string[]) => void;
  hiddenMenuIds: string[];
  setHiddenMenuIds: (ids: string[]) => void;
  showToast: (msg: string, type: 'success' | 'info') => void;
}

const MASTER_ITEMS = [
  { id: 'dashboard', label: 'Phân tích quy trình' },
  { id: 'tasks', label: 'Dự án & Nhiệm vụ' },
  { id: 'events', label: 'Lịch & Sự kiện' },
  { id: 'requests', label: 'Nghỉ phép & Đơn từ' },
  { id: 'user-management', label: 'Nhân sự & Tài khoản' },
  { id: 'chat', label: 'Tin nhắn & Trò chuyện' },
  { id: 'ocr-manager', label: 'Cổng thông tin & OCR' },
  { id: 'approvals', label: 'Phê duyệt đơn từ' },
  { id: 'form-builder', label: 'Thiết kế biểu mẫu' },
  { id: 'docs-incoming', label: 'Văn bản đến' },
  { id: 'docs-outgoing', label: 'Văn bản đi' },
  { id: 'docs-internal', label: 'Công văn nội bộ' },
  { id: 'audit-logs', label: 'Nhật ký hệ thống' },
  { id: 'shared-categories', label: 'Danh mục dùng chung' }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  theme,
  setTheme,
  menuOrder,
  setMenuOrder,
  hiddenMenuIds,
  setHiddenMenuIds,
  showToast
}) => {
  // Ensure we have a complete list of IDs
  const initialOrder = [...menuOrder];
  MASTER_ITEMS.forEach(m => {
    if (!initialOrder.includes(m.id)) {
      initialOrder.push(m.id);
    }
  });

  const [localTheme, setLocalTheme] = useState<'light' | 'dark'>(theme);
  const [localOrder, setLocalOrder] = useState<string[]>(initialOrder);
  const [localHidden, setLocalHidden] = useState<string[]>(hiddenMenuIds);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...localOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    setLocalOrder(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === localOrder.length - 1) return;
    const newOrder = [...localOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    setLocalOrder(newOrder);
  };

  const handleToggleVisibility = (id: string) => {
    if (localHidden.includes(id)) {
      setLocalHidden(localHidden.filter(h => h !== id));
    } else {
      // Don't allow hiding EVERYTHING
      if (localHidden.length >= MASTER_ITEMS.length - 1) {
        showToast('Không thể ẩn tất cả thanh công cụ!', 'info');
        return;
      }
      setLocalHidden([...localHidden, id]);
    }
  };

  const handleReset = () => {
    const defaultOrder = MASTER_ITEMS.map(m => m.id);
    setLocalTheme('light');
    setLocalOrder(defaultOrder);
    setLocalHidden([]);
    showToast('Đã khôi phục thiết lập giao diện mặc định!', 'info');
  };

  const handleSave = () => {
    setTheme(localTheme);
    localStorage.setItem('jin_theme', localTheme);

    setMenuOrder(localOrder);
    localStorage.setItem('jin_menu_order', JSON.stringify(localOrder));

    setHiddenMenuIds(localHidden);
    localStorage.setItem('jin_hidden_menu_ids', JSON.stringify(localHidden));

    showToast('Cập nhật cài đặt giao diện thành công!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-[#0c1a30]/40 backdrop-blur-md" onClick={onClose} />
      
      {/* Main dialog box */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-xl z-10 overflow-hidden relative animate-scale-up font-sans text-slate-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center space-x-2">
            <Settings size={18} className="text-[#2f80ed] animate-spin-slow" />
            <h3 className="font-extrabold text-[#0a2e24] text-sm tracking-tight">
              CÀI ĐẶT GIAO DIỆN & THANH CÔNG CỤ
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal content body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Section 1: Light/Dark Theme Adjustment */}
          <div className="space-y-3">
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              1. Điều chỉnh Background (Sáng / Tối)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setLocalTheme('light')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                  localTheme === 'light'
                    ? 'border-[#2f80ed] bg-blue-50/50 text-[#2f80ed] ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Sun size={20} className={localTheme === 'light' ? 'text-amber-500' : 'text-slate-400'} />
                <span className="text-xs font-bold">Giao diện Sáng (Default)</span>
              </button>

              <button
                onClick={() => setLocalTheme('dark')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                  localTheme === 'dark'
                    ? 'border-[#2f80ed] bg-slate-800 text-white ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Moon size={20} className={localTheme === 'dark' ? 'text-yellow-400' : 'text-slate-400'} />
                <span className="text-xs font-bold">Giao diện Tối (Sleek Dark)</span>
              </button>
            </div>
          </div>

          {/* Section 2: Toolbar Customizer (Menu Sắp xếp) */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                2. Sắp xếp & Ẩn/Hiện Thanh công cụ
              </label>
              <button
                type="button"
                onClick={handleReset}
                className="text-[10px] font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 hover:bg-slate-50 px-2 py-1 rounded-lg transition-all"
              >
                <RotateCcw size={10} />
                <span>Đặt lại mặc định</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-400">
              Sử dụng các nút mũi tên để thay đổi thứ tự hiển thị của các chức năng trong thanh Menu. Tích chọn biểu tượng mắt để ẩn hoặc hiện mục đó.
            </p>

            <div className="border border-slate-100 rounded-xl divide-y divide-slate-50 max-h-64 overflow-y-auto bg-slate-50/30 p-1 space-y-1">
              {localOrder.map((id, index) => {
                const item = MASTER_ITEMS.find(m => m.id === id);
                if (!item) return null;
                const isHidden = localHidden.includes(id);

                return (
                  <div 
                    key={id} 
                    className={`flex items-center justify-between p-2 rounded-lg text-xs font-semibold bg-white border border-slate-100 transition-all ${
                      isHidden ? 'opacity-50 bg-slate-50' : 'hover:border-blue-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] font-mono text-slate-300 w-5">#{index + 1}</span>
                      <span className="text-slate-700 font-bold">{item.label}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className={`p-1 rounded-md transition-all ${
                          index === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                        title="Di chuyển lên"
                      >
                        <ArrowUp size={13} />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === localOrder.length - 1}
                        className={`p-1 rounded-md transition-all ${
                          index === localOrder.length - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                        title="Di chuyển xuống"
                      >
                        <ArrowDown size={13} />
                      </button>

                      <div className="h-4 w-px bg-slate-100 mx-1" />

                      {/* Toggle Visibility */}
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(id)}
                        className={`p-1 rounded-md transition-all ${
                          isHidden 
                            ? 'text-rose-400 hover:bg-rose-50' 
                            : 'text-emerald-500 hover:bg-emerald-50'
                        }`}
                        title={isHidden ? "Hiển thị mục này" : "Ẩn mục này"}
                      >
                        {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end space-x-3 p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-500 transition-all cursor-pointer"
          >
            Hủy
          </button>
          <button 
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-[#2f80ed] hover:bg-[#1c71dd] text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
          >
            Lưu cài đặt
          </button>
        </div>

      </div>
    </div>
  );
};
