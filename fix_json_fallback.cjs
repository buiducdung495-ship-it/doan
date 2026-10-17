const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');
content = content.replace(
  /\.then\(res => res\.json\(\)\)/g,
  ".then(res => { if (!res.ok) throw new Error('API Error'); return res.json(); })"
);
fs.writeFileSync('src/App.tsx', content);
