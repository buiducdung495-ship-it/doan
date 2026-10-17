const fs = require('fs');
let content = fs.readFileSync('src/components/AuthPage.tsx', 'utf-8');

content = content.replace(
  /try \{ data = await response\.json\(\); \} catch\(e\) \{ data = \{ error: "Lỗi kết nối hoặc server phản hồi sai định dạng\." \}; \}/g,
  'try { data = await response.json(); } catch(e: any) { console.error("JSON PARSE ERROR 1:", e); data = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng. Chi tiết: " + e.message }; }'
);

content = content.replace(
  /try \{ data = await res\.json\(\); \} catch\(e\) \{ data = \{ error: "Lỗi kết nối hoặc server phản hồi sai định dạng\." \}; \}/g,
  'try { data = await res.json(); } catch(e: any) { console.error("JSON PARSE ERROR 2:", e); data = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng. Chi tiết: " + e.message }; }'
);

fs.writeFileSync('src/components/AuthPage.tsx', content);
