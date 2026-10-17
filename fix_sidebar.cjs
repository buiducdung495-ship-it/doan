const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

content = content.replace(
  /className="bg-\[#f3f7ff\] border border-blue-100 rounded-2xl/g,
  'className="bg-[#f3f7ff] border border-blue-100/50 rounded-3xl'
);

content = content.replace(
  /className="bg-white rounded-xl/g,
  'className="bg-white rounded-2xl'
);

fs.writeFileSync('src/components/Sidebar.tsx', content);
