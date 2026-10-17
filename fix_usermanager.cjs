const fs = require('fs');
let content = fs.readFileSync('src/components/UserManager.tsx', 'utf-8');

content = content.replace(
  /className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col md:grid md:grid-cols-12 gap-4 items-center relative"/g,
  'className="bg-white border border-slate-100/50 rounded-3xl p-5 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all duration-300 flex flex-col md:grid md:grid-cols-12 gap-4 items-center relative group"'
);

// enhance the avatar display
content = content.replace(
  /<img \n                         src=\{u\.avatar \|\| 'https:\/\/images\.unsplash\.com\/photo-1534528741775-53994a69daeb\?w=150'\} \n                         alt=\{u\.name\} \n                         className="w-10 h-10 rounded-full object-cover border border-slate-100"/g,
  '<img \n                         src={u.avatar || \'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150\'} \n                         alt={u.name} \n                         className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform duration-300"'
);

fs.writeFileSync('src/components/UserManager.tsx', content);
