import React, { useState } from 'react';
import { User } from '../types';
import { UserCheck, ShieldAlert, Phone, Mail, MapPin, CreditCard, Building, Briefcase, DollarSign, Save, User as UserIcon, Edit3, X, Upload, Camera } from 'lucide-react';

interface UserProfileModalProps {
  onClose: () => void;
  currentUser: User;
  onSaveProfile: (updatedUser: Partial<User>) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  onClose,
  currentUser,
  onSaveProfile,
  showToast
}) => {
  // Local form states with reliable fallbacks
  const [realName, setRealName] = useState(currentUser.realName || currentUser.name || '');
  const [cccd, setCccd] = useState(currentUser.cccd || '001096008742');
  const [address, setAddress] = useState(currentUser.address || 'Khu đô thị Vinhomes Ocean Park, Gia Lâm, Hà Nội');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || '0912345678');
  const [secondaryPhoneNumber, setSecondaryPhoneNumber] = useState(currentUser.secondaryPhoneNumber || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [signatureUrl, setSignatureUrl] = useState(currentUser.signatureUrl || '');
  
  // View vs Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const debounceRef = React.useRef<any>(null);

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Static security settings matching their positions
  const department = currentUser.department || 'Tech';
  const position = currentUser.position || (currentUser.role === 'admin' ? 'Giám đốc Vận hành' : currentUser.role === 'manager' ? 'Trưởng phòng bộ phận' : 'Kỹ sư công nghệ');
  const salary = currentUser.salary || 18000000;

  const handleFieldChange = (fieldName: string, value: string) => {
    // 1. Update local state immediately for fast UI response
    if (fieldName === 'realName') setRealName(value);
    else if (fieldName === 'cccd') setCccd(value);
    else if (fieldName === 'address') setAddress(value);
    else if (fieldName === 'phoneNumber') setPhoneNumber(value);
    else if (fieldName === 'secondaryPhoneNumber') setSecondaryPhoneNumber(value);
    else if (fieldName === 'email') setEmail(value);

    // 2. Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Validation checks before autosaving
    if (fieldName === 'realName' && !value.trim()) return;
    if (fieldName === 'phoneNumber' && !value.trim()) return;
    if (fieldName === 'email' && value.trim() && (!value.includes('@') || value.length < 5)) return;

    // 3. Set new timeout to autosave
    setSaveStatus('saving');
    debounceRef.current = setTimeout(async () => {
      try {
        await onSaveProfile({
          name: fieldName === 'realName' ? value : realName,
          realName: fieldName === 'realName' ? value : realName,
          cccd: fieldName === 'cccd' ? value : cccd,
          address: fieldName === 'address' ? value : address,
          phoneNumber: fieldName === 'phoneNumber' ? value : phoneNumber,
          secondaryPhoneNumber: fieldName === 'secondaryPhoneNumber' ? value : secondaryPhoneNumber,
          email: fieldName === 'email' ? value : email,
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err: any) {
        setSaveStatus('error');
      }
    }, 1000); // 1 second debounce
  };

  const handleFieldBlur = async () => {
    if (!realName.trim() || !phoneNumber.trim()) {
      return; // Do not save invalid/empty required fields
    }
    // Clear any pending debounced save to avoid duplicate saving
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setSaveStatus('saving');
    try {
      await onSaveProfile({
        name: realName,
        realName,
        cccd,
        address,
        phoneNumber,
        secondaryPhoneNumber,
        email,
        signatureUrl,
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      setSaveStatus('error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleFieldBlur();
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setRealName(currentUser.realName || currentUser.name || '');
    setCccd(currentUser.cccd || '001096008742');
    setAddress(currentUser.address || 'Khu đô thị Vinhomes Ocean Park, Gia Lâm, Hà Nội');
    setPhoneNumber(currentUser.phoneNumber || '0912345678');
    setSecondaryPhoneNumber(currentUser.secondaryPhoneNumber || '');
    setEmail(currentUser.email || '');
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-[#0c1a30]/40 backdrop-blur-md" onClick={onClose} />
      
      {/* Modal Dialog Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl z-10 overflow-hidden relative animate-scale-up font-sans text-slate-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center space-x-2">
            <UserCheck size={18} className="text-[#2f80ed]" />
            <h3 className="font-extrabold text-[#0a2e24] text-sm tracking-tight">
              QUẢN LÝ THÔNG TIN NGƯỜI DÙNG
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          {/* Left Column: Read-Only Official Information & Avatar */}
          <div className="p-6 md:w-5/12 bg-slate-50/30 flex flex-col items-center text-center space-y-5">
            <div className="relative">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={currentUser.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 shadow-md shadow-blue-500/5"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-1 right-1 bg-emerald-500 text-white p-1 rounded-full text-[8px] font-extrabold tracking-wider border-2 border-white animate-pulse">
                ACTIVE
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-800">{realName || currentUser.name}</h4>
              <p className="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                ID DOCUSYS: {currentUser.id.toUpperCase()}
              </p>
            </div>

            {/* Official Credentials Block */}
            <div className="w-full space-y-3.5 pt-4 border-t border-slate-100 text-left">
              <div className="flex items-center space-x-3 text-xs">
                <Building size={14} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Phòng ban</p>
                  <p className="font-bold text-slate-700">{department}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <Briefcase size={14} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Vị trí công việc</p>
                  <p className="font-bold text-slate-700">{position}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <DollarSign size={14} className="text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mức lương cơ bản</p>
                  <div className="flex items-center space-x-1.5">
                    <p className="font-bold text-slate-700 font-mono">
                      {salary.toLocaleString('vi-VN')} đ
                    </p>
                    <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded font-extrabold uppercase">BẢO MẬT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="w-full bg-[#f3f7ff] border border-blue-50 rounded-xl p-3 text-left flex items-start space-x-2">
              <ShieldAlert size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[9px] text-slate-500 leading-relaxed font-medium">
                Các thông tin phòng ban, vị trí công việc và mức lương do Ban Giám đốc thiết lập. Vui lòng liên hệ HR để thay đổi nếu có sai lệch.
              </p>
            </div>
          </div>

          {/* Right Column: Profile fields with View / Edit mode */}
          <div className="p-6 md:w-7/12 space-y-4">
            <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Thông tin liên hệ & Định danh cá nhân
            </h4>

            {!isEditing ? (
              /* ---------------- VIEW MODE ---------------- */
              <div className="space-y-3">
                {/* Họ và tên thật */}
                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start space-x-3 hover:bg-slate-50/80 transition-colors">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                    <UserIcon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Họ và tên thật</p>
                    <p className="font-extrabold text-slate-800 text-xs truncate">{realName || '(Chưa cung cấp)'}</p>
                  </div>
                </div>

                {/* Số điện thoại chính */}
                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start space-x-3 hover:bg-slate-50/80 transition-colors">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 mt-0.5">
                    <Phone size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Số điện thoại di động (Chính)</p>
                    <p className="font-extrabold text-slate-800 text-xs font-mono">{phoneNumber || '(Chưa cung cấp)'}</p>
                  </div>
                </div>

                {/* Số điện thoại phụ */}
                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start space-x-3 hover:bg-slate-50/80 transition-colors">
                  <div className="p-2 bg-teal-50 text-teal-600 rounded-lg shrink-0 mt-0.5">
                    <Phone size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Số điện thoại phụ</p>
                    <p className="font-extrabold text-slate-800 text-xs font-mono">
                      {secondaryPhoneNumber || <span className="text-slate-400 font-normal italic">(Chưa thiết lập)</span>}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start space-x-3 hover:bg-slate-50/80 transition-colors">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 mt-0.5">
                    <Mail size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Địa chỉ Email</p>
                    <p className="font-extrabold text-slate-800 text-xs truncate">{email || '(Chưa cung cấp)'}</p>
                  </div>
                </div>

                {/* CCCD */}
                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start space-x-3 hover:bg-slate-50/80 transition-colors">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0 mt-0.5">
                    <CreditCard size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Số Căn cước công dân (CCCD)</p>
                    <p className="font-extrabold text-slate-800 text-xs font-mono">{cccd || '(Chưa cung cấp)'}</p>
                  </div>
                </div>

                {/* Địa chỉ */}
                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start space-x-3 hover:bg-slate-50/80 transition-colors">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0 mt-0.5">
                    <MapPin size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Địa chỉ thường trú / tạm trú</p>
                    <p className="font-bold text-slate-700 text-xs leading-relaxed">{address || '(Chưa cung cấp)'}</p>
                  </div>
                </div>

                {/* Actions inside View Mode */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-500 transition-all cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-5 py-2.5 rounded-xl bg-[#2f80ed] hover:bg-[#1c71dd] text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center space-x-1.5"
                  >
                    <Edit3 size={13} />
                    <span>Chỉnh sửa thông tin</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ---------------- EDIT MODE ---------------- */
              <div className="space-y-4">
                {/* Autosave Banner */}
                <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2">
                  <span className="text-[10px] font-bold text-slate-400">Trạng thái lưu:</span>
                  <div className="flex items-center space-x-1">
                    {saveStatus === 'saving' && (
                      <span className="text-[10px] text-blue-600 font-extrabold flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        <span>Đang tự động lưu...</span>
                      </span>
                    )}
                    {saveStatus === 'saved' && (
                      <span className="text-[10px] text-emerald-600 font-extrabold flex items-center space-x-1 animate-fade-in">
                        <span>✓</span>
                        <span>Đã lưu mọi thay đổi</span>
                      </span>
                    )}
                    {saveStatus === 'error' && (
                      <span className="text-[10px] text-rose-600 font-extrabold flex items-center space-x-1 animate-pulse">
                        <span>✕</span>
                        <span>Lỗi khi tự động lưu</span>
                      </span>
                    )}
                    {saveStatus === 'idle' && (
                      <span className="text-[10px] text-slate-400 font-bold">
                        ✍️ Tự động lưu khi thay đổi
                      </span>
                    )}
                  </div>
                </div>

                {/* Input 1: Real name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Họ và tên thật
                  </label>
                  <div className="relative flex items-center">
                    <input
                      required
                      type="text"
                      value={realName}
                      onChange={(e) => handleFieldChange('realName', e.target.value)}
                      onBlur={handleFieldBlur}
                      placeholder="Nhập đầy đủ họ tên thật"
                      className="w-full border border-slate-200 rounded-xl pl-3.5 pr-10 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                    />
                    {realName && (
                      <button
                        type="button"
                        onClick={() => handleFieldChange('realName', '')}
                        className="absolute right-3 p-1 text-slate-400 hover:text-rose-500 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                        title="Xóa nhanh"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Input 2: Phone (Chính) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center space-x-1">
                    <Phone size={10} className="text-slate-400" />
                    <span>Số điện thoại di động (Chính)</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      required
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                      onBlur={handleFieldBlur}
                      placeholder="Nhập số điện thoại liên hệ"
                      className="w-full border border-slate-200 rounded-xl pl-3.5 pr-10 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 font-mono"
                    />
                    {phoneNumber && (
                      <button
                        type="button"
                        onClick={() => handleFieldChange('phoneNumber', '')}
                        className="absolute right-3 p-1 text-slate-400 hover:text-rose-500 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                        title="Xóa nhanh"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Input 2.5: Secondary Phone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center space-x-1">
                    <Phone size={10} className="text-slate-400" />
                    <span>Số điện thoại phụ</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={secondaryPhoneNumber}
                      onChange={(e) => handleFieldChange('secondaryPhoneNumber', e.target.value)}
                      onBlur={handleFieldBlur}
                      placeholder="Nhập số điện thoại phụ (không bắt buộc)"
                      className="w-full border border-slate-200 rounded-xl pl-3.5 pr-10 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 font-mono"
                    />
                    {secondaryPhoneNumber && (
                      <button
                        type="button"
                        onClick={() => handleFieldChange('secondaryPhoneNumber', '')}
                        className="absolute right-3 p-1 text-slate-400 hover:text-rose-500 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                        title="Xóa nhanh"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Input 3: Email */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center space-x-1">
                    <Mail size={10} className="text-slate-400" />
                    <span>Địa chỉ Email</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      onBlur={handleFieldBlur}
                      placeholder="Nhập email liên hệ"
                      className="w-full border border-slate-200 rounded-xl pl-3.5 pr-10 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                    />
                    {email && (
                      <button
                        type="button"
                        onClick={() => handleFieldChange('email', '')}
                        className="absolute right-3 p-1 text-slate-400 hover:text-rose-500 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                        title="Xóa nhanh"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Input 4: CCCD */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center space-x-1">
                    <CreditCard size={10} className="text-slate-400" />
                    <span>Số Căn cước công dân (CCCD)</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={cccd}
                      onChange={(e) => handleFieldChange('cccd', e.target.value)}
                      onBlur={handleFieldBlur}
                      placeholder="Nhập số CCCD gồm 12 số"
                      className="w-full border border-slate-200 rounded-xl pl-3.5 pr-10 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 font-mono"
                    />
                    {cccd && (
                      <button
                        type="button"
                        onClick={() => handleFieldChange('cccd', '')}
                        className="absolute right-3 p-1 text-slate-400 hover:text-rose-500 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                        title="Xóa nhanh"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Input 5: Address */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center space-x-1">
                    <MapPin size={10} className="text-slate-400" />
                    <span>Địa chỉ thường trú / tạm trú</span>
                  </label>
                  <div className="relative flex items-start">
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      onBlur={handleFieldBlur}
                      placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện..."
                      className="w-full border border-slate-200 rounded-xl p-3 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 leading-relaxed"
                    />
                    {address && (
                      <button
                        type="button"
                        onClick={() => handleFieldChange('address', '')}
                        className="absolute right-3 top-3 p-1 text-slate-400 hover:text-rose-500 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                        title="Xóa nhanh"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Signature Capture Section */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-400 mb-2 flex items-center space-x-1 uppercase tracking-wider">
                    <span>Chữ ký cá nhân</span>
                  </label>
                  <div className="flex flex-col space-y-3">
                    {signatureUrl ? (
                      <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden bg-slate-50 w-full max-w-[200px]">
                        <img src={signatureUrl} alt="Signature" className="w-full h-auto" />
                        <button
                          type="button"
                          onClick={() => setSignatureUrl('')}
                          className="absolute top-1 right-1 p-1 bg-white/80 hover:bg-white text-rose-500 rounded-lg backdrop-blur shadow-sm transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-3">
                        <label className="flex-1 border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 rounded-xl p-4 text-center cursor-pointer transition-all">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => setSignatureUrl(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }} 
                          />
                          <Upload size={20} className="mx-auto mb-2 text-slate-400" />
                          <span className="text-xs font-bold text-slate-600 block">Tải ảnh lên</span>
                        </label>

                        <label className="flex-1 border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 rounded-xl p-4 text-center cursor-pointer transition-all">
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => setSignatureUrl(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }} 
                          />
                          <Camera size={20} className="mx-auto mb-2 text-slate-400" />
                          <span className="text-xs font-bold text-slate-600 block">Chụp ảnh mới</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons in Edit Mode */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-500 transition-all cursor-pointer"
                  >
                    Quay lại
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2.5 rounded-xl bg-[#2f80ed] hover:bg-[#1c71dd] text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>Hoàn tất</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};

