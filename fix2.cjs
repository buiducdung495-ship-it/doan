const fs = require('fs');
let content = fs.readFileSync('src/components/AuthPage.tsx', 'utf-8');

const anchor = 'Vai trò công tác';
const index = content.lastIndexOf(anchor);
if (index === -1) { console.log("Not found"); process.exit(1); }

// Find where <button starts after Vai trò công tác block
const buttonIndex = content.indexOf('<button', index);

const newEnd = `                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#12b76a] hover:bg-[#0fa65e] text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center space-x-2 mt-4 cursor-pointer disabled:opacity-50"
                >
                  <UserPlus size={14} />
                  <span>{isLoading ? 'Đang đăng ký tài khoản...' : 'Đăng ký Tài khoản Mới'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
`;

const fixedContent = content.substring(0, buttonIndex) + newEnd;
fs.writeFileSync('src/components/AuthPage.tsx', fixedContent);
