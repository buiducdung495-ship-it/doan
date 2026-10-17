const fs = require('fs');
let content = fs.readFileSync('src/components/InternalDocumentManager.tsx', 'utf-8');

content = content.replace(
  /try \{\n        const parsed = JSON\.parse\(savedDocs\);\n      \/\/ Ensure all/g,
  'try {\n        const parsed = JSON.parse(savedDocs);\n      // Ensure all'
);

content = content.replace(
  /setDocuments\(migrated\);\n    \} else \{/g,
  'setDocuments(migrated);\n      } catch (e) { console.error("Error parsing docs:", e); }\n    } else {'
);

fs.writeFileSync('src/components/InternalDocumentManager.tsx', content);
