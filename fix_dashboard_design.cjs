const fs = require('fs');
let content = fs.readFileSync('src/components/DashboardAnalytics.tsx', 'utf-8');

// Banner
content = content.replace(
  /className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden"/g,
  'className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group"'
);

// Stat cards
content = content.replace(
  /className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-start justify-between relative overflow-hidden hover:shadow-md transition-shadow"/g,
  'className="bg-white rounded-3xl p-5 border border-slate-100/50 shadow-sm flex items-start justify-between relative overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"'
);

// Charts
content = content.replace(
  /className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs"/g,
  'className="bg-white rounded-3xl p-6 border border-slate-100/50 shadow-sm"'
);

// Activity List
content = content.replace(
  /className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs lg:col-span-1 flex flex-col h-full"/g,
  'className="bg-white rounded-3xl p-6 border border-slate-100/50 shadow-sm lg:col-span-1 flex flex-col h-full"'
);

fs.writeFileSync('src/components/DashboardAnalytics.tsx', content);
