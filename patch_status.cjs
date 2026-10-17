const fs = require('fs');
let code = fs.readFileSync('src/components/UserManager.tsx', 'utf8');

// Also map reversed users in the status tab for consistency
code = code.replace(
  '{users.map(u => (',
  '{[...users].reverse().map(u => ('
);

fs.writeFileSync('src/components/UserManager.tsx', code);
console.log('patched status tab');
