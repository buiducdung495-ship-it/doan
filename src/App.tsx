import { lazy, Suspense, useEffect, useState } from 'react';
import LandingPage from './landing/LandingPage';

const HRApp = lazy(() => import('./hr/HRApp'));

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const isLanding = pathname === '/';
  useEffect(() => {
    const sync = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  useEffect(() => {
    document.documentElement.lang = 'vi';
    document.title = isLanding
      ? 'SHC Company — Một nơi cho mọi người'
      : 'SHC Company · Quản lý nhân sự';
  }, [isLanding]);
  return isLanding ? <LandingPage /> : (
    <Suspense fallback={<p role="status" style={{ padding: 32 }}>Đang mở cổng nhân sự…</p>}>
      <HRApp />
    </Suspense>
  );
}
