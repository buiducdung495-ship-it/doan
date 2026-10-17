const fs = require('fs');
let content = fs.readFileSync('src/components/InternalDocumentManager.tsx', 'utf-8');
content = content.replace(
  /const savedDocs = localStorage\.getItem\('sio_internal_docs'\);\n    if \(savedDocs\) \{\n      try \{\n        const parsed = JSON\.parse\(savedDocs\);\n        setDocuments\(parsed\);\n      \}\n/g,
  "const savedDocs = localStorage.getItem('sio_internal_docs');\n    if (savedDocs) {\n      try {\n        const parsed = JSON.parse(savedDocs);\n        setDocuments(parsed);\n      } catch(e) {}\n"
);
content = content.replace(
  /const savedDocs = localStorage\.getItem\('sio_internal_docs'\);\s*if \(savedDocs\) \{\s*const parsed = JSON\.parse\(savedDocs\);\s*setDocuments\(parsed\);\s*\}/g,
  "const savedDocs = localStorage.getItem('sio_internal_docs');\n    if (savedDocs) { try { const parsed = JSON.parse(savedDocs); setDocuments(parsed); } catch(e) {} }"
);
fs.writeFileSync('src/components/InternalDocumentManager.tsx', content);
