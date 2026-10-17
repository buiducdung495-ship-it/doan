const fs = require('fs');
let content = fs.readFileSync('src/components/ApprovalInbox.tsx', 'utf-8');

content = content.replace(/rounded-xl/g, 'rounded-3xl');
content = content.replace(
  /className="p-3.5 rounded-lg border transition-all cursor-pointer text-left/g,
  'className="p-4 rounded-2xl border transition-all cursor-pointer text-left'
);
content = content.replace(
  /className="bg-indigo-50\/25 border-indigo-200 ring-1 ring-indigo-500\/10/g,
  'className="bg-indigo-50/50 border-indigo-200 ring-2 ring-indigo-500/20 shadow-sm shadow-indigo-100/50'
);

fs.writeFileSync('src/components/ApprovalInbox.tsx', content);
