const fs = require('fs');
let code = fs.readFileSync('src/components/KPIManager.tsx', 'utf8');

code = code.replace(
  /<td className="px-6 py-4 text-center">\s*<span className=\{\`font-bold \$\{record\.kpiScore >= 80 \? 'text-emerald-600' : record\.kpiScore >= 50 \? 'text-amber-600' : 'text-rose-600'\}\`\}>\s*\{record\.kpiScore\}\s*<\/span>\s*<\/td>/,
  `<td className="px-6 py-4 text-center">
                    {isEditing ? (
                      <input 
                        type="number" 
                        value={editKpi} 
                        onChange={e => setEditKpi(Number(e.target.value))} 
                        className="w-20 px-2 py-1 text-center border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ) : (
                      <span className={\`font-bold \${record.kpiScore >= 80 ? 'text-emerald-600' : record.kpiScore >= 50 ? 'text-amber-600' : 'text-rose-600'}\`}>
                        {record.kpiScore}
                      </span>
                    )}
                  </td>`
);
fs.writeFileSync('src/components/KPIManager.tsx', code);
console.log('patched kpiScore');
