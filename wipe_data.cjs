const fs = require('fs');

// ContractManager
let cm = fs.readFileSync('src/components/ContractManager.tsx', 'utf8');
cm = cm.replace(/sio_contracts/g, 'sio_contracts_v2');
cm = cm.replace(/setContracts\(\[\s*\{\s*id:\s*'1'[\s\S]*?\],\s*salespersonId:\s*currentUser\.id,\s*createdAt:\s*new Date\(\)\.toISOString\(\)\s*\}\s*,\s*\]\);/, 'setContracts([]);');
// let's just replace the whole else block for ContractManager
cm = cm.replace(/else \{\s*\/\/ Mock data\s*setContracts\(\[\s*\{[\s\S]*?\}\s*\);\s*\}/, 'else { setContracts([]); }');
fs.writeFileSync('src/components/ContractManager.tsx', cm);

// InternalDocumentManager
let idm = fs.readFileSync('src/components/InternalDocumentManager.tsx', 'utf8');
idm = idm.replace(/sio_internal_docs/g, 'sio_internal_docs_v2');
// replace defaultDocs array
idm = idm.replace(/const defaultDocs: InternalDocument\[\] = \[[\s\S]*?\];\s*setDocuments\(defaultDocs\);\s*localStorage\.setItem\('sio_internal_docs_v2',\s*JSON\.stringify\(defaultDocs\)\);/g, "setDocuments([]); localStorage.setItem('sio_internal_docs_v2', JSON.stringify([]));");
fs.writeFileSync('src/components/InternalDocumentManager.tsx', idm);

console.log("Wiped data");
