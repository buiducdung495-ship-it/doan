const fs = require('fs');
let code = fs.readFileSync('src/components/UserManager.tsx', 'utf8');

code = code.replace(
  'u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||',
  '(u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||'
).replace(
  'u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||',
  '(u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||'
);

fs.writeFileSync('src/components/UserManager.tsx', code);
console.log('patched toLowerCase error');
