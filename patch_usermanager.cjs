const fs = require('fs');
let code = fs.readFileSync('src/components/UserManager.tsx', 'utf8');

// Reverse the users list before filtering so new users appear first
code = code.replace(
  'const filteredUsers = users.filter(u => {',
  'const filteredUsers = [...users].reverse().filter(u => {'
);

// Wrap the delete button in a role check
code = code.replace(
  /<button\s+onClick=\{\(\) => handleDelete\(u\.id\)\}[\s\S]*?<\/button>/,
  `{(currentUser.role === 'admin' || currentUser.role === 'manager') && (
                              <button
                                onClick={() => handleDelete(u.id)}
                                disabled={u.id === currentUser.id || (currentUser.role === 'manager' && u.role === 'admin')}
                                className="w-full text-left flex items-center gap-2 p-2 hover:bg-rose-50 rounded-xl text-xs font-bold text-rose-600 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Trash2 size={13} />
                                <span>Xóa nhân sự</span>
                              </button>
                            )}`
);

fs.writeFileSync('src/components/UserManager.tsx', code);
console.log('patched UserManager.tsx');
