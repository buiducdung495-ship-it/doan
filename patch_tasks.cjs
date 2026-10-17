const fs = require('fs');

let content = fs.readFileSync('src/components/TaskManager.tsx', 'utf8');

// Replace STATIC_PROJECTS content with []
content = content.replace(/const STATIC_PROJECTS: Project\[\] = \[[\s\S]*?\];/m, 'const STATIC_PROJECTS: Project[] = [];');

// Replace INITIAL_TASKS content with []
content = content.replace(/export const INITIAL_TASKS: CustomTask\[\] = \[[\s\S]*?\];/m, 'export const INITIAL_TASKS: CustomTask[] = [];');

// Replace useState initialization for selectedProjectId
content = content.replace(/useState<string>\('PN0001245'\);/g, "useState<string>('');");

fs.writeFileSync('src/components/TaskManager.tsx', content, 'utf8');
console.log('Patched TaskManager.tsx');
