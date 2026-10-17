import React, { useState, useEffect } from 'react';
import { SharedCategory } from '../types';
import { Settings, Plus, Edit, Trash2 } from 'lucide-react';

export const SharedCategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<SharedCategory[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCat, setSelectedCat] = useState<SharedCategory | null>(null);
  const [formData, setFormData] = useState<Partial<SharedCategory>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/shared-categories');
      const text_data = await res.text(); let data: any = {}; if (text_data) { try { data = JSON.parse(text_data); } catch(e) { console.error("JSON parse error:", text_data); data = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng." }; } }
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isAdding) {
        await fetch('/api/shared-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            isActive: formData.isActive !== undefined ? formData.isActive : true
          })
        });
      } else if (selectedCat) {
        await fetch(`/api/shared-categories/${selectedCat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      setIsAdding(false);
      setSelectedCat(null);
      setFormData({});
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa danh mục này?')) return;
    try {
      await fetch(`/api/shared-categories/${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'document_type': return 'Loại văn bản';
      case 'urgency_level': return 'Độ khẩn';
      case 'confidentiality_level': return 'Độ mật';
      case 'department': return 'Phòng ban';
      default: return type;
    }
  };

  // Group categories by type
  const groupedCategories = categories.reduce((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = [];
    acc[cat.type].push(cat);
    return acc;
  }, {} as Record<string, SharedCategory[]>);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Settings size={20} className="text-indigo-600" />
            <span>Danh mục Dùng chung</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Cấu hình tham số, loại văn bản, độ mật, phòng ban...</p>
        </div>
        <button
          onClick={() => { setIsAdding(true); setSelectedCat(null); setFormData({ type: 'document_type', isActive: true }); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors"
        >
          <Plus size={16} />
          <span>Thêm Danh mục</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(Object.entries(groupedCategories) as [string, SharedCategory[]][]).map(([type, cats]) => (
          <div key={type} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-slate-700 text-sm mb-4 border-b border-slate-100 pb-2">{getTypeLabel(type)}</h3>
            <div className="space-y-2">
              {cats.map(cat => (
                <div key={cat.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg group transition-colors">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-800 text-xs">{cat.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1 rounded">{cat.code}</span>
                      {!cat.isActive && <span className="text-[9px] text-rose-500 bg-rose-50 px-1 rounded border border-rose-100">Vô hiệu</span>}
                    </div>
                    {cat.description && <div className="text-[10px] text-slate-500 mt-0.5">{cat.description}</div>}
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setSelectedCat(cat); setFormData(cat); }} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            Chưa có danh mục nào được cấu hình.
          </div>
        )}
      </div>

      {(isAdding || selectedCat) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">
                {isAdding ? 'Thêm Danh mục' : 'Sửa Danh mục'}
              </h3>
              <button onClick={() => { setIsAdding(false); setSelectedCat(null); }} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            
            <div className="p-6">
              <form id="cat-form" onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Loại danh mục</label>
                  <select value={formData.type || 'document_type'} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none">
                    <option value="document_type">Loại văn bản</option>
                    <option value="urgency_level">Độ khẩn</option>
                    <option value="confidentiality_level">Độ mật</option>
                    <option value="department">Phòng ban</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mã (Code)</label>
                    <input type="text" value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none font-mono" required placeholder="VD: QD" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tên hiển thị</label>
                    <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none" required placeholder="VD: Quyết định" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mô tả thêm (Tùy chọn)</label>
                  <input type="text" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none" />
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="cat-active" checked={formData.isActive !== false} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="cat-active" className="text-xs text-slate-700 font-semibold cursor-pointer">Kích hoạt (Đang sử dụng)</label>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
              <button onClick={() => { setIsAdding(false); setSelectedCat(null); }} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors">Hủy</button>
              <button type="submit" form="cat-form" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
                Lưu Danh mục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
