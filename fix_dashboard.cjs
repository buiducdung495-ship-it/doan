const fs = require('fs');
let content = fs.readFileSync('src/components/DashboardAnalytics.tsx', 'utf-8');

// Replace standard white cards with modern elegant cards
content = content.replace(
  /className="bg-white p-5 rounded-2xl border border-\[\#e2eae8\] shadow-xs flex flex-col justify-between min-h-\[120px\] hover:border-blue-300 transition-all"/g,
  'className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all relative overflow-hidden group"'
);
content = content.replace(
  /className="bg-white p-5 rounded-2xl border border-\[\#e2eae8\] shadow-xs flex flex-col justify-between min-h-\[120px\] hover:border-emerald-300 transition-all"/g,
  'className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all relative overflow-hidden group"'
);
content = content.replace(
  /className="bg-white p-5 rounded-2xl border border-\[\#e2eae8\] shadow-xs flex flex-col justify-between min-h-\[120px\] hover:border-amber-300 transition-all"/g,
  'className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all relative overflow-hidden group"'
);
content = content.replace(
  /className="bg-white p-5 rounded-2xl border border-\[\#e2eae8\] shadow-xs flex flex-col justify-between min-h-\[120px\] hover:border-purple-300 transition-all"/g,
  'className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all relative overflow-hidden group"'
);

// Add decorative gradients inside cards
content = content.replace(
  /<div className="flex justify-between items-start">\n              <span className="text-\[10px\] font-extrabold text-slate-400 uppercase tracking-wider">Tổng Đơn Trình Duyệt<\/span>/,
  '<div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />\n            <div className="flex justify-between items-start relative z-10">\n              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Tổng Đơn Trình Duyệt</span>'
);

content = content.replace(
  /<div className="flex justify-between items-start">\n              <span className="text-\[10px\] font-extrabold text-slate-400 uppercase tracking-wider">Đã Thông Qua \(Approved\)<\/span>/,
  '<div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full mix-blend-multiply filter blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />\n            <div className="flex justify-between items-start relative z-10">\n              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Đã Thông Qua (Approved)</span>'
);

content = content.replace(
  /<div className="flex justify-between items-start">\n              <span className="text-\[10px\] font-extrabold text-slate-400 uppercase tracking-wider">Chưa Thông Qua \/ Đang Chờ<\/span>/,
  '<div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full mix-blend-multiply filter blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />\n            <div className="flex justify-between items-start relative z-10">\n              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Chưa Thông Qua / Đang Chờ</span>'
);

content = content.replace(
  /<div className="flex justify-between items-start">\n              <span className="text-\[10px\] font-extrabold text-slate-400 uppercase tracking-wider">Doanh Số Hợp Đồng<\/span>/,
  '<div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full mix-blend-multiply filter blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />\n            <div className="flex justify-between items-start relative z-10">\n              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Doanh Số Hợp Đồng</span>'
);

// General card updates
content = content.replace(
  /className="bg-white p-6 rounded-2xl border border-\[\#e2eae8\] shadow-xs/g,
  'className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm'
);

content = content.replace(
  /className="bg-white p-5 rounded-2xl border border-\[\#e2eae8\] shadow-xs/g,
  'className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm'
);


fs.writeFileSync('src/components/DashboardAnalytics.tsx', content);
