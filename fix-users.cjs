const fs = require('fs');

const DEFAULT_USERS = [
  { id: 'admin-1', name: 'Trần Quỳnh', email: 'admin@company.com', role: 'admin', department: 'Admin', avatar: 'https://i.pravatar.cc/150?u=admin-1', realName: 'Trần Thị Quỳnh', position: 'Tổng Giám Đốc', level: 'Level 5', cccd: '001122334455', birthday: '01/01/1980', gender: 'Nữ' },
  { id: 'mgr-tech-1', name: 'Nguyễn Văn Đạt', email: 'dat.nguyen@company.com', role: 'manager', department: 'Tech', avatar: 'https://i.pravatar.cc/150?u=mgr-tech-1', position: 'Trưởng Phòng IT' },
  { id: 'emp-tech-1', name: 'Lê Hải', email: 'hai.le@company.com', role: 'employee', department: 'Tech', avatar: 'https://i.pravatar.cc/150?u=emp-tech-1', position: 'Lập trình viên' },
  { id: 'emp-hr-1', name: 'Phạm Linh', email: 'linh.pham@company.com', role: 'employee', department: 'HR', avatar: 'https://i.pravatar.cc/150?u=emp-hr-1', position: 'Nhân sự' }
];

const dbPath = 'data/db.json';
let db = {};
try {
  if (fs.existsSync(dbPath)) {
    db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  }
} catch (e) {}

if (!db.users || db.users.length === 0) {
  db.users = DEFAULT_USERS;
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  console.log('Added default users to db.json');
} else {
  console.log('Users already exist.');
}
