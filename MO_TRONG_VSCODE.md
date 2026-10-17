# Mở dự án trong Visual Studio Code

1. Giải nén gói `SHC-Company.zip` ra một thư mục bình thường.
2. Trong VS Code, chọn **File → Open Folder** và mở thư mục `SHC-Company`, hoặc mở tệp `NhanSu.code-workspace` bên trong. Nếu đang dùng thư mục `outputs/NhanSu-Nhom1` đã cập nhật, tiếp tục dùng thư mục đó.
3. Máy cần Node.js 22.14 trở lên và Bun. Nếu đã có Node nhưng chưa có Bun, chạy `npm install -g bun` trong terminal rồi mở lại terminal.
4. Chọn **Terminal → New Terminal** trong VS Code và chạy các lệnh PowerShell sau:

```powershell
bun install --frozen-lockfile
$env:HR_DATA_FILE='work/demo/hr.json'
bun run hr:demo
bun run build
bun run start
```

5. Mở **http://localhost:3000**. Mật khẩu demo được tạo ngẫu nhiên và lưu trong `work/demo/demo-access.txt`. Dùng `ADMIN` để quản trị, `HR01` cho nhân sự, `QL01` cho trưởng phòng, `NV001` cho nhân viên.

Lần sau không chạy lại `hr:demo`; chỉ đặt `HR_DATA_FILE` như trên rồi chạy `bun run start`. Nếu chỉnh mã nguồn, chạy `bun run build` trước. Có thể chạy `./Start-Demo.ps1` thay cho các bước trên nếu máy cho phép thực thi script PowerShell; không cần đổi chính sách máy nếu dùng lệnh thủ công.

Nếu cổng 3000 đã được ứng dụng khác sử dụng, đặt `$env:PORT='3002'` trước khi chạy và mở `http://localhost:3002`.

Gói không chứa thư viện `node_modules`, mật khẩu hoặc dữ liệu demo đã sinh, nên cần tải thư viện ở lần chạy đầu. Dữ liệu E-Office gốc được giữ trong `data/db.json`; dữ liệu demo/HR mới tách riêng. Không có thay đổi nào được đưa lên GitHub.

Đọc `docs/CHUYEN_DOI_NHAN_SU.md` để xem phần đã bỏ, phần đã thêm và giới hạn nghiệp vụ. Kiểm tra bằng `bun run lint` và `bun run test`.
