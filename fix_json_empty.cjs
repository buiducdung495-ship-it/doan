const fs = require('fs');
const files = [
  'src/components/AuditLogManager.tsx',
  'src/components/UserManager.tsx',
  'src/components/SharedCategoryManager.tsx',
  'src/components/OCRManager.tsx',
  'src/components/FormBuilder.tsx',
  'src/components/InternalDocumentManager.tsx',
  'src/components/LiveChat.tsx',
  'src/components/AuthPage.tsx',
  'src/App.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    
    // Fix the parse empty string error
    content = content.replace(/const (text_\w+) = await ([\w]+)\.text\(\); let (\w+): any = \{\}; try \{ \3 = JSON\.parse\(\1\); \} catch\(e\) \{ console\.error\("JSON parse error:", \1\); \3 = \{ error: "Lỗi kết nối hoặc server phản hồi sai định dạng\." \}; \}/g, 
      'const $1 = await $2.text(); let $3: any = {}; if ($1) { try { $3 = JSON.parse($1); } catch(e) { console.error("JSON parse error:", $1); $3 = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng." }; } }');
      
    content = content.replace(/const (text_ret) = await ([\w]+)\.text\(\); try \{ return JSON\.parse\(\1\); \} catch\(e\) \{ return \{\}; \}/g, 
      'const $1 = await $2.text(); if (!$1) return {}; try { return JSON.parse($1); } catch(e) { return {}; }');

    fs.writeFileSync(file, content);
  }
}
