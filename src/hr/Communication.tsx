import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Megaphone, Pin, Plus, Search, X } from 'lucide-react';
import type { Announcement, HRData } from './types';
import './communication.css';

type Mutate = (path: string, values: unknown, method?: string) => Promise<void>;
const stamp = (value: string) => new Date(value).toLocaleString('vi-VN', {
  hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
});

function AnnouncementEditor({ row, data, busy, mutate, close }: {
  row: Partial<Announcement>; data: HRData; busy: boolean; mutate: Mutate; close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState({ title: row.title || '', body: row.body || '', departmentId: row.departmentId || '', pinned: row.pinned || false });
  const [error, setError] = useState('');
  useEffect(() => {
    const node = dialog.current; node?.showModal();
    return () => node?.close();
  }, []);
  return <dialog ref={dialog} className="shc-editor" aria-labelledby="announcement-title" onCancel={e => { e.preventDefault(); if (!busy) close(); }}>
    <form onSubmit={async e => {
      e.preventDefault(); if (busy) return; setError('');
      try { await mutate(row.id ? `/hr/announcements/${row.id}` : '/hr/announcements', values, row.id ? 'PUT' : 'POST'); close(); }
      catch (err) { setError((err as Error).message); }
    }}>
      <div className="dialog-head"><h2 id="announcement-title">{row.id ? 'Sửa bản tin' : 'Đăng bản tin'}</h2><button type="button" className="icon-button" disabled={busy} onClick={close} aria-label="Đóng"><X size={20}/></button></div>
      <fieldset disabled={busy} className="shc-editor-fields">
        <label>Tiêu đề<input autoFocus required maxLength={120} value={values.title} onChange={e => setValues({ ...values, title: e.target.value })}/></label>
        <label>Người nhận<select value={values.departmentId} onChange={e => setValues({ ...values, departmentId: e.target.value })}><option value="">Toàn công ty</option>{data.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
        <label>Nội dung<textarea required rows={7} maxLength={4000} value={values.body} onChange={e => setValues({ ...values, body: e.target.value })}/></label>
        <label className="shc-check"><input type="checkbox" checked={values.pinned} onChange={e => setValues({ ...values, pinned: e.target.checked })}/>Ghim lên đầu bảng tin</label>
      </fieldset>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="dialog-actions"><button type="button" disabled={busy} onClick={close}>Hủy</button><button className="primary" disabled={busy}>{busy ? 'Đang lưu…' : row.id ? 'Lưu thay đổi' : 'Đăng bản tin'}</button></div>
    </form>
  </dialog>;
}

export function AnnouncementBoard({ data, isHR, busy, mutate }: { data: HRData; isHR: boolean; busy: boolean; mutate: Mutate }) {
  const [query, setQuery] = useState('');
  const [archived, setArchived] = useState(false);
  const [editor, setEditor] = useState<Partial<Announcement> | null>(null);
  const [error, setError] = useState('');
  const rows = data.announcements.filter(x => x.archived === archived && `${x.title} ${x.body}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')));
  return <section className="shc-communication" aria-label="Bảng tin nội bộ">
    <div className="shc-communication-tools">
      <label className="shc-search"><Search size={18}/><input aria-label="Tìm bản tin" placeholder="Tìm bản tin…" value={query} onChange={e => setQuery(e.target.value)}/></label>
      {isHR && <><select aria-label="Trạng thái bản tin" value={archived ? 'archived' : 'active'} onChange={e => setArchived(e.target.value === 'archived')}><option value="active">Đang hiển thị</option><option value="archived">Đã lưu trữ</option></select><button className="primary" disabled={busy} onClick={() => setEditor({})}><Plus size={17}/>Đăng bản tin</button></>}
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    <div className="shc-feed">{rows.map(row => <article className="shc-post" key={row.id}>
      <div className="shc-post-meta"><span className="shc-tag">{row.departmentId ? data.departments.find(d => d.id === row.departmentId)?.name || row.departmentId : 'Toàn công ty'}</span>{row.pinned && <span className="shc-pin"><Pin size={14}/>Đã ghim</span>}</div>
      <h2>{row.title}</h2><p className="shc-post-body">{row.body}</p>
      <footer><span>{row.authorName} · <time dateTime={row.updatedAt}>{stamp(row.updatedAt)}</time></span>{isHR && <div><button disabled={busy} onClick={() => setEditor(row)}>Chỉnh sửa</button><button disabled={busy} onClick={async () => {
        setError(''); try { await mutate(`/hr/announcements/${row.id}/archive`, { archived: !row.archived }); } catch (err) { setError((err as Error).message); }
      }}>{row.archived ? 'Khôi phục' : 'Lưu trữ'}</button></div>}</footer>
    </article>)}</div>
    {!rows.length && <div className="shc-empty"><Megaphone size={30}/><h2>{query ? 'Không tìm thấy bản tin' : archived ? 'Chưa có bản tin lưu trữ' : 'Chưa có bản tin'}</h2><p>{query ? 'Thử tìm bằng từ khóa khác.' : isHR ? 'Đăng thông tin mới để mọi người cùng cập nhật.' : 'Thông tin từ công ty sẽ xuất hiện tại đây.'}</p></div>}
    {editor && <AnnouncementEditor row={editor} data={data} busy={busy} mutate={mutate} close={() => setEditor(null)}/>}
  </section>;
}

export function NotificationCenter({ data, busy, mutate, navigate }: { data: HRData; busy: boolean; mutate: Mutate; navigate: (tab: string) => void }) {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState('');
  const unread = data.notifications.filter(x => !x.readAt).length;
  const rows = data.notifications.filter(x => !unreadOnly || !x.readAt);
  return <section className="shc-communication" aria-label="Thông báo cá nhân">
    <div className="shc-communication-tools"><label className="shc-check"><input type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)}/>Chưa đọc ({unread})</label><button disabled={busy || !unread} onClick={async () => {
      setError(''); try { await mutate('/hr/notifications/read-all', {}); } catch (err) { setError((err as Error).message); }
    }}><CheckCheck size={17}/>Đánh dấu tất cả đã đọc</button></div>
    {error && <p className="error" role="alert">{error}</p>}
    <div className="shc-feed">{rows.map(row => <article className={`shc-notification ${row.readAt ? '' : 'is-unread'}`} key={row.id}>
      <span className="shc-notification-icon"><Bell size={20}/></span><div><h2>{row.title}{!row.readAt && <span className="shc-unread-label">Chưa đọc</span>}</h2><p>{row.message}</p><time dateTime={row.createdAt}>{stamp(row.createdAt)}</time></div>
      <button disabled={busy} onClick={async () => {
        setError(''); try { if (!row.readAt) await mutate(`/hr/notifications/${row.id}/read`, {}); navigate(row.target); } catch (err) { setError((err as Error).message); }
      }}>Xem {row.target === 'leaves' ? 'đơn nghỉ' : 'bảng lương'}</button>
    </article>)}</div>
    {!rows.length && <div className="shc-empty"><Bell size={30}/><h2>{unreadOnly ? 'Bạn đã đọc hết thông báo' : 'Chưa có thông báo'}</h2><p>Cập nhật nghỉ phép và bảng lương sẽ xuất hiện tại đây.</p></div>}
  </section>;
}
