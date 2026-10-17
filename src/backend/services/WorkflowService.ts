import { RequestModel } from '../models/RequestModel';
import { FormModel } from '../models/FormModel';
import { WorkflowModel } from '../models/WorkflowModel';
import { UserModel } from '../models/UserModel';
import { NotificationModel } from '../models/NotificationModel';
import { WorkflowRequest, WorkflowConfig, ApprovalHistoryItem, User } from '../../types';

export class WorkflowService {
  static async determineSeverity(formCategory: string, submissionData: Record<string, any>, formTitle?: string): Promise<'low' | 'high'> {
    let severity: 'low' | 'high' = 'low';
    const titleLower = (formTitle || '').toLowerCase();

    if (formCategory === 'finance' || titleLower.includes('tài chính') || titleLower.includes('tạm ứng') || titleLower.includes('ngân sách')) {
      severity = 'high';
    } else if (formCategory === 'leave' || titleLower.includes('phép') || titleLower.includes('nghỉ')) {
      let days = 1;
      for (const [key, val] of Object.entries(submissionData)) {
        if (
          key.toLowerCase().includes('ngày') || 
          key.toLowerCase().includes('day') || 
          key.toLowerCase() === 'num_days' || 
          typeof val === 'number'
        ) {
          const num = Number(val);
          if (!isNaN(num)) {
            days = num;
          }
        }
      }
      severity = days >= 3 ? 'high' : 'low';
    } else if (formCategory === 'asset' || titleLower.includes('thiết bị') || titleLower.includes('tài sản') || titleLower.includes('vật tư')) {
      let isExpensive = false;
      for (const [key, val] of Object.entries(submissionData)) {
        const valStr = String(val).toLowerCase();
        if (
          valStr.includes('laptop') || 
          valStr.includes('phone') || 
          valStr.includes('điện thoại') || 
          valStr.includes('máy tính') || 
          valStr.includes('macbook') || 
          valStr.includes('dell') || 
          valStr.includes('màn hình') || 
          valStr.includes('monitor')
        ) {
          isExpensive = true;
        }
      }
      severity = isExpensive ? 'high' : 'low';
    } else {
      let hasHighIndicator = false;
      for (const [key, val] of Object.entries(submissionData)) {
        const valStr = String(val).toLowerCase();
        if (
          valStr.includes('khẩn') || 
          valStr.includes('gấp') || 
          valStr.includes('quan trọng') || 
          valStr.includes('chi phí') || 
          valStr.includes('triệu')
        ) {
          hasHighIndicator = true;
        }
        const valNum = Number(val);
        if (!isNaN(valNum) && valNum >= 5) {
          hasHighIndicator = true;
        }
      }
      severity = hasHighIndicator ? 'high' : 'low';
    }

    return severity;
  }

  static async submitRequest(formTemplateId: string, submitterId: string, submissionData: Record<string, any>): Promise<WorkflowRequest> {
    const form = FormModel.findById(formTemplateId);
    if (!form) {
      throw new Error('Mẫu đơn không tồn tại.');
    }

    const submitter = await UserModel.findById(submitterId);
    if (!submitter) {
      throw new Error('Nhân viên không tồn tại.');
    }

    // Get workflow configuration
    const config = WorkflowModel.findByFormTemplateId(formTemplateId);
    if (!config) {
      throw new Error('Quy trình duyệt chưa được cấu hình cho mẫu đơn này.');
    }

    const requestId = 'req-' + Math.random().toString(36).substring(2, 11);

    const severity = await this.determineSeverity(form.category, submissionData, form.title);

    // All submitted forms are directly approved/signed by Admin (no hierarchical stages)
    const activeStages = [
      {
        stageIndex: 0,
        roleRequired: 'admin',
        title: 'Ban Giám đốc phê duyệt',
        description: 'Phê duyệt tối cao của Quản trị viên/Ban giám đốc.'
      }
    ];

    const request: WorkflowRequest = {
      id: requestId,
      formTemplateId,
      formTitle: form.title,
      submitterId,
      submitterName: submitter.name,
      submitterRole: submitter.role,
      submitterDepartment: submitter.department,
      submissionData,
      status: 'pending',
      currentStageIndex: 0,
      approvalHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      severity
    };

    RequestModel.create(request);

    // Notify the first approver
    this.notifyApprover(request, activeStages);

    return request;
  }

  private static async notifyApprover(request: WorkflowRequest, activeStages: any[]): Promise<void> {
    const currentStage = activeStages.find(s => s.stageIndex === request.currentStageIndex);
    if (!currentStage) return;

    let targetApprovers: User[] = [];
    const users = await UserModel.findAll();

    if (currentStage.roleRequired === 'manager') {
      // Find the manager of the submitter's department
      targetApprovers = users.filter(
        u => u.role === 'manager' && u.department === request.submitterDepartment
      );

      // Fallback: if no manager in this department, find any manager or admin
      if (targetApprovers.length === 0) {
        targetApprovers = users.filter(u => u.role === 'manager');
      }
    } else if (currentStage.roleRequired === 'admin') {
      targetApprovers = users.filter(u => u.role === 'admin');
    } else {
      targetApprovers = users.filter(u => u.role === 'admin' || u.role === 'manager');
    }

    // Create notifications for all target approvers
    targetApprovers.forEach(approver => {
      NotificationModel.create({
        id: 'notif-' + Math.random().toString(36).substring(2, 11),
        userId: approver.id,
        title: `Yêu cầu duyệt: ${request.formTitle}`,
        message: `Nhân viên ${request.submitterName} (${request.submitterDepartment}) vừa gửi một ${request.formTitle.toLowerCase()} mới đang chờ bạn xem duyệt.`,
        read: false,
        type: 'workflow',
        link: `/requests/${request.id}`,
        timestamp: new Date().toISOString()
      });
    });
  }

  static async approveRequest(requestId: string, approverId: string, comment?: string): Promise<WorkflowRequest> {
    const request = RequestModel.findById(requestId);
    if (!request) {
      throw new Error('Yêu cầu không tồn tại.');
    }

    const approver = await UserModel.findById(approverId);
    if (!approver) {
      throw new Error('Người duyệt không tồn tại.');
    }

    const config = WorkflowModel.findByFormTemplateId(request.formTemplateId);
    if (!config) {
      throw new Error('Quy trình duyệt chưa được cấu hình.');
    }

    const form = FormModel.findById(request.formTemplateId);
    const category = form ? form.category : 'general';

    // All submitted forms are directly approved/signed by Admin (no hierarchical stages)
    const activeStages = [
      {
        stageIndex: 0,
        roleRequired: 'admin',
        title: 'Ban Giám đốc phê duyệt',
        description: 'Phê duyệt tối cao của Quản trị viên/Ban giám đốc.'
      }
    ];

    // Record approval
    const historyItem: ApprovalHistoryItem = {
      stageIndex: request.currentStageIndex,
      approverId,
      approverName: approver.name,
      approverRole: approver.role,
      action: 'approved',
      comment,
      timestamp: new Date().toISOString()
    };

    const newHistory = [...request.approvalHistory, historyItem];

    // Determine next stage
    const currentActiveIndex = activeStages.findIndex(s => s.stageIndex === request.currentStageIndex);
    const hasNextStage = currentActiveIndex !== -1 && currentActiveIndex < activeStages.length - 1;

    let newStatus: 'pending' | 'approved' | 'rejected' = 'pending';
    let nextStageIndex = request.currentStageIndex;

    if (hasNextStage) {
      nextStageIndex = activeStages[currentActiveIndex + 1].stageIndex;
    } else {
      newStatus = 'approved';
    }

    const updateData = {
      approvalHistory: newHistory,
      status: newStatus,
      currentStageIndex: nextStageIndex,
      updatedAt: new Date().toISOString()
    };

    RequestModel.update(requestId, updateData);
    const updatedRequest = { ...request, ...updateData };

    // Send notification to submitter
    if (newStatus === 'approved') {
      NotificationModel.create({
        id: 'notif-' + Math.random().toString(36).substring(2, 11),
        userId: request.submitterId,
        title: `Yêu cầu được PHÊ DUYỆT`,
        message: `Đơn "${request.formTitle}" của bạn đã được phê duyệt hoàn tất bởi ${approver.name}.`,
        read: false,
        type: 'workflow',
        link: `/requests/${request.id}`,
        timestamp: new Date().toISOString()
      });
    } else {
      // Notify next approver
      this.notifyApprover(updatedRequest, activeStages);
      
      // Notify submitter about step progress
      NotificationModel.create({
        id: 'notif-' + Math.random().toString(36).substring(2, 11),
        userId: request.submitterId,
        title: `Yêu cầu chuyển cấp duyệt`,
        message: `Đơn "${request.formTitle}" của bạn đã được thông qua bởi ${approver.name} và chuyển lên cấp duyệt tiếp theo.`,
        read: false,
        type: 'workflow',
        link: `/requests/${request.id}`,
        timestamp: new Date().toISOString()
      });
    }

    return updatedRequest;
  }

  static async rejectRequest(requestId: string, approverId: string, comment?: string): Promise<WorkflowRequest> {
    const request = RequestModel.findById(requestId);
    if (!request) {
      throw new Error('Yêu cầu không tồn tại.');
    }

    const approver = await UserModel.findById(approverId);
    if (!approver) {
      throw new Error('Người duyệt không tồn tại.');
    }

    const historyItem: ApprovalHistoryItem = {
      stageIndex: request.currentStageIndex,
      approverId,
      approverName: approver.name,
      approverRole: approver.role,
      action: 'rejected',
      comment,
      timestamp: new Date().toISOString()
    };

    const newHistory = [...request.approvalHistory, historyItem];

    const updateData = {
      approvalHistory: newHistory,
      status: 'rejected' as const,
      updatedAt: new Date().toISOString()
    };

    RequestModel.update(requestId, updateData);

    // Notify submitter
    NotificationModel.create({
      id: 'notif-' + Math.random().toString(36).substring(2, 11),
      userId: request.submitterId,
      title: `Yêu cầu bị TỪ CHỐI`,
      message: `Đơn "${request.formTitle}" của bạn đã bị từ chối bởi ${approver.name}. Lý do: "${comment || 'Không có lý do cụ thể'}"`,
      read: false,
      type: 'workflow',
      link: `/requests/${request.id}`,
      timestamp: new Date().toISOString()
    });

    return { ...request, ...updateData };
  }
}
