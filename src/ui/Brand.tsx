import { useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Check, Pause, Play } from 'lucide-react';
import './brand.css';
import { cn } from './cn';

export function BrandMark({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 3C27 3 27 13 20 20C13 13 13 3 20 3Z" fill="currentColor"/><path d="M37 20C37 27 27 27 20 20C27 13 37 13 37 20Z" fill="currentColor"/><path d="M20 37C13 37 13 27 20 20C27 27 27 37 20 37Z" fill="currentColor"/><path d="M3 20C3 13 13 13 20 20C13 27 3 27 3 20Z" fill="currentColor"/></svg>;
}
export function Brand({ light = false }: { light?: boolean }) {
  return <a href="/" className={cn('shc-brand', light && 'shc-brand-light')} aria-label="SHC Company — Trang chủ"><BrandMark/><span>shc<span className="brand-period">.</span><small>PEOPLE & WORK</small></span></a>;
}
/** Decorative illustration: compositor-only motion, paused off-screen or on request. */
export function WorkdayScene({ compact = false }: { compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: .15 });
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const playing = inView && !reduced && !paused;
  const drift = (delay: number) => ({ animate: playing ? { y: [0, -8, 0] } : { y: 0 }, transition: { duration: playing ? 6 : .18, repeat: playing ? Infinity : 0, delay: playing ? delay : 0, ease: 'easeInOut' as const } });
  return <div ref={ref} className={cn('workday-scene', compact && 'scene-compact')}>
    <div className="scene-art" aria-hidden="true">
      <svg className="scene-paths" viewBox="0 0 560 520" fill="none"><circle cx="280" cy="265" r="200" stroke="currentColor"/><circle cx="280" cy="265" r="138" stroke="currentColor"/><path d="M58 265H502M280 42V488" stroke="currentColor" strokeDasharray="3 9"/><motion.g animate={{ rotate: playing ? 360 : 0 }} transition={{ duration: playing ? 45 : 0, ease: 'linear', repeat: playing ? Infinity : 0 }} style={{ transformOrigin: '280px 265px' }}><circle cx="280" cy="65" r="7" fill="var(--shc-accent)"/><circle cx="280" cy="465" r="5" fill="var(--shc-ink)"/></motion.g></svg>
      <div className="scene-center"><BrandMark/><span>people first.</span></div>
      <motion.div className="scene-card scene-person" {...drift(0)}><span className="scene-avatar">L</span><div><strong>Ngọc Linh</strong><span>Hôm nay, một khởi đầu mới.</span></div><ArrowUpRight size={18}/></motion.div>
      <motion.div className="scene-card scene-week" {...drift(1.2)}><div><span>NHỊP LÀM VIỆC</span><span>Tháng 10</span></div><div className="scene-days">{['T2','T3','T4','T5','T6'].map((d,i)=><span key={d}><small>{d}</small><strong>{5+i}</strong><i>{i===2 ? '·' : <Check size={12}/>}</i></span>)}</div></motion.div>
      <motion.div className="scene-card scene-note" {...drift(2.4)}><span className="scene-check"><Check size={16}/></span><div><strong>Mọi thứ đã kết nối.</strong><span>Con người. Công việc. Cùng nhau.</span></div></motion.div>
      <span className="scene-index">SHC / WORKDAY STUDY — 01</span>
    </div>
    {!reduced && <button type="button" className="scene-motion" aria-label={paused ? 'Bật chuyển động minh họa' : 'Tạm dừng chuyển động minh họa'} aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused ? <Play size={13}/> : <Pause size={13}/>}<span>{paused ? 'Bật chuyển động' : 'Tạm dừng chuyển động'}</span></button>}
  </div>;
}
