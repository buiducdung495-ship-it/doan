const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Replace docs items
content = content.replace(
  /\{ id: 'docs-incoming', label: 'Văn bản đến'.*\n.*\n.*\n/,
  "{ id: 'docs-internal', label: 'Công văn nội bộ', icon: FileText, section: 'extended' },\n    { id: 'contracts', label: 'Quản lý hợp đồng', icon: FileSignature, section: 'extended' },\n"
);

// We need FileSignature icon
if (!content.includes('FileSignature')) {
  content = content.replace('FileText,', 'FileText, FileSignature,');
}

fs.writeFileSync('src/components/Sidebar.tsx', content);
