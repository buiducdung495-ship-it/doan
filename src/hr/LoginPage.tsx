import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react';
import type { Employee } from './types';
import { Brand, WorkdayScene } from '../ui/Brand';
import './login.css';

export default function LoginPage({ onLogin, authenticate }: {
  onLogin: (user: Employee) => void;
  authenticate: (identifier: string, password: string) => Promise<Employee>;
}) {
  const [mode, setMode] = useState<'login'|'register'>(()=>window.location.pathname==='/register'?'register':'login');
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [help, setHelp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);
  const reduced = useReducedMotion();
  useEffect(()=>{
    const sync=()=>{setMode(window.location.pathname==='/register'?'register':'login');setError('');setRegistered(false);setPassword('');setConfirmation('');};
    window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);
  },[]);
  useEffect(()=>{document.title=mode==='register'?'Tạo tài khoản · SHC Company':'Đăng nhập · SHC Company';},[mode]);
  function switchMode(next:'login'|'register') {
    window.history.pushState({},'',next==='register'?'/register':'/login');setMode(next);setError('');setRegistered(false);setPassword('');setConfirmation('');setHelp(false);setVisible(false);
  }
  return <main className="shc-auth">
    <aside className="auth-story"><Brand/><div className="auth-story-copy"><span className="auth-overline">MỘT NGÀY LÀM VIỆC TỐT HƠN</span><h2>Công việc có nhịp.<br/><em>Con người có chỗ.</em></h2><p>Những việc nhỏ được sắp xếp gọn gàng.<br/>Để dành nhiều hơn cho những điều quan trọng.</p></div><WorkdayScene compact/><div className="auth-story-foot"><span>01 / CON NGƯỜI LÀ TRUNG TÂM</span><span>SHC Company</span></div></aside>
    <section className="auth-form-side"><a className="auth-back" href="/"><ArrowLeft size={15}/>Về trang chủ</a><div className="auth-mobile-brand"><Brand/></div>
      <motion.div key={`${mode}-${registered}`} className="auth-form-content" initial={reduced?false:{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.18,ease:'easeOut'}}>
        {registered?<div className="auth-complete" role="status"><span className="auth-complete-icon"><Check size={28}/></span><span className="auth-overline">CHÀO MỪNG BẠN ĐẾN VỚI SHC</span><h1>Đăng ký đã<br/>được ghi nhận.</h1><p>Tài khoản <strong>{identifier}</strong> đang chờ Admin/HR kích hoạt và gán phòng ban. Bạn chưa có quyền truy cập dữ liệu nội bộ cho đến khi được duyệt.</p><div className="auth-next"><span>01</span><div><strong>Nhân sự xác nhận thông tin</strong><p>Không cần đăng ký lại. Khi được kích hoạt, dùng email và mật khẩu bạn vừa tạo để đăng nhập.</p></div></div><button className="auth-submit" onClick={()=>switchMode('login')}>Về đăng nhập<ArrowRight size={18}/></button></div>:<>
          <header className="auth-heading"><span className="auth-overline">{mode==='login'?'KHÔNG GIAN LÀM VIỆC CỦA BẠN':'BẮT ĐẦU MỘT KẾT NỐI MỚI'}</span><h1>{mode==='login'?<>Mừng bạn<br/>trở lại.</>:<>Một khởi đầu<br/>cùng SHC.</>}</h1><p>{mode==='login'?'Đăng nhập để tiếp tục ngày làm việc của bạn.':'Tạo tài khoản. Nhân sự sẽ xác nhận trước khi bạn vào không gian nội bộ.'}</p></header>
          <form aria-label={mode==='login'?'Đăng nhập SHC Company':'Đăng ký tài khoản SHC'} onSubmit={async event=>{
            event.preventDefault();if(busy)return;setError('');
            if(mode==='register'&&password!==confirmation){setError('Mật khẩu xác nhận chưa khớp.');return;}
            setBusy(true);
            try{if(mode==='login'){onLogin(await authenticate(identifier,password));window.history.replaceState({},'','/app');}
              else{const response=await fetch('/api/auth/register',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email:identifier,password})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Không thể đăng ký.');setPassword('');setConfirmation('');setRegistered(true);}}
            catch(err){setError((err as Error).message);}finally{setBusy(false);}
          }}>
            {mode==='register'&&<div className="auth-field"><label htmlFor="shc-name">Họ và tên</label><input id="shc-name" name="name" autoComplete="name" required maxLength={120} value={name} onChange={e=>setName(e.target.value)} disabled={busy} placeholder="Tên đầy đủ của bạn"/></div>}
            <div className="auth-field"><label htmlFor="shc-identifier">{mode==='login'?'Email hoặc mã nhân viên':'Email'}</label><div className="auth-input"><UserRound size={17} aria-hidden="true"/><input id="shc-identifier" name="identifier" type={mode==='register'?'email':'text'} autoComplete={mode==='register'?'email':'username'} autoCapitalize="none" spellCheck={false} required maxLength={200} value={identifier} onChange={e=>setIdentifier(e.target.value)} disabled={busy} placeholder={mode==='login'?'you@company.com hoặc mã nhân viên':'you@company.com'}/></div></div>
            <div className="auth-field"><label htmlFor="shc-password">Mật khẩu{mode==='register'&&<small>Tối thiểu 10 ký tự</small>}</label><div className="auth-input"><LockKeyhole size={17} aria-hidden="true"/><input id="shc-password" name="password" type={visible?'text':'password'} autoComplete={mode==='register'?'new-password':'current-password'} required minLength={mode==='register'?10:undefined} maxLength={200} placeholder="Nhập mật khẩu của bạn" value={password} onChange={e=>setPassword(e.target.value)} disabled={busy} onKeyUp={e=>setCapsLock(e.getModifierState('CapsLock'))} onKeyDown={e=>setCapsLock(e.getModifierState('CapsLock'))} onBlur={()=>setCapsLock(false)} aria-describedby={capsLock?'capslock-hint':undefined}/><button type="button" className="auth-eye" aria-label={visible?'Ẩn mật khẩu':'Hiện mật khẩu'} aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></div>
            {capsLock&&<p id="capslock-hint" className="auth-hint" role="status">Caps Lock đang bật.</p>}
            {mode==='register'&&<div className="auth-field"><label htmlFor="shc-confirm">Xác nhận mật khẩu</label><input id="shc-confirm" name="confirmation" type="password" autoComplete="new-password" required minLength={10} maxLength={200} disabled={busy} value={confirmation} onChange={e=>setConfirmation(e.target.value)} placeholder="Nhập lại mật khẩu"/></div>}
            {mode==='login'&&<div className="auth-help"><span><span className="auth-mini-dot"/>Tài khoản nội bộ</span><button type="button" aria-expanded={help} aria-controls="auth-help-text" onClick={()=>setHelp(!help)}>Quên mật khẩu?</button></div>}
            {help&&<p id="auth-help-text" className="auth-hint">Liên hệ quản trị viên của công ty để đặt lại mật khẩu. SHC chưa hỗ trợ khôi phục bằng email tự động.</p>}
            {error&&<p className="auth-error" role="alert">{error}</p>}
            <button type="submit" className="auth-submit" disabled={busy}>{busy?'Đang xử lý…':mode==='login'?'Đăng nhập':'Tạo tài khoản'}<ArrowRight size={18} aria-hidden="true"/></button>
            {mode==='register'&&<p className="auth-privacy">SHC lưu họ tên, email và mật khẩu đã băm để xử lý đăng ký. Tài khoản mới không được xem thông tin nội bộ trước khi được kích hoạt.</p>}
          </form><p className="auth-switch">{mode==='login'?'Chưa có tài khoản?':'Đã có tài khoản?'}<button type="button" disabled={busy} onClick={()=>switchMode(mode==='login'?'register':'login')}>{mode==='login'?'Tạo tài khoản':'Đăng nhập'}<ArrowUpRight size={13}/></button></p>
        </>}
      </motion.div><footer className="auth-footer"><span>© {new Date().getFullYear()} SHC Company</span><span>People & work, in harmony.</span></footer>
    </section>
  </main>;
}
