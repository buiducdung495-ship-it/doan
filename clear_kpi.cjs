const fs = require('fs');
const dbPath = 'data/db.json';
if (fs.existsSync(dbPath)) {
  let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  if (db.users) {
    db.users.forEach(u => {
      u.kpiRecords = {};
    });
  }
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  console.log('Cleared kpiRecords in db.json');
}
