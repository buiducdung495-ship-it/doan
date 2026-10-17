const fs = require('fs');

const files = [
  'src/components/AssetManager.tsx',
  'src/components/ContractManager.tsx',
  'src/components/TaskManager.tsx',
  'src/components/InternalDocumentManager.tsx',
  'src/components/LiveChat.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    content = content.replace(/rounded-xl/g, 'rounded-3xl');
    content = content.replace(/rounded-2xl/g, 'rounded-3xl');
    fs.writeFileSync(file, content);
  }
}
