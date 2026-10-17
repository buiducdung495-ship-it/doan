const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');
content = content.replace(
  /fetch\('([^']+)'\)\.then\(res => res\.json\(\)\)/g,
  "fetch('$1').then(res => res.ok ? res.json() : Promise.resolve([]))"
);
content = content.replace(
  /fetch\(currentUser \? `\/api\/chats\?userId=\$\{currentUser\.id\}` : '\/api\/chats'\)\.then\(res => res\.json\(\)\)/g,
  "fetch(currentUser ? `/api/chats?userId=${currentUser.id}` : '/api/chats').then(res => res.ok ? res.json() : Promise.resolve([]))"
);
content = content.replace(
  /fetch\(currentUser \? `\/api\/notifications\?userId=\$\{currentUser\.id\}` : '\/api\/notifications'\)\.then\(res => res\.json\(\)\)/g,
  "fetch(currentUser ? `/api/notifications?userId=${currentUser.id}` : '/api/notifications').then(res => res.ok ? res.json() : Promise.resolve([]))"
);

fs.writeFileSync('src/App.tsx', content);
