import { WorkflowRequest } from '../types';

/**
 * Generates a standard Vietnamese administrative decision text file representation
 * of a Workflow Request. This includes national headers, centered titles, formatted fields,
 * and high-fidelity text-based digital signatures and stamps.
 */
export function generateWorkflowTextFile(request: WorkflowRequest): string {
  const date = new Date(request.createdAt);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  const borderLine = "==========================================================================";
  const separator = "--------------------------------------------------------------------------";

  let text = "";
  text += `${borderLine}\n`;
  text += "                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n";
  text += "                         Độc lập - Tự do - Hạnh phúc\n";
  text += "                            -------------------\n\n";
  text += `                                            Hà Nội, ngày ${day} tháng ${month} năm ${year}\n\n`;
  text += ` Số: ${request.id.toUpperCase()}/QĐ-WF\n\n`;
  text += `                       QUYẾT ĐỊNH PHÊ DUYỆT HÀNH CHÍNH\n`;
  text += `             (V/v phê duyệt chính thức tờ trình: ${request.formTitle.toUpperCase()})\n`;
  text += `                            -------------------\n\n`;
  text += "   - Căn cứ Bộ luật Lao động nước Cộng hòa Xã hội Chủ nghĩa Việt Nam hiện hành.\n";
  text += "   - Căn cứ Quy chế hành chính và Quy trình nội bộ của Tổng Công ty.\n";
  text += `   - Xét hồ sơ yêu cầu phê duyệt có mã số ${request.id.toUpperCase()} thuộc mẫu biểu\n`;
  text += `     "${request.formTitle}" do nhân viên đề xuất.\n\n`;
  text += `                            QUYẾT ĐỊNH CHÍNH THỨC:\n\n`;
  text += " Điều 1: Phê duyệt tờ trình hành chính với các thông tin chi tiết sau đây:\n";
  text += `   • Họ và tên nhân sự : ${request.submitterName}\n`;
  text += `   • Bộ phận / Phòng ban: ${request.submitterDepartment}\n`;
  text += `   • Vai trò / Chức vụ  : ${request.submitterRole.toUpperCase()}\n`;
  text += `   • Mã biểu mẫu gốc   : ${request.formTemplateId}\n`;
  text += `   • Trạng thái hiện tại: ${request.status.toUpperCase()}\n`;
  text += `   • Thời gian nộp đơn  : ${day}/${month}/${year} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}\n\n`;
  text += " Chi tiết thông tin điền biểu mẫu:\n";
  text += `   ${separator}\n`;

  Object.entries(request.submissionData).forEach(([label, val]) => {
    // Left-pad to align
    const displayLabel = label.padEnd(25, ' ');
    text += `   | ${displayLabel} : ${String(val)}\n`;
  });

  text += `   ${separator}\n\n`;
  
  if (request.status === 'approved') {
    text += " Điều 2: Quyết định có hiệu lực thi hành ngay kể từ ngày ban hành.\n";
    text += " Các bộ phận Nhân sự, Kế toán, và cá nhân đương sự chịu trách nhiệm thi hành.\n\n";
  } else if (request.status === 'rejected') {
    text += " Điều 2: Yêu cầu không được thông qua do chưa đủ điều kiện phê duyệt.\n";
    text += " Cá nhân đương sự liên hệ Trưởng bộ phận để được giải trình chi tiết thêm.\n\n";
  } else {
    text += " Điều 2: Đơn đang ở trạng thái xử lý trung gian, chờ Ban Giám đốc phê duyệt.\n\n";
  }

  text += " Điều 3: Bản cam kết của nhân sự:\n";
  text += "   Tôi cam đoan đã hoàn tất bàn giao toàn bộ tài liệu, đầu việc, máy móc và công tác\n";
  text += "   chuyên môn trước khi nghỉ việc. Rất mong được Ban Giám đốc xét duyệt.\n\n";

  text += "   ----------------------------------------------------------------------\n";
  text += "                     CHỮ KÝ ĐIỆN TỬ & DẤU MỘC PHÊ DUYỆT\n";
  text += "   ----------------------------------------------------------------------\n\n";

  // Double-column signature layout
  text += "        NGƯỜI LÀM ĐƠN                          ĐẠI DIỆN BAN GIÁM ĐỐC\n";
  if (request.status === 'approved') {
    text += "       (Ký tên điện tử)                        (Đã duyệt - Có mộc đỏ)\n\n";
    text += `     [ Digitally Signed By ]                  [ DIGITAL APPROVED STAMP ]\n`;
    text += `     Tên: ${request.submitterName.padEnd(25, ' ')} Tên: Vũ Hoàng Sơn\n`;
    text += `     Mã: EMP-${request.submitterId.substring(0,6).toUpperCase()}                      Mã xác thực: WF-CEO-APPROVED\n`;
    text += `     Trạng thái: ĐÃ XÁC THỰC                   Trạng thái: ĐÃ ĐÓNG DẤU MỘC TRÒN\n`;
    text += `     Qua hệ thống: SMS OTP                    Bởi: Tổng Giám Đốc Vũ Hoàng Sơn\n\n`;
    text += `     Họ tên: ${request.submitterName.padEnd(25, ' ')} Họ tên: Vũ Hoàng Sơn\n`;
  } else if (request.status === 'rejected') {
    text += "       (Ký tên điện tử)                        (Bác bỏ - Đã xác nhận)\n\n";
    text += `     [ Digitally Signed By ]                  [ DIGITAL REJECTED STAMP ]\n`;
    text += `     Tên: ${request.submitterName.padEnd(25, ' ')} Tên: Vũ Hoàng Sơn\n`;
    text += `     Mã: EMP-${request.submitterId.substring(0,6).toUpperCase()}                      Mã xác thực: WF-CEO-REJECTED\n`;
    text += `     Trạng thái: ĐÃ XÁC THỰC                   Trạng thái: ĐÃ TỪ CHỐI\n`;
    text += `     Qua hệ thống: SMS OTP                    Bởi: Tổng Giám Đốc Vũ Hoàng Sơn\n\n`;
    text += `     Họ tên: ${request.submitterName.padEnd(25, ' ')} Họ tên: Vũ Hoàng Sơn\n`;
  } else {
    text += "       (Ký tên điện tử)                        (Chưa ký - Chờ duyệt)\n\n";
    text += `     [ Digitally Signed By ]                  [ CHỜ DUYỆT / PENDING ]\n`;
    text += `     Tên: ${request.submitterName.padEnd(25, ' ')} Tên: -------------------------\n`;
    text += `     Mã: EMP-${request.submitterId.substring(0,6).toUpperCase()}                      Mã xác thực: --------------------\n`;
    text += `     Trạng thái: ĐÃ XÁC THỰC                   Trạng thái: CHỜ PHÊ DUYỆT\n`;
    text += `     Qua hệ thống: SMS OTP                    Bởi: -------------------------\n\n`;
    text += `     Họ tên: ${request.submitterName.padEnd(25, ' ')} Họ tên: -------------------------\n`;
  }
  text += `${borderLine}\n`;
  text += "               Mẫu quyết định hành chính số hóa lưu trữ thông minh\n";
  text += `${borderLine}\n`;

  return text;
}

/**
 * Initiates a browser-download for the formatted workflow decision file
 */
export function downloadWorkflowTextFile(request: WorkflowRequest): void {
  const content = generateWorkflowTextFile(request);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  
  // Format clean filename
  const cleanTitle = request.formTitle
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip Vietnamese accents
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '_')
    .trim();
  
  link.download = `Quyet_Dinh_Phe_Duyet_${cleanTitle}_${request.id.substring(0, 8)}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
