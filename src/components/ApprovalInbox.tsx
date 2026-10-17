import React, { useState, useEffect } from 'react';
import { WorkflowRequest, User, WorkflowConfig } from '../types';
import { WorkflowCanvas } from './WorkflowCanvas';
import { 
  Check, 
  X, 
  MessageSquare, 
  UserCheck, 
  Clock, 
  Sparkles, 
  UserX,
  AlertCircle,
  FileText,
  Building
} from 'lucide-react';

interface ApprovalInboxProps {
  requests: WorkflowRequest[];
  workflows: WorkflowConfig[];
  currentUser: User;
  users: User[];
  onApprove: (requestId: string, comment?: string) => Promise<void>;
  onReject: (requestId: string, comment?: string) => Promise<void>;
  onAnalyzeAI: (formTitle: string, values: Record<string, any>) => Promise<any>;
}

export const ApprovalInbox: React.FC<ApprovalInboxProps> = ({
  requests,
  workflows,
  currentUser,
  users,
  onApprove,
  onReject,
  onAnalyzeAI
}) => {
  const [selectedReq, setSelectedReq] = useState<WorkflowRequest | null>(null);
  const [comment, setComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-run AI Analysis for the boss when inspecting a request!
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);

  // 1. Smart Filtering pending requests for this specific user's approval authority
  const pendingApprovals = requests.filter(req => {
    if (req.status !== 'pending') return false;

    // Submitter can't approve their own request!
    if (req.submitterId === currentUser.id) return false;

    // Admin has absolute supreme authority: can see and approve ALL pending requests!
    if (currentUser.role === 'admin') {
      return true;
    }

    const config = workflows.find(w => w.formTemplateId === req.formTemplateId);
    if (!config) return false;

    // Accounts for auto-skip rules to get the accurate stage details
    let activeStages = [...config.stages];
    if (config.autoApproveRules) {
      for (const rule of config.autoApproveRules) {
        const value = req.submissionData[rule.field];
        if (value !== undefined) {
          let matches = false;
          const ruleVal = rule.value;
          if (rule.operator === 'lt' && Number(value) < Number(ruleVal)) matches = true;
          if (rule.operator === 'gt' && Number(value) > Number(ruleVal)) matches = true;
          if (rule.operator === 'eq' && String(value) === String(ruleVal)) matches = true;
          if (matches && rule.action === 'skip') {
            activeStages = activeStages.filter(stage => stage.stageIndex !== 1);
          }
        }
      }
    }

    const currentStage = activeStages.find(s => s.stageIndex === req.currentStageIndex);
    if (!currentStage) return false;

    if (currentStage.roleRequired === 'admin') {
      return currentUser.role === 'admin';
    }
    if (currentStage.roleRequired === 'manager') {
      return currentUser.role === 'manager' && currentUser.department === req.submitterDepartment;
    }
    return false;
  });

  // Fetch AI assessment when the manager clicks/inspects a request!
  useEffect(() => {
    if (!selectedReq) {
      setAiAnalysis(null);
      return;
    }

    const fetchAIAssessment = async () => {
      setIsAnalyzingAI(true);
      setAiAnalysis(null);
      try {
        const result = await onAnalyzeAI(selectedReq.formTitle, selectedReq.submissionData);
        setAiAnalysis(result);
      } catch (err) {
        console.error('AI Assessment failed:', err);
      } finally {
        setIsAnalyzingAI(false);
      }
    };

    fetchAIAssessment();
  }, [selectedReq, onAnalyzeAI]);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedReq) return;
    setIsProcessing(true);
    setError(null);
    try {
      if (action === 'approve') {
        await onApprove(selectedReq.id, comment);
      } else {
        await onReject(selectedReq.id, comment);
      }
      setSelectedReq(null);
      setComment('');
    } catch (err: any) {
      setError(err.message || 'Lỗi thao tác phê duyệt.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="approvals-view">
      {/* Inbox List (Left Column) */}
      <div className="col-span-12 lg:col-span-5 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Danh Sách Yêu Cầu Chờ Duyệt</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {currentUser.role === 'admin' 
                  ? 'Quyền tối cao Admin: Có thể ký duyệt mọi đơn từ cấp dưới.' 
                  : `Các đơn thuộc thẩm quyền phòng ban ${currentUser.department} của bạn.`}
              </p>
            </div>
            <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-full font-bold text-xs">
              {pendingApprovals.length} Đơn mới
            </span>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <UserCheck size={36} className="text-slate-200 stroke-1 mb-2 animate-bounce" />
              <p className="text-xs font-semibold text-slate-500">Tuyệt vời! Bạn không có đơn chờ duyệt</p>
              <p className="text-[10px] text-slate-400 text-center mt-1">Hộp thư của bạn hoàn toàn trống, mọi công văn đã được thông qua.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 mt-3 max-h-[500px] overflow-y-auto space-y-1">
              {pendingApprovals.map((req) => {
                const config = workflows.find(w => w.formTemplateId === req.formTemplateId);
                const activeStages = config ? config.stages : [];
                const currentStage = activeStages.find(s => s.stageIndex === req.currentStageIndex);
                const isAdminOverride = currentUser.role === 'admin' && currentStage && currentStage.roleRequired !== 'admin';

                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedReq(req)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer text-left ${
                      selectedReq?.id === req.id
                        ? 'bg-indigo-50/25 border-indigo-200 ring-1 ring-indigo-500/10'
                        : 'bg-white border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-400">{req.id}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 mt-1.5">{req.formTitle}</h4>
                    
                    {isAdminOverride && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[9px] font-bold">
                          ★ Quyền Admin Ghi Đè ({currentStage.roleRequired === 'manager' ? 'Duyệt Trưởng Nhóm' : 'Người dùng'})
                        </span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 mt-2">
                      <img
                        src={`https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`}
                        alt={req.submitterName}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="text-[11px] font-semibold text-slate-600">{req.submitterName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({req.submitterDepartment})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Inspection & Decision Desk (Right Column) */}
      <div className="col-span-12 lg:col-span-7">
        {!selectedReq ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center h-full min-h-[400px] flex flex-col justify-center items-center text-slate-400">
            <FileText size={48} className="text-slate-200 stroke-1 mb-3" />
            <h4 className="text-sm font-semibold text-slate-700">Bàn Làm Việc & Ký Duyệt Đơn Từ</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
              Vui lòng nhấp chọn một đơn từ chờ duyệt bên danh mục trái để kiểm tra chi tiết dữ liệu thực tế, tham khảo tư vấn AI thông minh và thực hiện ký quyết định.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
            
            {/* Header profile */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Building size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{selectedReq.formTitle}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mã số: {selectedReq.id} • Người gửi: <span className="font-semibold text-slate-700">{selectedReq.submitterName}</span> ({selectedReq.submitterDepartment})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedReq(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            {/* Visual multi-stage stepper pipeline / Workflow Canvas */}
            <WorkflowCanvas 
              request={selectedReq}
              workflows={workflows}
              users={users}
            />

            {/* Submission Data Values */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <h4 className="text-[11px] font-bold uppercase text-slate-400 mb-2.5 tracking-wider">Chi tiết nội dung đơn:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(selectedReq.submissionData).map(([key, val]) => (
                  <div key={key} className="bg-white p-3 rounded-lg border border-slate-200/60 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase font-mono block">{key}</span>
                    <span className="text-xs font-bold text-slate-800 mt-1 inline-block">
                      {typeof val === 'boolean' ? (val ? 'Đồng ý / Đúng' : 'Không') : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI smart recommendation help widget */}
            <div className="bg-indigo-50/40 rounded-xl p-5 border border-indigo-100/50 space-y-3">
              <div className="flex items-center space-x-2 text-indigo-600">
                <Sparkles size={16} className="animate-spin-slow" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Đánh Giá Phân Tích Thông Minh (AI Gemini)</h4>
              </div>

              {isAnalyzingAI ? (
                <div className="flex items-center space-x-2 text-slate-500 py-3 text-xs">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>AI đang kiểm định biểu mẫu & dự trù ngân sách...</span>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400">RỦI RO HÀNH CHÍNH:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      aiAnalysis.complexity === 'Nghiêm trọng'
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : aiAnalysis.complexity === 'Trung bình'
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}>
                      {aiAnalysis.complexity || 'Thấp'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block mb-0.5">PHÂN TÍCH CHUYÊN SÂU:</span>
                    <p className="text-[11px] text-slate-600 leading-relaxed italic bg-white/60 p-2.5 rounded border border-slate-100">
                      "{aiAnalysis.explanation}"
                    </p>
                  </div>
                  <div className="bg-white p-3.5 rounded-lg border border-indigo-100 shadow-3xs">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">KHUYẾN NGHỊ AI CHO BẠN:</span>
                    <p className="text-[11.5px] text-indigo-950 font-semibold leading-relaxed">
                      {aiAnalysis.aiRecommendation}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">Chưa tải được đánh giá AI cho đơn này.</p>
              )}
            </div>

            {/* Approval Form */}
            <div className="space-y-4 border-t border-slate-100 pt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Ý kiến / Ghi chú phê duyệt của Sếp <span className="text-slate-400 font-normal">(Tùy chọn)</span>
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ví dụ: Đồng ý cấp phép phép năm / Đồng ý bàn giao thiết bị..."
                  className="w-full bg-slate-50 text-slate-800 text-xs rounded border border-slate-200 py-2.5 px-3 focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 text-rose-500 text-xs rounded-lg flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => handleAction('reject')}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserX size={14} />
                  <span>{isProcessing ? 'Đang xử lý...' : 'Từ Chối Đơn'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('approve')}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/10 transition-colors cursor-pointer"
                >
                  <Check size={14} />
                  <span>{isProcessing ? 'Đang xử lý...' : 'Ký Phê Duyệt'}</span>
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
