import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { 
  FileText, Plus, FileEdit, Trash2, Search, Download, Upload, Inbox, Sparkles, RefreshCw, 
  Filter, SlidersHorizontal, Calendar, ShieldAlert, AlertCircle, X, ChevronDown, ChevronUp,
  Paperclip, Eye, RotateCw, ZoomIn, ZoomOut, CheckCircle2, FileCode, FileSpreadsheet, Printer, ExternalLink,
  UserCheck, Clock, ClipboardList, Send, BarChart3, PieChart, TrendingUp, Award,
  PenTool, Key, Check, Share2, ShieldCheck, CheckSquare
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { printDocument } from '../utils/printDocument';
import { SignatureCanvas } from './SignatureCanvas';

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'image' | 'text' | 'word' | 'excel';
  url: string; // Base64 or mock URL
  content?: string; // Rich sample contents for the visual previewer
}

export interface DocumentAssignment {
  id: string;
  assigneeId: string; // ID of the user assigned
  assignedBy: string; // ID of the user who assigned it
  assignedAt: string;
  dueDate: string;
  instructions: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  feedback?: string;
  updatedAt?: string;
}

export interface DocumentHistoryEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'create' | 'edit' | 'assign' | 'update_progress' | 'delete';
  details: string;
  timestamp: string;
}

export interface InternalDocument {
  id: string;
  title: string;
  docNumber: string; // Số hiệu công văn
  type: 'notice' | 'decision' | 'regulation' | 'plan' | 'report' | 'minutes';
  category: 'incoming' | 'outgoing' | 'internal';
  content: string;
  departmentId: string;
  creatorId: string;
  status: 'draft' | 'published';
  createdAt: string;
  documentDate: string; // Ngày văn bản
  confidentiality: 'normal' | 'confidential' | 'secret'; // Độ mật
  urgency: 'normal' | 'urgent' | 'very_urgent'; // Độ khẩn
  attachments?: Attachment[];
  assignments?: DocumentAssignment[];
  history?: DocumentHistoryEntry[];
  isSigned?: boolean;
  signedBy?: string;
  signedAt?: string;
  signatureHash?: string;
  signatureType?: string;
  signatureValue?: string;
  stampType?: string;
  linkedTaskId?: string;
  version?: number; // Quản lý phiên bản
  retentionPeriod?: '5_years' | '10_years' | '20_years' | 'permanent'; // Thời hạn lưu trữ
  isInterconnected?: boolean; // Liên thông văn bản
}

interface InternalDocumentManagerProps {
  currentUser: User;
  users: User[];
}

export const InternalDocumentManager: React.FC<InternalDocumentManagerProps> = ({ currentUser, users }) => {
  const [documents, setDocuments] = useState<InternalDocument[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<InternalDocument | null>(null);
  const [formData, setFormData] = useState<Partial<InternalDocument>>({});
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'internal' | 'statistics'>('internal');
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Search & Filter state variables
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDocNumber, setSearchDocNumber] = useState('');
  const [filterConfidentiality, setFilterConfidentiality] = useState<string>('all');
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  // Chức năng 3: Interactive File Preview & Attachment States
  const [previewDoc, setPreviewDoc] = useState<InternalDocument | null>(null);
  const [activeAttachment, setActiveAttachment] = useState<Attachment | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [rotateAngle, setRotateAngle] = useState(0);
  const [pdfPage, setPdfPage] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chức năng 4: State variables for Work Assignments (Phân công xử lý)
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assigneeId, setAssigneeId] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignInstructions, setAssignInstructions] = useState('');
  const [updatingAssignmentId, setUpdatingAssignmentId] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'pending' | 'processing' | 'completed' | 'rejected'>('processing');
  const [updateFeedback, setUpdateFeedback] = useState('');

  // Chức năng 7: State variables for Digital Sign-off and Cross-Module Linkage
  const [isSigningOpen, setIsSigningOpen] = useState(false);
  const [signType, setSignType] = useState<'draw' | 'type' | 'token'>('draw');
  const [typedSignName, setTypedSignName] = useState(currentUser.name);
  const [cursiveStyle, setCursiveStyle] = useState<number>(0);
  const [selectedTokenCert, setSelectedTokenCert] = useState('SIO-CA SHA256 (Hội đồng quản trị)');
  const [tokenPin, setTokenPin] = useState('');
  const [selectedStamp, setSelectedStamp] = useState('official'); // 'official' | 'secret' | 'urgent'
  const [linkTaskName, setLinkTaskName] = useState('');
  const [linkTaskDesc, setLinkTaskDesc] = useState('');
  const [linkTaskAssignee, setLinkTaskAssignee] = useState(currentUser.id);
  const [showTaskLinkModal, setShowTaskLinkModal] = useState(false);
  const [showChatShareModal, setShowChatShareModal] = useState(false);
  const [chatRoomSelection, setChatRoomSelection] = useState('general');
  const [customChatMessage, setCustomChatMessage] = useState('');

  // Chức năng 5: Nhật ký tác động & Lịch sử chỉnh sửa (Audit Trail) helper
  const createHistoryEntry = (
    action: DocumentHistoryEntry['action'],
    details: string
  ): DocumentHistoryEntry => {
    return {
      id: uuidv4(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role === 'admin' ? 'Quản trị viên' : currentUser.role === 'manager' ? 'Cấp quản lý' : 'Nhân viên',
      action,
      details,
      timestamp: new Date().toISOString()
    };
  };

  // Chức năng 4: Phân công xử lý Công văn đến
  const handleAssignTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewDoc || !assigneeId) return;

    const newAssignment: DocumentAssignment = {
      id: uuidv4(),
      assigneeId,
      assignedBy: currentUser.id,
      assignedAt: new Date().toISOString(),
      dueDate: assignDueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      instructions: assignInstructions,
      status: 'pending'
    };

    const targetUser = users.find(u => u.id === assigneeId);
    const assigneeName = targetUser?.name || 'Cán bộ';
    const historyEntry = createHistoryEntry(
      'assign', 
      `Phân công xử lý cho ${assigneeName}. Hạn xử lý: ${newAssignment.dueDate}. Chỉ đạo: "${assignInstructions || 'Không có'}"`
    );

    const updatedDoc: InternalDocument = {
      ...previewDoc,
      assignments: [...(previewDoc.assignments || []), newAssignment],
      history: [historyEntry, ...(previewDoc.history || [])]
    };

    const updatedDocs = documents.map(doc => doc.id === previewDoc.id ? updatedDoc : doc);
    saveDocuments(updatedDocs);
    setPreviewDoc(updatedDoc); // update visual state in-place!
    
    // reset form
    setShowAssignForm(false);
    setAssigneeId('');
    setAssignDueDate('');
    setAssignInstructions('');
  };

  const handleUpdateAssignment = (assignmentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!previewDoc) return;

    const updatedAssignments = (previewDoc.assignments || []).map(asg => {
      if (asg.id === assignmentId) {
        return {
          ...asg,
          status: updateStatus,
          feedback: updateFeedback,
          updatedAt: new Date().toISOString()
        };
      }
      return asg;
    });

    const statusLabels: Record<string, string> = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      completed: 'Đã hoàn thành',
      rejected: 'Từ chối'
    };
    
    const details = `Cập nhật tiến độ xử lý thành "${statusLabels[updateStatus]}". Phản hồi: "${updateFeedback}"`;
    const historyEntry = createHistoryEntry('update_progress', details);

    const updatedDoc: InternalDocument = {
      ...previewDoc,
      assignments: updatedAssignments,
      history: [historyEntry, ...(previewDoc.history || [])]
    };

    const updatedDocs = documents.map(doc => doc.id === previewDoc.id ? updatedDoc : doc);
    saveDocuments(updatedDocs);
    setPreviewDoc(updatedDoc); // update visual state in-place!

    // reset edit state
    setUpdatingAssignmentId(null);
    setUpdateFeedback('');
  };

  // Chức năng 7: Business logic for Digital Sign-off & Multi-module integration
  const handleSignConfirm = (signatureValue: string) => {
    if (!previewDoc) return;
    
    // Generate secure fake cryptographic hash for signature validation
    const mockHash = 'sio_sig_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const timestamp = new Date().toISOString();
    
    const signatureData = {
      signerName: currentUser.name,
      signerRole: currentUser.role === 'admin' ? 'Chủ tịch HĐQT / Quản trị viên' : currentUser.role === 'manager' ? 'Giám đốc Điều hành / Trưởng bộ phận' : 'Nhân viên Ủy quyền',
      signatureType: signType === 'draw' ? 'Ký vẽ tay trực tiếp' : signType === 'type' ? 'Ký tên mẫu chữ viết' : 'Khóa USB Token số hóa',
      signatureValue: signatureValue,
      stampType: selectedStamp === 'official' ? 'Dấu tròn Pháp nhân SIO' : selectedStamp === 'secret' ? 'Dấu MẬT (Confidential)' : 'Dấu HỎA TỐC (Very Urgent)',
      hash: mockHash,
      timestamp: timestamp
    };

    const historyEntry = createHistoryEntry(
      'edit', 
      `Ký số xác thực văn bản thành công. Người ký: ${signatureData.signerName} (${signatureData.signerRole}). Loại chữ ký: ${signatureData.signatureType}. Dấu đóng: ${signatureData.stampType}. Mã xác thực: ${mockHash.substring(0, 16)}...`
    );

    const updatedDoc: InternalDocument = {
      ...previewDoc,
      status: 'published' as const, // Automatically publish upon signing
      isSigned: true,
      signedBy: currentUser.id,
      signedAt: timestamp,
      signatureHash: mockHash,
      signatureType: signType,
      signatureValue: signatureValue,
      stampType: selectedStamp,
      history: [historyEntry, ...(previewDoc.history || [])]
    };

    const updatedDocs = documents.map(d => d.id === previewDoc.id ? updatedDoc : d);
    saveDocuments(updatedDocs);
    setPreviewDoc(updatedDoc); // refresh visual preview!

    setIsSigningOpen(false);
    alert('Ký số & Đóng dấu điện tử thành công! Văn bản đã được ban hành chính thức.');
  };

  const handleCreateLinkedTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewDoc) return;

    try {
      // POST directly to our real-world system tasks API
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: linkTaskName || `Xử lý công văn: ${previewDoc.title}`,
          description: linkTaskDesc || `Cần xử lý công văn số ${previewDoc.docNumber}.\nNội dung công văn: ${previewDoc.content}`,
          assigneeId: linkTaskAssignee,
          creatorId: currentUser.id,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'todo',
          priority: previewDoc.urgency === 'very_urgent' ? 'high' : previewDoc.urgency === 'urgent' ? 'medium' : 'low'
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create task through API');
      }

      const text_createdTask = await res.text(); let createdTask: any = {}; if (text_createdTask) { try { createdTask = JSON.parse(text_createdTask); } catch(e) { console.error("JSON parse error:", text_createdTask); createdTask = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng." }; } }
      const taskId = createdTask.id || `task-${Date.now()}`;

      // Update document history to note the linkage
      const historyEntry = createHistoryEntry(
        'edit', 
        `Đã liên kết chuyển tiếp công văn thành công việc [${taskId}] giao cho nhân viên xử lý.`
      );

      const updatedDoc: InternalDocument = {
        ...previewDoc,
        linkedTaskId: taskId,
        history: [historyEntry, ...(previewDoc.history || [])]
      };

      const updatedDocs = documents.map(d => d.id === previewDoc.id ? updatedDoc : d);
      saveDocuments(updatedDocs);
      setPreviewDoc(updatedDoc);

      setShowTaskLinkModal(false);
      alert(`Đã liên kết và tạo thành công Công việc ${taskId} trong hệ thống! Bạn có thể chuyển sang tab Dự án & Nhiệm vụ để theo dõi.`);
    } catch (err: any) {
      console.error(err);
      alert('Có lỗi xảy ra khi tạo công việc thông qua API: ' + err.message);
    }
  };

  const handleShareToChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewDoc) return;

    try {
      const recipientId = chatRoomSelection === 'general' ? 'all' : `dept:${currentUser.department}`;
      const content = customChatMessage || `📢 Tôi xin chia sẻ công văn mới số ${previewDoc.docNumber}: "${previewDoc.title}". Đề nghị các bộ phận liên quan xem và phối hợp xử lý gấp.`;

      // POST to our real chat messages API
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role === 'admin' ? 'Quản trị viên' : 'Cấp quản lý',
          recipientId: recipientId,
          content: `${content}\n\n🔗 [LIÊN KẾT CÔNG VĂN SỐ: ${previewDoc.docNumber}] - Tiêu đề: "${previewDoc.title}"`
        })
      });

      if (!res.ok) {
        throw new Error('Failed to post chat message through API');
      }

      // Log to history
      const historyEntry = createHistoryEntry(
        'edit', 
        `Đã chia sẻ liên kết công văn vào kênh trò chuyện nhóm: "${chatRoomSelection === 'general' ? 'Kênh Chung Toàn Công Ty' : 'Kênh Phòng Ban Nội Bộ'}"`
      );

      const updatedDoc: InternalDocument = {
        ...previewDoc,
        history: [historyEntry, ...(previewDoc.history || [])]
      };

      const updatedDocs = documents.map(d => d.id === previewDoc.id ? updatedDoc : d);
      saveDocuments(updatedDocs);
      setPreviewDoc(updatedDoc);

      setShowChatShareModal(false);
      alert('Đã chia sẻ thành công liên kết công văn lên kênh trò chuyện!');
    } catch (err: any) {
      console.error(err);
      alert('Có lỗi xảy ra khi chia sẻ qua API chat: ' + err.message);
    }
  };

  useEffect(() => {
    const savedDocs = localStorage.getItem('sio_internal_docs_v2');
    if (savedDocs) {
      try {
        const parsed = JSON.parse(savedDocs);
      // Ensure all migrated docs have attachments, assignments & history
      const migrated = parsed.map((doc: any, index: number) => {
        const docDate = doc.documentDate || doc.createdAt.split('T')[0];
        const creatorName = users.find(u => u.id === (doc.creatorId || currentUser.id))?.name || 'Hệ thống';
        const defaultHistory: DocumentHistoryEntry[] = [
          {
            id: `h-mig-${doc.id}`,
            userId: doc.creatorId || currentUser.id,
            userName: creatorName,
            userRole: 'Hệ thống',
            action: 'create',
            details: 'Khởi tạo văn bản trên hệ thống',
            timestamp: doc.createdAt || new Date().toISOString()
          }
        ];

        return {
          ...doc,
          docNumber: doc.docNumber || `CV-0${index + 1}/VP-BOD`,
          documentDate: docDate,
          confidentiality: doc.confidentiality || 'normal',
          urgency: doc.urgency || 'normal',
          attachments: doc.attachments || getDefaultAttachments(doc.type, doc.title, docDate),
          assignments: doc.assignments || [],
          history: doc.history || defaultHistory
        };
      });
      setDocuments(migrated);
      } catch (e) { console.error("Error parsing docs:", e); }
    } else {
      const today = new Date().toISOString().split('T')[0];
      const targetUser = users.find(u => u.role === 'employee' || u.id !== currentUser.id) || currentUser;
      
      setDocuments([]); localStorage.setItem('sio_internal_docs_v2', JSON.stringify([]));
    }
  }, [currentUser.id]);

  function getDefaultAttachments(type: string, title: string, date: string): Attachment[] {
    return [
      {
        id: uuidv4(),
        name: `Dinh_Kem_Van_Ban_${type.toUpperCase()}.pdf`,
        size: '1.5 MB',
        type: 'pdf',
        url: '#',
        content: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\nÝ CHÍNH VÀ CHI TIẾT VĂN BẢN\nNgày ban hành: ${date}\n\nNội dung chính:\n${title}\n\nVăn bản chính thức đã được phê chuẩn bởi thủ trưởng cơ quan ban ngành.`
      }
    ];
  }

  const saveDocuments = (newDocs: InternalDocument[]) => {
    setDocuments(newDocs);
    localStorage.setItem('sio_internal_docs_v2', JSON.stringify(newDocs));
  };

  // Chức năng 3: Handle dynamic file uploading and parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processUploadedFiles(e.target.files);
    }
  };

  const processUploadedFiles = (files: FileList) => {
    const newAttachments: Attachment[] = [];
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      const fileType = file.type;
      
      let typeCategory: 'pdf' | 'image' | 'text' | 'word' | 'excel' = 'text';
      if (fileType.includes('image')) typeCategory = 'image';
      else if (fileType.includes('pdf')) typeCategory = 'pdf';
      else if (fileType.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) typeCategory = 'excel';
      else if (fileType.includes('word') || file.name.endsWith('.docx')) typeCategory = 'word';

      reader.onload = (event) => {
        const resultString = event.target?.result as string;
        const newAttachment: Attachment = {
          id: uuidv4(),
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          type: typeCategory,
          url: typeCategory === 'image' ? resultString : '#',
          content: typeCategory === 'image' ? undefined : (resultString || `[Tài liệu ${file.name} đã được tải lên thành công]`)
        };

        // Update form state
        setFormData(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), newAttachment]
        }));
      };

      if (typeCategory === 'image') {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file.slice(0, 5000)); // Read first 5KB for preview text
      }
    });
  };

  const removeAttachment = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter(a => a.id !== id)
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      processUploadedFiles(e.dataTransfer.files);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const docAttachments = formData.attachments || [];

    if (selectedDoc) {
      const changes: string[] = [];
      if (formData.title && formData.title !== selectedDoc.title) changes.push(`Thay đổi tiêu đề thành "${formData.title}"`);
      if (formData.type && formData.type !== selectedDoc.type) changes.push(`Đổi loại văn bản`);
      if (formData.confidentiality && formData.confidentiality !== selectedDoc.confidentiality) changes.push(`Thay đổi độ mật`);
      if (formData.urgency && formData.urgency !== selectedDoc.urgency) changes.push(`Thay đổi độ khẩn`);
      if (formData.content && formData.content !== selectedDoc.content) changes.push(`Cập nhật nội dung văn bản`);
      if (docAttachments.length !== (selectedDoc.attachments || []).length) changes.push(`Cập nhật tài liệu đính kèm`);

      const details = changes.length > 0 ? changes.join(', ') : 'Cập nhật thông tin chung';
      const historyEntry = createHistoryEntry('edit', details);

      const updatedDocs = documents.map(d => 
        d.id === selectedDoc.id 
          ? { 
              ...d, 
              ...formData, 
              attachments: docAttachments,
              category: activeTab,
              history: [historyEntry, ...(d.history || [])]
            } as InternalDocument 
          : d
      );
      saveDocuments(updatedDocs);
      if (previewDoc && previewDoc.id === selectedDoc.id) {
        setPreviewDoc({
          ...previewDoc,
          ...formData,
          attachments: docAttachments,
          category: activeTab,
          history: [historyEntry, ...(previewDoc.history || [])]
        } as InternalDocument);
      }
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      const historyEntry = createHistoryEntry('create', 'Khởi tạo văn bản mới trên hệ thống');
      const newDoc: InternalDocument = {
        id: uuidv4(),
        title: formData.title || '',
        docNumber: formData.docNumber || `CV-0${documents.length + 1}/VP-${formData.departmentId || currentUser.department || 'BOD'}`,
        type: formData.type || 'notice',
        category: activeTab,
        content: formData.content || '',
        departmentId: formData.departmentId || currentUser.department || 'BOD',
        creatorId: currentUser.id,
        status: formData.status || 'draft',
        createdAt: new Date().toISOString(),
        documentDate: formData.documentDate || todayStr,
        confidentiality: formData.confidentiality || 'normal',
        urgency: formData.urgency || 'normal',
        attachments: docAttachments.length > 0 ? docAttachments : getDefaultAttachments(formData.type || 'notice', formData.title || '', formData.documentDate || todayStr),
        history: [historyEntry]
      };
      saveDocuments([newDoc, ...documents]);
    }
    setIsAdding(false);
    setSelectedDoc(null);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa văn bản này?')) {
      saveDocuments(documents.filter(d => d.id !== id));
    }
  };

  const getUserName = (id: string) => {
    return users.find(u => u.id === id)?.name || id;
  };

  const handleSummarize = async () => {
    if (!formData.content) return;
    setIsSummarizing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setFormData(prev => ({
        ...prev,
        content: `[TÓM TẮT AI]\n- Ý chính 1: Văn bản đề cập đến quy trình quản lý hành chính nội bộ.\n- Ý chính 2: Yêu cầu các bộ phận liên quan nghiêm chỉnh chấp hành và báo cáo đúng tiến độ.\n\n[NỘI DUNG GỐC]\n${prev.content}`
      }));
    } finally {
      setIsSummarizing(false);
    }
  };

  const getDocTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      notice: 'Thông báo',
      decision: 'Quyết định',
      regulation: 'Quy chế',
      plan: 'Kế hoạch',
      report: 'Báo cáo',
      minutes: 'Biên bản'
    };
    return types[type] || type;
  };

  const getConfidentialityBadge = (level: string) => {
    switch (level) {
      case 'secret':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded text-[10px] font-bold select-none">Tối mật</span>;
      case 'confidential':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold select-none">Mật</span>;
      default:
        return <span className="bg-slate-50 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-medium select-none">Thường</span>;
    }
  };

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case 'very_urgent':
        return <span className="bg-red-100 text-red-800 border border-red-200 px-1.5 py-0.5 rounded text-[10px] font-black animate-pulse select-none">Hỏa tốc</span>;
      case 'urgent':
        return <span className="bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded text-[10px] font-bold select-none">Khẩn</span>;
      default:
        return <span className="bg-slate-50 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-medium select-none">Thường</span>;
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSearchDocNumber('');
    setFilterConfidentiality('all');
    setFilterUrgency('all');
    setFilterType('all');
    setStartDate('');
    setEndDate('');
  };

  // Comprehensive Search & Filter Logic
  const filteredDocs = documents
    .filter(d => activeTab === 'statistics' ? true : d.category === activeTab)
    .filter(d => {
      if (searchTerm) {
        const query = (searchTerm || "").toLowerCase();
        const matchesTitle = d.title && d.title.toLowerCase().includes(query);
        const matchesContent = d.content && d.content.toLowerCase().includes(query);
        if (!matchesTitle && !matchesContent) return false;
      }

      if (searchDocNumber) {
        const query = (searchDocNumber || "").toLowerCase();
        const docNo = d.docNumber ? d.docNumber.toLowerCase() : '';
        if (!docNo.includes(query)) return false;
      }

      if (filterConfidentiality !== 'all') {
        const level = d.confidentiality || 'normal';
        if (level !== filterConfidentiality) return false;
      }

      if (filterUrgency !== 'all') {
        const level = d.urgency || 'normal';
        if (level !== filterUrgency) return false;
      }

      if (filterType !== 'all') {
        if (d.type !== filterType) return false;
      }

      if (startDate || endDate) {
        const docDateStr = d.documentDate || d.createdAt.split('T')[0];
        const docDate = new Date(docDateStr);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (docDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (docDate > end) return false;
        }
      }

      return true;
    });

  // Action: Open the detailed document viewing & previewing screen
  const handleOpenDocPreview = (doc: InternalDocument) => {
    setPreviewDoc(doc);
    setZoomScale(1);
    setRotateAngle(0);
    setPdfPage(1);
    if (doc.attachments && doc.attachments.length > 0) {
      setActiveAttachment(doc.attachments[0]);
    } else {
      setActiveAttachment(null);
    }
  };

  const handlePrint = () => {
    alert(`Đang gửi tài liệu [${activeAttachment?.name || previewDoc?.title}] đến máy in hệ thống...`);
  };

  // ==========================================
  // Chức năng 6: Báo cáo Thống kê & Xuất dữ liệu
  // ==========================================
  const exportToCSV = () => {
    const headers = [
      'ID',
      'Số hiệu',
      'Tiêu đề/Trích yếu',
      'Phân loại danh mục',
      'Loại văn bản',
      'Độ mật',
      'Độ khẩn',
      'Người tạo',
      'Ngày văn bản',
      'Trạng thái ban hành',
      'Số tệp đính kèm',
      'Số lượng phân công'
    ];

    const rows = documents.map(doc => {
      const creatorName = users.find(u => u.id === doc.creatorId)?.name || 'Hệ thống';
      const docTypeLabel = getDocTypeLabel(doc.type);
      const categoryLabel = doc.category === 'incoming' ? 'Văn bản đến' : doc.category === 'outgoing' ? 'Văn bản đi' : 'Công văn nội bộ';
      const confidentialityLabel = doc.confidentiality === 'secret' ? 'Tối mật' : doc.confidentiality === 'confidential' ? 'Mật' : 'Bình thường';
      const urgencyLabel = doc.urgency === 'very_urgent' ? 'Hỏa tốc' : doc.urgency === 'urgent' ? 'Khẩn' : 'Bình thường';
      const statusLabel = doc.status === 'published' ? 'Đã ban hành' : 'Bản nháp';
      const attachmentsCount = doc.attachments ? doc.attachments.length : 0;
      const assignmentsCount = doc.assignments ? doc.assignments.length : 0;

      // Clean comma and quotes for CSV
      const cleanTitle = doc.title ? doc.title.replace(/"/g, '""') : '';

      return [
        doc.id,
        doc.docNumber || '',
        `"${cleanTitle}"`,
        categoryLabel,
        docTypeLabel,
        confidentialityLabel,
        urgencyLabel,
        creatorName,
        doc.documentDate || '',
        statusLabel,
        attachmentsCount,
        assignmentsCount
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    // Add BOM (Byte Order Mark) for Excel UTF-8 support
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bao_cao_quan_ly_cong_van_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Statistical Calculations for Chức năng 6
  const totalDocs = documents.length;
  const incomingDocsCount = documents.filter(d => d.category === 'incoming').length;
  const outgoingDocsCount = documents.filter(d => d.category === 'outgoing').length;
  const internalDocsCount = documents.filter(d => d.category === 'internal').length;

  const confidentialityStats = {
    normal: documents.filter(d => d.confidentiality === 'normal' || !d.confidentiality).length,
    confidential: documents.filter(d => d.confidentiality === 'confidential').length,
    secret: documents.filter(d => d.confidentiality === 'secret').length,
  };

  const urgencyStats = {
    normal: documents.filter(d => d.urgency === 'normal' || !d.urgency).length,
    urgent: documents.filter(d => d.urgency === 'urgent').length,
    very_urgent: documents.filter(d => d.urgency === 'very_urgent').length,
  };

  const typeStats = {
    notice: documents.filter(d => d.type === 'notice').length,
    decision: documents.filter(d => d.type === 'decision').length,
    regulation: documents.filter(d => d.type === 'regulation').length,
    plan: documents.filter(d => d.type === 'plan').length,
    report: documents.filter(d => d.type === 'report').length,
    minutes: documents.filter(d => d.type === 'minutes').length,
  };

  const allAssignments = documents.flatMap(d => d.assignments || []);
  const totalAssignments = allAssignments.length;
  const assignmentStatusStats = {
    pending: allAssignments.filter(a => a.status === 'pending').length,
    processing: allAssignments.filter(a => a.status === 'processing').length,
    completed: allAssignments.filter(a => a.status === 'completed').length,
    rejected: allAssignments.filter(a => a.status === 'rejected').length,
  };

  const userLoadMap: Record<string, { total: number; completed: number; processing: number }> = {};
  allAssignments.forEach(asg => {
    if (!userLoadMap[asg.assigneeId]) {
      userLoadMap[asg.assigneeId] = { total: 0, completed: 0, processing: 0 };
    }
    userLoadMap[asg.assigneeId].total += 1;
    if (asg.status === 'completed') userLoadMap[asg.assigneeId].completed += 1;
    if (asg.status === 'processing') userLoadMap[asg.assigneeId].processing += 1;
  });

  const staffStats = users.map(u => {
    const stats = userLoadMap[u.id] || { total: 0, completed: 0, processing: 0 };
    return {
      id: u.id,
      name: u.name,
      role: u.role,
      department: u.department,
      avatar: u.avatar,
      ...stats,
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    };
  }).filter(s => s.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
            <Inbox className="text-indigo-600" />
            <span>Quản lý Công văn & Tài liệu</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Lưu trữ, đính kèm, phê duyệt và xem trước trực quan các văn bản hành chính</p>
        </div>
        {activeTab !== 'statistics' && (
          <button 
            onClick={() => { setIsAdding(true); setSelectedDoc(null); setFormData({ attachments: [] }); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Thêm Văn bản</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap bg-white rounded-xl shadow-sm border border-slate-200 p-1 gap-1">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'incoming' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Download size={16} />
          <span>Văn bản đến</span>
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'outgoing' ? 'bg-amber-50 text-amber-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Upload size={16} />
          <span>Văn bản đi</span>
        </button>
        <button
          onClick={() => setActiveTab('internal')}
          className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'internal' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Inbox size={16} />
          <span>Công văn nội bộ</span>
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          className={`flex-1 min-w-[120px] flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'statistics' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <BarChart3 size={16} />
          <span>Báo cáo & Thống kê</span>
        </button>
      </div>

      {activeTab === 'statistics' ? (
        <div className="space-y-6 animate-fade-in" id="statistics-dashboard">
          {/* Dashboard Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="text-emerald-200" size={22} />
                <h3 className="text-lg font-black tracking-tight">Trung tâm Phân tích & Báo cáo Số liệu</h3>
              </div>
              <p className="text-emerald-100 text-xs mt-1.5 font-medium max-w-2xl">
                Phân tích dữ liệu thời gian thực về luồng công văn đến, đi và nội bộ; theo dõi tiến độ xử lý công việc và hiệu suất của cán bộ nhân viên trong hệ thống.
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm shrink-0"
              title="Xuất toàn bộ danh sách công văn thành file CSV tiện ích"
            >
              <Download size={14} />
              <span>Xuất Báo cáo CSV</span>
            </button>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Tổng văn bản</span>
                <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                  <FileText size={14} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-slate-800 tracking-tight">{totalDocs}</div>
                <div className="text-[10px] text-slate-400 font-semibold mt-1">Lưu trữ trên hệ thống</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-500">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Văn bản đến</span>
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Download size={14} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-slate-800 tracking-tight">{incomingDocsCount}</div>
                <div className="text-[10px] text-blue-600 font-semibold mt-1">
                  {totalDocs > 0 ? Math.round((incomingDocsCount / totalDocs) * 100) : 0}% tổng số lượng
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-500">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Văn bản đi</span>
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Upload size={14} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-slate-800 tracking-tight">{outgoingDocsCount}</div>
                <div className="text-[10px] text-amber-600 font-semibold mt-1">
                  {totalDocs > 0 ? Math.round((outgoingDocsCount / totalDocs) * 100) : 0}% tổng số lượng
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-indigo-500">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Văn bản nội bộ</span>
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Inbox size={14} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-slate-800 tracking-tight">{internalDocsCount}</div>
                <div className="text-[10px] text-indigo-600 font-semibold mt-1">
                  {totalDocs > 0 ? Math.round((internalDocsCount / totalDocs) * 100) : 0}% tổng số lượng
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-emerald-500">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tổng phân công</span>
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <UserCheck size={14} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-slate-800 tracking-tight">{totalAssignments}</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                  Tỷ lệ HT: {totalAssignments > 0 ? Math.round((assignmentStatusStats.completed / totalAssignments) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Middle Analytics Grid (Progress & Classifications) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Phân công & Tiến độ */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                <ClipboardList className="text-emerald-600" size={16} />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Tiến độ xử lý phân công</h4>
              </div>

              <div className="space-y-3.5">
                {/* Completed */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Hoàn thành xuất sắc</span>
                    </span>
                    <span>{assignmentStatusStats.completed} / {totalAssignments} ({totalAssignments > 0 ? Math.round((assignmentStatusStats.completed / totalAssignments) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${totalAssignments > 0 ? (assignmentStatusStats.completed / totalAssignments) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Processing */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>Đang triển khai xử lý</span>
                    </span>
                    <span>{assignmentStatusStats.processing} / {totalAssignments} ({totalAssignments > 0 ? Math.round((assignmentStatusStats.processing / totalAssignments) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${totalAssignments > 0 ? (assignmentStatusStats.processing / totalAssignments) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Pending */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Chờ tiếp nhận xử lý</span>
                    </span>
                    <span>{assignmentStatusStats.pending} / {totalAssignments} ({totalAssignments > 0 ? Math.round((assignmentStatusStats.pending / totalAssignments) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${totalAssignments > 0 ? (assignmentStatusStats.pending / totalAssignments) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Rejected */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>Từ chối tiếp nhận</span>
                    </span>
                    <span>{assignmentStatusStats.rejected} / {totalAssignments} ({totalAssignments > 0 ? Math.round((assignmentStatusStats.rejected / totalAssignments) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${totalAssignments > 0 ? (assignmentStatusStats.rejected / totalAssignments) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Thống kê Độ mật */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                <ShieldAlert className="text-rose-600" size={16} />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Mức độ mật văn bản</h4>
              </div>

              <div className="space-y-4 pt-1">
                {/* Normal */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500 shrink-0"></span>
                    <span className="text-xs font-semibold text-slate-600">Thường (Công khai)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-slate-700">{confidentialityStats.normal}</span>
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                      {totalDocs > 0 ? Math.round((confidentialityStats.normal / totalDocs) * 100) : 0}%
                    </span>
                  </div>
                </div>

                {/* Confidential */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded bg-amber-500 shrink-0"></span>
                    <span className="text-xs font-semibold text-slate-600">Văn bản Mật</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-slate-700">{confidentialityStats.confidential}</span>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      {totalDocs > 0 ? Math.round((confidentialityStats.confidential / totalDocs) * 100) : 0}%
                    </span>
                  </div>
                </div>

                {/* Secret */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded bg-rose-600 shrink-0"></span>
                    <span className="text-xs font-semibold text-slate-600">Tối mật (Giới hạn cao)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-slate-700">{confidentialityStats.secret}</span>
                    <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      {totalDocs > 0 ? Math.round((confidentialityStats.secret / totalDocs) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 bg-slate-50/50 rounded-lg p-3 border border-slate-100 text-[11px] text-slate-500 font-medium">
                Văn bản mật và tối mật yêu cầu tài khoản được cấp quyền phù hợp theo phòng ban mới có thể mở xem trực quan file đính kèm.
              </div>
            </div>

            {/* Thống kê Độ khẩn */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                <Clock className="text-indigo-600" size={16} />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Mức độ khẩn văn bản</h4>
              </div>

              <div className="space-y-4 pt-1">
                {/* Normal */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded bg-slate-400 shrink-0"></span>
                    <span className="text-xs font-semibold text-slate-600">Bình thường</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-slate-700">{urgencyStats.normal}</span>
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                      {totalDocs > 0 ? Math.round((urgencyStats.normal / totalDocs) * 100) : 0}%
                    </span>
                  </div>
                </div>

                {/* Urgent */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded bg-orange-500 shrink-0"></span>
                    <span className="text-xs font-semibold text-slate-600">Công văn Khẩn</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-slate-700">{urgencyStats.urgent}</span>
                    <span className="text-[10px] text-orange-700 font-bold bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                      {totalDocs > 0 ? Math.round((urgencyStats.urgent / totalDocs) * 100) : 0}%
                    </span>
                  </div>
                </div>

                {/* Very Urgent */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded bg-red-600 shrink-0"></span>
                    <span className="text-xs font-semibold text-slate-600">Hỏa tốc / Khẩn cấp</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-slate-700">{urgencyStats.very_urgent}</span>
                    <span className="text-[10px] text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                      {totalDocs > 0 ? Math.round((urgencyStats.very_urgent / totalDocs) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 bg-slate-50/50 rounded-lg p-3 border border-slate-100 text-[11px] text-slate-500 font-medium">
                Công văn hỏa tốc yêu cầu cán bộ xử lý phải xác nhận và phản hồi tiến độ trong vòng 24 giờ kể từ thời điểm tiếp nhận.
              </div>
            </div>
          </div>

          {/* Bottom Analytics Grid (Types Breakdown & Staff Loaderboard) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Phân loại tài liệu theo tính chất (4 cols) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 lg:col-span-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                <FileText className="text-teal-600" size={16} />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Phân bố theo Loại văn bản</h4>
              </div>

              <div className="space-y-3">
                {/* Notice */}
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                  <span>Thông báo</span>
                  <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">{typeStats.notice}</span>
                </div>
                {/* Decision */}
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                  <span>Quyết định</span>
                  <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">{typeStats.decision}</span>
                </div>
                {/* Regulation */}
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                  <span>Quy chế / Quy định</span>
                  <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">{typeStats.regulation}</span>
                </div>
                {/* Plan */}
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                  <span>Kế hoạch</span>
                  <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">{typeStats.plan}</span>
                </div>
                {/* Report */}
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                  <span>Báo cáo</span>
                  <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">{typeStats.report}</span>
                </div>
                {/* Minutes */}
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                  <span>Biên bản cuộc họp</span>
                  <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">{typeStats.minutes}</span>
                </div>
              </div>
            </div>

            {/* Hiệu suất xử lý của Nhân sự (8 cols) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 lg:col-span-8">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Award className="text-amber-500" size={16} />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Tải công việc & Hiệu suất Cán bộ</h4>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Sắp xếp theo khối lượng xử lý</span>
              </div>

              {staffStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-1.5">
                  <AlertCircle size={20} />
                  <p className="text-xs font-semibold">Chưa có phân công công việc nào được ghi nhận</p>
                  <p className="text-[10px]">Các chỉ số hiệu suất sẽ hiển thị khi có luồng phân công xử lý công văn.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead>
                      <tr className="text-slate-400 font-bold border-b border-slate-100 select-none">
                        <th className="pb-2 font-semibold">Cán bộ đảm nhận</th>
                        <th className="pb-2 font-semibold text-center">Đang làm</th>
                        <th className="pb-2 font-semibold text-center">Hoàn thành</th>
                        <th className="pb-2 font-semibold text-center">Tổng nhận</th>
                        <th className="pb-2 font-semibold text-right">Tỷ lệ hoàn thành</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staffStats.map(staff => (
                        <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5">
                            <div className="flex items-center space-x-2.5">
                              {staff.avatar ? (
                                <img src={staff.avatar} alt={staff.name} className="w-7 h-7 rounded-full object-cover border border-slate-100 shrink-0" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-[10px] shrink-0">
                                  {staff.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-800">{staff.name}</div>
                                <div className="text-[9px] text-slate-400 font-semibold">{staff.role.toUpperCase()} • PB: {staff.department}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 text-center font-bold text-blue-600">{staff.processing}</td>
                          <td className="py-2.5 text-center font-bold text-emerald-600">{staff.completed}</td>
                          <td className="py-2.5 text-center font-black text-slate-800">{staff.total}</td>
                          <td className="py-2.5">
                            <div className="flex items-center justify-end space-x-2">
                              <span className="font-bold text-slate-700 text-[11px] shrink-0">{staff.completionRate}%</span>
                              <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden shrink-0 hidden sm:block">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full transition-all" 
                                  style={{ width: `${staff.completionRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Chức năng 1: Advanced Search & Filter Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-sans">Bộ lọc & Tìm kiếm nâng cao</h3>
              </div>
              <button
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className="flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                <SlidersHorizontal size={14} />
                <span>{isFilterExpanded ? 'Thu gọn bộ lọc' : 'Mở rộng bộ lọc'}</span>
                {isFilterExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* Filters Panel */}
            {isFilterExpanded && (
              <div className="pt-2 border-t border-slate-100 space-y-4">
                {/* Row 1: Search Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                      Trích yếu / Nội dung
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm theo tên văn bản, nội dung tóm tắt..."
                        className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 outline-none text-slate-700 placeholder-slate-400 bg-slate-50/50"
                      />
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                      Số hiệu công văn
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchDocNumber}
                        onChange={(e) => setSearchDocNumber(e.target.value)}
                        placeholder="VD: 120/TB-HR, 35/QĐ-BOD..."
                        className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 outline-none text-slate-700 placeholder-slate-400 bg-slate-50/50"
                      />
                      <FileText size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Row 2: Select Selectors */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                      Loại văn bản
                    </label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:border-indigo-500 outline-none text-slate-700 bg-slate-50/50"
                    >
                      <option value="all">Tất cả các loại</option>
                      <option value="notice">Thông báo</option>
                      <option value="decision">Quyết định</option>
                      <option value="regulation">Quy chế</option>
                      <option value="plan">Kế hoạch</option>
                      <option value="report">Báo cáo</option>
                      <option value="minutes">Biên bản</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                      Độ mật
                    </label>
                    <select
                      value={filterConfidentiality}
                      onChange={(e) => setFilterConfidentiality(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:border-indigo-500 outline-none text-slate-700 bg-slate-50/50"
                    >
                      <option value="all">Tất cả mức độ</option>
                      <option value="normal">Thường (Công khai)</option>
                      <option value="confidential">Mật</option>
                      <option value="secret">Tối mật</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                      Độ khẩn
                    </label>
                    <select
                      value={filterUrgency}
                      onChange={(e) => setFilterUrgency(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:border-indigo-500 outline-none text-slate-700 bg-slate-50/50"
                    >
                      <option value="all">Tất cả mức độ</option>
                      <option value="normal">Bình thường</option>
                      <option value="urgent">Khẩn</option>
                      <option value="very_urgent">Hỏa tốc</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                      Thời gian ban hành
                    </label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full text-[10px] p-1.5 border border-slate-300 rounded-lg focus:border-indigo-500 outline-none text-slate-700 bg-slate-50/50"
                      />
                      <span className="text-slate-400 text-xs">→</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full text-[10px] p-1.5 border border-slate-300 rounded-lg focus:border-indigo-500 outline-none text-slate-700 bg-slate-50/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Reset Filter Action */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                  <span className="text-[10px] font-medium text-slate-400">
                    Tìm thấy <strong className="text-indigo-600 font-bold">{filteredDocs.length}</strong> văn bản phù hợp
                  </span>
                  {(searchTerm || searchDocNumber || filterConfidentiality !== 'all' || filterUrgency !== 'all' || filterType !== 'all' || startDate || endDate) && (
                    <button
                      onClick={resetFilters}
                      className="flex items-center space-x-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer animate-fade-in"
                    >
                      <X size={12} />
                      <span>Xóa bộ lọc</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Table Document List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 select-none">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-[42%]">Tên công văn / Trích yếu</th>
                    <th className="px-4 py-3 font-semibold">Phân loại</th>
                    <th className="px-4 py-3 font-semibold">Độ mật / Độ khẩn</th>
                    <th className="px-4 py-3 font-semibold">Ngày văn bản</th>
                    <th className="px-4 py-3 font-semibold">Tệp đính kèm</th>
                    <th className="px-4 py-3 font-semibold text-center">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map(doc => (
                    <tr key={doc.id} className="hover:bg-indigo-50/20 transition-all">
                      <td className="px-4 py-3">
                        <div className="flex items-start space-x-3">
                          <button 
                            onClick={() => handleOpenDocPreview(doc)}
                            className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg shrink-0 mt-0.5 transition-colors cursor-pointer"
                            title="Xem tài liệu và file trực quan"
                          >
                            <FileText size={16} />
                          </button>
                          <div className="min-w-0 flex-1">
                            <button
                              onClick={() => handleOpenDocPreview(doc)}
                              className="font-bold text-slate-800 hover:text-indigo-600 text-left transition-colors line-clamp-2 cursor-pointer outline-none"
                            >
                              {doc.title}
                            </button>
                            <div className="flex items-center space-x-2 mt-1.5 flex-wrap gap-y-1">
                              <span className="bg-slate-100 text-slate-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-slate-200 select-none">
                                SỐ: {doc.docNumber || 'Đang cập nhật'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 px-1 py-0.5 rounded">
                                PB: {doc.departmentId}
                              </span>
                            </div>
                            {doc.assignments && doc.assignments.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {doc.assignments.map(asg => {
                                  const assignee = users.find(u => u.id === asg.assigneeId);
                                  if (!assignee) return null;
                                  let bgStyle = 'bg-amber-50 text-amber-700 border-amber-200';
                                  if (asg.status === 'processing') bgStyle = 'bg-blue-50 text-blue-700 border-blue-200';
                                  if (asg.status === 'completed') bgStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                  if (asg.status === 'rejected') bgStyle = 'bg-rose-50 text-rose-700 border-rose-200';
                                  return (
                                    <span key={asg.id} className={`text-[9px] font-bold border px-1.5 py-0.5 rounded flex items-center space-x-1 ${bgStyle}`}>
                                      <span>👤 {assignee.name}</span>
                                      <span className="opacity-40">•</span>
                                      <span className="uppercase text-[8px] font-black">{asg.status === 'pending' ? 'Chờ' : asg.status === 'processing' ? 'Đang làm' : asg.status === 'completed' ? 'Xong' : 'Từ chối'}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                        {getDocTypeLabel(doc.type)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[9px] text-slate-400 font-medium w-8">Độ mật:</span>
                            {getConfidentialityBadge(doc.confidentiality || 'normal')}
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[9px] text-slate-400 font-medium w-8">Độ khẩn:</span>
                            {getUrgencyBadge(doc.urgency || 'normal')}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-semibold">
                        <div className="flex items-center space-x-1">
                          <Calendar size={13} className="text-slate-400" />
                          <span>
                            {doc.documentDate ? new Date(doc.documentDate).toLocaleDateString('vi-VN') : new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </td>
                      {/* Chức năng 3: Attached file summary count badge */}
                      <td className="px-4 py-3">
                        {doc.attachments && doc.attachments.length > 0 ? (
                          <button 
                            onClick={() => handleOpenDocPreview(doc)}
                            className="inline-flex items-center space-x-1.5 px-2 py-1 bg-slate-100 hover:bg-indigo-50 border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 text-[10px] font-bold cursor-pointer transition-colors"
                            title="Xem trước các file đính kèm này"
                          >
                            <Paperclip size={12} />
                            <span>{doc.attachments.length} tệp</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Không đính kèm</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                          doc.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {doc.status === 'published' ? 'Đã ban hành' : 'Bản nháp'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end space-x-1">
                          <button 
                            onClick={() => {
                              const contentHtml = `
                                <p><strong>Số/Ký hiệu:</strong> ${doc.referenceNumber}</p>
                                <p><strong>Nơi ban hành:</strong> ${doc.issuer}</p>
                                <p><strong>Trích yếu:</strong> ${doc.subject}</p>
                                <p><strong>Người ký:</strong> ${doc.signerName} (${doc.signerPosition})</p>
                                <p><strong>Ngày ban hành:</strong> ${doc.issueDate}</p>
                                <p><strong>Loại công văn:</strong> ${doc.type === 'incoming' ? 'Công văn đến' : 'Công văn đi'}</p>
                                <p><strong>Liên thông:</strong> ${doc.isInterconnected ? 'Có' : 'Không'}</p>
                                <p><strong>Thời hạn lưu trữ:</strong> ${
                                  doc.retentionPeriod === '5_years' ? '5 năm' : 
                                  doc.retentionPeriod === '10_years' ? '10 năm' : 
                                  doc.retentionPeriod === '20_years' ? '20 năm' : 'Vĩnh viễn'
                                }</p>
                                <p><strong>Phiên bản:</strong> ${doc.version || 1}</p>
                              `;
                              printDocument(`Công văn ${doc.referenceNumber}`, contentHtml, currentUser);
                            }} 
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer" 
                            title="In văn bản"
                          >
                            <Printer size={15} />
                          </button>
                          <button 
                            onClick={() => { setSelectedDoc(doc); setFormData(doc); }} 
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer" 
                            title="Chỉnh sửa văn bản"
                          >
                            <FileEdit size={15} />
                          </button>
                          <button 
                            onClick={() => handleDelete(doc.id)} 
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer" 
                            title="Xóa"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredDocs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-slate-500 bg-slate-50/30">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <AlertCircle size={24} className="text-slate-300" />
                          <p className="text-xs font-semibold text-slate-500">Không tìm thấy công văn phù hợp</p>
                          <p className="text-[10px] text-slate-400">Hãy thử thay đổi từ khóa hoặc bộ lọc nâng cao phía trên</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add / Edit Dialog with File Attachment Fields (Chức năng 3) */}
      {(isAdding || selectedDoc) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center space-x-2">
                <FileText size={18} className="text-indigo-600" />
                <span>
                  {isAdding ? `Tạo mới ${activeTab === 'incoming' ? 'Văn bản đến' : activeTab === 'outgoing' ? 'Văn bản đi' : 'Công văn nội bộ'}` : 'Cập nhật Văn bản'}
                </span>
              </h3>
              <button 
                onClick={() => { setIsAdding(false); setSelectedDoc(null); }} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-all text-lg font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="internal-doc-form" onSubmit={handleSave} className="space-y-4">
                {/* Row 1: Title/Subject */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Tên văn bản / Trích yếu *</label>
                  <input 
                    type="text" 
                    value={formData.title || ''} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none font-medium" 
                    placeholder="VD: Thông báo lịch họp định kỳ, Quyết định phê duyệt dự án..."
                    required 
                  />
                </div>

                {/* Row 2: Document Number & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Số hiệu công văn</label>
                    <input 
                      type="text" 
                      value={formData.docNumber || ''} 
                      onChange={e => setFormData({...formData, docNumber: e.target.value})} 
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none" 
                      placeholder="VD: 120/TB-HR (Tự động sinh nếu trống)"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Ngày ban hành / Ngày đến *</label>
                    <input 
                      type="date" 
                      value={formData.documentDate || new Date().toISOString().split('T')[0]} 
                      onChange={e => setFormData({...formData, documentDate: e.target.value})} 
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none" 
                      required
                    />
                  </div>
                </div>

                {/* Row 3: Doc Type & Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Loại văn bản</label>
                    <select 
                      value={formData.type || 'notice'} 
                      onChange={e => setFormData({...formData, type: e.target.value as any})} 
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none text-slate-700 bg-white"
                    >
                      <option value="notice">Thông báo</option>
                      <option value="decision">Quyết định</option>
                      <option value="regulation">Quy chế</option>
                      <option value="plan">Kế hoạch</option>
                      <option value="report">Báo cáo</option>
                      <option value="minutes">Biên bản</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Phòng ban liên quan *</label>
                    <input 
                      type="text" 
                      value={formData.departmentId || currentUser.department || ''} 
                      onChange={e => setFormData({...formData, departmentId: e.target.value})} 
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none" 
                      placeholder="VD: HR, BOD, KT, Tech..."
                      required 
                    />
                  </div>
                </div>

                {/* Row 4: Confidentiality & Urgency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Độ mật</label>
                    <select 
                      value={formData.confidentiality || 'normal'} 
                      onChange={e => setFormData({...formData, confidentiality: e.target.value as any})} 
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none text-slate-700 bg-white"
                    >
                      <option value="normal">Thường (Công khai)</option>
                      <option value="confidential">Mật</option>
                      <option value="secret">Tối mật</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Độ khẩn</label>
                    <select 
                      value={formData.urgency || 'normal'} 
                      onChange={e => setFormData({...formData, urgency: e.target.value as any})} 
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none text-slate-700 bg-white"
                    >
                      <option value="normal">Bình thường</option>
                      <option value="urgent">Khẩn</option>
                      <option value="very_urgent">Hỏa tốc</option>
                    </select>
                  </div>
                </div>

                {/* Row 5: EVN Features (Retention, Version, Linked) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Thời hạn lưu trữ</label>
                    <select 
                      value={formData.retentionPeriod || 'permanent'} 
                      onChange={e => setFormData({...formData, retentionPeriod: e.target.value as any})} 
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none text-slate-700 bg-white"
                    >
                      <option value="5_years">5 năm</option>
                      <option value="10_years">10 năm</option>
                      <option value="20_years">20 năm</option>
                      <option value="permanent">Vĩnh viễn</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Phiên bản</label>
                    <input 
                      type="number" 
                      min="1"
                      value={formData.version || 1} 
                      onChange={e => setFormData({...formData, version: Number(e.target.value)})} 
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none bg-slate-50"
                      placeholder="VD: 1, 2..."
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${formData.isInterconnected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 text-transparent group-hover:border-indigo-400'}`}>
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <input 
                        type="checkbox"
                        checked={!!formData.isInterconnected}
                        onChange={e => setFormData({...formData, isInterconnected: e.target.checked})}
                        className="hidden"
                      />
                      <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">Liên thông văn bản</span>
                    </label>
                  </div>
                </div>

                {/* Content text */}
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Nội dung văn bản / Trích yếu chi tiết *</label>
                    <button 
                      type="button" 
                      onClick={handleSummarize} 
                      disabled={isSummarizing || !formData.content} 
                      className={`flex items-center space-x-1 text-[10px] font-extrabold px-2 py-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer ${isSummarizing ? 'opacity-50' : ''}`}
                    >
                      {isSummarizing ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      <span>Tóm tắt bằng AI</span>
                    </button>
                  </div>
                  <textarea 
                    value={formData.content || ''} 
                    onChange={e => setFormData({...formData, content: e.target.value})} 
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none min-h-[100px] font-sans" 
                    placeholder="Soạn thảo hoặc dán nội dung công văn tại đây..."
                    required 
                  />
                </div>

                {/* Chức năng 3: Drag & Drop File Upload Panel */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
                    Đính kèm tài liệu (PDF, Hình ảnh, Excel, Văn bản)
                  </label>
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      dragOver 
                        ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]' 
                        : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      multiple
                      className="hidden" 
                      accept=".pdf,.jpg,.jpeg,.png,.txt,.xlsx,.csv,.doc,.docx"
                    />
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full">
                        <Upload size={18} />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Kéo thả file vào đây hoặc bấm để chọn tệp</p>
                      <p className="text-[10px] text-slate-400 font-medium">Hỗ trợ PDF, JPG, PNG, TXT, XLSX (Mỗi file dưới 15MB)</p>
                    </div>
                  </div>

                  {/* Attachment Previews in Form */}
                  {formData.attachments && formData.attachments.length > 0 && (
                    <div className="mt-3 space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {formData.attachments.map(att => (
                        <div key={att.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                          <div className="flex items-center space-x-2 min-w-0">
                            <div className="text-indigo-600 shrink-0">
                              {att.type === 'pdf' ? <FileText size={16} /> : att.type === 'excel' ? <FileSpreadsheet size={16} /> : <FileCode size={16} />}
                            </div>
                            <span className="font-semibold text-slate-700 truncate" title={att.name}>{att.name}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">({att.size})</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeAttachment(att.id)}
                            className="p-1 hover:bg-rose-100 text-rose-600 rounded cursor-pointer transition-colors"
                            title="Loại bỏ"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Trạng thái phát hành</label>
                  <select 
                    value={formData.status || 'draft'} 
                    onChange={e => setFormData({...formData, status: e.target.value as any})} 
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none text-slate-700 bg-white"
                  >
                    <option value="draft">Bản nháp (Lưu trữ nội bộ)</option>
                    <option value="published">Ban hành chính thức</option>
                  </select>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={() => { setIsAdding(false); setSelectedDoc(null); }} 
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button 
                type="submit" 
                form="internal-doc-form" 
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
              >
                Lưu Văn bản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chức năng 3: Interactive Split-Pane Visual Document Details & Interactive File Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col h-[90vh] animate-scale-up text-slate-300">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center select-none">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2 bg-indigo-600 text-white rounded-lg">
                  <Eye size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-white truncate">{previewDoc.title}</h4>
                  <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-400">
                    <span className="font-mono text-indigo-400">SỐ: {previewDoc.docNumber}</span>
                    <span>•</span>
                    <span>Ban hành: {previewDoc.documentDate ? new Date(previewDoc.documentDate).toLocaleDateString('vi-VN') : new Date(previewDoc.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { setPreviewDoc(null); setActiveAttachment(null); }}
                className="text-slate-400 hover:text-white cursor-pointer p-1.5 rounded-lg hover:bg-slate-800 transition-all font-bold text-lg"
              >
                ×
              </button>
            </div>

            {/* Split Content Pane */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Column: Official Metadata & Document Context */}
              <div className="w-full md:w-[35%] border-r border-slate-800 bg-slate-950 p-5 overflow-y-auto space-y-5">
                <div>
                  <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Thông tin tài liệu</h5>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                        <span className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Độ mật</span>
                        <div className="font-semibold">{getConfidentialityBadge(previewDoc.confidentiality)}</div>
                      </div>
                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                        <span className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Độ khẩn</span>
                        <div className="font-semibold">{getUrgencyBadge(previewDoc.urgency)}</div>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Bộ phận soạn thảo:</span>
                        <span className="font-bold text-indigo-400">{previewDoc.departmentId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Người ban hành:</span>
                        <span className="font-semibold text-slate-300">{getUserName(previewDoc.creatorId)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Loại công văn:</span>
                        <span className="font-bold text-slate-300 uppercase text-[10px] tracking-wider">{getDocTypeLabel(previewDoc.type)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trích yếu tóm tắt */}
                <div>
                  <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Trích yếu nội dung</h5>
                  <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/60 text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
                    {previewDoc.content}
                  </div>
                </div>

                {/* Chức năng 7: Ký số & Liên kết đa phân hệ */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 space-y-4 animate-fade-in shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300 flex items-center space-x-1.5">
                      <PenTool size={12} className="text-emerald-400 animate-pulse" />
                      <span>Xác thực & Liên kết tác vụ</span>
                    </h5>
                    <span className="text-[8px] bg-slate-850 border border-slate-800 px-1 py-0.5 rounded font-bold text-slate-500">Chức năng 7</span>
                  </div>
                  
                  {/* Signing Status & Trigger Button */}
                  <div className="space-y-2">
                    {previewDoc.isSigned ? (
                      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 text-xs space-y-1.5 shadow-sm">
                        <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                          <ShieldCheck size={14} className="animate-pulse" />
                          <span className="tracking-wide text-[11px]">VĂN BẢN ĐÃ KÝ SỐ</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                          Người ký: <strong className="text-slate-200">{getUserName(previewDoc.signedBy)}</strong>
                          <br />
                          Thời gian: <span className="text-slate-300">{new Date(previewDoc.signedAt || '').toLocaleString('vi-VN')}</span>
                          <br />
                          Loại: <span className="text-slate-300 italic">{previewDoc.signatureType === 'draw' ? 'Vẽ tay trực tiếp' : previewDoc.signatureType === 'type' ? 'Ký mẫu chữ đẹp' : 'Khóa Token bảo mật'}</span>
                          <br />
                          Dấu mộc: <span className="text-slate-300">{previewDoc.stampType === 'official' ? 'Dấu tròn SIO' : previewDoc.stampType === 'secret' ? 'Dấu mộc MẬT' : 'Dấu mộc HỎA TỐC'}</span>
                        </p>
                        <div className="pt-2 border-t border-emerald-500/10 text-[9px] font-mono text-emerald-500/80 truncate select-all cursor-copy" title="Nhấp đúp chuột để sao chép mã hash bảo mật">
                          Xác thực: {previewDoc.signatureHash}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-950/10 border border-amber-500/20 rounded-xl p-3 text-xs space-y-2">
                        <div className="flex items-center space-x-1.5 text-amber-500 font-bold">
                          <AlertCircle size={14} />
                          <span className="tracking-wide text-[11px]">VĂN BẢN CHƯA KÝ SỐ</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal font-sans">
                          Công văn nội bộ này chưa được đóng dấu & ký số điện tử của thủ trưởng để ban hành chính thức.
                        </p>
                        {(currentUser.role === 'admin' || currentUser.role === 'manager' || previewDoc.creatorId === currentUser.id) && (
                          <button
                            onClick={() => {
                              setIsSigningOpen(true);
                              setSignType('draw');
                              setTypedSignName(currentUser.name);
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm"
                          >
                            <PenTool size={11} />
                            <span>✍️ Ký số & Đóng dấu điện tử</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Multi-Module Action Linkage */}
                  <div className="pt-2 border-t border-slate-850 space-y-2">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Liên kết liên phân hệ:</span>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                      {/* Convert to Task */}
                      <button
                        onClick={() => {
                          setLinkTaskName(`Xử lý công văn: ${previewDoc.title}`);
                          setLinkTaskDesc(`Cần thực hiện chỉ đạo công văn số ${previewDoc.docNumber}.\nTên công văn: ${previewDoc.title}\nNội dung công văn:\n${previewDoc.content}`);
                          setLinkTaskAssignee(currentUser.id);
                          setShowTaskLinkModal(true);
                        }}
                        className="bg-slate-900 border border-slate-800 hover:border-indigo-500/30 text-slate-300 hover:text-indigo-400 py-2 px-1 rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer"
                        title="Tạo việc giao cho nhân sự liên kết với công văn này"
                      >
                        <CheckSquare size={12} className="text-indigo-400" />
                        <span>Chuyển thành việc</span>
                      </button>
                      
                      {/* Share to Chat */}
                      <button
                        onClick={() => {
                          setCustomChatMessage(`📢 Tôi xin chia sẻ công văn mới số ${previewDoc.docNumber}: "${previewDoc.title}". Đề nghị các bộ phận liên quan xem và phối hợp xử lý gấp.`);
                          setShowChatShareModal(true);
                        }}
                        className="bg-slate-900 border border-slate-800 hover:border-sky-500/30 text-slate-300 hover:text-sky-450 py-2 px-1 rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer"
                        title="Gửi thẻ xem nhanh công văn này vào phòng chat nhóm"
                      >
                        <Share2 size={12} className="text-sky-400" />
                        <span>Chia sẻ vào Chat</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* List of attachments inside the split preview modal */}
                <div>
                  <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Danh sách tệp đính kèm ({previewDoc.attachments?.length || 0})</h5>
                  {previewDoc.attachments && previewDoc.attachments.length > 0 ? (
                    <div className="space-y-2">
                      {previewDoc.attachments.map(att => {
                        const isSelected = activeAttachment?.id === att.id;
                        return (
                          <button
                            key={att.id}
                            onClick={() => {
                              setActiveAttachment(att);
                              setZoomScale(1);
                              setRotateAngle(0);
                              setPdfPage(1);
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-indigo-950/40 border-indigo-500/80 text-white shadow-md' 
                                : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <div className={isSelected ? 'text-indigo-400' : 'text-slate-500'}>
                                {att.type === 'pdf' ? <FileText size={16} /> : att.type === 'excel' ? <FileSpreadsheet size={16} /> : <FileCode size={16} />}
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-bold block truncate">{att.name}</span>
                                <span className="text-[10px] text-slate-500 block mt-0.5">{att.size} • {att.type.toUpperCase()}</span>
                              </div>
                            </div>
                            <div className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors">
                              <Eye size={12} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic p-3 bg-slate-900/20 border border-slate-800/40 rounded-lg">Không có tệp đính kèm nào cho công văn này</p>
                  )}
                </div>

                {/* Chức năng 4: Phân công & Tiến độ xử lý */}
                <div className="border-t border-slate-800 pt-5 mt-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center space-x-1.5">
                      <ClipboardList size={12} className="text-indigo-400" />
                      <span>Phân công & Tiến độ xử lý</span>
                    </h5>
                    
                    {/* Only show 'Giao việc' if user is creator, manager, or admin */}
                    {(currentUser.role === 'admin' || currentUser.role === 'manager' || previewDoc.creatorId === currentUser.id) && !showAssignForm && (
                      <button
                        onClick={() => {
                          setShowAssignForm(true);
                          setAssignDueDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                        }}
                        className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-2 py-1 rounded transition-colors flex items-center space-x-1 cursor-pointer animate-fade-in"
                      >
                        <Plus size={10} />
                        <span>Giao việc</span>
                      </button>
                    )}
                  </div>

                  {/* Form Phân công (Giao việc) */}
                  {showAssignForm && (
                    <form onSubmit={handleAssignTask} className="p-3.5 bg-slate-900 border border-indigo-500/30 rounded-xl space-y-3.5 animate-scale-up">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">Phiếu giao việc mới</span>
                        <button 
                          type="button" 
                          onClick={() => setShowAssignForm(false)} 
                          className="text-slate-400 hover:text-white text-xs cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Người nhận xử lý *</label>
                        <select
                          value={assigneeId}
                          onChange={e => setAssigneeId(e.target.value)}
                          required
                          className="w-full text-xs p-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none text-slate-200"
                        >
                          <option value="">-- Chọn cán bộ/nhân viên --</option>
                          {users
                            .filter(u => u.id !== currentUser.id) // assign to others
                            .map(u => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.position || u.role}) - Phòng {u.department}
                              </option>
                            ))
                          }
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Thời hạn hoàn thành *</label>
                        <input
                          type="date"
                          value={assignDueDate}
                          onChange={e => setAssignDueDate(e.target.value)}
                          required
                          className="w-full text-xs p-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Chỉ đạo chi tiết / Yêu cầu công việc</label>
                        <textarea
                          value={assignInstructions}
                          onChange={e => setAssignInstructions(e.target.value)}
                          rows={3}
                          placeholder="Nhập nội dung chỉ đạo, cách thức xử lý, các phòng ban cần phối hợp..."
                          className="w-full text-xs p-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none text-slate-200"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                      >
                        <Send size={12} />
                        <span>Xác nhận Giao việc</span>
                      </button>
                    </form>
                  )}

                  {/* Danh sách nhiệm vụ đã giao */}
                  <div className="space-y-3">
                    {previewDoc.assignments && previewDoc.assignments.length > 0 ? (
                      previewDoc.assignments.map(asg => {
                        const assignee = users.find(u => u.id === asg.assigneeId);
                        const assigner = users.find(u => u.id === asg.assignedBy);
                        const isAssignee = asg.assigneeId === currentUser.id;
                        const isEditing = updatingAssignmentId === asg.id;

                        // Calculate if overdue
                        const isOverdue = asg.status !== 'completed' && new Date(asg.dueDate) < new Date();

                        return (
                          <div 
                            key={asg.id} 
                            className={`p-3 rounded-xl border bg-slate-900/50 space-y-2.5 transition-all ${
                              isAssignee ? 'border-indigo-500/30 ring-1 ring-indigo-500/10' : 'border-slate-800/80'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-0.5">
                                <div className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                                  <span>👤 {assignee?.name || 'Nhân viên'}</span>
                                  {isAssignee && (
                                    <span className="text-[8px] bg-indigo-600 text-white font-extrabold px-1 rounded uppercase tracking-widest">Tôi</span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500 block">
                                  Bởi: {assigner?.name || 'Cấp quản lý'} • {new Date(asg.assignedAt).toLocaleDateString('vi-VN')}
                                </span>
                              </div>

                              {/* Status badge */}
                              <div className="flex flex-col items-end space-y-1">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  asg.status === 'completed' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : asg.status === 'processing'
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : asg.status === 'rejected'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {asg.status === 'completed' ? 'Hoàn thành' : asg.status === 'processing' ? 'Đang xử lý' : asg.status === 'rejected' ? 'Từ chối' : 'Chờ xử lý'}
                                </span>
                                {isOverdue && (
                                  <span className="text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1 py-0.5 rounded font-bold uppercase animate-pulse">Quá hạn</span>
                                )}
                              </div>
                            </div>

                            {/* Due date and instructions */}
                            <div className="text-xs space-y-1 bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
                              <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-bold">
                                <Clock size={11} className={isOverdue ? 'text-rose-400' : 'text-slate-500'} />
                                <span>Hạn xử lý:</span>
                                <span className={isOverdue ? 'text-rose-400 font-extrabold' : 'text-slate-300'}>
                                  {new Date(asg.dueDate).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              {asg.instructions && (
                                <p className="text-slate-300 text-xs mt-1 italic pl-1 border-l-2 border-indigo-500/30 leading-relaxed font-sans">
                                  "{asg.instructions}"
                                </p>
                              )}
                            </div>

                            {/* Feedback reports (if any) */}
                            {asg.feedback && (
                              <div className="text-[11px] bg-indigo-950/10 p-2 rounded-lg border border-indigo-500/10 space-y-1">
                                <div className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest">Ý kiến phản hồi / Báo cáo:</div>
                                <p className="text-slate-300 italic font-sans leading-normal">"{asg.feedback}"</p>
                                {asg.updatedAt && (
                                  <span className="text-[8px] text-slate-500 block text-right">
                                    Cập nhật: {new Date(asg.updatedAt).toLocaleTimeString('vi-VN')} - {new Date(asg.updatedAt).toLocaleDateString('vi-VN')}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Inline Edit/Update UI for the Assignee */}
                            {isAssignee && !isEditing && (
                              <button
                                onClick={() => {
                                  setUpdatingAssignmentId(asg.id);
                                  setUpdateStatus(asg.status);
                                  setUpdateFeedback(asg.feedback || '');
                                }}
                                className="w-full py-1 text-[10px] font-bold bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 rounded-lg transition-colors cursor-pointer text-center"
                              >
                                ✍️ Cập nhật tiến độ xử lý
                              </button>
                            )}

                            {isEditing && (
                              <form onSubmit={(e) => handleUpdateAssignment(asg.id, e)} className="p-2.5 bg-slate-950 border border-indigo-500/40 rounded-xl space-y-2.5 animate-scale-up">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 mb-1">
                                  <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-wider">Cập nhật kết quả</span>
                                  <button 
                                    type="button" 
                                    onClick={() => setUpdatingAssignmentId(null)}
                                    className="text-slate-500 hover:text-white text-[10px] cursor-pointer"
                                  >
                                    Hủy
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[8px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Trạng thái mới</label>
                                    <select
                                      value={updateStatus}
                                      onChange={e => setUpdateStatus(e.target.value as any)}
                                      className="w-full text-[10px] p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-200 outline-none"
                                    >
                                      <option value="pending">Chờ xử lý</option>
                                      <option value="processing">Đang xử lý</option>
                                      <option value="completed">Đã hoàn thành</option>
                                      <option value="rejected">Từ chối</option>
                                    </select>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[8px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Báo cáo tiến độ / Phản hồi</label>
                                  <textarea
                                    value={updateFeedback}
                                    onChange={e => setUpdateFeedback(e.target.value)}
                                    rows={2}
                                    placeholder="Nêu kết quả đã xử lý hoặc lý do từ chối..."
                                    required
                                    className="w-full text-[11px] p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-200 outline-none font-sans"
                                  />
                                </div>

                                <button
                                  type="submit"
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-1.5 rounded text-[10px] transition-colors cursor-pointer text-center"
                                >
                                  Lưu phản hồi
                                </button>
                              </form>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 bg-slate-900/20 border border-slate-800/40 rounded-xl">
                        <UserCheck size={20} className="text-slate-700 mx-auto mb-1 animate-pulse" />
                        <p className="text-[10px] text-slate-500 font-medium">Chưa có người xử lý được chỉ định</p>
                        {(currentUser.role === 'admin' || currentUser.role === 'manager' || previewDoc.creatorId === currentUser.id) && (
                          <p className="text-[8px] text-indigo-500/80 mt-0.5">Bấm nút "Giao việc" ở trên để phân công xử lý văn bản đến này</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Chức năng 5: Nhật ký tác động & Lịch sử chỉnh sửa (Audit Trail) */}
                <div className="border-t border-slate-800 pt-5 mt-5 space-y-4 animate-fade-in">
                  <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center space-x-1.5">
                    <Clock size={12} className="text-indigo-400 animate-pulse" />
                    <span>Nhật ký tác động & Lịch sử chỉnh sửa (Audit Trail)</span>
                  </h5>
                  
                  <div className="relative border-l border-slate-800 pl-4 ml-2.5 space-y-4 pt-1 pb-1">
                    {previewDoc.history && previewDoc.history.length > 0 ? (
                      previewDoc.history.map((entry) => {
                        const actionColors: Record<string, { bg: string, text: string, label: string }> = {
                          create: { bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', text: 'text-emerald-400', label: 'Khởi tạo' },
                          edit: { bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400', text: 'text-blue-400', label: 'Chỉnh sửa' },
                          assign: { bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400', text: 'text-indigo-400', label: 'Phân công' },
                          update_progress: { bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400', text: 'text-amber-400', label: 'Tiến độ' }
                        };
                        const cfg = actionColors[entry.action] || { bg: 'bg-slate-500/10 border-slate-500/20 text-slate-400', text: 'text-slate-400', label: 'Tác động' };

                        return (
                          <div key={entry.id} className="relative group/timeline">
                            {/* Timeline dot */}
                            <div className={`absolute -left-[21px] top-1.5 w-2 h-2 rounded-full border border-slate-950 ${
                              entry.action === 'create' ? 'bg-emerald-500' : entry.action === 'edit' ? 'bg-blue-500' : entry.action === 'assign' ? 'bg-indigo-500' : 'bg-amber-500'
                            }`} />
                            
                            <div className="space-y-1">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                <span className="text-[11px] font-bold text-slate-200">
                                  {entry.userName} <span className="text-[9px] text-slate-500 font-medium font-sans">({entry.userRole})</span>
                                </span>
                                <span className="text-[9px] text-slate-500 font-medium font-mono shrink-0">
                                  {new Date(entry.timestamp).toLocaleTimeString('vi-VN')} - {new Date(entry.timestamp).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-1.5">
                                <span className={`px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${cfg.bg}`}>
                                  {cfg.label}
                                </span>
                                <p className="text-xs text-slate-400 leading-normal font-sans">
                                  {entry.details}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-500 italic">Không tìm thấy lịch sử ghi nhận tác động.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Interactive Document Viewer Stage */}
              <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
                {activeAttachment ? (
                  <>
                    {/* Visual Toolbar */}
                    <div className="p-3 border-b border-slate-800 bg-slate-900 flex justify-between items-center text-slate-400 select-none text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <FileText size={14} className="text-indigo-400" />
                        <span className="font-bold text-slate-200 truncate">{activeAttachment.name}</span>
                        <span className="text-[10px] text-slate-500">({activeAttachment.size})</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 shrink-0">
                        {/* Zoom Controls */}
                        {activeAttachment.type !== 'excel' && (
                          <div className="flex items-center space-x-1 border-r border-slate-800 pr-2">
                            <button 
                              onClick={() => setZoomScale(Math.max(0.5, zoomScale - 0.25))}
                              className="p-1 hover:bg-slate-800 hover:text-white rounded transition-colors cursor-pointer"
                              title="Thu nhỏ"
                            >
                              <ZoomOut size={14} />
                            </button>
                            <span className="text-[10px] font-bold text-slate-400 px-1 w-10 text-center">{Math.round(zoomScale * 100)}%</span>
                            <button 
                              onClick={() => setZoomScale(Math.min(2, zoomScale + 0.25))}
                              className="p-1 hover:bg-slate-800 hover:text-white rounded transition-colors cursor-pointer"
                              title="Phóng to"
                            >
                              <ZoomIn size={14} />
                            </button>
                          </div>
                        )}

                        {/* Rotation Control for Images */}
                        {activeAttachment.type === 'image' && (
                          <button 
                            onClick={() => setRotateAngle((rotateAngle + 90) % 360)}
                            className="p-1 hover:bg-slate-800 hover:text-white rounded transition-colors cursor-pointer border-r border-slate-800 pr-2 mr-1"
                            title="Xoay ảnh"
                          >
                            <RotateCw size={14} />
                          </button>
                        )}

                        {/* Pagination for PDFs */}
                        {activeAttachment.type === 'pdf' && (
                          <div className="flex items-center space-x-1.5 border-r border-slate-800 pr-2 mr-1 text-[10px] font-bold">
                            <button 
                              onClick={() => setPdfPage(Math.max(1, pdfPage - 1))}
                              disabled={pdfPage === 1}
                              className={`p-1 hover:bg-slate-800 hover:text-white rounded transition-colors cursor-pointer ${pdfPage === 1 ? 'opacity-30' : ''}`}
                            >
                              ◀
                            </button>
                            <span>Trang {pdfPage}/2</span>
                            <button 
                              onClick={() => setPdfPage(Math.min(2, pdfPage + 1))}
                              disabled={pdfPage === 2}
                              className={`p-1 hover:bg-slate-800 hover:text-white rounded transition-colors cursor-pointer ${pdfPage === 2 ? 'opacity-30' : ''}`}
                            >
                              ▶
                            </button>
                          </div>
                        )}

                        {/* Common Action Buttons */}
                        <button 
                          onClick={handlePrint}
                          className="p-1 hover:bg-slate-800 hover:text-white rounded transition-colors cursor-pointer"
                          title="In tài liệu này"
                        >
                          <Printer size={14} />
                        </button>
                        <a 
                          href={activeAttachment.url !== '#' ? activeAttachment.url : undefined} 
                          download={activeAttachment.name}
                          onClick={() => activeAttachment.url === '#' && alert('Tải xuống tệp thành công!')}
                          className="p-1 hover:bg-slate-800 hover:text-white rounded transition-colors cursor-pointer text-slate-400 hover:no-underline"
                          title="Tải xuống tệp tin"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    </div>

                    {/* Stage Preview Rendering */}
                    <div className="flex-1 overflow-auto p-6 flex justify-center items-start bg-slate-900/60 relative">
                      {/* PDF Viewer Simulation */}
                      {activeAttachment.type === 'pdf' && (
                        <div 
                          style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }}
                          className="w-full max-w-xl bg-white text-slate-800 shadow-xl rounded-lg p-8 border border-slate-300 font-sans transition-transform"
                        >
                          {/* Simulated Letterhead Page 1 */}
                          {pdfPage === 1 ? (
                            <div className="space-y-6">
                              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                                <div className="text-center font-bold text-[10px] tracking-wide text-slate-700">
                                  <p className="uppercase">CÔNG TY CỔ PHẦN CÔNG NGHỆ SIO</p>
                                  <p className="border-b border-slate-700 w-16 mx-auto mt-1"></p>
                                  <p className="text-[9px] text-slate-500 mt-1 font-medium font-mono">Số: {previewDoc.docNumber}</p>
                                </div>
                                <div className="text-center font-bold text-[10px] tracking-wide text-slate-700">
                                  <p className="uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                                  <p className="font-medium text-[9px] lowercase italic">Độc lập - Tự do - Hạnh phúc</p>
                                  <p className="border-b border-slate-700 w-24 mx-auto mt-1"></p>
                                </div>
                              </div>

                              <div className="text-center mt-6 space-y-2">
                                <h4 className="font-extrabold text-base tracking-tight uppercase text-slate-900">
                                  {previewDoc.type === 'decision' ? 'QUYẾT ĐỊNH' : previewDoc.type === 'notice' ? 'THÔNG BÁO' : 'CÔNG VĂN CHÍNH THỨC'}
                                </h4>
                                <p className="text-xs italic text-slate-500">
                                  V/v: {previewDoc.title}
                                </p>
                              </div>

                              <div className="text-xs text-slate-700 leading-relaxed space-y-4 font-sans pt-4 min-h-[250px]">
                                {activeAttachment.content ? (
                                  <div className="whitespace-pre-line">{activeAttachment.content}</div>
                                ) : (
                                  <div>
                                    <p className="font-bold">Kính gửi: Các phòng ban, bộ phận toàn thể Công ty.</p>
                                    <p className="mt-2 indent-6">{previewDoc.content}</p>
                                    <p className="mt-2 indent-6">Yêu cầu toàn thể cán bộ nhân viên cập nhật thông tin chính xác và phối hợp triển khai công tác theo đúng chức năng nhiệm vụ.</p>
                                  </div>
                                )}
                              </div>

                              {/* Footer Signblock & Red Seal */}
                              <div className="flex justify-between items-end pt-12 text-xs text-slate-800">
                                <div className="text-[10px] text-slate-500 leading-tight">
                                  <p className="font-bold">Nơi nhận:</p>
                                  <p>- Như Điều 3;</p>
                                  <p>- Ban Giám đốc (để b/c);</p>
                                  <p>- Lưu VP-HR.</p>
                                </div>
                                <div className="text-center relative min-w-[150px]">
                                  <p className="font-bold uppercase tracking-wide">
                                    {previewDoc.type === 'decision' ? 'T.M BAN GIÁM ĐỐC' : 'T.M HỘI ĐỒNG QUẢN TRỊ'}
                                  </p>
                                  {previewDoc.isSigned ? (
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-0.5 flex items-center justify-center space-x-1">
                                      <span>✓ ĐÃ KÝ SỐ</span>
                                    </p>
                                  ) : (
                                    <p className="text-[10px] font-medium text-slate-400 italic mt-0.5">Chưa ký ban hành</p>
                                  )}
                                  
                                  <div className="h-16 flex items-center justify-center relative">
                                    {previewDoc.isSigned ? (
                                      previewDoc.signatureType === 'draw' ? (
                                        <img 
                                          src={previewDoc.signatureValue} 
                                          alt="Chữ ký" 
                                          className="h-16 w-auto object-contain mix-blend-darken select-none rotate-2" 
                                        />
                                      ) : previewDoc.signatureType === 'type' ? (
                                        <p className="font-serif italic text-lg text-blue-800 font-bold tracking-widest py-2 select-none rotate-1">
                                          {previewDoc.signatureValue}
                                        </p>
                                      ) : (
                                        <div className="flex flex-col items-center justify-center p-1 border border-indigo-200 bg-indigo-50/80 rounded font-mono text-[7px] text-indigo-700 leading-none select-none">
                                          <span className="font-bold">🔒 SECURE TOKEN</span>
                                          <span>SIO-CA CERTIFIED</span>
                                        </div>
                                      )
                                    ) : (
                                      <div className="h-full"></div>
                                    )}
                                  </div>

                                  <p className="font-black text-slate-900 tracking-tight">
                                    {previewDoc.isSigned ? getUserName(previewDoc.signedBy) : getUserName(previewDoc.creatorId)}
                                  </p>
                                  
                                  {/* Dynamic Stamp Seal */}
                                  {previewDoc.isSigned ? (
                                    previewDoc.stampType === 'official' ? (
                                      <div className="absolute -right-4 top-2 w-20 h-20 rounded-full border-4 border-rose-500 flex flex-col items-center justify-center text-[8px] font-black text-rose-500 uppercase rotate-12 select-none pointer-events-none bg-rose-500/5 shadow-sm">
                                        <span className="text-[6px] font-extrabold text-center leading-tight">CÔNG TY CỔ PHẦN</span>
                                        <span className="text-[9px] font-black tracking-tighter">SIO TECH</span>
                                        <span className="text-[5px] font-extrabold text-center leading-none">ĐÃ PHÊ DUYỆT</span>
                                      </div>
                                    ) : previewDoc.stampType === 'secret' ? (
                                      <div className="absolute -right-4 top-6 px-2.5 py-0.5 border-2 border-amber-600 text-amber-600 font-extrabold text-[9px] uppercase rotate-12 select-none pointer-events-none bg-amber-50/20">
                                        TỐI MẬT
                                      </div>
                                    ) : (
                                      <div className="absolute -right-4 top-6 px-2.5 py-0.5 border-2 border-rose-600 text-rose-600 font-extrabold text-[9px] uppercase -rotate-6 select-none pointer-events-none bg-rose-50/20 animate-pulse">
                                        HỎA TỐC
                                      </div>
                                    )
                                  ) : (
                                    <div className="absolute right-2 top-4 w-16 h-16 rounded-full border-4 border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-300 uppercase rotate-12 select-none pointer-events-none">
                                      CHƯA ĐÓNG DẤU
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Page 2 (Clauses / Signers details)
                            <div className="space-y-6">
                              <h5 className="font-bold border-b pb-2 text-xs uppercase text-slate-700">Phần Phụ Lục Kèm Theo Văn Bản</h5>
                              <div className="text-xs space-y-4 text-slate-600">
                                <p className="font-semibold text-slate-800">KHOẢN 1: QUY CHẾ VÀ BIỆN PHÁP AN TOÀN</p>
                                <p className="indent-4 leading-relaxed">Mọi cán bộ công nhân viên trực thuộc các dự án đang hoạt động phải chấp hành nghiêm túc quy định bảo mật an ninh mạng và rà soát thiết bị định kỳ trước khi bàn giao ca kíp.</p>
                                <p className="font-semibold text-slate-800">KHOẢN 2: THỜI HẠN VÀ BIỂU MẪU BÁO CÁO</p>
                                <p className="indent-4 leading-relaxed">Báo cáo kết quả công tác trực ban và xử lý văn bản khẩn cấp phát sinh phải được gửi trực tiếp về Văn phòng Hội đồng quản trị trong vòng 24 giờ sau ca trực.</p>
                              </div>
                              <div className="pt-24 text-center text-[10px] text-slate-400 italic">
                                -- Hết trang phụ lục 2 --
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Image Viewer */}
                      {activeAttachment.type === 'image' && (
                        <div className="relative overflow-hidden border border-slate-800 rounded-lg max-w-lg bg-slate-950 flex items-center justify-center min-h-[300px]">
                          <img 
                            src={activeAttachment.url} 
                            alt={activeAttachment.name}
                            referrerPolicy="no-referrer"
                            style={{ 
                              transform: `scale(${zoomScale}) rotate(${rotateAngle}deg)`,
                              transition: 'transform 0.2s ease-in-out'
                            }}
                            className="max-h-[70vh] object-contain rounded"
                          />
                        </div>
                      )}

                      {/* Excel Viewer Simulation */}
                      {activeAttachment.type === 'excel' && (
                        <div className="w-full max-w-2xl bg-white text-slate-800 shadow-xl rounded-lg overflow-hidden border border-slate-300 font-mono text-xs select-none">
                          {/* Excel top ribbon */}
                          <div className="bg-slate-100 border-b border-slate-200 px-3 py-1.5 text-[10px] text-slate-500 flex items-center space-x-2">
                            <span className="font-bold text-emerald-700">EXCEL PREVIEW</span>
                            <span>•</span>
                            <span>Sheet1</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 text-center">
                                  <th className="border-r border-slate-200 px-2 py-1 w-8">#</th>
                                  <th className="border-r border-slate-200 px-3 py-1">A</th>
                                  <th className="border-r border-slate-200 px-3 py-1">B</th>
                                  <th className="border-r border-slate-200 px-3 py-1">C</th>
                                  <th className="px-3 py-1">D</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700">
                                {activeAttachment.content ? (
                                  activeAttachment.content.split('\n').map((row, rIdx) => {
                                    const cells = row.split(',');
                                    return (
                                      <tr key={rIdx} className="hover:bg-slate-50">
                                        <td className="bg-slate-50 border-r border-slate-200 text-[10px] text-slate-400 font-bold text-center py-1.5 w-8">{rIdx + 1}</td>
                                        <td className="border-r border-slate-200 px-3 py-1.5 font-bold text-slate-900">{cells[0] || ''}</td>
                                        <td className="border-r border-slate-200 px-3 py-1.5">{cells[1] || ''}</td>
                                        <td className="border-r border-slate-200 px-3 py-1.5 text-indigo-600 font-semibold">{cells[2] || ''}</td>
                                        <td className="px-3 py-1.5 text-slate-500 italic">{cells[3] || ''}</td>
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr className="text-center">
                                    <td colSpan={5} className="py-8 text-slate-400">Không có dữ liệu chi tiết</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Default text viewer */}
                      {(activeAttachment.type === 'text' || activeAttachment.type === 'word') && (
                        <div 
                          style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }}
                          className="w-full max-w-xl bg-amber-50/10 border border-slate-800 text-slate-300 shadow-xl rounded-lg p-6 font-mono text-xs whitespace-pre-wrap leading-relaxed transition-transform"
                        >
                          <div className="border-b border-slate-800 pb-3 mb-3 text-[10px] text-slate-500 font-sans flex justify-between">
                            <span>MÃ HÓA KÝ TỰ: UTF-8</span>
                            <span>{activeAttachment.name}</span>
                          </div>
                          {activeAttachment.content || `Nội dung tài liệu đính kèm ${activeAttachment.name}`}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-3 p-12 text-center text-slate-500">
                    <FileText size={40} className="text-slate-700 animate-pulse" />
                    <p className="text-xs font-bold text-slate-400">Chọn một tệp đính kèm ở cột bên trái</p>
                    <p className="text-[10px] text-slate-500">Hệ thống sẽ tải bộ xem trước trực quan (PDF, hình ảnh, văn bản hoặc bảng tính) thời gian thực tại đây.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end space-x-3 select-none">
              <button 
                onClick={() => { setPreviewDoc(null); setActiveAttachment(null); }}
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Đóng xem trước
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chức năng 7: Digital Signature Modal Overlay */}
      {isSigningOpen && previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div className="flex items-center space-x-2">
                <PenTool size={16} className="text-emerald-400" />
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">Ký số & Đóng dấu điện tử</h3>
              </div>
              <button 
                onClick={() => setIsSigningOpen(false)}
                className="text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-xs text-slate-400 flex items-start space-x-2.5">
                <ShieldCheck size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200">Xác thực chứng thư số chính phủ: </span>
                  Hệ thống sử dụng tiêu chuẩn chữ ký số công cộng SHA-256 mã hóa đối xứng, tự động xác minh danh tính tài khoản hiện hành.
                </div>
              </div>

              {/* Step 1: Select Stamp Style */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Bước 1: Chọn mẫu dấu đóng mộc</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedStamp('official')}
                    className={`p-3 rounded-xl border text-left space-y-1 transition-all flex flex-col justify-between h-20 cursor-pointer ${
                      selectedStamp === 'official' 
                        ? 'border-rose-500 bg-rose-950/10 text-rose-400' 
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-black">Dấu Tròn Pháp Nhân</span>
                    <span className="text-[8px] opacity-70">Sử dụng cho Ban Giám đốc và HĐQT ban hành chính thức</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStamp('secret')}
                    className={`p-3 rounded-xl border text-left space-y-1 transition-all flex flex-col justify-between h-20 cursor-pointer ${
                      selectedStamp === 'secret' 
                        ? 'border-amber-500 bg-amber-950/10 text-amber-400' 
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-black">Mộc đỏ TỐI MẬT</span>
                    <span className="text-[8px] opacity-70">Sử dụng cho các quyết định bảo mật, nội bộ nhạy cảm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStamp('urgent')}
                    className={`p-3 rounded-xl border text-left space-y-1 transition-all flex flex-col justify-between h-20 cursor-pointer ${
                      selectedStamp === 'urgent' 
                        ? 'border-rose-600 bg-rose-950/20 text-rose-500' 
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-black">Mộc đỏ HỎA TỐC</span>
                    <span className="text-[8px] opacity-70">Sử dụng cho các văn bản khẩn, cần chỉ đạo lập tức</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Select Signing Method */}
              <div className="space-y-2 pt-2 border-t border-slate-850">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Bước 2: Chọn phương thức ký số</label>
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850">
                  <button
                    type="button"
                    onClick={() => setSignType('draw')}
                    className={`flex-1 py-1.5 rounded-md text-center text-xs font-bold transition-all cursor-pointer ${
                      signType === 'draw' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Vẽ tay trực tiếp
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignType('type')}
                    className={`flex-1 py-1.5 rounded-md text-center text-xs font-bold transition-all cursor-pointer ${
                      signType === 'type' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tên mẫu chữ viết
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignType('token')}
                    className={`flex-1 py-1.5 rounded-md text-center text-xs font-bold transition-all cursor-pointer ${
                      signType === 'token' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Khóa USB Token
                  </button>
                </div>
              </div>

              {/* Step 3: Signature Area */}
              <div className="pt-2">
                {signType === 'draw' && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-slate-500 italic">Vui lòng vẽ chữ ký của bạn vào khung bên dưới:</span>
                    <div className="border border-slate-800 bg-white rounded-xl overflow-hidden h-44 relative">
                      <SignatureCanvas 
                        onSave={handleSignConfirm} 
                        onCancel={() => setIsSigningOpen(false)} 
                      />
                    </div>
                  </div>
                )}

                {signType === 'type' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 block font-bold">Nhập tên hiển thị trên chữ ký:</label>
                      <input
                        type="text"
                        value={typedSignName}
                        onChange={(e) => setTypedSignName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        placeholder="Nhập họ và tên đầy đủ..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 block font-bold">Chọn kiểu chữ viết tay mỹ thuật:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { style: 'font-serif italic font-extrabold tracking-widest text-indigo-700', label: 'Cursive Elegant' },
                          { style: 'font-mono italic font-black text-rose-600', label: 'Calligraphy Bold' },
                          { style: 'font-sans italic font-bold tracking-tight text-emerald-600', label: 'Modern Script' }
                        ].map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCursiveStyle(idx)}
                            className={`p-3 rounded-lg border text-center transition-all cursor-pointer bg-slate-950 ${
                              cursiveStyle === idx ? 'border-indigo-500 bg-indigo-950/10' : 'border-slate-850'
                            }`}
                          >
                            <p className={`${item.style} text-sm truncate`}>{typedSignName || 'Ky ten'}</p>
                            <span className="text-[8px] text-slate-500 mt-1 block">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!typedSignName}
                      onClick={() => handleSignConfirm(typedSignName)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Xác nhận chữ ký điện tử
                    </button>
                  </div>
                )}

                {signType === 'token' && (
                  <div className="space-y-3 bg-slate-950 border border-slate-850 p-4 rounded-xl">
                    <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs mb-2">
                      <Key size={14} className="animate-bounce" />
                      <span>THIẾT BỊ USB CA-TOKEN CẮM NGOÀI</span>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 block font-bold">Chọn Chứng thư số (máy tính phát hiện):</label>
                      <select
                        value={selectedTokenCert}
                        onChange={(e) => setSelectedTokenCert(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="SIO-CA SHA256 (Hội đồng quản trị)">SIO-CA SHA256 (Hội đồng quản trị) - Expired: 2029</option>
                        <option value="SIO-CA SHA256 (Phòng Hành chính Tổng hợp)">SIO-CA SHA256 (Phòng Hành chính Tổng hợp) - Expired: 2030</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 block font-bold">Mã PIN của USB Token:</label>
                      <input
                        type="password"
                        value={tokenPin}
                        onChange={(e) => setTokenPin(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        placeholder="Nhập mã PIN Token..."
                      />
                    </div>

                    <button
                      type="button"
                      disabled={!tokenPin}
                      onClick={() => handleSignConfirm(`🔑 CERT:${selectedTokenCert.substring(0,12)}`)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer mt-2"
                    >
                      Xác thực PIN & Ký khóa bảo mật
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Link Modal */}
      {showTaskLinkModal && previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none animate-fade-in">
          <form 
            onSubmit={handleCreateLinkedTask}
            className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div className="flex items-center space-x-2">
                <CheckSquare size={16} className="text-indigo-400" />
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">Chuyển tiếp thành Công việc</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowTaskLinkModal(false)}
                className="text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              <p className="text-slate-400 text-[11px]">
                Hệ thống tự động liên kết công văn <span className="font-bold text-slate-200">{previewDoc.docNumber}</span> với một nhiệm vụ mới để cán bộ trực ban thực hiện xử lý cụ thể.
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tên Nhiệm vụ:</label>
                <input
                  type="text"
                  value={linkTaskName}
                  onChange={(e) => setLinkTaskName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nội dung chi tiết chỉ đạo:</label>
                <textarea
                  value={linkTaskDesc}
                  onChange={(e) => setLinkTaskDesc(e.target.value)}
                  rows={4}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Phân công cho cán bộ xử lý:</label>
                <select
                  value={linkTaskAssignee}
                  onChange={(e) => setLinkTaskAssignee(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === 'admin' ? 'Quản trị viên' : u.role === 'manager' ? 'Cấp quản lý' : 'Nhân viên'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-850 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowTaskLinkModal(false)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Tạo & Liên kết nhiệm vụ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chat Share Modal */}
      {showChatShareModal && previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none animate-fade-in">
          <form 
            onSubmit={handleShareToChat}
            className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div className="flex items-center space-x-2">
                <Share2 size={16} className="text-sky-400" />
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">Chia sẻ Công văn vào Chat</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowChatShareModal(false)}
                className="text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              <p className="text-slate-400 text-[11px]">
                Gửi ngay liên kết công văn này vào kênh chat nội bộ để thông báo cho toàn bộ thành viên dự án và cộng đồng cùng theo dõi.
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Chọn phòng chat nhóm:</label>
                <select
                  value={chatRoomSelection}
                  onChange={(e) => setChatRoomSelection(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="general">Kênh Chung Toàn Công Ty (Corporate All)</option>
                  <option value="department">Kênh Phòng Ban Nội Bộ (My Department Only)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nội dung tin nhắn đi kèm:</label>
                <textarea
                  value={customChatMessage}
                  onChange={(e) => setCustomChatMessage(e.target.value)}
                  rows={3}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-850 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowChatShareModal(false)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Gửi tin nhắn liên kết
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
