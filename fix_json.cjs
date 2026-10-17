const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');
content = content.replace(
  /\.then\(res => \{ if \(\!res\.ok\) throw new Error\('API Error'\); return res\.json\(\); \}\)/g,
  ".then(async res => { if (!res.ok) throw new Error('API Error'); const text = await res.text(); try { return JSON.parse(text); } catch(e) { console.error('Failed to parse JSON for ' + res.url, text.substring(0, 50)); return []; } })"
);
fs.writeFileSync('src/App.tsx', content);
