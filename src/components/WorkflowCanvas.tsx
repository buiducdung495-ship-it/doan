import React from 'react';
import { WorkflowRequest, WorkflowConfig, User } from '../types';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  UserCheck, 
  ArrowRight, 
  CornerDownRight,
  Shield, 
  Check, 
  HelpCircle,
  SkipForward,
  Lock,
  User as UserIcon
} from 'lucide-react';

interface WorkflowCanvasProps {
  request: WorkflowRequest;
  workflows: WorkflowConfig[];
  users: User[];
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  request,
  workflows,
  users
}) => {
  const config = workflows.find(w => w.formTemplateId === request.formTemplateId);
  
  // Deterministic severity check (or fallback to what request has)
  const isLowSeverity = request.severity === 'low';

  // Find the manager of submitter's department
  const deptManager = users.find(u => u.role === 'manager' && u.department === request.submitterDepartment);
  // Find any admins
  const companyAdmin = users.find(u => u.role === 'admin');

  // Parse approval history
  const managerApproval = request.approvalHistory.find(h => h.stageIndex === 0);
  const adminApproval = request.approvalHistory.find(h => h.stageIndex === 1);

  // Status computation for node 1 (Submitter)
  const submitDateStr = new Date(request.createdAt).toLocaleDateString('vi-VN');
  const submitTimeStr = new Date(request.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  // Status computation for Node 2 (Manager)
  let managerStatus: 'pending' | 'approved' | 'rejected' | 'active' = 'pending';
  if (managerApproval) {
    managerStatus = managerApproval.action === 'approved' ? 'approved' : 'rejected';
  } else if (request.status === 'pending' && request.currentStageIndex === 0) {
    managerStatus = 'active';
  } else if (request.status === 'rejected' && request.approvalHistory.length === 0) {
    managerStatus = 'rejected';
  }

  // Status computation for Node 3 (Admin / Board)
  let adminStatus: 'locked' | 'active' | 'approved' | 'rejected' | 'skipped' = 'locked';
  if (isLowSeverity) {
    adminStatus = 'skipped';
  } else if (adminApproval) {
    adminStatus = adminApproval.action === 'approved' ? 'approved' : 'rejected';
  } else if (request.status === 'pending' && request.currentStageIndex === 1) {
    adminStatus = 'active';
  } else if (request.status === 'rejected' && request.currentStageIndex === 1) {
    adminStatus = 'rejected';
  }

  return (
    <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-5 shadow-inner relative overflow-hidden" id="approval-flow-canvas">
      {/* Decorative Canvas Background Dot-Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
      
      {/* Canvas Header */}
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div>
          <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Sơ đồ luồng phê duyệt (Canvas)
          </span>
          <h4 className="text-xs font-bold text-slate-100 mt-1 flex items-center gap-1.5">
            Phân cấp phê duyệt: {isLowSeverity ? (
              <span className="text-emerald-400">Đơn Thường / Không nghiêm trọng (1 Cấp duyệt)</span>
            ) : (
              <span className="text-amber-400">Đơn Phức tạp / Cần xét duyệt Cấp cao (2 Cấp duyệt)</span>
            )}
          </h4>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" /> Đã thông qua</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse block" /> Đang chờ</span>
        </div>
      </div>

      {/* Visual Canvas Diagram Layout */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        
        {/* Node 1: Submitter */}
        <div className="md:col-span-3 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-900">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cấp 0: Người nộp đơn</span>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-0.5 uppercase">
              <Check size={8} /> Đã gửi
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <img 
              src={`https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`} 
              alt={request.submitterName}
              className="w-8 h-8 rounded-full border border-slate-800 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 truncate">{request.submitterName}</p>
              <p className="text-[10px] text-slate-500 truncate">{request.submitterRole.toUpperCase()} • {request.submitterDepartment}</p>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-900 flex justify-between text-[9px] text-slate-500 font-mono">
            <span>{submitDateStr}</span>
            <span>{submitTimeStr}</span>
          </div>
        </div>

        {/* Connector 1 */}
        <div className="md:col-span-1 flex md:flex-col justify-center items-center text-slate-600 py-1 md:py-0">
          <div className="h-0.5 w-8 md:w-full bg-indigo-500/30 relative flex justify-center items-center">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-indigo-500/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping absolute" />
          </div>
        </div>

        {/* Node 2: Manager Approval */}
        <div className={`md:col-span-3 rounded-xl p-3.5 border transition-all shadow-sm ${
          managerStatus === 'approved' 
            ? 'bg-slate-950/80 border-emerald-500/40 hover:border-emerald-500/60' 
            : managerStatus === 'rejected'
              ? 'bg-slate-950/80 border-rose-500/40 hover:border-rose-500/60'
              : managerStatus === 'active'
                ? 'bg-indigo-950/30 border-indigo-500 shadow-lg ring-1 ring-indigo-500/30'
                : 'bg-slate-950/40 border-slate-800/80 opacity-60'
        }`}>
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-900">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cấp 1: Trưởng phòng</span>
            {managerStatus === 'approved' && (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">
                ✓ Đã duyệt
              </span>
            )}
            {managerStatus === 'rejected' && (
              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">
                ✕ Từ chối
              </span>
            )}
            {managerStatus === 'active' && (
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase animate-pulse">
                ● Đang chờ
              </span>
            )}
            {managerStatus === 'pending' && (
              <span className="bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">
                Chưa tới
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img 
                src={deptManager?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                alt="Manager" 
                className="w-8 h-8 rounded-full border border-slate-800 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-0.5 -right-0.5 bg-slate-900 rounded-full p-0.5 border border-slate-800">
                <UserIcon size={8} className="text-indigo-400" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 truncate">{managerApproval ? managerApproval.approverName : deptManager ? deptManager.name : `Trưởng bộ phận`}</p>
              <p className="text-[9px] text-slate-500 truncate">Manager • P. {request.submitterDepartment}</p>
            </div>
          </div>

          {/* Comment/Note if approved/rejected */}
          {managerApproval && (
            <div className="mt-2.5 p-1.5 bg-slate-900 rounded text-[10px] text-slate-300 border border-slate-800/60 leading-relaxed italic truncate-2-lines">
              "{managerApproval.comment || 'Đã đồng ý phê duyệt đơn từ.'}"
            </div>
          )}
          
          {managerStatus === 'active' && (
            <p className="text-[10px] text-indigo-400 mt-2.5 font-medium animate-pulse">
              → Đang đợi ý kiến của Trưởng phòng {request.submitterDepartment}...
            </p>
          )}
        </div>

        {/* Connector 2 */}
        <div className="md:col-span-1 flex md:flex-col justify-center items-center text-slate-600 py-1 md:py-0">
          <div className="h-0.5 w-8 md:w-full bg-indigo-500/30 relative flex justify-center items-center">
            {adminStatus === 'skipped' ? (
              <div className="absolute inset-0 flex justify-center items-center bg-slate-800/40">
                <SkipForward size={10} className="text-slate-500" />
              </div>
            ) : (
              <>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-indigo-500/60" />
                {managerStatus === 'approved' && request.status === 'pending' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping absolute" />
                )}
              </>
            )}
          </div>
        </div>

        {/* Node 3: Senior Admin Approval */}
        <div className={`md:col-span-3 rounded-xl p-3.5 border transition-all shadow-sm ${
          adminStatus === 'approved'
            ? 'bg-slate-950/80 border-emerald-500/40 hover:border-emerald-500/60'
            : adminStatus === 'rejected'
              ? 'bg-slate-950/80 border-rose-500/40 hover:border-rose-500/60'
              : adminStatus === 'active'
                ? 'bg-indigo-950/30 border-indigo-500 shadow-lg ring-1 ring-indigo-500/30'
                : adminStatus === 'skipped'
                  ? 'bg-slate-950/30 border-dashed border-slate-800 opacity-50 select-none'
                  : 'bg-slate-950/10 border-slate-800/50 opacity-40'
        }`}>
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-900">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cấp 2: Ban Giám Đốc</span>
            {adminStatus === 'approved' && (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">
                ✓ Hoàn tất
              </span>
            )}
            {adminStatus === 'rejected' && (
              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">
                ✕ Từ chối
              </span>
            )}
            {adminStatus === 'active' && (
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase animate-pulse">
                ● Cần duyệt
              </span>
            )}
            {adminStatus === 'skipped' && (
              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase">
                Lược bỏ (Đơn thường)
              </span>
            )}
            {adminStatus === 'locked' && (
              <span className="bg-slate-900 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase flex items-center gap-0.5">
                <Lock size={7} /> Khóa
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img 
                src={companyAdmin?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'} 
                alt="Director" 
                className={`w-8 h-8 rounded-full border border-slate-800 object-cover ${adminStatus === 'skipped' ? 'grayscale' : ''}`}
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-0.5 -right-0.5 bg-slate-900 rounded-full p-0.5 border border-slate-800">
                <Shield size={8} className={adminStatus === 'skipped' ? 'text-slate-500' : 'text-rose-400'} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-bold text-slate-200 truncate ${adminStatus === 'skipped' ? 'line-through text-slate-500' : ''}`}>
                {adminApproval ? adminApproval.approverName : companyAdmin ? companyAdmin.name : 'Vũ Hoàng Sơn'}
              </p>
              <p className="text-[9px] text-slate-500 truncate">Tổng Giám đốc • CEO Office</p>
            </div>
          </div>

          {/* Comment/Note if approved/rejected */}
          {adminApproval && (
            <div className="mt-2.5 p-1.5 bg-slate-900 rounded text-[10px] text-slate-300 border border-slate-800/60 leading-relaxed italic truncate-2-lines">
              "{adminApproval.comment || 'Đã đồng ý phê duyệt tối cao.'}"
            </div>
          )}

          {adminStatus === 'skipped' && (
            <div className="mt-2.5 p-1.5 bg-emerald-950/10 border border-emerald-500/10 rounded text-[9px] text-emerald-400 leading-snug">
              ✓ Đơn không nghiêm trọng. Hệ thống tự động phê chuẩn khi Trưởng phòng thông qua.
            </div>
          )}

          {adminStatus === 'active' && (
            <p className="text-[10px] text-indigo-400 mt-2.5 font-medium animate-pulse">
              → Đang chờ Ban Giám Đốc ký xác nhận...
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
