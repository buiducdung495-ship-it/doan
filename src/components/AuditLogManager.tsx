import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { 
  Shield, 
  Clock, 
  Terminal, 
  User, 
  Search, 
  RefreshCw, 
  Filter, 
  Server,
  UserCheck,
  FileCheck,
  FileX,
  PlusCircle,
  HelpCircle
} from 'lucide-react';

export const AuditLogManager: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/audit-logs');
      const text_data = await res.text(); let data: any = {}; if (text_data) { try { data = JSON.parse(text_data); } catch(e) { console.error("JSON parse error:", text_data); data = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng." }; } }
      if (Array.isArray(data)) {
        setLogs(data);
      } else {
        console.warn('Expected array of logs, got:', data);
        setLogs([]);
      }
    } catch (err) {
      console.error(err);
      setLogs([]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Get unique action types for filter list
  const uniqueActions = ['all', ...Array.from(new Set((logs || []).filter(Boolean).map(l => l && l.action).filter(Boolean)))];

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Không rõ thời gian';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) {
      return String(timestamp);
    }
    return d.toLocaleString('vi-VN');
  };

  const formatDetails = (details: any): string => {
    if (!details) return '';
    if (typeof details === 'object') {
      return details.message || JSON.stringify(details);
    }
    return String(details);
  };

  const filteredLogs = (logs || []).filter(log => {
    if (!log) return false;
    const detailsStr = formatDetails(log.details);
    const matchesSearch = 
      (log.userName || '').toLowerCase().includes((searchTerm || "").toLowerCase()) ||
      (log.userId || '').toLowerCase().includes((searchTerm || "").toLowerCase()) ||
      (detailsStr || "").toLowerCase().includes((searchTerm || "").toLowerCase()) ||
      (log.action || '').toLowerCase().includes((searchTerm || "").toLowerCase());
    
    const matchesAction = selectedActionType === 'all' || log.action === selectedActionType;
    return matchesSearch && matchesAction;
  });

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (!a || !b) return 0;
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    const valA = isNaN(timeA) ? 0 : timeA;
    const valB = isNaN(timeB) ? 0 : timeB;
    return valB - valA;
  });

  // Color mapper for action tags
  const getActionBadgeStyle = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('LOGIN')) {
      return 'bg-blue-950/40 text-blue-400 border border-blue-900/50';
    }
    if (act.includes('REGISTER') || act.includes('CREATE')) {
      return 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50';
    }
    if (act.includes('UPDATE')) {
      return 'bg-amber-950/40 text-amber-400 border border-amber-900/50';
    }
    if (act.includes('DELETE') || act.includes('REJECT')) {
      return 'bg-rose-950/40 text-rose-400 border border-rose-900/50';
    }
    if (act.includes('APPROVE') || act.includes('SUCCESS') || act.includes('SIGN')) {
      return 'bg-teal-950/40 text-teal-400 border border-teal-900/50';
    }
    return 'bg-slate-900/60 text-slate-400 border border-slate-800';
  };

  const getActionIcon = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('LOGIN')) return <User size={12} className="text-blue-400" />;
    if (act.includes('APPROVE') || act.includes('SIGN')) return <FileCheck size={12} className="text-teal-400" />;
    if (act.includes('REJECT')) return <FileX size={12} className="text-rose-400" />;
    if (act.includes('REGISTER')) return <UserCheck size={12} className="text-emerald-400" />;
    if (act.includes('CREATE')) return <PlusCircle size={12} className="text-emerald-400" />;
    return <Server size={12} className="text-slate-400" />;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <Shield size={18} className="text-indigo-600" />
            <span>Nhật ký hoạt động hệ thống</span>
          </h2>
          <p className="text-[11px] text-slate-400 font-bold mt-0.5">
            Giám sát thời gian thực toàn bộ thao tác nghiệp vụ, nhân sự và phê duyệt biểu mẫu.
          </p>
        </div>
        
        <button
          onClick={fetchLogs}
          disabled={isRefreshing}
          className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
          <span>Tải lại dữ liệu</span>
        </button>
      </div>

      {/* Filters Dashboard */}
      <div className="bg-white border border-[#e2eae8] rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row gap-3">
        
        {/* Search */}
        <div className="relative flex-1 flex items-center">
          <Search size={14} className="absolute left-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm theo nhân viên, ID hoặc hành động..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2 bg-[#f4f7f6] border border-[#e2eae8] rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700 placeholder-slate-400"
          />
        </div>

        {/* Action filter */}
        <div className="relative flex items-center gap-2 min-w-48">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <select
            value={selectedActionType}
            onChange={(e) => setSelectedActionType(e.target.value)}
            className="w-full text-xs p-2 bg-[#f4f7f6] border border-[#e2eae8] rounded-xl outline-none font-bold text-slate-600 cursor-pointer"
          >
            <option value="all">Tất cả hành động</option>
            {uniqueActions.filter(act => act !== 'all').map((act) => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Terminal View Container */}
      <div className="bg-slate-950 rounded-2xl shadow-xl overflow-hidden border border-slate-800">
        
        {/* Terminal Tab Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center">
            <Terminal size={14} className="text-emerald-400 mr-2" />
            <span className="text-[10px] font-mono text-slate-400 font-bold tracking-wider">jin-platform@server:~# tail -n 100 audit.log</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/25" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/25" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/25 animate-pulse" />
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-5 max-h-[580px] overflow-y-auto space-y-3 font-mono text-[11px] leading-relaxed custom-scrollbar">
          {sortedLogs.map((log, idx) => (
            <div 
              key={log.id || `audit-log-idx-${idx}`} 
              className="group flex flex-col lg:flex-row lg:items-center justify-between p-3 rounded-xl bg-slate-900/20 hover:bg-slate-900/70 border-l-2 border-slate-800 hover:border-emerald-500 transition-all gap-2 lg:gap-4"
            >
              {/* Left Column: Timestamp & User ID */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-slate-500 flex items-center gap-1 min-w-36">
                  <Clock size={11} className="text-slate-600" />
                  <span>{formatTimestamp(log.timestamp)}</span>
                </div>
                <div className="text-slate-300 font-bold flex items-center gap-1.5 min-w-44 truncate" title={`${log.userName || ''} (${log.userId || ''})`}>
                  <User size={11} className="text-slate-500" />
                  <span>{log.userName || 'Hệ thống'}</span>
                  <span className="text-[9px] text-slate-500 font-bold font-mono">({log.userId || 'system'})</span>
                </div>
              </div>

              {/* Middle Column: Action badge & details */}
              <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-extrabold uppercase shrink-0 flex items-center gap-1 ${getActionBadgeStyle(log.action)}`}>
                  {getActionIcon(log.action)}
                  <span>{log.action || 'HÀNH ĐỘNG'}</span>
                </span>
                <span className="text-slate-300 font-medium text-[11px] break-words flex-1 leading-normal">
                  {formatDetails(log.details)}
                </span>
              </div>

              {/* Right Column: IP address */}
              {log.ipAddress && (
                <div className="text-[9px] text-slate-600 font-bold shrink-0 self-end lg:self-auto">
                  IP: {log.ipAddress}
                </div>
              )}
            </div>
          ))}

          {sortedLogs.length === 0 && (
            <div className="text-slate-500 text-center py-16 flex flex-col items-center justify-center space-y-2">
              <Terminal size={32} className="opacity-10 mb-2 text-white" />
              <p className="font-bold">HỆ THỐNG TRỐNG</p>
              <p className="text-[10px] text-slate-600 font-bold">Không tìm thấy bản ghi nhật ký hoạt động nào khớp với bộ lọc.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
