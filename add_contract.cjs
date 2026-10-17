const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const usage = `
          {currentTab === 'contracts' && (
            <ContractManager
              currentUser={currentUser}
              users={users}
            />
          )}
`;

content = content.replace(/\{currentTab === 'docs-internal' && \(\s*<InternalDocumentManager[\s\S]*?\/>\s*\)\}/, `$&${usage}`);
fs.writeFileSync('src/App.tsx', content);
