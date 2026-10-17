const fs = require('fs');

function fixCalendar() {
  let code = fs.readFileSync('src/components/CalendarManager.tsx', 'utf8');
  code = code.replace(
    /note\.content\.toLowerCase\(\)\.includes/g,
    '(note.content || "").toLowerCase().includes'
  );
  fs.writeFileSync('src/components/CalendarManager.tsx', code);
}
try { fixCalendar(); } catch (e) {}
