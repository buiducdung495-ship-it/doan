const fs = require('fs');
let code = fs.readFileSync('src/components/TaskManager.tsx', 'utf8');

code = code.replace(
  "const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];",
  `const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0] || {
    id: '---',
    name: 'Không có dự án',
    description: 'Chưa có dự án nào được tạo.',
    reporter: 'Không có',
    priority: 'low',
    dueDate: '---',
    assignees: []
  };`
);

fs.writeFileSync('src/components/TaskManager.tsx', code);
console.log('patched');
