const fs = require('fs');

let code = fs.readFileSync('src/components/KPIManager.tsx', 'utf8');

code = code.replace(
  /const handleClearAll = async \(\) => \{[\s\S]*?console\.error\(e\);\s*\}\s*\};\s*/,
  ""
);

code = code.replace(
  /\{currentUser\.role !== 'employee' && \(\s*<button\s*onClick=\{handleClearAll\}\s*className="[^"]*"\s*>\s*Xóa dữ liệu\s*<\/button>\s*\)\}\s*/,
  ""
);

fs.writeFileSync('src/components/KPIManager.tsx', code);
console.log("patched!");
