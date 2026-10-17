const fs = require('fs');
let content = fs.readFileSync('src/components/LiveChat.tsx', 'utf-8');
content = content.replace(
  /\{\/\* Right side controls \(Add member button for active 1-1 chat\) \*\/\}/,
  `{/* Right side controls (FaceTime and Add member) */}
            <div className="flex items-center space-x-2">
              {['private', 'department'].includes(activeChatTab) && selectedRecipientId !== '' && (
                <button
                  onClick={() => {
                    setActiveVideoCall({ isOpen: true, partnerName: activeChatPartnerName, isGroup: selectedRecipientId.startsWith('group:') || activeChatTab === 'department' });
                  }}
                  className="text-[10px] font-extrabold text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  title="Gọi Video Meeting (FaceTime)"
                >
                  <Video size={12} strokeWidth={2.5} />
                  <span>FaceTime</span>
                </button>
              )}`
);
fs.writeFileSync('src/components/LiveChat.tsx', content);
