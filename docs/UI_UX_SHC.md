# SHC — UI/UX và đăng ký công khai

Cập nhật 03/10/2026, trên mã nguồn ứng dụng HR ở thư mục gốc. Không chỉnh bản sao dự án lồng bên trong, dữ liệu HR thật, tài liệu Word gốc hoặc báo cáo đã xuất trước đó.

## Thiết kế

Nền giấy ấm, chữ mực đậm, màu đất nung và biểu tượng bốn cánh riêng cho SHC. Chữ serif dùng cho tiêu đề lớn; chữ sans dùng cho điều khiển và bảng. Trang ngoài có bố cục bất đối xứng, nội dung tiếng Việt, ba phần xem trước tương tác và câu hỏi mở bằng details gốc của trình duyệt. Dữ liệu minh họa được ghi rõ, không dùng số liệu khách hàng hoặc lời chứng thực bịa.

Đồng bộ trang giới thiệu, đăng nhập, đăng ký, chờ kích hoạt và toàn bộ bộ khung HR: dashboard, hồ sơ, hợp đồng, công/phép/lương, danh mục, bảng tin và thông báo. Điều hướng chia nhóm; menu mobile đóng/mở; bảng nhiều cột cuộn trong vùng riêng, hỗ trợ bàn phím và có gợi ý vuốt. Hộp nhập liệu và xác nhận dùng dialog gốc; thao tác xóa/chốt/hủy có alertdialog, mặc định đặt focus ở nút quay lại.

Skill baseline-ui định hướng khoảng cách, phân cấp chữ, trạng thái lỗi và khả năng truy cập. JavaScript motion dùng motion/react, chỉ transform/opacity. Minh họa trôi/quỹ đạo có nút dừng, tự ngừng ngoài màn hình và tôn trọng prefers-reduced-motion. Không bổ sung gradient, glow hay chuyển động nền blur. Cổng nội bộ ưu tiên đọc dữ liệu, không chạy hoạt cảnh trang trí liên tục.

## Đăng ký thật

1. Người dùng gửi họ tên, email và mật khẩu tối thiểu 10 ký tự tại `/register`.
2. Máy chủ băm mật khẩu bằng scrypt, kiểm tra email trùng, giới hạn 10 yêu cầu/IP/15 phút và tối đa 500 đăng ký đang chờ.
3. Không tạo phiên, không tự thêm hồ sơ nhân viên, không cấp truy cập nội bộ khi gửi đăng ký.
4. Admin/HR xử lý trong **Duyệt tài khoản**. Kích hoạt cần mã nhân viên chưa tồn tại, phòng ban, chức vụ, ngày vào làm và phép năm. Quyền luôn là employee, trạng thái hồ sơ ban đầu probation. Chức vụ trong hồ sơ không tự nâng quyền hệ thống.
5. Từ chối cần lý do. Không xử lý lại đăng ký đã duyệt/từ chối. Tài khoản được kích hoạt đăng nhập bằng email/mật khẩu đã tạo.

API dữ liệu chỉ trả đăng ký đã bỏ hash cho Admin/HR; nhân viên và trưởng phòng nhận mảng rỗng. Dữ liệu phiên bản cũ được thêm mảng đăng ký trống, giữ nguyên hồ sơ và mật khẩu hiện có.

Chưa tích hợp Google/Microsoft OAuth, email xác minh, email báo duyệt hoặc quên mật khẩu qua email. Người dùng cần liên hệ nhân sự để biết kết quả hoặc quản trị viên để đặt lại mật khẩu. Luồng này không biến mọi người đăng ký thành nhân viên thật khi chưa có người có quyền kiểm tra.

## Kiểm chứng

- `npm run typecheck:hr`: đạt.
- `npm test`: 19/19 kiểm tra đạt, gồm validation, phân quyền, đăng ký/duyệt/từ chối, giới hạn tần suất, migration và các nghiệp vụ HR hiện có.
- `npm run build`: đạt.
- Trình duyệt: desktop mặc định 1280px và mobile 390×844; trang ngoài, đăng nhập/đăng ký, đăng ký sai xác nhận mật khẩu, đăng ký thành công, Admin kích hoạt, người mới đăng nhập đúng quyền cá nhân, menu mobile chọn được cả mục cuối, biểu mẫu và alertdialog đóng bằng Escape, nút dừng hoạt cảnh. Không thấy lỗi console tại dashboard được kiểm tra.
- Các viewport đã đo không tràn ngang toàn trang. Bảng rộng vẫn cuộn ngang có chủ đích. Ảnh kiểm chứng ở `work/ui-review/`.
- Chế độ giảm chuyển động được xử lý trong hook/CSS; chưa emulation thiết lập hệ điều hành bằng công cụ trình duyệt này.

Xem thử: `http://localhost:3120/` (server production, `HR_DATA_FILE=work/ui-demo/hr.json`). Dữ liệu thử có tài khoản UI001 do kiểm thử đăng ký, không phải hồ sơ thật. Server cũ cổng 3100 chưa bị dừng hoặc đổi cấu hình; nếu cần dùng bản mới với dữ liệu thật phải khởi động lại server tương ứng sau khi sao lưu. Không chạy hai server cùng sửa một file dữ liệu.

## Giới hạn và tài liệu

Báo cáo Word/PDF đã xuất trước thay đổi này là ảnh chụp phiên bản trước, chưa mô tả đăng ký công khai và bộ UI mới. Giữ nguyên để tránh tự ý thay đổi bài nộp; cần cập nhật báo cáo nếu dùng chức năng mới khi bảo vệ.

Storage JSON/phiên bộ nhớ vẫn dành cho đồ án một tiến trình, không phải chứng nhận sẵn sàng production. Trước triển khai công khai cần HTTPS, cookie secure, cơ chế xác minh email/chống bot, giám sát và rà soát dependency. Lần cài thư viện class (clsx/tailwind-merge) npm báo 7 cảnh báo dependency (5 moderate, 2 high); chưa tự chạy audit fix hoặc nâng cấp diện rộng vì có thể ảnh hưởng các module cũ.
