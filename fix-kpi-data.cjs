const fs = require('fs');

const dbPath = 'data/db.json';
let db = {};
try {
  if (fs.existsSync(dbPath)) {
    db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  }
} catch (e) {}

if (db.users) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
  const lastMonthKey = currentMonth === 1 ? `${currentYear - 1}-12` : `${currentYear}-${(currentMonth - 1).toString().padStart(2, '0')}`;

  db.users.forEach(user => {
    if (!user.kpiRecords) {
      user.kpiRecords = {};
    }
    
    if (user.role !== 'admin') {
      user.kpiRecords[lastMonthKey] = {
        daysWorked: Math.floor(Math.random() * 5) + 20, // 20-24
        kpiScore: Math.floor(Math.random() * 20) + 80, // 80-99
        note: 'Đạt chỉ tiêu tháng trước'
      };
      
      user.kpiRecords[monthKey] = {
        daysWorked: Math.floor(Math.random() * 5) + 15, // 15-19
        kpiScore: Math.floor(Math.random() * 30) + 70, // 70-99
        note: 'Đang theo dõi'
      };
    }
  });

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  console.log('Added default KPI records to users in db.json');
} else {
  console.log('No users found in db.');
}
