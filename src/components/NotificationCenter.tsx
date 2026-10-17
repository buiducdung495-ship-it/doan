import React, { useState } from 'react';
import { Notification } from '../types';
import { 
  Bell, 
  CheckCheck, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare,
  Coins,
  X
} from 'lucide-react';

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onClickNotification?: (notif: Notification) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClickNotification
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'workflow':
        return <CheckCircle size={14} className="text-emerald-500 shrink-0" />;
      case 'asset':
        return <AlertTriangle size={14} className="text-amber-500 shrink-0" />;
      case 'chat':
        return <MessageSquare size={14} className="text-blue-500 shrink-0" />;
      case 'payment':
        return <Coins size={14} className="text-purple-500 shrink-0" />;
      default:
        return <Info size={14} className="text-slate-500 shrink-0" />;
    }
  };

  const getCategoryStyles = (type: Notification['type']) => {
    switch (type) {
      case 'workflow':
        return 'border-l-4 border-l-emerald-500 bg-emerald-50/20';
      case 'asset':
        return 'border-l-4 border-l-amber-500 bg-amber-50/20';
      case 'chat':
        return 'border-l-4 border-l-indigo-600 bg-indigo-50/20';
      case 'payment':
        return 'border-l-4 border-l-purple-500 bg-purple-50/20';
      default:
        return 'border-l-4 border-l-slate-400 bg-slate-50/20';
    }
  };

  const getCategoryLabel = (type: Notification['type']) => {
    switch (type) {
      case 'workflow': return { text: 'Quy trình', color: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
      case 'asset': return { text: 'Tài sản', color: 'text-amber-700 bg-amber-50 border-amber-100' };
      case 'chat': return { text: 'Tin nhắn', color: 'text-indigo-700 bg-indigo-50 border-indigo-100' };
      case 'payment': return { text: 'Lương thưởng', color: 'text-purple-700 bg-purple-50 border-purple-100' };
      default: return { text: 'Hệ thống', color: 'text-slate-700 bg-slate-50 border-slate-100' };
    }
  };

  return (
    <div className="relative z-40">
      {/* Trigger Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full relative transition-colors cursor-pointer"
        id="notification-bell-btn"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 border-2 border-white rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-slide-up">
            
            {/* Header */}
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">Thông báo của bạn ({unreadCount})</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => { onMarkAllAsRead(); setIsOpen(false); }}
                  className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer text-[10px]"
                >
                  <CheckCheck size={12} />
                  <span>Đọc tất cả</span>
                </button>
              )}
            </div>

             {/* List */}
            <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto text-xs">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <p>Không có thông báo mới.</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const label = getCategoryLabel(notif.type);
                  return (
                    <div
                      key={notif.id}
                      onClick={() => { 
                        if (onClickNotification) {
                          onClickNotification(notif);
                        } else {
                          onMarkAsRead(notif.id);
                        }
                        setIsOpen(false); 
                      }}
                      className={`p-3 text-left transition-all hover:bg-slate-100 cursor-pointer flex gap-2.5 ${getCategoryStyles(notif.type)} ${
                        !notif.read ? 'font-bold' : 'opacity-70'
                      }`}
                    >
                      {getIcon(notif.type)}
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className={`font-semibold truncate text-[11.5px] flex-1 ${!notif.read ? 'text-indigo-950 font-bold' : 'text-slate-700'}`}>
                            {notif.title}
                          </h4>
                          <span className={`text-[8px] font-extrabold px-1 py-0.2 rounded border uppercase tracking-wider shrink-0 ${label.color}`}>
                            {label.text}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed truncate-2-lines">{notif.message}</p>
                        <span className="text-[9px] text-slate-400 font-mono block mt-1">
                          {new Date(notif.timestamp).toLocaleDateString('vi-VN')} {new Date(notif.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
};
