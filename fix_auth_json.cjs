const fs = require('fs');
let content = fs.readFileSync('src/components/AuthPage.tsx', 'utf-8');

content = content.replace(
  /const data = await response\.json\(\);/g,
  'let data: any = {};\n      try { data = await response.json(); } catch(e) { data = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng." }; }'
);

content = content.replace(
  /const data = await res\.json\(\);/g,
  'let data: any = {};\n        try { data = await res.json(); } catch(e) { data = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng." }; }'
);

fs.writeFileSync('src/components/AuthPage.tsx', content);
