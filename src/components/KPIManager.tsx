import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Activity, Calendar, Award, ChevronLeft, ChevronRight, Edit3, Check, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface KPIManagerProps {
  currentUser: User;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export const KPIManager: React.FC<KPIManagerProps> = ({ currentUser, users, setUsers }) => {
  const currentDate = new Date();
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  const [editDays, setEditDays] = useState<number | ''>(0);
  const [editKpi, setEditKpi] = useState<number | ''>(0);
  const [editNote, setEditNote] = useState('');

  const monthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const startEdit = (user: User) => {
    setEditingUserId(user.id);
    const record = user.kpiRecords?.[monthKey];
    setEditDays(record?.daysWorked ?? '');
    setEditKpi(record?.kpiScore ?? '');
    setEditNote(record?.note || '');
  };

  const saveEdit = async (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    
    const updatedKpiRecords = {
      ...userToUpdate.kpiRecords,
      [monthKey]: {
        daysWorked: Number(editDays) || 0,
        kpiScore: Number(editKpi) || 0,
        note: editNote
      }
    };
    
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kpiRecords: updatedKpiRecords })
      });
      if (res.ok) {
        const updatedUsers = users.map(u => u.id === userId ? { ...u, kpiRecords: updatedKpiRecords } : u);
        setUsers(updatedUsers);
        setEditingUserId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const displayUsers = currentUser.role === 'employee' ? [currentUser] : users;

  // Data for chart
  const chartData = displayUsers.map(u => ({
    name: u.name,
    kpi: u.kpiRecords?.[monthKey]?.kpiScore || 0
  })).sort((a, b) => b.kpi - a.kpi);

  const topPerformers = chartData.slice(0, 3).filter(u => u.kpi > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Activity size={20} className="text-indigo-600" />
            <span>Đánh giá nhân viên</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý ngày làm việc và đánh giá KPI hàng tháng.
          </p>
        </div>
        <div className="flex items-center space-x-4 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
            <ChevronLeft size={16} />
          </button>
          <div className="text-sm font-bold text-slate-700 min-w-[100px] text-center">
            Tháng {currentMonth}/{currentYear}
          </div>
          <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Chart and Top Performers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Biểu đồ đánh giá KPI</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="kpi" name="Điểm KPI" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <Award className="text-amber-500" size={20} />
            <span>Top nhân viên xuất sắc</span>
          </h3>
          <div className="space-y-4 flex-1">
            {topPerformers.length > 0 ? (
              topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-amber-100 text-amber-700' : 
                      index === 1 ? 'bg-slate-200 text-slate-700' : 
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-semibold text-slate-700">{performer.name}</span>
                  </div>
                  <span className="font-bold text-emerald-600">{performer.kpi}đ</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500 flex items-center justify-center h-full">Chưa có dữ liệu đánh giá tháng này</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-700">Nhân viên</th>
              <th className="px-6 py-4 font-semibold text-slate-700 text-center">Số ngày làm việc</th>
              <th className="px-6 py-4 font-semibold text-slate-700 text-center">Điểm KPI (0-100)</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Đánh giá / Ghi chú</th>
              {currentUser.role !== 'employee' && (
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Thao tác</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayUsers.map(user => {
              const record = user.kpiRecords?.[monthKey] || { daysWorked: 0, kpiScore: 0, note: '' };
              const isEditing = editingUserId === user.id;

              return (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.position || user.department}</div>
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    {isEditing ? (
                      <input 
                        type="number" 
                        value={editDays} 
                        onChange={e => setEditDays(e.target.value === '' ? '' : Number(e.target.value))} 
                        className="w-20 px-2 py-1 text-center border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ) : (
                      <span className="font-medium text-slate-700">{record.daysWorked} ngày</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-center">
                    {isEditing ? (
                      <input 
                        type="number" 
                        value={editKpi} 
                        onChange={e => setEditKpi(e.target.value === '' ? '' : Number(e.target.value))} 
                        className="w-20 px-2 py-1 text-center border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ) : (
                      <span className={`font-bold ${record.kpiScore >= 80 ? 'text-emerald-600' : record.kpiScore >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {record.kpiScore}
                      </span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editNote} 
                        onChange={e => setEditNote(e.target.value)}
                        placeholder="Nhập đánh giá..."
                        className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="text-slate-500 text-xs">{record.note || '-'}</span>
                    )}
                  </td>
                  
                  {currentUser.role !== 'employee' && (
                    <td className="px-6 py-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => saveEdit(user.id)} className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded transition-colors">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingUserId(null)} className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded transition-colors">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(user)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Chỉnh sửa đánh giá">
                          <Edit3 size={16} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
