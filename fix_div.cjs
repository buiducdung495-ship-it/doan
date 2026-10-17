const fs = require('fs');
let content = fs.readFileSync('src/components/LiveChat.tsx', 'utf-8');
content = content.replace(
  /\n            <div className="flex items-center space-x-2">\n              \{activeChatTab === 'private'/,
  "\n              {activeChatTab === 'private'"
);
fs.writeFileSync('src/components/LiveChat.tsx', content);
