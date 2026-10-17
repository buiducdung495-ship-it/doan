export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  secondaryPhoneNumber?: string;
  role: 'admin' | 'manager' | 'employee';
  department: 'Tech' | 'HR' | 'Finance' | 'Sales' | 'Admin';
  avatar?: string;
  salary: number;
  realName?: string;
  cccd?: string;
  address?: string;
  position?: string;
  gender?: 'Nam' | 'Nữ';
  birthday?: string;
  age?: number;
  level?: 'Sơ cấp' | 'Trung cấp' | 'Cao cấp';
  cloudUsed?: number; // bytes used in cloud storage
  kpiRecords?: Record<string, { daysWorked: number, kpiScore: number, note: string }>; // Keyed by YYYY-MM
  signatureUrl?: string; // base64 image or url
}

export interface FormField {
  id: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  label: string;
  placeholder: string;
  required: boolean;
  options?: string[]; // For 'select' dropdowns
  validationMin?: number; // Minimum number or character length
  validationMax?: number; // Maximum number or character length
}

export interface FormTemplate {
  id: string;
  title: string;
  description: string;
  category: 'leave' | 'asset' | 'finance' | 'general';
  fields: FormField[];
  status: 'draft' | 'active';
  createdBy: string;
  createdAt: string;
}

export interface WorkflowStage {
  stageIndex: number;
  roleRequired: 'manager' | 'admin' | 'any';
  title: string;
  description: string;
}

export interface AutoApproveRule {
  field: string;
  operator: 'lt' | 'gt' | 'eq';
  value: string | number;
  action: 'approve' | 'skip';
}

export interface WorkflowConfig {
  id: string;
  formTemplateId: string;
  name: string;
  stages: WorkflowStage[];
  autoApproveRules?: AutoApproveRule[];
}

export interface ApprovalHistoryItem {
  stageIndex: number;
  approverId: string;
  approverName: string;
  approverRole: string;
  action: 'approved' | 'rejected' | 'commented';
  comment?: string;
  timestamp: string;
}

export interface WorkflowRequest {
  id: string;
  formTemplateId: string;
  formTitle: string;
  submitterId: string;
  submitterName: string;
  submitterRole: string;
  submitterDepartment: string;
  submissionData: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  currentStageIndex: number;
  approvalHistory: ApprovalHistoryItem[];
  createdAt: string;
  updatedAt: string;
  severity?: 'low' | 'high';
}

export interface Asset {
  id: string;
  name: string;
  description: string;
  category: 'Laptop' | 'Monitor' | 'Phone' | 'Chair' | 'Desk' | 'Other';
  initialCondition: number; // 0-100 damage level (0 is perfect, 100 is broken)
  currentCondition: number;
  assignedTo?: string; // userId
  assignedToName?: string;
  assignmentDate?: string;
  returnDate?: string;
  returnCondition?: number;
  status: 'available' | 'assigned' | 'pending_assign' | 'pending_return' | 'pending_exchange' | 'pending_buyback' | 'sold';
  purchaseValue: number;
  currentPriceForSale: number;
  requestedBy?: string; // userId requesting action
  requestDetails?: string; // e.g., damage details, purchase reasoning
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  recipientId: string; // 'all' for general channels, 'dept:deptName', 'group:groupId', or userId for direct message
  content: string;
  timestamp: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: 'image' | 'file';
  replyTo?: {
    messageId: string;
    senderName: string;
    contentSnippet: string;
  };
  deletedForUsers?: string[];
}

export interface ChatGroup {
  id: string;
  name: string;
  memberIds: string[]; // list of user ids
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: 'workflow' | 'asset' | 'chat' | 'payment';
  link?: string;
  timestamp: string;
  targetTab?: 'ai' | 'corporate' | 'department' | 'private';
  targetRecipientId?: string;
}

export interface OutgoingDocument {
  id: string;
  title: string; // Trích yếu
  documentType: string; // Loại văn bản
  departmentId: string; // Đơn vị soạn thảo
  drafterId: string; // Người soạn thảo
  content: string; // Nội dung
  status: 'draft' | 'submitted' | 'approved' | 'signed' | 'issued' | 'rejected';
  approverId?: string;
  signerId?: string;
  issueDate?: string;
  recipient?: string; // Nơi nhận
  attachments?: string[];
  signatureData?: string; // Dữ liệu ký số
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  organizerId: string;
  attendees: string[];
  type: 'meeting' | 'business_trip' | 'holiday' | 'other';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  creatorId: string;
  dueDate: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
}

export interface IncomingDocument {
  id: string;
  documentNumber: string; // Số ký hiệu
  title: string; // Trích yếu
  documentDate: string; // Ngày văn bản
  receivedDate: string; // Ngày nhận
  sender: string; // Cơ quan ban hành/gửi đến
  category: string; // Loại văn bản (Quyết định, Thông báo, Công văn...)
  urgency: 'normal' | 'urgent' | 'very_urgent'; // Độ khẩn
  confidentiality: 'normal' | 'confidential' | 'secret'; // Độ mật
  status: 'new' | 'assigned' | 'in_progress' | 'completed' | 'archived'; // Trạng thái
  assignedTo?: string[]; // Người được phân công xử lý (danh sách user ID)
  attachments?: string[]; // Danh sách file đính kèm
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  userName: string;
  assetId?: string;
  assetName?: string;
  type: 'buyback' | 'rent' | 'deduction';
  amount: number;
  paymentMethod: 'credit_card' | 'e_wallet' | 'payroll_deduction';
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
}

export interface InternalDocument {
  id: string;
  title: string;
  docNumber?: string;
  type: 'notice' | 'decision' | 'regulation' | 'plan' | 'report' | 'minutes';
  content: string;
  departmentId: string;
  creatorId: string;
  createdAt: string;
  status: 'draft' | 'published';
  attachments?: string[];
  documentDate?: string;
  confidentiality?: 'normal' | 'confidential' | 'secret';
  urgency?: 'normal' | 'urgent' | 'very_urgent';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface SharedCategory {
  id: string;
  type: 'document_type' | 'urgency_level' | 'confidentiality_level' | 'department';
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface OCRDocument {
  id: string;
  fileName: string;
  fileUrl?: string;
  extractedText: string;
  confidence: number;
  status: 'processing' | 'completed' | 'failed';
  uploadedAt: string;
  uploaderId: string;
}

export interface CloudFile {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileType: string; // e.g. 'image', 'pdf', 'docx', etc.
  fileSize: number; // in bytes
  uploadedAt: string;
}

