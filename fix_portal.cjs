const fs = require('fs');
let content = fs.readFileSync('src/components/WorkflowPortal.tsx', 'utf-8');

// Top Welcome Banner styling
content = content.replace(
  /className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"/g,
  'className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group"'
);

content = content.replace(
  /<h2 className="text-lg font-bold">Cổng Đăng Ký Đơn Từ Hành Chính<\/h2>\s*<p className="text-xs text-slate-300 mt-1">/g,
  '<div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-60 group-hover:bg-indigo-100 transition-all duration-700"></div>\n          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 relative z-10">Cổng Đăng Ký Đơn Từ</h2>\n          <p className="text-sm text-slate-500 mt-2 font-medium relative z-10">'
);

content = content.replace(
  /className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700\/80 border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"/g,
  'className="px-4 py-2.5 bg-white border-2 border-slate-100 hover:border-emerald-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer relative z-10 shadow-sm"'
);

// Grid of Available Forms
content = content.replace(
  /className="bg-white rounded-xl shadow-xs border border-slate-100 p-5 hover:shadow-md hover:border-slate-200 transition-all flex flex-col justify-between"/g,
  'className="bg-white rounded-3xl shadow-sm border border-slate-100/50 p-6 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-100 transition-all duration-300 flex flex-col justify-between group"'
);

content = content.replace(
  /className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"/g,
  'className="px-4 py-2 bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-300 cursor-pointer shadow-sm"'
);

// Table History
content = content.replace(
  /className="bg-white rounded-xl shadow-xs border border-slate-100 overflow-hidden"/g,
  'className="bg-white rounded-3xl shadow-sm border border-slate-100/50 overflow-hidden"'
);

fs.writeFileSync('src/components/WorkflowPortal.tsx', content);
