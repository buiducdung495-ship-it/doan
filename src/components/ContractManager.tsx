import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { FileSignature, Plus, FileEdit, Trash2, Search, FileText, Printer } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { printDocument } from '../utils/printDocument';

interface Contract {
  id: string;
  code: string;
  partnerName: string;
  value: number;
  status: 'draft' | 'pending' | 'signed' | 'expired' | 'canceled';
  salespersonId: string;
  createdAt: string;
}

interface ContractManagerProps {
  currentUser: User;
  users: User[];
}

export const ContractManager: React.FC<ContractManagerProps> = ({ currentUser, users }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState<Partial<Contract>>({});

  useEffect(() => {
    const saved = localStorage.getItem('sio_contracts_v2');
    if (saved) { try { setContracts(JSON.parse(saved)); } catch(e) { console.error(e); } } else { setContracts([]); }
  }, [currentUser.id]);

  const saveContracts = (newContracts: Contract[]) => {
    setContracts(newContracts);
    localStorage.setItem('sio_contracts_v2', JSON.stringify(newContracts));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedContract) {
      const updated = contracts.map(c => c.id === selectedContract.id ? { ...c, ...formData } as Contract : c);
      saveContracts(updated);
    } else {
      const newContract: Contract = {
        id: uuidv4(),
        code: formData.code || `HD-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        partnerName: formData.partnerName || '',
        value: Number(formData.value) || 0,
        status: formData.status || 'draft',
        salespersonId: currentUser.id,
        createdAt: new Date().toISOString()
      };
      saveContracts([newContract, ...contracts]);
    }
    setIsAdding(false);
    setSelectedContract(null);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa hợp đồng này?')) {
      saveContracts(contracts.filter(c => c.id !== id));
    }
  };

  const getUserName = (id: string) => {
    return users.find(u => u.id === id)?.name || id;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed': return 'bg-emerald-100 text-emerald-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'expired': return 'bg-rose-100 text-rose-700';
      case 'canceled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'signed': return 'Đã ký';
      case 'pending': return 'Chờ duyệt/Ký';
      case 'draft': return 'Bản nháp';
      case 'expired': return 'Hết hạn';
      case 'canceled': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FileSignature className="text-indigo-600" /> Quản lý Hợp đồng Sale
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Theo dõi và quản lý vòng đời hợp đồng kinh doanh</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setSelectedContract(null); setFormData({}); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span>Tạo Hợp đồng mới</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Mã HĐ</th>
                <th className="px-4 py-3 font-semibold">Đối tác / Khách hàng</th>
                <th className="px-4 py-3 font-semibold text-right">Giá trị (VNĐ)</th>
                <th className="px-4 py-3 font-semibold">Phụ trách (Sale)</th>
                <th className="px-4 py-3 font-semibold text-center">Trạng thái</th>
                <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contracts.map(contract => (
                <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-700">
                    {contract.code}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {contract.partnerName}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-indigo-600">
                    {contract.value.toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    {getUserName(contract.salespersonId)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(contract.status)}`}>
                      {getStatusText(contract.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => {
                          const contentHtml = `
                            <p><strong>Mã hợp đồng:</strong> ${contract.code}</p>
                            <p><strong>Bên B (Khách hàng/Đối tác):</strong> ${contract.partnerName}</p>
                            <p><strong>Giá trị:</strong> ${contract.value.toLocaleString('vi-VN')} đ</p>
                            <p><strong>Ngày bắt đầu:</strong> ${contract.startDate}</p>
                            <p><strong>Ngày kết thúc:</strong> ${contract.endDate}</p>
                            <p><strong>Ghi chú:</strong> ${contract.notes}</p>
                          `;
                          printDocument(`Hợp đồng ${contract.code}`, contentHtml, currentUser);
                        }} 
                        className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer" 
                        title="In văn bản"
                      >
                        <Printer size={16} />
                      </button>
                      <button onClick={() => { setSelectedContract(contract); setFormData(contract); setIsAdding(true); }} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer" title="Sửa">
                        <FileEdit size={16} />
                      </button>
                      <button onClick={() => handleDelete(contract.id)} className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer" title="Xóa">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {contracts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    Chưa có hợp đồng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(isAdding) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">
                {selectedContract ? 'Cập nhật Hợp đồng' : 'Tạo Hợp đồng mới'}
              </h3>
              <button onClick={() => { setIsAdding(false); setSelectedContract(null); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">×</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="contract-form" onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mã hợp đồng (Tự động sinh nếu để trống)</label>
                  <input type="text" value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none font-mono uppercase" placeholder="HD-..." />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tên đối tác / Khách hàng</label>
                  <input type="text" value={formData.partnerName || ''} onChange={e => setFormData({...formData, partnerName: e.target.value})} className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Giá trị hợp đồng (VNĐ)</label>
                  <input type="number" value={formData.value || ''} onChange={e => setFormData({...formData, value: Number(e.target.value)})} className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none font-mono" required min="0" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Trạng thái</label>
                  <select value={formData.status || 'draft'} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none">
                    <option value="draft">Bản nháp</option>
                    <option value="pending">Chờ duyệt / Ký</option>
                    <option value="signed">Đã ký</option>
                    <option value="expired">Hết hạn</option>
                    <option value="canceled">Đã hủy</option>
                  </select>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
              <button type="button" onClick={() => { setIsAdding(false); setSelectedContract(null); }} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">Hủy</button>
              <button type="submit" form="contract-form" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer">
                Lưu Hợp đồng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
