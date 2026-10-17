const fs = require('fs');
const filePath = 'src/backend/services/AIService.ts';

if (!fs.existsSync(filePath)) {
  console.error('File not found');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

const newInstruction = `Bạn là Trợ lý AI Thông minh (AI HR Bot) đa năng tích hợp trong hệ thống quản lý công việc và hành chính nội bộ của công ty, đồng thời là một AI thông minh giống như ChatGPT hay Gemini, có khả năng trả lời bất cứ câu hỏi nào.
Nhiệm vụ của bạn là hỗ trợ trực tuyến, giải đáp và tư vấn trực tiếp cho nhân viên về mọi vấn đề: từ nghiệp vụ công ty, lập trình, kiến thức chung, đến các chủ đề khác trong cuộc sống.

YÊU CẦU & CHỨC NĂNG:
- Trả lời TẤT CẢ các loại câu hỏi, bất kể chủ đề gì, giống như một trợ lý AI thông thường.
- Đối với các câu hỏi liên quan đến nội bộ, ưu tiên trả lời dựa vào nghiệp vụ, quy định của hệ thống:
  + Quy trình nghỉ phép: nghỉ dưới 3 ngày do Trưởng phòng duyệt; từ 3 ngày trở lên cần thêm Trưởng phòng Nhân sự và Ban Giám đốc duyệt.
  + Quản lý tài sản: nhân viên có quyền đăng ký cấp phát thiết bị, mua thanh lý máy tính công ty với giá ưu đãi khấu trừ qua lương.
  + Tính lương và thuế: Lương được trả vào ngày 5 hàng tháng. Thuế TNCN tính theo biểu thuế lũy tiến từng phần.
- Khi người dùng gặp sự cố hệ thống: Đưa ra các hướng giải quyết tạm thời và hướng dẫn báo cáo qua bộ phận Dev.
- THÔNG TIN KHẨN CẤP: Nếu nhân viên cần liên hệ khẩn cấp (Bộ phận Chăm sóc Nhân viên), hãy cung cấp thông tin sau: 
  + Email: hr-support@company.com
  + Điện thoại: 0988-123-456
Luôn trả lời thân thiện, nhiệt tình và rõ ràng. Bạn có thể sử dụng nhiều ngôn ngữ nhưng mặc định ưu tiên giao tiếp bằng tiếng Việt.`;

// find the exact block for systemInstruction inside chatWithAI
content = content.replace(
  /const systemInstruction = `Bạn là Trợ lý AI Thông minh \(AI HR Bot\) tích hợp trong hệ thống quản lý công việc và hành chính nội bộ của công ty\.[\s\S]*?Luôn trả lời thân thiện, súc tích và bằng tiếng Việt\.`;/g,
  "const systemInstruction = `" + newInstruction + "`;"
);

// We should also remove the fallback logic that forces HR-only answers
content = content.replace(
  /if \(text\.includes\('khẩn cấp'\) \|\| text\.includes\('liên hệ'\) \|\| text\.includes\('số điện thoại'\) \|\| text\.includes\('email'\) \|\| text\.includes\('chăm sóc'\)\) \{[\s\S]*?return 'Cảm ơn câu hỏi của bạn\. Quy trình công ty quy định rõ ràng: các đơn từ đều được tự động hóa phân cấp duyệt theo mức độ nghiêm trọng\. Bạn có cần hướng dẫn tạo biểu mẫu hay duyệt đơn không\?';/g,
  `if (text.includes('khẩn cấp') || text.includes('liên hệ') || text.includes('số điện thoại') || text.includes('email') || text.includes('chăm sóc')) {
      return 'Trong trường hợp khẩn cấp, bạn có thể liên hệ với Bộ phận Chăm sóc Nhân viên qua:\\n- Email: hr-support@company.com\\n- Điện thoại: 0988-123-456';
    }
    return 'Cảm ơn bạn đã trò chuyện. (Lưu ý: API AI đang bị gián đoạn, nên tôi chỉ có thể trả lời các mẫu câu hỏi cơ bản nội bộ)';`
);


fs.writeFileSync(filePath, content);
console.log('patched AIService');
