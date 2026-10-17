const fs = require('fs');

const files = [
  'src/components/AuditLogManager.tsx',
  'src/components/UserManager.tsx',
  'src/components/SharedCategoryManager.tsx',
  'src/components/OCRManager.tsx',
  'src/components/FormBuilder.tsx',
  'src/components/InternalDocumentManager.tsx',
  'src/components/LiveChat.tsx',
  'src/App.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    content = content.replace(
      /const (\w+) = await ([\w]+)\.json\(\);/g,
      'let $1: any = {};\n      try { $1 = await $2.json(); } catch(e) { $1 = {}; }'
    );
    content = content.replace(
      /return await ([\w]+)\.json\(\);/g,
      'try { return await $1.json(); } catch(e) { return {}; }'
    );
    fs.writeFileSync(file, content);
  }
}
