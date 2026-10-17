import React, { useState } from 'react';
import { FormTemplate, WorkflowRequest, User, WorkflowConfig } from '../types';
import { FormRenderer } from './FormRenderer';
import { WorkflowCanvas } from './WorkflowCanvas';
import { downloadWorkflowTextFile } from '../utils/textGenerator';
import { 
  FileSpreadsheet, 
  Printer, 
  Sparkles, 
  History, 
  Plus, 
  X, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  BookOpen,
  Info,
  GitFork,
  Download
} from 'lucide-react';

interface WorkflowPortalProps {
  forms: FormTemplate[];
  requests: WorkflowRequest[];
  workflows: WorkflowConfig[];
  currentUser: User;
  users: User[];
  onSubmitRequest: (formTemplateId: string, values: Record<string, any>) => Promise<void>;
  onAnalyzeAI: (formTitle: string, values: Record<string, any>) => Promise<any>;
}

export const WorkflowPortal: React.FC<WorkflowPortalProps> = ({
  forms,
  requests,
  workflows,
  currentUser,
  users,
  onSubmitRequest,
  onAnalyzeAI
}) => {
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);
  const [activeFormValues, setActiveFormValues] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // AI Preview State
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Print Document State
  const [printDoc, setPrintDoc] = useState<WorkflowRequest | null>(null);

  // Selected Request for Flow Diagram Canvas
  const [selectedRequestForCanvas, setSelectedRequestForCanvas] = useState<WorkflowRequest | null>(null);

  const myRequests = requests.filter(r => r.submitterId === currentUser.id);

  const handleFormSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      await onSubmitRequest(selectedForm!.id, values);
      setSelectedForm(null);
      setActiveFormValues({});
      setAiAnalysis(null);
    } catch (err) {
      alert('Gửi đơn thất bại: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerAI = async (values: Record<string, any>) => {
    setIsAnalyzing(true);
    try {
      const result = await onAnalyzeAI(selectedForm!.title, values);
      setAiAnalysis(result);
    } catch (err) {
      console.error(err);
      alert('Không thể thực hiện phân tích AI lúc này.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportToExcel = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM for Excel
    csvContent += "Mã Đơn,Tiêu Đề,Loại Biểu Mẫu,Phòng Ban,Trạng Thái,Ngày Tạo,Chi Tiết Dữ Liệu\r\n";
    
    myRequests.forEach(r => {
      const dataStr = Object.entries(r.submissionData)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ')
        .replace(/"/g, '""');
      
      csvContent += `"${r.id}","${r.formTitle}","${r.formTemplateId}","${r.submitterDepartment}","${r.status}","${new Date(r.createdAt).toLocaleDateString('vi-VN')}","${dataStr}"\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_Cao_Don_Tu_Cua_${currentUser.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6" id="workflow-requests-view">
      {/* Top Welcome Banner */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group">
        <div>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-60 group-hover:bg-indigo-100 transition-all duration-700"></div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 relative z-10">Cổng Đăng Ký Đơn Từ</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium relative z-10">
            Nơi nhân viên tạo đơn xin nghỉ phép, đề xuất máy móc, vật tư, và theo dõi tiến độ duyệt đa cấp theo thời gian thực.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToExcel}
            className="px-4 py-2.5 bg-white border-2 border-slate-100 hover:border-emerald-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer relative z-10 shadow-sm"
          >
            <FileSpreadsheet size={14} className="text-emerald-400" />
            <span>Xuất Excel Registry</span>
          </button>
        </div>
      </div>

      {/* Grid of Available Forms */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-2">
          <BookOpen size={14} className="text-indigo-600" />
          Mẫu Đơn Đang Áp Dụng Tại Công Ty
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => (
            <div 
              key={form.id}
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-100 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  form.category === 'leave'
                    ? 'bg-sky-50 text-sky-600'
                    : form.category === 'asset'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-slate-50 text-slate-600'
                }`}>
                  {form.category === 'leave' ? 'Nghỉ phép' : form.category === 'asset' ? 'Vật tư/Thiết bị' : 'Chung'}
                </span>
                <h4 className="text-sm font-semibold text-slate-800 mt-2.5">{form.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed truncate-2-lines">
                  {form.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  {form.fields.length} trường nhập liệu
                </span>
                <button
                  onClick={() => setSelectedForm(form)}
                  className="px-4 py-2 bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-300 cursor-pointer shadow-sm"
                >
                  <Plus size={12} />
                  <span>Viết đơn ngay</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Submission History */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-2">
          <History size={14} className="text-indigo-600" />
          Lịch Sử Gửi Đơn & Tiến Độ Phê Duyệt Của Tôi ({myRequests.length})
        </h3>

        {myRequests.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-slate-100 shadow-xs text-center text-slate-400">
            <Clock size={36} className="mx-auto text-slate-200 stroke-1 mb-2" />
            <p className="text-xs font-medium">Bạn chưa nộp đơn nào lên hệ thống</p>
            <p className="text-[10px] text-slate-400 mt-1">Chọn một mẫu đơn ở trên để thực hiện gửi yêu cầu đầu tiên.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase border-b border-slate-100">
                    <th className="py-3 px-4">Mã Đơn</th>
                    <th className="py-3 px-4">Mẫu đơn</th>
                    <th className="py-3 px-4">Ngày nộp</th>
                    <th className="py-3 px-4">Nội dung tóm tắt</th>
                    <th className="py-3 px-4">Cấp độ duyệt hiện tại</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {myRequests.map((req) => {
                    const statusConfig = {
                      pending: { bg: 'bg-amber-50 text-amber-600 border-amber-200', label: 'Chờ duyệt' },
                      approved: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: 'Đã duyệt' },
                      rejected: { bg: 'bg-rose-50 text-rose-600 border-rose-200', label: 'Bị từ chối' }
                    };
                    const badge = statusConfig[req.status];
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-slate-500">
                          {req.id}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {req.formTitle}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">
                          {new Date(req.createdAt).toLocaleDateString('vi-VN')} {new Date(req.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                          {Object.entries(req.submissionData)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ')}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {req.status === 'approved' ? (
                            <span className="text-emerald-600 font-bold">✓ Đã duyệt hoàn tất</span>
                          ) : req.status === 'rejected' ? (
                            <span className="text-rose-500 line-through">Bị từ chối ở cấp {req.currentStageIndex + 1}</span>
                          ) : (
                            <span>Đang ở cấp duyệt {req.currentStageIndex + 1}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedRequestForCanvas(req)}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-md inline-flex items-center gap-1 cursor-pointer animate-pulse-slow"
                              title="Xem sơ đồ luồng phê duyệt (Canvas trực quan)"
                            >
                              <GitFork size={13} />
                              <span className="text-[10px] font-semibold">Xem Sơ đồ</span>
                            </button>
                            <button
                              onClick={() => setPrintDoc(req)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md inline-flex items-center gap-1 cursor-pointer"
                              title="In quyết định phê duyệt hành chính (PDF)"
                            >
                              <Printer size={13} />
                              <span className="text-[10px] font-semibold">Quyết Định</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Write Form Submission & Live AI Complexity Preview */}
      {selectedForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Tạo Đơn Yêu Cầu Mới</h3>
                  <p className="text-[10px] text-slate-400">Mẫu: {selectedForm.title}</p>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedForm(null); setAiAnalysis(null); }}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form & AI columns split layout */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Input Form fields */}
              <div className="lg:col-span-7">
                <FormRenderer
                  template={selectedForm}
                  onSubmit={handleFormSubmit}
                  isSubmitting={isSubmitting}
                />
              </div>

              {/* Right Column: Dynamic AI Assessment simulator */}
              <div className="lg:col-span-5 bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-indigo-600 mb-3">
                    <Sparkles size={16} className="animate-pulse" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Phân Tích Đơn Bằng AI (Gemini)</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Hệ thống tích hợp AI tự động kiểm định rủi ro, đánh giá mức độ nghiêm trọng và khuyến nghị số cấp duyệt tối ưu trước khi nộp chính thức.
                  </p>

                  <button
                    type="button"
                    onClick={() => handleTriggerAI(activeFormValues)}
                    disabled={isAnalyzing}
                    className="w-full mt-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles size={13} />
                    <span>{isAnalyzing ? 'AI Đang chấm điểm...' : 'Chạy Thử Nghiệm AI'}</span>
                  </button>

                  {/* AI Results Display */}
                  {aiAnalysis ? (
                    <div className="mt-4 p-3.5 bg-white rounded-lg border border-indigo-100 space-y-3 shadow-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Mức Độ Phức Tạp:</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            aiAnalysis.complexity === 'Nghiêm trọng'
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : aiAnalysis.complexity === 'Trung bình'
                                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          }`}>
                            {aiAnalysis.complexity || 'Thấp'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">({aiAnalysis.suggestedStagesCount || 1} cấp duyệt khuyến nghị)</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Đánh Giá Giải Trình:</span>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed bg-slate-50 p-2 rounded italic">
                          "{aiAnalysis.explanation}"
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Đề Xuất Phê Duyệt Cho Sếp:</span>
                        <p className="text-[11px] text-indigo-950 font-medium leading-relaxed bg-indigo-50/50 p-2.5 rounded-lg">
                          {aiAnalysis.aiRecommendation}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 border border-dashed border-slate-200 rounded-lg text-center py-10 text-slate-400">
                      <Info size={20} className="mx-auto text-slate-300 stroke-1 mb-1.5" />
                      <p className="text-[10px]">Chưa có kết quả phân tích thử nghiệm.</p>
                    </div>
                  )}
                </div>

                <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-6 border-t border-slate-100 pt-2.5 font-mono">
                  <span>Power by Gemini-3.5-Flash</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Printable PDF Admin Decision Document Overlay Modal */}
      {printDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[90vh]">
            {/* Header controls */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs font-bold text-slate-700">Mẫu In Văn Bản Quyết Định Phê Duyệt</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadWorkflowTextFile(printDoc)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Tải tệp tin văn bản thành phẩm (.txt) chứa chữ ký điện tử và dấu mộc đỏ"
                >
                  <Download size={13} />
                  <span>Tải File Text (.TXT)</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Kích hoạt in cứng / Lưu PDF</span>
                </button>
                <button
                  onClick={() => setPrintDoc(null)}
                  className="p-1 hover:bg-slate-200 rounded-full text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Document Content Box */}
            <div className="flex-1 overflow-y-auto p-10 bg-white" id="printable-area">
              <div className="max-w-xl mx-auto space-y-6 text-black font-serif leading-relaxed">
                {/* Official Header */}
                <div className="flex justify-between items-start text-xs font-bold uppercase tracking-tight">
                  <div className="text-center font-sans space-y-0.5">
                    <p className="text-[11px]">CÔNG TY CỔ PHẦN CÔNG NGHỆ WORKFLOW</p>
                    <p className="text-[9px] font-medium text-slate-500">Mã Số Doanh Nghiệp: 010928312</p>
                  </div>
                  <div className="text-center font-sans space-y-1">
                    <p className="text-[11px]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className="text-[10px] font-medium underline">Độc lập - Tự do - Hạnh phúc</p>
                  </div>
                </div>

                <div className="text-right text-[10px] italic font-sans text-slate-500">
                  Hà Nội, ngày {new Date(printDoc.createdAt).getDate()} tháng {new Date(printDoc.createdAt).getMonth() + 1} năm {new Date(printDoc.createdAt).getFullYear()}
                </div>

                {/* Document Code */}
                <div className="text-center space-y-1">
                  <h1 className="text-md font-bold uppercase tracking-wide">QUYẾT ĐỊNH PHÊ DUYỆT HÀNH CHÍNH</h1>
                  <p className="text-[11px] italic font-sans text-slate-600">Số: {printDoc.id.toUpperCase()}/QĐ-WF</p>
                </div>

                {/* Subheader rules */}
                <div className="text-xs space-y-2 font-sans text-slate-800 leading-relaxed">
                  <p><i>- Căn cứ Luật Lao động nước Cộng hòa Xã hội Chủ nghĩa Việt Nam hiện hành.</i></p>
                  <p><i>- Căn cứ Điều lệ vận hành và Quản lý tài chính - hành chính nội bộ của Công ty CP Công nghệ Workflow.</i></p>
                  <p><i>- Căn cứ vào nội dung tờ trình đã qua kiểm duyệt số cấp tự động thuộc biểu mẫu: <b>{printDoc.formTitle}</b> của nhân viên.</i></p>
                </div>

                {/* Main Decisions Block */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase border-b border-black pb-1">BẢN QUYẾT ĐỊNH</h3>
                  
                  <div className="text-xs space-y-3 font-sans leading-relaxed text-slate-900">
                    <p>
                      <b>Điều 1:</b> Phê duyệt chính thức và áp dụng các thông số đính kèm của đơn từ đối với nhân sự:
                    </p>
                    
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 gap-y-2.5 font-sans text-xs">
                      <div><b>Họ và tên:</b> {printDoc.submitterName}</div>
                      <div><b>Phòng ban:</b> {printDoc.submitterDepartment}</div>
                      <div><b>Vai trò:</b> {printDoc.submitterRole.toUpperCase()}</div>
                      <div><b>Trạng thái duyệt:</b> <span className={`font-bold uppercase ${
                        printDoc.status === 'approved' 
                          ? 'text-emerald-600' 
                          : printDoc.status === 'rejected' 
                            ? 'text-rose-600' 
                            : 'text-amber-500'
                      }`}>
                        {printDoc.status === 'approved' 
                          ? 'Đã duyệt hoàn tất' 
                          : printDoc.status === 'rejected' 
                            ? 'Bị từ chối' 
                            : 'Chờ ký duyệt'}
                      </span></div>
                      
                      <div className="col-span-2 border-t border-slate-200/60 pt-2.5">
                        <span className="font-bold block text-slate-700">Dữ liệu tờ trình đã nộp:</span>
                        <div className="mt-1.5 grid grid-cols-1 gap-1 pl-3 border-l-2 border-indigo-500 text-slate-600">
                          {Object.entries(printDoc.submissionData).map(([key, val]) => (
                            <div key={key}>• <span className="font-medium">{key}:</span> {String(val)}</div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <p>
                      <b>Điều 2:</b> Ban quản trị, Phòng nhân sự, và cá nhân ông/bà <b>{printDoc.submitterName}</b> có trách nhiệm thi hành đúng các nội dung đã cam kết nêu trong đơn từ bắt đầu từ thời điểm quyết định này có hiệu lực hành chính.
                    </p>
                    
                    <p>
                      <b>Điều 3:</b> Quyết định này có hiệu lực chính thức kể từ ngày ký.
                    </p>
                  </div>
                </div>

                {/* Signatures Footer */}
                <div className="pt-8 grid grid-cols-2 text-center text-xs font-sans">
                  <div>
                    <p className="font-bold">ĐẠI DIỆN PHÒNG NHÂN SỰ</p>
                    <p className="text-[10px] text-slate-500 italic mt-0.5">(Ký và ghi rõ họ tên)</p>
                    <div className="h-16 flex items-center justify-center">
                      <span className="text-[11px] font-mono font-bold text-slate-300">ADMIN SEALED</span>
                    </div>
                    <p className="font-semibold text-slate-800">Phạm Hồng Hạnh</p>
                  </div>
                  <div>
                    <p className="font-bold">BAN GIÁM ĐỐC QUYẾT ĐỊNH</p>
                    <p className="text-[10px] text-slate-500 italic mt-0.5">(Ký và đóng dấu)</p>
                    <div className="h-16 flex items-center justify-center relative">
                      {/* Decorative Approved Stamp - only visible after actual approval */}
                      {printDoc.status === 'approved' ? (
                        <div className="border-4 border-double border-red-500 text-red-500 font-bold px-3 py-1 text-[11px] rounded rotate-6 absolute font-mono tracking-widest bg-white/80 animate-fade-in">
                          WORKFLOW APPROVED
                        </div>
                      ) : printDoc.status === 'rejected' ? (
                        <div className="border-4 border-double border-rose-600 text-rose-600 font-bold px-3 py-1 text-[11px] rounded rotate-6 absolute font-mono tracking-widest bg-white/80">
                          DENIED / BÁC BỎ
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono font-medium text-slate-400 italic">
                          (Chờ chữ ký số & mộc đỏ)
                        </span>
                      )}
                    </div>
                    {printDoc.status === 'approved' ? (
                      <p className="font-semibold text-slate-800">Vũ Hoàng Sơn</p>
                    ) : printDoc.status === 'rejected' ? (
                      <p className="font-semibold text-rose-600">Bác bỏ bởi Vũ Hoàng Sơn</p>
                    ) : (
                      <p className="text-slate-400 italic text-[11px]">Chờ ký duyệt...</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Approval Flow Canvas Modal Overlay */}
      {selectedRequestForCanvas && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-w-4xl w-full flex flex-col overflow-hidden max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                  <GitFork size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Theo Dõi Sơ Đồ Quy Trình Phê Duyệt</h3>
                  <p className="text-[10px] text-slate-400">Mã đơn: {selectedRequestForCanvas.id} • Tiêu đề: {selectedRequestForCanvas.formTitle}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRequestForCanvas(null)}
                className="p-1 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto bg-slate-950/25">
              <WorkflowCanvas 
                request={selectedRequestForCanvas}
                workflows={workflows}
                users={users}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedRequestForCanvas(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Đóng sơ đồ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
