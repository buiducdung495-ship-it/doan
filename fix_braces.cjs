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
    content = content.replace(/Lỗi kết nối hoặc server phản hồi sai định dạng\." \}; \}; \}/g, 'Lỗi kết nối hoặc server phản hồi sai định dạng." }; }');
    fs.writeFileSync(file, content);
  }
}
