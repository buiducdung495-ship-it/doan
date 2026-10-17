import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Send, 
  Sparkles, 
  Type, 
  List, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Trash2,
  FileText,
  AlignLeft,
  FileClock,
  Clipboard,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  FolderOpen,
  X
} from 'lucide-react';
import { User, WorkflowRequest } from '../types';

interface FormBuilderProps {
  forms: any[];
  requests: WorkflowRequest[];
  onSaveForm?: (form: any) => Promise<void>;
  onSubmitRequest?: (formTemplateId: string, values: Record<string, any>) => Promise<void>;
  userId: string;
  currentUser: User;
}

interface CanvasField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date';
  label: string;
  value: any;
  options?: string[];
}

interface FormDraft {
  id: string;
  title: string;
  fields: CanvasField[];
  signatureImage: string | null;
  updatedAt: string;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({ 
  requests, 
  onSubmitRequest, 
  currentUser 
}) => {
  // Main tabs: 'editor' (Biên tập & Gửi đơn) and 'history' (Lịch sử viết đơn)
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  
  // History sub-tabs: 'drafts' (Đơn nháp), 'pending' (Đơn chờ duyệt), 'approved' (Đơn đã duyệt)
  const [activeHistoryTab, setActiveHistoryTab] = useState<'drafts' | 'pending' | 'approved'>('drafts');

  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [documentTitle, setDocumentTitle] = useState('ĐƠN XIN NGHỈ PHÉP');
  const [fields, setFields] = useState<CanvasField[]>([]);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);

  // Selected request detail modal
  const [selectedRequest, setSelectedRequest] = useState<WorkflowRequest | null>(null);

  // Drafts state loaded from localStorage
  const [drafts, setDrafts] = useState<FormDraft[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('jin_form_drafts');
    if (saved) {
      try {
        setDrafts(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to load drafts:', err);
      }
    }
  }, []);

  const saveDraftToStorage = (updatedDrafts: FormDraft[]) => {
    setDrafts(updatedDrafts);
    localStorage.setItem('jin_form_drafts', JSON.stringify(updatedDrafts));
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatureImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Prompt Form Generator
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/forms/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, user: currentUser })
      });
      const text_data = await response.text(); let data: any = {}; if (text_data) { try { data = JSON.parse(text_data); } catch(e) { console.error("JSON parse error:", text_data); data = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng." }; } }
      
      if (data && data.title) {
        setDocumentTitle(data.title.toUpperCase());
        setFields(data.fields || []);
      }
    } catch (err) {
      console.error('Failed to parse form with AI', err);
    } finally {
      setIsGenerating(false);
      setAiPrompt('');
    }
  };

  const addField = (type: CanvasField['type']) => {
    const defaultLabels = {
      text: 'Trường văn bản',
      textarea: 'Nội dung chi tiết',
      number: 'Số lượng / Số ngày',
      select: 'Tùy chọn',
      checkbox: 'Xác nhận thông tin',
      date: 'Ngày áp dụng'
    };

    setFields([
      ...fields,
      {
        id: `custom-${Date.now()}`,
        type,
        label: defaultLabels[type],
        value: type === 'checkbox' ? false : '',
        options: type === 'select' ? ['Tùy chọn 1', 'Tùy chọn 2'] : undefined
      }
    ]);
  };

  const updateField = (id: string, prop: keyof CanvasField, value: any) => {
    let newFields = fields.map(f => f.id === id ? { ...f, [prop]: value } : f);
    
    // Auto-calculate days if changing start/end date
    const updatedField = newFields.find(f => f.id === id);
    if (updatedField && updatedField.type === 'date') {
      const startDateField = newFields.find(f => f.label.toLowerCase().includes('ngày bắt đầu') || f.label.toLowerCase().includes('từ ngày'));
      const endDateField = newFields.find(f => f.label.toLowerCase().includes('ngày kết thúc') || f.label.toLowerCase().includes('đến ngày'));
      const numDaysField = newFields.find(f => f.label.toLowerCase().includes('số ngày') || f.label.toLowerCase().includes('ngày nghỉ'));
      
      if (startDateField && endDateField && numDaysField && startDateField.value && endDateField.value) {
        const start = new Date(startDateField.value as string);
        const end = new Date(endDateField.value as string);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          newFields = newFields.map(f => f.id === numDaysField.id ? { ...f, value: diffDays } : f);
        }
      }
    }
    
    setFields(newFields);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  // Submit request (Sends request to backend workflow engine)
  const handleSubmit = async () => {
    if (!onSubmitRequest) return;
    setIsSubmitting(true);
    
    try {
      const submissionData: Record<string, any> = {};
      fields.forEach(f => {
        submissionData[f.label] = f.value;
      });

      // We assign correct form template id based on document title keyword
      let tmplId = 'form-leave'; // default
      const lowerTitle = documentTitle.toLowerCase();
      if (lowerTitle.includes('thiết bị') || lowerTitle.includes('máy tính') || lowerTitle.includes('laptop')) {
        tmplId = 'form-device-request';
      } else if (lowerTitle.includes('tạm ứng') || lowerTitle.includes('chi phí') || lowerTitle.includes('tiền')) {
        tmplId = 'form-payment-advance';
      }

      await onSubmitRequest(tmplId, submissionData);
      
      // Clear fields and show success
      setFields([]);
      setDocumentTitle('ĐƠN ĐỀ NGHỊ MỚI');
      setSignatureImage(null);
      alert('Gửi đơn đề nghị thành công! Trạng thái đang Chờ duyệt.');
      
      // Automatically switch to history -> pending approvals
      setActiveTab('history');
      setActiveHistoryTab('pending');
    } catch (err) {
      console.error(err);
      alert('Gửi đơn thất bại, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save current Document as local Draft
  const handleSaveDraft = () => {
    if (!documentTitle.trim()) {
      alert('Vui lòng điền tiêu đề đơn.');
      return;
    }

    const newDraft: FormDraft = {
      id: `draft-${Date.now()}`,
      title: documentTitle,
      fields: fields,
      signatureImage: signatureImage,
      updatedAt: new Date().toISOString()
    };

    // Remove any previous draft with exact same title or ID to prevent duplicates
    const filtered = drafts.filter(d => d.title !== documentTitle);
    const updated = [newDraft, ...filtered];
    saveDraftToStorage(updated);
    alert('Đã lưu bản thảo vào danh sách Đơn nháp!');
  };

  const handleLoadDraft = (draft: FormDraft) => {
    setDocumentTitle(draft.title);
    setFields(draft.fields || []);
    setSignatureImage(draft.signatureImage);
    setActiveTab('editor'); // Go back to document editor
  };

  const handleDeleteDraft = (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc muốn xóa bản nháp này?')) return;
    const updated = drafts.filter(d => d.id !== draftId);
    saveDraftToStorage(updated);
  };

  // Filter requests submitted by me
  const myRequests = requests.filter(r => r.submitterId === currentUser.id);
  const pendingRequests = myRequests.filter(r => r.status === 'pending');
  const completedRequests = myRequests.filter(r => r.status === 'approved' || r.status === 'rejected');

  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();

  return (
    <div className="flex flex-col h-screen bg-[#f4f7f6] font-sans overflow-hidden">
      
      {/* ---------------- SUB HEADER WITH TAB NAVIGATION ---------------- */}
      <div className="bg-white border-b border-[#e2eae8] px-6 py-3 grid grid-cols-3 items-center shrink-0">
        {/* Left column: Title */}
        <div className="flex items-center gap-3 justify-start">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            Biên tập & Thiết kế biểu mẫu
          </h2>
        </div>

        {/* Center column: Switch Tabs */}
        <div className="flex justify-center">
          <div className="bg-slate-100 p-0.5 rounded-full flex">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'editor' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Biên tập & Viết đơn
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'history' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Lịch sử viết đơn</span>
              {pendingRequests.length > 0 && (
                <span className="bg-amber-500 text-white w-2.5 h-2.5 rounded-full animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Right column: Save Draft (keeps original location) */}
        <div className="flex justify-end">
          {activeTab === 'editor' && (
            <button
              onClick={handleSaveDraft}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Clipboard size={13} />
              <span>Lưu nháp</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------------- MAIN VIEWS CONTAINER ---------------- */}
      <div className="flex-1 overflow-hidden">
        
        {activeTab === 'editor' ? (
          
          /* ================= WORKSPACE EDITOR TAB ================= */
          <div className="flex h-full">
            
            {/* Left AI Assistant Section */}
            <div className="w-80 bg-white border-r border-[#e2eae8] flex flex-col shrink-0">
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/20 to-white">
                <div className="flex items-center space-x-2 text-[#2f80ed] font-bold mb-1">
                  <Sparkles size={16} />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider">Trợ lý viết đơn AI</h3>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Nhập mong muốn của bạn, hệ thống AI tự động soạn biểu mẫu chuẩn chỉnh.</p>
              </div>

              <div className="p-5 space-y-5 overflow-y-auto flex-1">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Yêu cầu biểu mẫu của bạn</label>
                  <textarea
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#2f80ed]/20 focus:outline-none transition-all resize-none font-medium text-slate-600"
                    rows={4}
                    placeholder="Ví dụ: Đơn xin đi muộn về sớm, xin tạm ứng công tác phí 5 triệu đồng..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                  <button
                    onClick={handleAIGenerate}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Đang tạo...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} />
                        <span>Tự động tạo mẫu đơn</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Suggestions Quick Buttons */}
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gợi ý chủ đề nhanh</label>
                  <div className="flex flex-col gap-1.5">
                    {[
                      'Đơn xin nghỉ phép năm',
                      'Đề nghị cấp phát thiết bị làm việc',
                      'Xin tạm ứng công tác phí 10 triệu',
                      'Xin làm việc từ xa (WFH) 3 ngày'
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setAiPrompt(suggestion)}
                        className="text-[11px] bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-left p-2.5 rounded-xl border border-slate-100 transition-all font-bold cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Word Page Canvas */}
            <div className="flex-1 flex flex-col overflow-y-auto p-6 items-center">
              
              {/* Quick Component Inject Bar */}
              <div className="bg-white px-4 py-2.5 rounded-2xl border border-[#e2eae8] shadow-xs flex items-center gap-2 mb-6 max-w-2xl">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-2">Thêm trường:</span>
                <button onClick={() => addField('text')} className="flex items-center gap-1 px-2.5 py-1 hover:bg-slate-50 rounded-lg text-[11px] font-bold text-slate-700 border border-slate-100 transition-all cursor-pointer">
                  <Type size={12} className="text-blue-500" />
                  <span>Chữ ngắn</span>
                </button>
                <button onClick={() => addField('textarea')} className="flex items-center gap-1 px-2.5 py-1 hover:bg-slate-50 rounded-lg text-[11px] font-bold text-slate-700 border border-slate-100 transition-all cursor-pointer">
                  <AlignLeft size={12} className="text-amber-500" />
                  <span>Đoạn văn</span>
                </button>
                <button onClick={() => addField('checkbox')} className="flex items-center gap-1 px-2.5 py-1 hover:bg-slate-50 rounded-lg text-[11px] font-bold text-slate-700 border border-slate-100 transition-all cursor-pointer">
                  <CheckSquare size={12} className="text-emerald-500" />
                  <span>Hộp kiểm</span>
                </button>
                <button onClick={() => addField('select')} className="flex items-center gap-1 px-2.5 py-1 hover:bg-slate-50 rounded-lg text-[11px] font-bold text-slate-700 border border-slate-100 transition-all cursor-pointer">
                  <List size={12} className="text-purple-500" />
                  <span>Danh sách</span>
                </button>
                <button onClick={() => addField('date')} className="flex items-center gap-1 px-2.5 py-1 hover:bg-slate-50 rounded-lg text-[11px] font-bold text-slate-700 border border-slate-100 transition-all cursor-pointer">
                  <CalendarIcon size={12} className="text-rose-500" />
                  <span>Ngày tháng</span>
                </button>
              </div>

              {/* Document Layout - Paper form */}
              <div className="w-full max-w-2xl bg-white min-h-[842px] border border-slate-200 shadow-sm p-12 md:p-16 flex flex-col relative">
                
                {/* Nation Header Banner */}
                <div className="text-center mb-8">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Cộng hòa xã hội chủ nghĩa Việt Nam</h4>
                  <p className="font-bold text-slate-700 text-[11px] underline underline-offset-4 mt-0.5">Độc lập - Tự do - Hạnh phúc</p>
                  <p className="text-[11px] text-slate-400 italic mt-4 text-right">Hà Nội, ngày {day} tháng {month} năm {year}</p>
                </div>

                {/* Editable Main Title of Document */}
                <div className="text-center mb-10 border-b border-transparent hover:border-slate-100">
                  <input
                    type="text"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value.toUpperCase())}
                    className="text-center font-black text-slate-800 text-lg w-full border-none focus:outline-none focus:ring-0 placeholder-slate-300 uppercase"
                    placeholder="NHẬP TIÊU ĐỀ ĐƠN ĐỀ NGHỊ"
                  />
                </div>

                {/* Main Fields Area */}
                <div className="space-y-6 flex-1">
                  {fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                      <FileText size={36} className="opacity-20 mb-3 text-blue-500" />
                      <p className="text-xs font-bold text-slate-500">Mẫu đơn chưa có nội dung</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-xs">Sử dụng Trợ lý AI ở bên trái hoặc các nút công cụ để thêm trường thông tin.</p>
                    </div>
                  ) : (
                    fields.map((field) => (
                      <div key={field.id} className="group flex flex-col md:flex-row md:items-start gap-3 relative pb-2 border-b border-slate-50">
                        
                        {/* Label */}
                        <div className="md:w-1/3 pt-1">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(field.id, 'label', e.target.value)}
                            className="font-bold text-xs text-slate-700 w-full bg-transparent focus:outline-none border-b border-transparent hover:border-slate-200 focus:border-blue-500"
                            placeholder="Nhập nhãn trường..."
                          />
                        </div>

                        {/* Input Value */}
                        <div className="flex-1 relative">
                          {field.type === 'textarea' ? (
                            <textarea
                              value={field.value || ''}
                              onChange={(e) => updateField(field.id, 'value', e.target.value)}
                              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 focus:border-[#2f80ed] focus:ring-1 focus:ring-[#2f80ed] bg-slate-50 focus:bg-white resize-y outline-none"
                              rows={3}
                              placeholder="Nhập thông tin chi tiết..."
                            />
                          ) : field.type === 'checkbox' ? (
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="checkbox"
                                checked={!!field.value}
                                onChange={(e) => updateField(field.id, 'value', e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                              />
                              <span className="text-xs font-bold text-slate-500 italic">Đã xác nhận chính xác</span>
                            </div>
                          ) : field.type === 'select' ? (
                            <div className="space-y-2">
                              <select
                                value={field.value || ''}
                                onChange={(e) => updateField(field.id, 'value', e.target.value)}
                                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 bg-slate-50 outline-none cursor-pointer"
                              >
                                <option value="">-- Lựa chọn --</option>
                                {field.options?.map((opt, idx) => (
                                  <option key={idx} value={opt}>{opt}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={field.options?.join(', ') || ''}
                                onChange={(e) => updateField(field.id, 'options', e.target.value.split(',').map(s => s.trim()))}
                                className="text-[10px] text-slate-400 font-bold bg-transparent border-b border-dashed border-slate-200 focus:outline-none pb-1 w-full"
                                placeholder="Cách nhau bằng dấu phẩy, vd: Nghỉ phép năm, Nghỉ việc riêng..."
                              />
                            </div>
                          ) : field.type === 'date' ? (
                            <input
                              type="date"
                              value={field.value || ''}
                              onChange={(e) => updateField(field.id, 'value', e.target.value)}
                              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 bg-slate-50 focus:bg-white focus:border-[#2f80ed] focus:ring-1 focus:ring-[#2f80ed] outline-none font-mono"
                            />
                          ) : (
                            <input
                              type={field.type}
                              value={field.value || ''}
                              onChange={(e) => updateField(field.id, 'value', e.target.value)}
                              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 bg-slate-50 focus:bg-white focus:border-[#2f80ed] focus:ring-1 focus:ring-[#2f80ed] outline-none"
                              placeholder="Điền nội dung..."
                            />
                          )}

                          {/* Quick delete icon on hover */}
                          <button
                            onClick={() => removeField(field.id)}
                            className="absolute -right-8 top-1 p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:bg-rose-50 rounded"
                            title="Xóa trường này"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                      </div>
                    ))
                  )}
                </div>

                {/* Hand Signatures footer */}
                <div className="mt-12 pt-8 grid grid-cols-2 gap-6 border-t border-slate-100">
                  <div className="text-center relative">
                    <p className="font-bold text-slate-700 text-xs">Người đề xuất</p>
                    <p className="text-[10px] text-slate-400 italic mt-0.5">(Ký và xác nhận)</p>
                    
                    <div className="h-20 flex items-center justify-center relative mt-2 group">
                      {signatureImage ? (
                        <img src={signatureImage} alt="Chữ ký" className="max-h-16 object-contain mix-blend-multiply" />
                      ) : (
                        <div className="p-2 border border-dashed border-blue-100 rounded-xl bg-blue-50/20 text-center flex flex-col items-center justify-center">
                          <span className="text-[9px] font-extrabold text-blue-600 tracking-wider">CHỮ KÝ ĐIỆN TỬ</span>
                          <span className="text-[8px] text-slate-400 font-mono mt-0.5">Mã: {currentUser.id.toUpperCase()}</span>
                        </div>
                      )}

                      {/* Overwrite or sign upload box */}
                      <label className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer border border-dashed border-slate-300 rounded-xl backdrop-blur-2xs">
                        <span className="bg-white text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs border border-blue-50">
                          {signatureImage ? 'Thay chữ ký' : 'Tải chữ ký tay'}
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
                      </label>
                    </div>

                    <p className="font-extrabold text-slate-800 text-xs mt-1">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{currentUser.department}</p>
                  </div>

                  <div className="text-center flex flex-col justify-between opacity-55">
                    <div>
                      <p className="font-bold text-slate-700 text-xs">Ban Giám đốc</p>
                      <p className="text-[10px] text-slate-400 italic mt-0.5">(Xét duyệt hồ sơ)</p>
                    </div>
                    <div className="pb-4">
                      <span className="text-[10px] text-slate-400 italic">Chờ phê duyệt tự động...</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        ) : (
          
          /* ================= HISTORICAL DOCUMENTS TAB ================= */
          <div className="h-full overflow-y-auto p-6 max-w-5xl mx-auto space-y-6">
            
            {/* Horizontal Subtabs for Document History categories */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveHistoryTab('drafts')}
                className={`pb-3 px-5 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-1.5 cursor-pointer ${
                  activeHistoryTab === 'drafts' 
                    ? 'border-blue-600 text-blue-600 font-extrabold' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Đơn nháp</span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-bold">
                  {drafts.length}
                </span>
              </button>
              <button
                onClick={() => setActiveHistoryTab('pending')}
                className={`pb-3 px-5 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-1.5 cursor-pointer ${
                  activeHistoryTab === 'pending' 
                    ? 'border-blue-600 text-blue-600 font-extrabold' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Đơn chờ xét duyệt</span>
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[9px] font-bold">
                  {pendingRequests.length}
                </span>
              </button>
              <button
                onClick={() => setActiveHistoryTab('approved')}
                className={`pb-3 px-5 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-1.5 cursor-pointer ${
                  activeHistoryTab === 'approved' 
                    ? 'border-blue-600 text-blue-600 font-extrabold' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Đơn đã duyệt</span>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-bold">
                  {completedRequests.length}
                </span>
              </button>
            </div>

            {/* Sub-tab views content */}
            {activeHistoryTab === 'drafts' && (
              <div className="space-y-3.5">
                {drafts.length > 0 ? (
                  drafts.map((d) => (
                    <div 
                      key={d.id}
                      onClick={() => handleLoadDraft(d)}
                      className="bg-white border border-slate-150 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition-all flex justify-between items-center cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-50 w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shrink-0">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs uppercase group-hover:text-blue-600 transition-colors">
                            {d.title}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                            Cập nhật cuối: {new Date(d.updatedAt).toLocaleString('vi-VN')} · {d.fields?.length || 0} trường nội dung
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleLoadDraft(d); }}
                          className="px-3 py-1.5 hover:bg-blue-50 text-blue-600 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <FolderOpen size={12} />
                          <span>Mở soạn đơn</span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteDraft(d.id, e)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa bản thảo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs font-bold">
                    Không có đơn nháp nào được lưu. Bạn có thể lưu nháp khi đang biên tập mẫu đơn.
                  </div>
                )}
              </div>
            )}

            {activeHistoryTab === 'pending' && (
              <div className="space-y-3.5">
                {pendingRequests.length > 0 ? (
                  pendingRequests.map((r) => (
                    <div 
                      key={r.id}
                      onClick={() => setSelectedRequest(r)}
                      className="bg-white border border-slate-150 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition-all flex justify-between items-center cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-50 text-amber-500 w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                          <Clock size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs uppercase group-hover:text-blue-600 transition-colors">
                            {r.formTitle}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                            Ngày nộp: {new Date(r.createdAt).toLocaleDateString('vi-VN')} · Giai đoạn hiện tại: {r.currentStageIndex + 1}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 border border-amber-100 text-amber-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                          <span>CHỜ XÉT DUYỆT</span>
                        </span>
                        <ArrowUpRight size={14} className="text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs font-bold">
                    Không có đơn đề nghị nào đang trong trạng thái chờ xét duyệt.
                  </div>
                )}
              </div>
            )}

            {activeHistoryTab === 'approved' && (
              <div className="space-y-3.5">
                {completedRequests.length > 0 ? (
                  completedRequests.map((r) => (
                    <div 
                      key={r.id}
                      onClick={() => setSelectedRequest(r)}
                      className="bg-white border border-slate-150 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition-all flex justify-between items-center cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          r.status === 'approved' 
                            ? 'bg-emerald-50 text-emerald-500' 
                            : 'bg-rose-50 text-rose-500'
                        }`}>
                          {r.status === 'approved' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs uppercase group-hover:text-blue-600 transition-colors">
                            {r.formTitle}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                            Hoàn thành ngày: {new Date(r.updatedAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {r.status === 'approved' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 border border-emerald-100 text-emerald-600">
                            ĐÃ DUYỆT
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 border border-rose-100 text-rose-600">
                            BÁC BỎ
                          </span>
                        )}
                        <ArrowUpRight size={14} className="text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs font-bold">
                    Không tìm thấy dữ liệu đơn đã được phê duyệt hoặc bác bỏ trước đây.
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {/* ---------------- READ-ONLY REQUEST VIEW MODAL ---------------- */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto animate-slide-up relative space-y-4">
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-3 uppercase tracking-wider">
              Chi tiết hồ sơ trình duyệt
            </h3>

            <div className="p-5 border border-slate-150 rounded-2xl bg-slate-50/50 space-y-3 text-xs text-slate-600">
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="font-bold">Mẫu đơn:</span>
                <span className="font-bold text-slate-800 uppercase">{selectedRequest.formTitle}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="font-bold">Mã đề xuất:</span>
                <span className="font-mono font-bold text-slate-500">{selectedRequest.id.toUpperCase()}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="font-bold">Người gửi:</span>
                <span className="font-bold text-slate-800">{selectedRequest.submitterName} ({selectedRequest.submitterDepartment})</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="font-bold">Trạng thái hiện tại:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                  selectedRequest.status === 'pending' 
                    ? 'bg-amber-100 text-amber-700' 
                    : selectedRequest.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {selectedRequest.status === 'pending' ? 'CHỜ DUYỆT' : selectedRequest.status === 'approved' ? 'ĐÃ PHÊ DUYỆT' : 'BÁC BỎ'}
                </span>
              </div>

              {/* Submitted fields data */}
              <div className="pt-2">
                <p className="font-bold text-slate-700 mb-2">Nội dung đã khai báo:</p>
                <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-2">
                  {Object.entries(selectedRequest.submissionData || {}).map(([key, val]) => (
                    <div key={key} className="flex gap-2">
                      <span className="font-bold text-slate-500 shrink-0">{key}:</span>
                      <span className="text-slate-800 font-bold">{val !== null && typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Approval history log */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-700 text-xs">Lịch sử phê duyệt quy trình:</h4>
              <div className="space-y-2.5">
                {selectedRequest.approvalHistory && selectedRequest.approvalHistory.length > 0 ? (
                  selectedRequest.approvalHistory.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        item.action === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`} />
                      <div>
                        <p className="font-bold text-slate-700">
                          {item.approverName} ({item.approverRole.toUpperCase()})
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold">
                          Đã {item.action === 'approved' ? 'Phê duyệt' : 'Bác bỏ'} ngày {new Date(item.timestamp).toLocaleString('vi-VN')}
                        </p>
                        {item.comment && (
                          <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            Ý kiến: "{item.comment}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic text-[11px]">Chưa có phản hồi phê duyệt từ cấp quản lý.</p>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Submit Button in bottom-right corner */}
      {activeTab === 'editor' && (
        <button
          onClick={handleSubmit}
          disabled={fields.length === 0 || isSubmitting}
          className="fixed bottom-6 right-6 z-50 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-full text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 duration-200"
          title="Gửi đơn lên cấp trên phê duyệt"
        >
          <Send size={15} />
          <span>Gửi đơn duyệt</span>
        </button>
      )}

    </div>
  );
};
