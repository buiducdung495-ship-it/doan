# Bản cập nhật SHC Company — 19/09/2026

## Nội dung mới

- Đăng nhập: tên SHC Company, bố cục gọn, màu xanh navy, tương thích màn hình nhỏ; hiện/ẩn mật khẩu, nhắc Caps Lock, thông báo lỗi và trạng thái đang đăng nhập. Nút “Quên mật khẩu?” hướng dẫn liên hệ quản trị viên. Không có gửi email khôi phục tự động.
- Đồng bộ tên công ty ở thanh điều hướng, chân trang và tiêu đề trình duyệt. Giữ các chỉnh sửa giao diện quản trị hiện có.
- Bảng tin: admin/HR đăng, sửa, ghim, lưu trữ và khôi phục; chọn toàn công ty hoặc một phòng ban; tìm theo tiêu đề/nội dung. Nhân viên/trưởng phòng chỉ xem bản tin đang hiển thị thuộc phạm vi của mình. Admin/HR quản lý tất cả bản tin.
- Thông báo cá nhân: khi gửi đơn nghỉ, admin/HR và trưởng phòng phù hợp nhận thông báo cần duyệt; người gửi nhận kết quả duyệt/từ chối. Nhân viên nhận thông báo khi bảng lương được chốt. Có số chưa đọc, lọc chưa đọc, mở chức năng liên quan và đánh dấu tất cả đã đọc.
- Phân quyền được kiểm tra ở API. Thông báo thuộc từng tài khoản, không chứa số tiền lương hoặc lý do nghỉ của người khác. Bảng tin được hiển thị dưới dạng văn bản, không thực thi HTML.

Tham khảo nhóm tính năng truyền thông nội bộ và thông báo nghiệp vụ của [HappyTime](https://happytime.vn/) và [tài liệu tính năng chính thức](https://help.happytime.vn/article/c%C3%A1c-t%C3%ADnh-n%C4%83ng-c%E1%BB%A7a-happytime-l%C3%A0-g%C3%AC-c%C3%B3-g%C3%AC-%C4%91%E1%BA%B7c-bi%E1%BB%87t). Đây là phần triển khai riêng trong dự án; không tích hợp dịch vụ HappyTime.

## Dùng bản mới với dữ liệu hiện có

Mã nguồn đã cập nhật trực tiếp trong thư mục `outputs/NhanSu-Nhom1` của workspace. Nếu bạn đang mở thư mục này trong VS Code, dừng server cũ bằng Ctrl+C và chạy:

```powershell
$env:HR_DATA_FILE='work/demo/hr.json'
bun run build
bun run start
```

Nếu bạn dùng đường dẫn dữ liệu riêng, giữ nguyên `HR_DATA_FILE` đang sử dụng. Tài khoản và mật khẩu hiện có không thay đổi. Không chạy lại lệnh khởi tạo dữ liệu.

Nếu chuyển sang thư mục giải nén `SHC-Company.zip`, cài thư viện bằng `bun install --frozen-lockfile`. Để giữ dữ liệu, khi server đã dừng hãy sao lưu rồi chép thư mục `work/demo` từ bản cũ sang bản mới, hoặc trỏ `HR_DATA_FILE` tới bản sao tệp dữ liệu HR cũ. Không chạy đồng thời hai server trên cùng một tệp JSON.

Nếu chưa có Bun: chạy `npm install -g bun`, mở lại terminal và kiểm tra `bun --version`. Chỉ cần cài một lần. Máy cần Node.js 22.14 trở lên.

Để tạo demo mới hoàn toàn, làm theo `MO_TRONG_VSCODE.md` hoặc chạy `./Start-Demo.ps1`. Mật khẩu mới được sinh trong `work/demo/demo-access.txt`; mật khẩu của bản demo cũ sẽ không dùng được cho bộ dữ liệu mới.

## Dữ liệu và phạm vi

- Tệp JSON phiên bản cũ tự có thêm `announcements` và `notifications` khi nạp; không xóa hồ sơ, hợp đồng, công, phép, lương hay mật khẩu. Hai danh sách này được ghi xuống đĩa ở lần lưu kế tiếp.
- Thông báo chỉ phát sinh từ thao tác mới, không tạo ngược cho đơn nghỉ/bảng lương đã xử lý trước bản cập nhật.
- Mở Bảng tin/Thông báo, bấm chuông hoặc “Làm mới” để lấy dữ liệu mới. Chưa có thông báo đẩy, email, websocket hay thông báo ngoài trình duyệt.
- Nội dung thử nghiệm chỉ nằm trong `work/shc-preview`; không đi kèm gói nguồn. Gói không kèm `node_modules`, `dist`, `.env` hoặc dữ liệu HR và mật khẩu đã sinh.
- Đây vẫn là bản đồ án/demo dùng một tiến trình Node và lưu JSON. Các giới hạn tính lương được ghi trong README và tài liệu chuyển đổi.

## Kiểm tra bản cập nhật

- TypeScript strict: đạt.
- 14/14 kiểm tra tự động: đạt; bổ sung kiểm tra phân quyền/phạm vi bản tin, lưu trữ/khôi phục, thông báo riêng tư, đánh dấu đã đọc, ngăn phát sinh trùng khi thao tác lỗi và nâng cấp dữ liệu cũ.
- Build frontend và server production: đạt.
- Trình duyệt: đăng nhập đúng/sai, hiện/ẩn mật khẩu và đăng bản tin có ghim được kiểm tra trên dữ liệu riêng.

Các tệp giao diện chính để tiếp tục chỉnh trong VS Code/Antigravity: `src/hr/LoginPage.tsx`, `src/hr/login.css`, `src/hr/Communication.tsx`, `src/hr/communication.css`. Giữ nguyên giao tiếp API và phân quyền nếu chỉ sửa giao diện.
