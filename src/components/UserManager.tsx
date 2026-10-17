import React, { useState } from 'react';
import { User } from '../types';
import { 
  Users, UserPlus, Pencil, Trash2, Key, Shield, LogIn, 
  Filter, MoreVertical, ChevronLeft, ChevronRight, Check, Search, X 
} from 'lucide-react';

interface UserManagerProps {
  users: User[];
  currentUser: User;
  onUserUpdate: () => void;
  onUserChange?: (newUser: User) => void;
}

export const UserManager: React.FC<UserManagerProps> = ({ 
  users, 
  currentUser, 
  onUserUpdate,
  onUserChange 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'status'>('list');
  const [isEditing, setIsEditing] = useState<User | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<User>>({});
  const [errorMsg, setErrorMsg] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const departments = ['Tech', 'HR', 'Finance', 'Sales', 'Admin'];
  const roles = ['admin', 'manager', 'employee'];
  const levels = ['Sơ cấp', 'Trung cấp', 'Cao cấp'];
  const genders = ['Nam', 'Nữ'];

  const handleEdit = (user: User) => {
    setIsEditing(user);
    setFormData(user);
    setIsAdding(false);
    setErrorMsg('');
    setActiveMenuUserId(null);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setIsEditing(null);
    setFormData({
      id: `emp-${Math.floor(Math.random() * 10000)}`,
      role: 'employee',
      department: 'Tech',
      gender: 'Nam',
      birthday: '1995-05-12',
      age: 28,
      position: 'UI/UX Designer',
      level: 'Trung cấp',
      salary: 15000000
    });
    setErrorMsg('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Xóa thất bại');
      onUserUpdate();
      setActiveMenuUserId(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isAdding) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) {
          const text_data = await res.text(); let data: any = {}; if (text_data) { try { data = JSON.parse(text_data); } catch(e) { console.error("JSON parse error:", text_data); data = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng." }; } }
          throw new Error(data.error || 'Lỗi thêm mới');
        }
      } else if (isEditing) {
        const res = await fetch(`/api/users/${isEditing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) {
          const text_data = await res.text(); let data: any = {}; if (text_data) { try { data = JSON.parse(text_data); } catch(e) { console.error("JSON parse error:", text_data); data = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng." }; } }
          throw new Error(data.error || 'Lỗi cập nhật');
        }
      }
      setIsEditing(null);
      setIsAdding(false);
      onUserUpdate();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Filter & Search users
  const filteredUsers = [...users].reverse().filter(u => {
    const matchesSearch = 
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.position && u.position.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDept = selectedDeptFilter === 'All' || u.department === selectedDeptFilter;
    
    return matchesSearch && matchesDept;
  });

  // Paginated users
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* ---------------- MAIN HEADER SECTION ---------------- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-800">
            Nhân sự ({totalItems})
          </h2>
          
          {/* Subtabs matching Chinese '列表' (Danh sách) & '状态' (Trạng thái) */}
          <div className="bg-slate-100 p-0.5 rounded-full flex items-center">
            <button
              onClick={() => setActiveSubTab('list')}
              className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                activeSubTab === 'list' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Danh sách
            </button>
            <button
              onClick={() => setActiveSubTab('status')}
              className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                activeSubTab === 'status' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Trạng thái
            </button>
          </div>
        </div>

        {/* Search, Filter & Add actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Inline search bar */}
          <div className="relative flex-1 md:flex-initial">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Tìm kiếm nhân viên..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-3 py-1.5 bg-white border border-[#e2eae8] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#2f80ed] w-full md:w-52 font-medium text-slate-700 placeholder-slate-400" 
            />
          </div>

          {/* Department Filter Selector */}
          <select
            value={selectedDeptFilter}
            onChange={(e) => {
              setSelectedDeptFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2 py-1.5 bg-white border border-[#e2eae8] rounded-xl text-xs text-slate-600 font-bold focus:outline-none cursor-pointer"
          >
            <option value="All">Phòng ban (Tất cả)</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Add Employee Button */}
          <button
            onClick={handleAdd}
            className="bg-[#2f80ed] hover:bg-blue-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <span className="text-sm font-bold">+</span>
            <span>Thêm nhân viên</span>
          </button>
        </div>
      </div>

      {/* ---------------- MAIN SUBTAB VIEWS ---------------- */}
      {activeSubTab === 'list' ? (
        
        /* ================= LIST TAB ================= */
        <div className="space-y-4">
          <div className="space-y-3.5">
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((u) => {
                const userGender = u.gender || 'Nam';
                const userBirthday = u.birthday || '1995-05-12';
                const userAge = u.age || 28;
                const userPosition = u.position || 'UI/UX Designer';
                const userLevel = u.level || 'Trung cấp';

                return (
                  <div 
                    key={u.id}
                    className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all duration-300 flex flex-col md:grid md:grid-cols-12 gap-4 items-center relative group"
                  >
                    {/* User Info (Avatar & Name) */}
                    <div className="col-span-12 md:col-span-3 flex items-center gap-3 w-full">
                      <img 
                        src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                        alt={u.name} 
                        className="w-10 h-10 rounded-full object-cover border border-slate-100"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-[13px] hover:text-blue-600 transition-colors">
                          {u.name}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate font-medium">
                          {u.email}
                        </p>
                      </div>
                    </div>

                    {/* Gender column */}
                    <div className="col-span-6 md:col-span-2 flex flex-col items-start md:items-center w-full">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 md:hidden">Giới tính</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 hidden md:block">Giới tính</span>
                      <span className="text-[12px] font-bold text-slate-700">{userGender}</span>
                    </div>

                    {/* Birthday column */}
                    <div className="col-span-6 md:col-span-2 flex flex-col items-start md:items-center w-full">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 md:hidden">Ngày sinh</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 hidden md:block">Ngày sinh</span>
                      <span className="text-[12px] font-bold text-slate-700 font-mono">{userBirthday}</span>
                    </div>

                    {/* Age column */}
                    <div className="col-span-6 md:col-span-1 flex flex-col items-start md:items-center w-full">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 md:hidden">Tuổi</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 hidden md:block">Tuổi</span>
                      <span className="text-[12px] font-bold text-slate-700">{userAge}</span>
                    </div>

                    {/* Position & Badge column */}
                    <div className="col-span-6 md:col-span-3 flex flex-col items-start w-full">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Chức vụ</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[12px] font-bold text-slate-700">{userPosition}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          userLevel === 'Cao cấp' 
                            ? 'bg-rose-50 text-rose-600 border-rose-100' 
                            : userLevel === 'Trung cấp'
                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                            : 'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                          {userLevel}
                        </span>
                      </div>
                    </div>

                    {/* Action Icon Trigger */}
                    <div className="col-span-12 md:col-span-1 flex items-center justify-end w-full relative">
                      <button
                        onClick={() => setActiveMenuUserId(activeMenuUserId === u.id ? null : u.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Options Popup */}
                      {activeMenuUserId === u.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveMenuUserId(null)} />
                          <div className="absolute right-0 mt-36 w-44 bg-white border border-slate-150 rounded-2xl shadow-xl p-1.5 z-50 animate-fade-in text-left">
                            {onUserChange && (
                              <button
                                onClick={() => {
                                  onUserChange(u);
                                  setActiveMenuUserId(null);
                                }}
                                className="w-full text-left flex items-center gap-2 p-2 hover:bg-blue-50 rounded-xl text-xs font-bold text-blue-600 transition-all cursor-pointer"
                              >
                                <LogIn size={13} />
                                <span>Đăng nhập thử</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(u)}
                              className="w-full text-left flex items-center gap-2 p-2 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
                            >
                              <Pencil size={13} className="text-slate-400" />
                              <span>Sửa thông tin</span>
                            </button>
                            {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
                              <button
                                onClick={() => handleDelete(u.id)}
                                disabled={u.id === currentUser.id || (currentUser.role === 'manager' && u.role === 'admin')}
                                className="w-full text-left flex items-center gap-2 p-2 hover:bg-rose-50 rounded-xl text-xs font-bold text-rose-600 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Trash2 size={13} />
                                <span>Xóa nhân sự</span>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs font-bold">
                Không tìm thấy nhân viên nào khớp với tiêu chí lọc.
              </div>
            )}
          </div>

          {/* Pagination Controls matching '1-8 of 28' design */}
          {totalItems > 0 && (
            <div className="flex justify-between items-center bg-white border border-slate-100 rounded-2xl px-6 py-4.5">
              <span className="text-xs text-slate-400 font-bold">
                Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} trên {totalItems} nhân sự
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-bold">
                  {currentPage} / {totalPages} Trang
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-700 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-700 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        
        /* ================= STATUS TAB ================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Security & Access Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Shield size={16} className="text-blue-500" />
                  <span>Trạng thái hoạt động tài khoản hệ thống</span>
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-50 text-emerald-600 rounded">
                  ONLINE
                </span>
              </div>

              <div className="space-y-3.5">
                {[...users].reverse().map(u => (
                  <div key={u.id} className="flex justify-between items-center text-xs border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      <img src={u.avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-100" referrerPolicy="no-referrer" />
                      <div>
                        <p className="font-bold text-slate-700">{u.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                        u.role === 'admin' 
                          ? 'bg-rose-50 text-rose-600 border-rose-100' 
                          : u.role === 'manager'
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {u.role}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Đang trực tuyến" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security & OTP settings (retained from original) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2 border-b border-slate-50 pb-3">
                <Shield size={16} className="text-emerald-500" />
                <span>Bảo mật & OTP</span>
              </h3>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Key size={14} className="text-slate-400" />
                  <span className="font-bold text-slate-600">Xác thực 2 bước (OTP)</span>
                </div>
                <div className="w-8 h-4 bg-emerald-500 rounded-full relative cursor-not-allowed">
                  <div className="absolute right-1 top-0.5 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <LogIn size={14} className="text-slate-400" />
                  <span className="font-bold text-slate-600">Đăng nhập một lần (SSO)</span>
                </div>
                <div className="w-8 h-4 bg-slate-200 rounded-full relative cursor-not-allowed">
                  <div className="absolute left-1 top-0.5 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
            </div>

            {/* Login logs */}
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2 border-b border-slate-50 pb-3">
                <LogIn size={16} className="text-indigo-500" />
                <span>Đăng nhập gần đây</span>
              </h3>
              <div className="space-y-3">
                {[
                  { time: '10 phút trước', ip: '192.168.1.105', status: 'Thành công' },
                  { time: '1 giờ trước', ip: '113.190.23.45', status: 'Thành công' },
                  { time: 'Hôm qua', ip: '116.108.77.2', status: 'Thất bại (Sai mật khẩu)' }
                ].map((log, i) => (
                  <div key={i} className="flex justify-between items-center text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-bold text-slate-700">{log.time}</p>
                      <p className="text-[10px] text-slate-400 font-mono">IP: {log.ip}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                      log.status.includes('Thành công') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- ADD/EDIT EMPLOYEE MODAL DIALOG ---------------- */}
      {(isEditing || isAdding) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up relative">
            <button
              onClick={() => { setIsEditing(null); setIsAdding(false); }}
              className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center space-x-2 border-b border-slate-50 pb-3">
              {isAdding ? <UserPlus size={18} className="text-[#2f80ed]" /> : <Pencil size={18} className="text-[#2f80ed]" />}
              <span>{isAdding ? 'Thêm mới nhân sự' : 'Cập nhật thông tin nhân sự'}</span>
            </h3>
            
            {errorMsg && (
              <div className="mb-4 p-2.5 bg-rose-50 text-rose-600 text-xs rounded-xl border border-rose-100 font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mã nhân viên (ID)</label>
                  <input
                    type="text"
                    value={formData.id || ''}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    disabled={!isAdding}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 focus:border-[#2f80ed] focus:ring-1 focus:ring-[#2f80ed] outline-none disabled:bg-slate-50 disabled:text-slate-400 font-mono"
                    placeholder="Mã nhân viên"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Họ tên</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 focus:border-[#2f80ed] focus:ring-1 focus:ring-[#2f80ed] outline-none"
                    placeholder="Họ và tên"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 focus:border-[#2f80ed] focus:ring-1 focus:ring-[#2f80ed] outline-none"
                    placeholder="Email liên hệ"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phoneNumber || ''}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 focus:border-[#2f80ed] focus:ring-1 focus:ring-[#2f80ed] outline-none font-mono"
                    placeholder="Số điện thoại"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Giới tính</label>
                  <select
                    value={formData.gender || 'Nam'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white outline-none"
                  >
                    {genders.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={formData.birthday || '1995-05-12'}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tuổi</label>
                  <input
                    type="number"
                    value={formData.age || 28}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 28 })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Chức vụ</label>
                  <input
                    type="text"
                    value={formData.position || ''}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 focus:border-[#2f80ed] focus:ring-1 focus:ring-[#2f80ed] outline-none"
                    placeholder="Chức danh công việc"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Trình độ / Cấp độ</label>
                  <select
                    value={formData.level || 'Trung cấp'}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white outline-none"
                  >
                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vai trò</label>
                  <select
                    value={formData.role || 'employee'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white outline-none uppercase"
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phòng ban</label>
                  <select
                    value={formData.department || 'Tech'}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white outline-none"
                  >
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => { setIsEditing(null); setIsAdding(false); }}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-[#2f80ed] hover:bg-blue-600 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
