const fs = require('fs');

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

function fixLiveChat() {
  let code = fs.readFileSync('src/components/LiveChat.tsx', 'utf8');
  code = code.replace(
    'const roleLower = u.role.toLowerCase();',
    'const roleLower = (u.role || "").toLowerCase();'
  );
  fs.writeFileSync('src/components/LiveChat.tsx', code);
}

function fixDashboard() {
  let code = fs.readFileSync('src/components/DashboardAnalytics.tsx', 'utf8');
  code = code.replace(
    'stat.dept.toLowerCase().includes(searchQuery.toLowerCase())',
    '(stat.dept && stat.dept.toLowerCase().includes((searchQuery || "").toLowerCase()))'
  );
  fs.writeFileSync('src/components/DashboardAnalytics.tsx', code);
}

function fixTaskManager() {
  let code = fs.readFileSync('src/components/TaskManager.tsx', 'utf8');
  code = code.replace(
    'if (!userObj.name.toLowerCase().includes(filterAssigneeSearch.toLowerCase())) {',
    'if (!userObj.name || !userObj.name.toLowerCase().includes((filterAssigneeSearch || "").toLowerCase())) {'
  );
  code = code.replace(
    'const isActive = filterAssigneeSearch.toLowerCase().includes(name.split(\' \')[0].toLowerCase());',
    'const isActive = filterAssigneeSearch && name && (filterAssigneeSearch || "").toLowerCase().includes((name.split(\' \')[0] || "").toLowerCase());'
  );
  fs.writeFileSync('src/components/TaskManager.tsx', code);
}

function fixInternalDoc() {
  let code = fs.readFileSync('src/components/InternalDocumentManager.tsx', 'utf8');
  code = code.replace(
    'const query = searchTerm.toLowerCase();',
    'const query = (searchTerm || "").toLowerCase();'
  );
  code = code.replace(
    'const matchesTitle = d.title.toLowerCase().includes(query);',
    'const matchesTitle = d.title && d.title.toLowerCase().includes(query);'
  );
  code = code.replace(
    'const matchesContent = d.content.toLowerCase().includes(query);',
    'const matchesContent = d.content && d.content.toLowerCase().includes(query);'
  );
  code = code.replace(
    'const query = searchDocNumber.toLowerCase();',
    'const query = (searchDocNumber || "").toLowerCase();'
  );
  fs.writeFileSync('src/components/InternalDocumentManager.tsx', code);
}

function fixCalendar() {
  let code = fs.readFileSync('src/components/CalendarManager.tsx', 'utf8');
  code = code.replace(
    /note\.title\.toLowerCase\(\)\.includes\(noteSearchTerm\.toLowerCase\(\)\)/g,
    '(note.title && note.title.toLowerCase().includes((noteSearchTerm || "").toLowerCase()))'
  );
  fs.writeFileSync('src/components/CalendarManager.tsx', code);
}

try { fixApp(); } catch (e) {}
try { fixLiveChat(); } catch (e) {}
try { fixDashboard(); } catch (e) {}
try { fixTaskManager(); } catch (e) {}
try { fixInternalDoc(); } catch (e) {}
try { fixCalendar(); } catch (e) {}
console.log('patched');
