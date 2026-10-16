import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Clock3, Menu, Users, Wallet, X } from 'lucide-react';
import { Brand, BrandMark, WorkdayScene } from '../ui/Brand';
import './landing.css';
import { cn } from '../ui/cn';

const samplePeople=[['NL','Ngọc Linh','Công nghệ','Đang làm việc'],['QH','Quang Huy','Công nghệ','Đang làm việc'],['TV','Thảo Vy','Kinh doanh','Thử việc']];
const previewTabs=['Con người','Ngày làm việc','Kỳ lương'] as const;
const faqs=[
  ['SHC giúp quản lý những gì?','Hồ sơ, hợp đồng, ngày công, nghỉ phép, bảng lương cơ bản, đánh giá và thông tin nội bộ. Những phần liên quan với nhau được đặt trong một không gian làm việc.'],
  ['Tôi có thể tự tạo tài khoản không?','Có. Bạn có thể đăng ký bằng họ tên, email và mật khẩu. Admin/HR xác nhận, kích hoạt và gán phòng ban trước khi bạn được truy cập dữ liệu nhân sự nội bộ.'],
  ['Mỗi người có quyền truy cập như nhau không?','Không. Admin, nhân sự, trưởng phòng và nhân viên có phạm vi khác nhau. Quyền được kiểm tra tại máy chủ; nhân viên chỉ đọc dữ liệu cá nhân được cho phép.'],
  ['SHC đã tích hợp máy chấm công và thuế chưa?','Chưa. Máy chấm công hiện là danh mục; công được nhập theo ngày. Công thức lương cơ bản chưa tự tính thuế, bảo hiểm, tăng ca hoặc lịch ngày lễ.'],
];

function WorkspacePreview(){
  const [tab,setTab]=useState<(typeof previewTabs)[number]>('Con người');
  const reduced=useReducedMotion();
  return <div className="site-preview">
    <div className="preview-bar"><span><BrandMark/>Không gian của bạn</span><span className="preview-demo">DỮ LIỆU MINH HỌA</span></div>
    <div className="preview-body"><div className="preview-nav" aria-label="Chọn nội dung xem trước">{previewTabs.map((t,i)=>{const Icon=[Users,Clock3,Wallet][i];return <button key={t} className={cn(t===tab && 'is-active')} aria-pressed={t===tab} onClick={()=>setTab(t)}><Icon size={17}/>{t}<ArrowUpRight size={14}/></button>;})}<p>Đúng thông tin.<br/>Đúng người.<br/>Đúng lúc.</p></div>
      <motion.div className="preview-content" key={tab} initial={reduced?false:{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:.18,ease:'easeOut'}}>
        <div className="preview-title"><span>{tab==='Con người'?'ĐỘI NGŨ CỦA BẠN':tab==='Ngày làm việc'?'MỖI NGÀY, RÕ RÀNG HƠN':'TRƯỚC KHI CHỐT KỲ'}</span><h3>{tab==='Con người'?'Những người làm nên công việc.':tab==='Ngày làm việc'?'Một tuần có nhịp riêng.':'Từ ngày công đến kỳ lương.'}</h3></div>
        {tab==='Con người'?<div className="preview-table-wrap"><table><thead><tr><th>Thành viên</th><th>Phòng ban</th><th>Trạng thái</th></tr></thead><tbody>{samplePeople.map(([initials,name,team,status])=><tr key={name}><td><span className="preview-avatar">{initials}</span>{name}</td><td>{team}</td><td><span className="preview-status">{status}</span></td></tr>)}</tbody></table><a href="/login">Mở hồ sơ nhân viên<ArrowUpRight size={14}/></a></div>:tab==='Ngày làm việc'?<div className="preview-workdays"><div className="preview-week">{['Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu'].map((d,i)=><div key={d}><span>{d}</span><strong>{5+i}</strong><small>{i===2?'Nghỉ phép':<><Check size={12}/>Đã ghi công</>}</small></div>)}</div><div className="preview-request"><span className="preview-avatar">NL</span><div><strong>Ngọc Linh · Nghỉ phép</strong><span>Một ngày nghỉ, một luồng duyệt rõ ràng.</span></div><span>Chờ duyệt</span></div></div>:<div className="preview-payroll"><div><small>KỲ LƯƠNG MINH HỌA</small><h4>Tháng 09 / 2026</h4><span>Bản nháp · Chưa chốt</span></div><dl><div><dt>Ngày công</dt><dd>22 / 22</dd></div><div><dt>Lương cơ bản</dt><dd>12.000.000đ</dd></div><div><dt>Phụ cấp</dt><dd>1.000.000đ</dd></div><div><dt>Theo công thức cơ bản</dt><dd>13.000.000đ</dd></div></dl><p>Kiểm tra công và phép trước khi chốt. Chưa tự tính thuế, bảo hiểm, tăng ca.</p></div>}
      </motion.div>
    </div>
  </div>;
}

export default function LandingPage(){
  const [menu,setMenu]=useState(false);
  const reduced=useReducedMotion();
  return <div className="site">
    <a href="#site-main" className="site-skip">Đến nội dung chính</a>
    <header className="site-header site-container"><Brand/><nav id="site-navigation" aria-label="Điều hướng chính" className={cn('site-nav',menu && 'is-open')}><a href="#platform" onClick={()=>setMenu(false)}>Không gian làm việc</a><a href="#approach" onClick={()=>setMenu(false)}>Cách SHC kết nối</a><a href="#faq" onClick={()=>setMenu(false)}>Câu hỏi thường gặp</a></nav><a href="/login" className="site-login">Đăng nhập<ArrowUpRight size={15}/></a><button className="site-menu" aria-label={menu?'Đóng menu':'Mở menu'} aria-controls="site-navigation" aria-expanded={menu} onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button></header>
    <main id="site-main">
      <section className="site-hero site-container"><motion.div className="site-hero-copy" initial={reduced?false:{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:.5,ease:'easeOut'}}><span className="site-overline"><i/>QUẢN LÝ NHÂN SỰ, THEO CÁCH GẦN GŨI HƠN</span><h1>Một nơi cho<br/><em>mọi người.</em></h1><p>Gọn việc nhân sự. Rõ từng ngày công.<br/>Một không gian để đội ngũ của bạn<br className="site-wide-break"/> cùng làm việc tốt hơn.</p><div className="site-hero-actions"><a className="site-button" href="/register">Bắt đầu cùng SHC<ArrowRight size={18}/></a><a className="site-text-link" href="#platform">Khám phá không gian<ChevronDown size={16}/></a></div><div className="site-hero-note"><span className="site-note-line"/>Con người là trung tâm. Phần còn lại, để SHC sắp xếp.</div></motion.div><div className="site-hero-art"><WorkdayScene/><span className="site-art-caption">MỘT GÓC NHỎ CỦA NGÀY LÀM VIỆC · HÌNH MINH HỌA</span></div></section>
      <div className="site-chapters site-container">{[['01','Con người','Hồ sơ, hợp đồng và những cột mốc.'],['02','Ngày làm việc','Ngày công, lịch ca và nghỉ phép.'],['03','Kết nối','Bảng tin, thông báo và kỳ lương.']].map(([n,t,c])=><a href="#platform" key={n}><span>{n}</span><div><strong>{t}</strong><small>{c}</small></div><ArrowUpRight size={19}/></a>)}</div>
      <section id="platform" className="site-platform"><div className="site-container"><div className="site-section-head"><div><span className="site-overline">KHÔNG GIAN LÀM VIỆC</span><h2>Bớt những đầu việc rời rạc.<br/><em>Thêm những kết nối rõ ràng.</em></h2></div><p>Thông tin được đặt cạnh nhau.<br/>Để mỗi quyết định có đủ ngữ cảnh.</p></div><WorkspacePreview/><div className="site-preview-foot"><span>Chọn từng mục để xem trước · Dữ liệu giả lập, không phải hồ sơ thật</span><a href="/login">Vào không gian của bạn<ArrowRight size={15}/></a></div></div></section>
      <section id="approach" className="site-approach site-container"><div className="site-approach-intro"><span className="site-overline">THIẾT KẾ CHO CÔNG VIỆC HẰNG NGÀY</span><h2>Đủ gọn để dùng.<br/><em>Đủ rõ để tin.</em></h2><p>Không thêm những thao tác không cần thiết. SHC giúp nhân sự, quản lý và nhân viên nhìn thấy đúng phần việc của mình.</p><a className="site-text-link" href="/register">Tìm nhịp làm việc của bạn<ArrowUpRight size={15}/></a></div><div className="site-approach-list">{[['01','Thông tin có một nơi để về.','Từ hồ sơ đến hợp đồng, giữ những thông tin cần thiết cạnh nhau. Không phải tìm lại giữa nhiều bảng tính.'],['02','Quy trình có điểm đầu, điểm cuối.','Gửi đơn, theo dõi và xử lý theo quyền. Trạng thái rõ ràng giúp biết việc nào còn chờ, việc nào đã hoàn tất.'],['03','Mỗi người có một không gian riêng.','Nhân viên xem dữ liệu cá nhân. Quản lý xử lý công việc của phòng. Nhân sự giữ bức tranh chung.']].map(([n,t,c])=><article key={n}><span>{n}</span><div><h3>{t}</h3><p>{c}</p></div></article>)}</div></section>
      <section id="faq" className="site-faq site-container"><div><span className="site-overline">TRƯỚC KHI BẮT ĐẦU</span><h2>Một chút<br/><em>rõ ràng hơn.</em></h2></div><div>{faqs.map(([q,a])=><details key={q}><summary>{q}<span><ChevronDown size={17}/></span></summary><p>{a}</p></details>)}</div></section>
      <section className="site-invitation site-container"><BrandMark/><div><span className="site-overline">MỘT NGÀY MỚI, MỘT NHỊP MỚI</span><h2>Bắt đầu từ <em>con người.</em></h2><p>Không gian làm việc tiếp theo của bạn đang chờ.</p></div><a className="site-button" href="/register">Tạo tài khoản<ArrowRight size={18}/></a></section>
    </main><footer className="site-footer site-container"><Brand/><span>© {new Date().getFullYear()} SHC Company</span><a href="/login">Đã có tài khoản? Đăng nhập<ArrowUpRight size={14}/></a></footer>
  </div>;
}
