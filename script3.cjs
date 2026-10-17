const fs = require('fs');
let content = fs.readFileSync('src/components/LiveChat.tsx', 'utf8');

const forwardModal = `
      {/* MODAL: FORWARD MESSAGE */}
      {forwardingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setForwardingMessage(null)} />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md z-10 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Chuyển tiếp tin nhắn</h3>
              <button onClick={() => setForwardingMessage(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 line-clamp-3">
                <span className="font-bold text-slate-700">{forwardingMessage.senderName}:</span> {forwardingMessage.content || forwardingMessage.fileName}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chọn người nhận</div>
              {allUsers.filter(u => u.id !== currentUser.id).map(u => (
                <button
                  key={u.id}
                  onClick={async () => {
                    setIsSending(true);
                    try {
                      await onSendChatMessage('private', forwardingMessage.content, u.id, forwardingMessage.fileUrl, forwardingMessage.fileName, forwardingMessage.fileType, forwardingMessage.fileSize);
                      setForwardingMessage(null);
                    } catch (err) {
                      console.error(err);
                      alert('Lỗi chuyển tiếp.');
                    } finally {
                      setIsSending(false);
                    }
                  }}
                  className="w-full text-left p-3 flex items-center space-x-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                >
                  <img src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} className="w-8 h-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">{u.name}</div>
                    <div className="text-[10px] text-slate-500">{u.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
`;

content = content.replace('{/* MODAL: QUICK PREVIEW */}', forwardModal + '\n      {/* MODAL: QUICK PREVIEW */}');

fs.writeFileSync('src/components/LiveChat.tsx', content);
console.log("Updated LiveChat.tsx with forward modal");
