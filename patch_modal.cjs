const fs = require('fs');
let code = fs.readFileSync('src/components/TaskManager.tsx', 'utf8');

const modalStr = `
      {/* ========================================================= */}
      {/* MODAL: ADD NEW PROJECT */}
      {isAddProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0c1a30]/40 backdrop-blur-md" onClick={() => setIsAddProjectOpen(false)} />
          
          <div className="bg-white rounded-xl border border-slate-100 shadow-2xl w-full max-w-lg z-10 overflow-hidden relative animate-scale-up font-sans text-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#2f80ed]/10 flex items-center justify-center text-[#2f80ed]">
                  <FolderKanban size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Tạo dự án mới</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Thiết lập thông tin cơ bản cho dự án</p>
                </div>
              </div>
              <button onClick={() => setIsAddProjectOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors">
                <Trash2 size={16} className="rotate-45" /> {/* Use Trash2 as X if X is not imported, wait, let's use Plus rotated */}
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleAddProject} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Tên dự án <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="Nhập tên dự án..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2f80ed] focus:ring-1 focus:ring-[#2f80ed] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Mô tả dự án</label>
                <textarea
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                  placeholder="Mô tả ngắn gọn về mục tiêu dự án..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#2f80ed] focus:ring-1 focus:ring-[#2f80ed] transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Mức độ ưu tiên</label>
                  <select
                    value={newProjectPriority}
                    onChange={e => setNewProjectPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#2f80ed] focus:ring-1 focus:ring-[#2f80ed] transition-all"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Hạn chót</label>
                  <input
                    type="date"
                    value={newProjectDueDate}
                    onChange={e => setNewProjectDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#2f80ed] focus:ring-1 focus:ring-[#2f80ed] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Thành viên tham gia</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                  {users.map(u => (
                    <label key={u.id} className="flex items-center space-x-2.5 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={newProjectAssignees.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewProjectAssignees(prev => [...prev, u.id]);
                          } else {
                            setNewProjectAssignees(prev => prev.filter(id => id !== u.id));
                          }
                        }}
                        className="rounded text-[#2f80ed] focus:ring-[#2f80ed]"
                      />
                      <div className="flex items-center space-x-2">
                        <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover" />
                        <span className="text-xs font-semibold text-slate-700">{u.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddProjectOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={!newProjectName.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#2f80ed] text-white hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <FolderKanban size={14} />
                  <span>Tạo dự án</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
`;

code = code.replace("{/* ========================================================= */}\n      {/* MODAL 3: ADD NEW TASK MODAL", modalStr + "      {/* MODAL 3: ADD NEW TASK MODAL");
fs.writeFileSync('src/components/TaskManager.tsx', code);
console.log('patched modal');
