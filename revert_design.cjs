const fs = require('fs');
const files = [
  'src/components/ApprovalInbox.tsx',
  'src/components/UserManager.tsx',
  'src/components/WorkflowPortal.tsx',
  'src/components/DashboardAnalytics.tsx',
  'src/components/Sidebar.tsx',
  'src/components/AssetManager.tsx',
  'src/components/ContractManager.tsx',
  'src/components/TaskManager.tsx',
  'src/components/InternalDocumentManager.tsx',
  'src/components/LiveChat.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    content = content.replace(/rounded-3xl/g, 'rounded-xl');
    content = content.replace(/slate-100\/50/g, 'slate-100');
    content = content.replace(/border-slate-100\/60/g, 'border-slate-100');
    content = content.replace(/bg-slate-100\/60/g, 'bg-[#f4f7f6]');
    fs.writeFileSync(file, content);
  }
}

let appContent = fs.readFileSync('src/App.tsx', 'utf-8');
appContent = appContent.replace(/bg-slate-100\/60/g, 'bg-[#f4f7f6]');
appContent = appContent.replace(/className="pl-9 pr-8 py-2 bg-slate-100\/60 border border-transparent hover:bg-white hover:border-slate-200 rounded-full text-xs focus:outline-none focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500\/10 w-56 focus:w-72 transition-all duration-300 font-medium text-slate-700 placeholder-slate-400 shadow-sm focus:shadow-md"/g, 'className="pl-9 pr-8 py-1.5 bg-[#f4f7f6] border border-[#e2eae8] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#2f80ed] w-56 focus:w-72 transition-all font-medium text-slate-700 placeholder-slate-400"');
fs.writeFileSync('src/App.tsx', appContent);

