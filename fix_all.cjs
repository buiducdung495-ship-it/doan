const fs = require('fs');

function fixAudit() {
  let code = fs.readFileSync('src/components/AuditLogManager.tsx', 'utf8');
  code = code.replace(/searchTerm\.toLowerCase\(\)/g, '(searchTerm || "").toLowerCase()');
  code = code.replace(/detailsStr\.toLowerCase\(\)/g, '(detailsStr || "").toLowerCase()');
  fs.writeFileSync('src/components/AuditLogManager.tsx', code);
}

function fixApp() {
  let code = fs.readFileSync('src/App.tsx', 'utf8');
  code = code.replace(
    'const query = globalSearchQuery.toLowerCase();',
    'const query = (globalSearchQuery || "").toLowerCase();'
  );
  code = code.replace(
    'item.title.toLowerCase().includes(query) ||',
    '(item.title && item.title.toLowerCase().includes(query)) ||'
  );
  code = code.replace(
    'item.subtitle.toLowerCase().includes(query) ||',
    '(item.subtitle && item.subtitle.toLowerCase().includes(query)) ||'
  );
  code = code.replace(
    'item.badge.toLowerCase().includes(query)',
    '(item.badge && item.badge.toLowerCase().includes(query))'
  );
  fs.writeFileSync('src/App.tsx', code);
}

try { fixAudit(); } catch(e) {}
try { fixApp(); } catch(e) {}
