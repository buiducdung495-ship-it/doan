const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const regexes = [
  /const savedTasks = localStorage\.getItem\('sio_tasks'\);\s*const taskList = savedTasks \? JSON\.parse\(savedTasks\) : \[\];/g,
  /const savedEvents = localStorage\.getItem\('sio_calendar_events'\);\s*const eventList = savedEvents \? JSON\.parse\(savedEvents\) : \[\];/g,
  /const savedNotes = localStorage\.getItem\('sio_calendar_notes'\);\s*const noteList = savedNotes \? JSON\.parse\(savedNotes\) : \[\];/g,
  /const savedDocs = localStorage\.getItem\('sio_internal_docs'\);\s*const docList = savedDocs \? JSON\.parse\(savedDocs\) : \[\];/g,
  /const savedContracts = localStorage\.getItem\('sio_contracts'\);\s*const contractList = savedContracts \? JSON\.parse\(savedContracts\) : \[\];/g
];

const replacements = [
  'const savedTasks = localStorage.getItem(\'sio_tasks\');\n      let taskList = [];\n      if (savedTasks) { try { taskList = JSON.parse(savedTasks); } catch(e){} }',
  'const savedEvents = localStorage.getItem(\'sio_calendar_events\');\n      let eventList = [];\n      if (savedEvents) { try { eventList = JSON.parse(savedEvents); } catch(e){} }',
  'const savedNotes = localStorage.getItem(\'sio_calendar_notes\');\n      let noteList = [];\n      if (savedNotes) { try { noteList = JSON.parse(savedNotes); } catch(e){} }',
  'const savedDocs = localStorage.getItem(\'sio_internal_docs\');\n      let docList = [];\n      if (savedDocs) { try { docList = JSON.parse(savedDocs); } catch(e){} }',
  'const savedContracts = localStorage.getItem(\'sio_contracts\');\n      let contractList = [];\n      if (savedContracts) { try { contractList = JSON.parse(savedContracts); } catch(e){} }'
];

for(let i=0; i<regexes.length; i++) {
  content = content.replace(regexes[i], replacements[i]);
}

fs.writeFileSync('src/App.tsx', content);
