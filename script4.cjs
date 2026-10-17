const fs = require('fs');
let content = fs.readFileSync('src/components/LiveChat.tsx', 'utf8');

// remove isFloating conditions
content = content.replace(/if\s*\(isFloating\)\s*\{\s*setActivePane\('[a-z]+'\);\s*\}/g, '');
content = content.replace(/\{isFloating && \(\s*<button[\s\S]*?Quay lại danh sách\s*<\/button>\s*\)\}/, '');
content = content.replace(/\{isFloating && \(activeChatTab === 'private' \|\| activeChatTab === 'department'\) && \([\s\S]*?<ChevronLeft size=\{14\} \/>\s*<\/button>\s*\)\}/, '');
content = content.replace(/\{isFloating && onCloseFloating && \([\s\S]*?<X size=\{14\} strokeWidth=\{3\} \/>\s*<\/button>\s*\)\}/, '');

fs.writeFileSync('src/components/LiveChat.tsx', content);
