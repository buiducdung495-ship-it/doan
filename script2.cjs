const fs = require('fs');
let content = fs.readFileSync('src/components/LiveChat.tsx', 'utf8');

// Add Reply and Forward imports
if (!content.includes('Reply,')) {
  content = content.replace('import {', 'import { Reply, Forward,');
}

const replacement = `
                      <div className={\`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap \${bubbleColor} \${isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'} relative group/msg\`}>
                        {msg.replyTo && (
                          <div className="mb-2 p-1.5 bg-black/10 border-l-2 border-black/20 rounded text-[10px] text-left overflow-hidden">
                            <strong className="opacity-70 block mb-0.5">{msg.replyTo.senderName}</strong>
                            <span className="opacity-60 truncate block">{msg.replyTo.contentSnippet}</span>
                          </div>
                        )}
                        {msg.content}
                        
                        {/* Hover actions */}
                        <div className={\`absolute top-1/2 -translate-y-1/2 flex items-center bg-white border border-slate-200 shadow-sm rounded-lg opacity-0 group-hover/msg:opacity-100 transition-opacity \${isMe ? '-left-14' : '-right-14'}\`}>
                          <button
                            onClick={() => setReplyingTo({ messageId: msg.id, senderName: msg.senderName, contentSnippet: msg.content || (msg.fileName || 'Đính kèm') })}
                            className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 rounded-l-lg cursor-pointer"
                            title="Trả lời"
                          >
                            <Reply size={13} />
                          </button>
                          <button
                            onClick={() => setForwardingMessage(msg)}
                            className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-emerald-600 rounded-r-lg border-l border-slate-100 cursor-pointer"
                            title="Chuyển tiếp"
                          >
                            <Forward size={13} />
                          </button>
                        </div>
`;

content = content.replace(
  /<div className=\{\`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap \$\{bubbleColor\} \$\{isMe \? 'rounded-tr-sm' : 'rounded-tl-sm'\}\`\}>\n\s*\{msg.content\}/,
  replacement
);

fs.writeFileSync('src/components/LiveChat.tsx', content);
console.log("Updated LiveChat.tsx with replying UI");
