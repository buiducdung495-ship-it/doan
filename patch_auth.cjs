const fs = require('fs');
let code = fs.readFileSync('src/components/AuthPage.tsx', 'utf8');

const target1 = `  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();`;
const replace1 = `  const handleQuickLogin = async (identifier: string, employeeId: string) => {
    setLoginIdentifier(identifier);
    setLoginEmployeeId(employeeId);
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          employeeId,
          skip2FA: true
        })
      });
      const text_data = await response.text(); let data: any = {}; if (text_data) { try { data = JSON.parse(text_data); } catch(e) { console.error("JSON parse error:", text_data); data = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng." }; } }
      if (!response.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại.');
      }
      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();`;

const target2 = `                    </>
                  )}
                </button>
              </form>
            ) : (`;
const replace2 = `                    </>
                  )}
                </button>
                
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider text-center">Tài Khoản Dùng Thử</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => handleQuickLogin('admin@company.com', 'admin-1')} className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold text-left transition-colors border border-indigo-100">
                      <span className="block text-[10px] text-indigo-400 uppercase">Giám đốc (Admin)</span>
                      Trần Quỳnh
                    </button>
                    <button type="button" onClick={() => handleQuickLogin('dat.nguyen@company.com', 'mgr-tech-1')} className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold text-left transition-colors border border-blue-100">
                      <span className="block text-[10px] text-blue-400 uppercase">Trưởng phòng IT</span>
                      Nguyễn Văn Đạt
                    </button>
                    <button type="button" onClick={() => handleQuickLogin('hai.le@company.com', 'emp-tech-1')} className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold text-left transition-colors border border-slate-200">
                      <span className="block text-[10px] text-slate-400 uppercase">Nhân viên IT</span>
                      Lê Hải
                    </button>
                    <button type="button" onClick={() => handleQuickLogin('linh.pham@company.com', 'emp-hr-1')} className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold text-left transition-colors border border-slate-200">
                      <span className="block text-[10px] text-slate-400 uppercase">Nhân viên HR</span>
                      Phạm Linh
                    </button>
                  </div>
                </div>
              </form>
            ) : (`;

if (code.includes('handleQuickLogin')) {
  console.log('Already patched');
} else {
  code = code.replace(target1, replace1);
  code = code.replace(target2, replace2);
  fs.writeFileSync('src/components/AuthPage.tsx', code);
  console.log('Patched AuthPage.tsx');
}
