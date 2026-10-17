const fs = require('fs');
let content = fs.readFileSync('src/components/AuthPage.tsx', 'utf-8');

content = content.replace(
  /<span className="text-xl font-bold tracking-tight">HomestayOS<\/span>/g,
  '<span className="text-xl font-bold tracking-tight">Siohioma Workspace</span>'
);

content = content.replace(
  /Quản trị Homestay<br \/>Thông Minh/g,
  'Quản Trị Nội Bộ<br />& Phê Duyệt Văn Bản'
);

content = content.replace(
  /Nền tảng vận hành tập trung giúp bạn tối ưu hóa công việc, nâng cao trải nghiệm khách hàng và quản lý tài chính dễ dàng./g,
  'Nền tảng vận hành tập trung giúp tối ưu hóa luồng công việc, xử lý công văn giấy tờ và quản lý nhân sự hiệu quả.'
);

content = content.replace(
  /\{ icon: CheckCircle, text: 'Quản lý phòng nghỉ' \}/g,
  '{ icon: CheckCircle, text: \'Phê duyệt công văn\' }'
);

content = content.replace(
  /\{ icon: CheckCircle, text: 'Báo cáo thống kê trực quan' \}/g,
  '{ icon: CheckCircle, text: \'Quản lý tài sản & nhân sự\' }'
);

content = content.replace(
  /Được tin dùng bởi hơn 1,000\+ quản lý Homestay trên toàn quốc./g,
  'Được tin dùng bởi hơn 1,000+ nhân sự và chuyên viên quản trị.'
);

content = content.replace(
  /HomestayOS Team/g,
  'Siohioma Tech Team'
);

fs.writeFileSync('src/components/AuthPage.tsx', content);
