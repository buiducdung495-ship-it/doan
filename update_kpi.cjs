const fs = require('fs');

let code = fs.readFileSync('src/components/KPIManager.tsx', 'utf8');

// 1. Update saveEdit to call API
code = code.replace(
  /const saveEdit = \(userId: string\) => \{[\s\S]*?setEditingUserId\(null\);\s*\};/,
  `const saveEdit = async (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    
    const updatedKpiRecords = {
      ...userToUpdate.kpiRecords,
      [monthKey]: {
        daysWorked: editDays,
        kpiScore: editKpi,
        note: editNote
      }
    };
    
    try {
      const res = await fetch(\`/api/users/\${userId}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kpiRecords: updatedKpiRecords })
      });
      if (res.ok) {
        const updatedUsers = users.map(u => u.id === userId ? { ...u, kpiRecords: updatedKpiRecords } : u);
        setUsers(updatedUsers);
        setEditingUserId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };`
);

// 2. Add handleClearAll function for deleting all existing data
code = code.replace(
  /const saveEdit = async /g,
  `const handleClearAll = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu KPI?')) return;
    try {
      const promises = users.map(u => 
        fetch(\`/api/users/\${u.id}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kpiRecords: {} })
        })
      );
      await Promise.all(promises);
      const updatedUsers = users.map(u => ({ ...u, kpiRecords: {} }));
      setUsers(updatedUsers);
    } catch (e) {
      console.error(e);
    }
  };

  const saveEdit = async `
);

// 3. Render inputs for daysWorked and kpiScore
code = code.replace(
  /<td className="px-6 py-4 text-center">\s*<span className="font-medium text-slate-700">\{record\.daysWorked\} ngày<\/span>\s*<\/td>/,
  `<td className="px-6 py-4 text-center">
                    {isEditing ? (
                      <input 
                        type="number" 
                        value={editDays} 
                        onChange={e => setEditDays(Number(e.target.value))} 
                        className="w-20 px-2 py-1 text-center border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ) : (
                      <span className="font-medium text-slate-700">{record.daysWorked} ngày</span>
                    )}
                  </td>`
);

code = code.replace(
  /<td className="px-6 py-4 text-center">\s*<span className={`\$\{record\.kpiScore >= 80 \? 'text-emerald-600' : record\.kpiScore >= 50 \? 'text-amber-600' : 'text-rose-600'\}`\}>\s*\{record\.kpiScore\}\s*<\/span>\s*<\/td>/,
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

// 4. Add "Delete All Data" button to header
code = code.replace(
  /Quản lý ngày làm việc và đánh giá KPI hàng tháng\.\s*<\/p>\s*<\/div>/,
  `Quản lý ngày làm việc và đánh giá KPI hàng tháng.
          </p>
        </div>
        {currentUser.role !== 'employee' && (
          <button 
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-100 text-red-600 font-semibold rounded-lg hover:bg-red-200 transition-colors mr-auto ml-4"
          >
            Xóa dữ liệu
          </button>
        )}`
);

fs.writeFileSync('src/components/KPIManager.tsx', code);
console.log('updated kpi manager');
