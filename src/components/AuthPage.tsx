import React, { useState } from 'react';
import { User } from '../types';
import {
  Shield,
  Sparkles,
  UserCheck,
  Key,
  Phone,
  Mail,
  UserPlus,
  LogIn,
  Briefcase,
  DollarSign,
  Search,
  ChevronRight,
  Info,
  Layers,
  FileText,
  Calendar,
  CheckCircle,
  HelpCircle,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft
} from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
  allUsers: User[];
}

type AuthMode = 'login' | 'register' | 'forgot_password';

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, allUsers }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [otpMode, setOtpMode] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  // Login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginEmployeeId, setLoginEmployeeId] = useState('');
  
  // Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDepartment, setRegDepartment] = useState<'Tech' | 'HR' | 'Finance' | 'Sales' | 'Admin'>('Tech');
  const [regRole, setRegRole] = useState<'admin' | 'manager' | 'employee'>('employee');
  const [regEmployeeId, setRegEmployeeId] = useState('');
  
  // Forgot Password
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetStates = (mode: AuthMode) => {
    setAuthMode(mode);
    setOtpMode(false);
    setOtpCode('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setResetSuccess(false);
  };

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginIdentifier || !loginEmployeeId) {
      setErrorMsg('Vui lòng nhập Email/Số điện thoại và Mã nhân viên.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier,
          employeeId: loginEmployeeId,
          skip2FA: true
        })
      });
      const text_data = await response.text(); 
      let data: any = {}; 
      if (text_data) { 
        try { data = JSON.parse(text_data); } 
        catch(e) { data = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng." }; } 
      }
      if (!response.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại.');
      }
      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone || !regEmployeeId) {
      setErrorMsg('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpMode(true);
      setSuccessMsg(`Mã OTP đã được gửi đến ${regEmail || regPhone}`);
    }, 1000);
  };

  const handleRegisterConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      setErrorMsg('Mã OTP không hợp lệ.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: regEmployeeId,
          name: regName,
          email: regEmail,
          phoneNumber: regPhone,
          role: regRole,
          department: regDepartment,
          salary: 15000000,
          status: 'active'
        })
      });
      if (!res.ok) {
        const text_data = await res.text(); 
        let data: any = {}; 
        if (text_data) { 
          try { data = JSON.parse(text_data); } 
          catch(e) { data = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng." }; } 
        }
        throw new Error(data.error || 'Lỗi đăng ký tài khoản.');
      }
      setSuccessMsg('Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.');
      setTimeout(() => {
        resetStates('login');
        setLoginIdentifier(regEmail);
        setLoginEmployeeId(regEmployeeId);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier) {
      setErrorMsg('Vui lòng nhập Email hoặc Số điện thoại.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpMode(true);
      setSuccessMsg(`Mã OTP khôi phục đã được gửi đến ${forgotIdentifier}`);
    }, 1000);
  };

  const handleForgotConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      setErrorMsg('Mã OTP không hợp lệ.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpMode(false);
      setResetSuccess(true);
      setSuccessMsg(null);
      setErrorMsg(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] ring-1 ring-slate-100">
        
        {/* Left Panel: Branding / Visual */}
        <div className="w-full md:w-5/12 bg-indigo-600 p-12 text-white flex flex-col justify-between relative overflow-hidden hidden md:flex">
          <div className="absolute top-0 left-0 w-full h-full">
             <div className="absolute w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -top-20 -left-20 animate-blob" />
             <div className="absolute w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 top-40 -right-20 animate-blob animation-delay-2000" />
             <div className="absolute w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -bottom-32 left-20 animate-blob animation-delay-4000" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-10">
              <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm border border-white/30">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">DOCUSYS</span>
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight">
              Quản Trị Nội Bộ<br />& Phê Duyệt Văn Bản
            </h1>
            <p className="text-indigo-100 text-sm leading-relaxed max-w-sm mb-8 font-medium">
              Nền tảng vận hành tập trung giúp tối ưu hóa luồng công việc, xử lý công văn giấy tờ và quản lý nhân sự hiệu quả.
            </p>
            
            <div className="space-y-4">
              {[
                { icon: CheckCircle, text: 'Phê duyệt công văn' },
                { icon: CheckCircle, text: 'Tự động hóa quy trình' }
              ].map((item, i) => (
                <div key={i} className="flex items-center space-x-3 text-indigo-100/90 text-sm font-medium">
                  <item.icon className="w-5 h-5 text-indigo-300" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative z-10 pt-12">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-indigo-600 shadow-sm" />
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-indigo-600 bg-indigo-800 flex items-center justify-center text-xs font-bold text-indigo-200 shadow-sm">
                +99
              </div>
            </div>
            <p className="text-xs text-indigo-200 mt-3 font-medium">Được tin dùng bởi hơn 1,000+ nhân sự và chuyên viên quản trị.</p>
          </div>
        </div>

        {/* Right Panel: Auth Form */}
        <div className="w-full md:w-7/12 p-8 md:p-16 flex flex-col justify-center bg-white relative">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">
                {authMode === 'login' && 'Đăng Nhập'}
                {authMode === 'register' && 'Tạo Tài Khoản'}
                {authMode === 'forgot_password' && 'Quên Mật Khẩu'}
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                {authMode === 'login' && 'Chào mừng bạn quay trở lại nền tảng.'}
                {authMode === 'register' && 'Bắt đầu hành trình quản trị mới của bạn.'}
                {authMode === 'forgot_password' && 'Khôi phục truy cập hệ thống của bạn.'}
              </p>
            </div>

            {/* Tab Switcher - only show if not in forgot password mode and not in OTP mode */}
            {authMode !== 'forgot_password' && !otpMode && (
              <div className="flex bg-slate-100 p-1 rounded-xl mb-8 relative">
                <button 
                  onClick={() => resetStates('login')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${authMode === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Đăng Nhập
                </button>
                <button 
                  onClick={() => resetStates('register')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${authMode === 'register' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Đăng Ký Mới
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center space-x-3 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
                <HelpCircle size={16} className="shrink-0" />
                <p>{errorMsg}</p>
              </div>
            )}
            
            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center space-x-3 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
                <CheckCircle size={16} className="shrink-0" />
                <p>{successMsg}</p>
              </div>
            )}

            {/* OTP Mode Form */}
            {otpMode ? (
              <form onSubmit={authMode === 'register' ? handleRegisterConfirm : handleForgotConfirm} className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Mã OTP (6 số)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400"><Lock size={14} /></span>
                    <input
                      type="text"
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl py-2.5 pl-9 text-xs text-slate-800 focus:outline-none transition-all font-medium tracking-[0.5em]"
                      required
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 mt-4 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Xác nhận OTP</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setOtpMode(false)}
                  className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-700 mt-4 cursor-pointer"
                >
                  Quay lại
                </button>
              </form>
            ) : authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in duration-300">
                {/* Email / Phone */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Email hoặc Số điện thoại</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400"><UserCheck size={14} /></span>
                    <input
                      type="text"
                      placeholder="email@company.com"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl py-2.5 pl-9 text-xs text-slate-800 focus:outline-none transition-all font-medium"
                      required
                    />
                  </div>
                </div>
                
                {/* Employee ID */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Mã nhân viên (Mật khẩu)</label>
                    <button type="button" onClick={() => resetStates('forgot_password')} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer">
                      Quên mã / mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400"><Key size={14} /></span>
                    <input
                      type="password"
                      placeholder="EMP-123"
                      value={loginEmployeeId}
                      onChange={(e) => setLoginEmployeeId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl py-2.5 pl-9 text-xs text-slate-800 focus:outline-none transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 mt-4 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Đăng nhập hệ thống</span>
                      <LogIn size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            ) : authMode === 'register' ? (
              <form onSubmit={handleRegisterInitiate} className="space-y-4 animate-in fade-in duration-300 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Họ và tên</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-400"><UserCheck size={14} /></span>
                      <input
                        type="text"
                        placeholder="Nguyễn Văn A"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl py-2.5 pl-9 text-xs text-slate-800 focus:outline-none transition-all font-medium"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* ID */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Mã nhân viên (ID)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-400"><Key size={14} /></span>
                      <input
                        type="text"
                        placeholder="EMP-123"
                        value={regEmployeeId}
                        onChange={(e) => setRegEmployeeId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl py-2.5 pl-9 text-xs text-slate-800 focus:outline-none transition-all font-medium"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Email liên hệ</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400"><Mail size={14} /></span>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl py-2.5 pl-9 text-xs text-slate-800 focus:outline-none transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Số điện thoại</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400"><Phone size={14} /></span>
                    <input
                      type="text"
                      placeholder="0912 345 678"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl py-2.5 pl-9 text-xs text-slate-800 focus:outline-none transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Phòng ban</label>
                    <select
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none font-medium cursor-pointer"
                    >
                      <option value="Tech">Công nghệ</option>
                      <option value="HR">Nhân sự</option>
                      <option value="Finance">Tài chính</option>
                      <option value="Sales">Kinh doanh</option>
                      <option value="Admin">Hành chính</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Vai trò</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none font-medium cursor-pointer"
                    >
                      <option value="employee">Nhân viên</option>
                      <option value="manager">Quản lý</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center space-x-2 mt-4 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Tiếp tục</span>
                      <UserPlus size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : resetSuccess ? (
              <div className="text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Đã thiết lập lại mật khẩu</h3>
                <p className="text-sm text-slate-500 mb-6">Bạn có thể sử dụng mã nhân viên mới cung cấp bởi bộ phận IT để đăng nhập.</p>
                <button
                  onClick={() => resetStates('login')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  Quay lại đăng nhập
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotInitiate} className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Email hoặc Số điện thoại</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400"><Mail size={14} /></span>
                    <input
                      type="text"
                      placeholder="Nhập email hoặc số điện thoại..."
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl py-2.5 pl-9 text-xs text-slate-800 focus:outline-none transition-all font-medium"
                      required
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 mt-4 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Gửi mã xác nhận</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => resetStates('login')}
                  className="w-full flex items-center justify-center space-x-2 text-xs font-bold text-slate-500 hover:text-slate-700 mt-4 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Quay lại đăng nhập</span>
                </button>
              </form>
            )}
            
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-medium">
                Sản phẩm phát triển nội bộ bởi đội ngũ <span className="font-bold text-slate-700">DOCUSYS Team</span>
              </p>
            </div>
            
          </div>
        </div>
      </div>
      
      {/* Keyframes for blob animation are normally put in global css, adding here for convenience if missing */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}} />
    </div>
  );
};
