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
    
    // Fix the messy catch statements we made earlier
    content = content.replace(/let (\w+): any = \{\};\s*try \{ \1 = await ([\w]+)\.json\(\); \} catch\(e[\s:any]*\) \{.*?\}/g, 
      'const text_$1 = await $2.text(); let $1: any = {}; try { $1 = JSON.parse(text_$1); } catch(e) { console.error("JSON parse error:", text_$1); $1 = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng." }; }');
      
    content = content.replace(/try \{ return await ([\w]+)\.json\(\); \} catch\(e\) \{ return \{\}; \}/g, 
      'const text_ret = await $1.text(); try { return JSON.parse(text_ret); } catch(e) { return {}; }');

    fs.writeFileSync(file, content);
  }
}
