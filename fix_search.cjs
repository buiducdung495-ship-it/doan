const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  /className="pl-9 pr-8 py-1.5 bg-\[#f4f7f6\] border border-\[#e2eae8\] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-\[#2f80ed\] w-56 focus:w-72 transition-all font-medium text-slate-700 placeholder-slate-400"/g,
  'className="pl-9 pr-8 py-2 bg-slate-100/60 border border-transparent hover:bg-white hover:border-slate-200 rounded-full text-xs focus:outline-none focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 w-56 focus:w-72 transition-all duration-300 font-medium text-slate-700 placeholder-slate-400 shadow-sm focus:shadow-md"'
);

fs.writeFileSync('src/App.tsx', content);
