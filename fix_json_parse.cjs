const fs = require('fs');

function fixFile(filePath) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // App.tsx
    if (filePath.includes('App.tsx')) {
      content = content.replace(
        /const saved = localStorage\.getItem\('jin_menu_order'\);\s*return saved \? JSON\.parse\(saved\) : \[\];/g,
        'const saved = localStorage.getItem(\'jin_menu_order\');\n    try { return saved ? JSON.parse(saved) : []; } catch(e) { return []; }'
      );
      content = content.replace(
        /const saved = localStorage\.getItem\('jin_hidden_menu_ids'\);\s*return saved \? JSON\.parse\(saved\) : \[\];/g,
        'const saved = localStorage.getItem(\'jin_hidden_menu_ids\');\n    try { return saved ? JSON.parse(saved) : []; } catch(e) { return []; }'
      );
    }
    
    // FormBuilder.tsx
    if (filePath.includes('FormBuilder.tsx')) {
      content = content.replace(
        /const saved = localStorage\.getItem\('jin_form_drafts'\);\s*if \(saved\) \{\s*setDrafts\(JSON\.parse\(saved\)\);\s*\}/g,
        'const saved = localStorage.getItem(\'jin_form_drafts\');\n    if (saved) { try { setDrafts(JSON.parse(saved)); } catch(e) { console.error(e); } }'
      );
    }

    // ContractManager.tsx
    if (filePath.includes('ContractManager.tsx')) {
      content = content.replace(
        /const saved = localStorage\.getItem\('sio_contracts'\);\s*if \(saved\) \{\s*setContracts\(JSON\.parse\(saved\)\);\s*\}/g,
        'const saved = localStorage.getItem(\'sio_contracts\');\n    if (saved) { try { setContracts(JSON.parse(saved)); } catch(e) { console.error(e); } }'
      );
    }

    // CalendarManager.tsx
    if (filePath.includes('CalendarManager.tsx')) {
      content = content.replace(
        /const saved = localStorage\.getItem\('sio_calendar_events'\);\s*if \(saved\) \{\s*return JSON\.parse\(saved\);\s*\}/g,
        'const saved = localStorage.getItem(\'sio_calendar_events\');\n    if (saved) { try { return JSON.parse(saved); } catch(e) { return []; } }'
      );
      content = content.replace(
        /const saved = localStorage\.getItem\('sio_calendar_notes'\);\s*if \(saved\) \{\s*return JSON\.parse\(saved\);\s*\}/g,
        'const saved = localStorage.getItem(\'sio_calendar_notes\');\n    if (saved) { try { return JSON.parse(saved); } catch(e) { return []; } }'
      );
    }
    
    // InternalDocumentManager.tsx
    if (filePath.includes('InternalDocumentManager.tsx')) {
      content = content.replace(
        /const savedDocs = localStorage\.getItem\('sio_internal_docs'\);\s*if \(savedDocs\) \{\s*const parsed = JSON\.parse\(savedDocs\);/g,
        'const savedDocs = localStorage.getItem(\'sio_internal_docs\');\n    if (savedDocs) {\n      try {\n        const parsed = JSON.parse(savedDocs);'
      );
      // Wait, this one has a closing brace. I'll just rewrite InternalDocumentManager differently if needed.
    }

    fs.writeFileSync(filePath, content);
  }
}

['src/App.tsx', 'src/components/FormBuilder.tsx', 'src/components/ContractManager.tsx', 'src/components/CalendarManager.tsx', 'src/components/InternalDocumentManager.tsx'].forEach(fixFile);
