const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// I might have removed HelpSupportModal earlier?
const hasHelpSupport = code.includes('interface HelpSupportModalProps');
console.log('hasHelpSupport:', hasHelpSupport);
