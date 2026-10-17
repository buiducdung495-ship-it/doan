const fs = require('fs');

const dbPath = 'data/db.json';
let db = {};
if (fs.existsSync(dbPath)) {
  db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

if (!db.forms || db.forms.length === 0) {
  db.forms = [
    {
      id: "form-1",
      title: "Đơn Xin Nghỉ Phép",
      category: "leave",
      fields: [
        { id: "f1", label: "Lý do nghỉ", type: "text", required: true },
        { id: "f2", label: "Số ngày", type: "number", required: true }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "form-2",
      title: "Đề Xuất Cấp Máy Tính",
      category: "asset",
      fields: [
        { id: "f1", label: "Loại máy", type: "text", required: true },
        { id: "f2", label: "Lý do", type: "text", required: true }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

if (!db.requests || db.requests.length === 0) {
  db.requests = [
    {
      id: "req-1",
      formTemplateId: "form-1",
      formTitle: "Đơn Xin Nghỉ Phép",
      submitterId: "emp-tech-1",
      submitterName: "Lê Hải",
      submitterRole: "employee",
      submitterDepartment: "Tech",
      submissionData: { f1: "Nghỉ ốm", f2: "2" },
      status: "pending",
      currentStageIndex: 0,
      approvalHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "req-2",
      formTemplateId: "form-2",
      formTitle: "Đề Xuất Cấp Máy Tính",
      submitterId: "emp-hr-1",
      submitterName: "Phạm Linh",
      submitterRole: "employee",
      submitterDepartment: "HR",
      submissionData: { f1: "Laptop Dell", f2: "Máy cũ bị hỏng" },
      status: "approved",
      currentStageIndex: 1,
      approvalHistory: [
        {
          stageName: "Trưởng Phòng",
          approverId: "admin-1",
          approverName: "Trần Quỳnh",
          action: "approved",
          comment: "Đồng ý cấp máy",
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

if (!db.tasks || db.tasks.length === 0) {
  db.tasks = [
    {
      id: "task-1",
      title: "Triển khai hệ thống Docusys",
      description: "Hoàn thiện các module chính",
      assignee: "Nguyễn Văn Đạt",
      department: "Tech",
      priority: "high",
      status: "in-progress",
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: "task-2",
      title: "Tuyển dụng nhân sự tháng 7",
      description: "Tuyển 2 dev react",
      assignee: "Phạm Linh",
      department: "HR",
      priority: "medium",
      status: "todo",
      dueDate: new Date(Date.now() + 86400000 * 10).toISOString(),
      createdAt: new Date().toISOString()
    }
  ];
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Added mock forms, requests, and tasks.');
