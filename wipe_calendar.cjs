const fs = require('fs');
let code = fs.readFileSync('src/components/CalendarManager.tsx', 'utf8');

// Wipe localEvents fallback
code = code.replace(
  /const \[localEvents, setLocalEvents\] = useState<EventItem\[\]>\(\(\) => \{[\s\S]*?return list;\s*\}\);/,
  `const [localEvents, setLocalEvents] = useState<EventItem[]>(() => {
    const saved = localStorage.getItem('sio_calendar_events_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });`
);

// Wipe localNotes fallback
code = code.replace(
  /const \[localNotes, setLocalNotes\] = useState<CalendarNote\[\]>\(\(\) => \{[\s\S]*?return initialList;\s*\}\);/,
  `const [localNotes, setLocalNotes] = useState<CalendarNote[]>(() => {
    const saved = localStorage.getItem('sio_calendar_notes_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });`
);

// Update localStorage keys in useEffect
code = code.replace(
  /localStorage\.setItem\('sio_calendar_events', JSON\.stringify\(events\)\);/g,
  `localStorage.setItem('sio_calendar_events_v2', JSON.stringify(events));`
);

code = code.replace(
  /localStorage\.setItem\('sio_calendar_notes', JSON\.stringify\(calendarNotes\)\);/g,
  `localStorage.setItem('sio_calendar_notes_v2', JSON.stringify(calendarNotes));`
);

fs.writeFileSync('src/components/CalendarManager.tsx', code);
console.log('patched');
