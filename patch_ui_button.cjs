const fs = require('fs');
let code = fs.readFileSync('src/components/TaskManager.tsx', 'utf8');

const targetStr = `<label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-2">
                Dự án hiện tại
              </label>`;

const replaceStr = `<div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Dự án hiện tại
                </label>
                <button 
                  onClick={() => setIsAddProjectOpen(true)}
                  className="p-1 hover:bg-slate-100 rounded text-[#2f80ed] transition-colors"
                  title="Thêm dự án mới"
                >
                  <Plus size={14} strokeWidth={3} />
                </button>
              </div>`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/TaskManager.tsx', code);
console.log('patched ui button');
