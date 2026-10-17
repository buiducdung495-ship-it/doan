const fs = require('fs');
let content = fs.readFileSync('src/components/AuthPage.tsx', 'utf-8');

const badString = `                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#12b76a] hover:bg-[#0fa65e] text-white font-bold py          </div>
        </div>
      </div>
    </div>
  );
};      ))}
                {filteredUsers.length === 0 && (
                  <div className="col-span-2 py-4 text-center text-xs text-slate-400 font-mono border border-dashed border-[#e2eae8] rounded-xl">
                    Không tìm thấy tài khoản thuộc vai trò này.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};`;

const goodString = `                <button
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
};`;

content = content.replace(badString, goodString);
fs.writeFileSync('src/components/AuthPage.tsx', content);
