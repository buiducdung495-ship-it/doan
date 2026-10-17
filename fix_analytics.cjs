const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardAnalytics.tsx', 'utf8');

code = code.replace(/assets: Asset\[\];/, '');
code = code.replace(/assets = \[\],/, '');

fs.writeFileSync('src/components/DashboardAnalytics.tsx', code);
console.log('Fixed analytics');
