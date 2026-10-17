# SHC Company — Website quản lý nhân sự

Đồ án kỳ khóa 523 — Bùi Đức Dũng (MSV 523100077, lớp 523100B), GVHD ThS. Trần Thị Lụa.

**Báo cáo đồ án:** [Word (.docx)](checkpoints/CP06_bao_cao_demo/Bao_cao_Quan_ly_nhan_su_SHC_523.docx) · [PDF](checkpoints/CP06_bao_cao_demo/Bao_cao_Quan_ly_nhan_su_SHC_523.pdf)

**Hồ sơ checkpoint:** [checkpoints/](checkpoints/README.md) — CP03 Thiết kế · CP04 Triển khai · CP05 Kiểm thử · CP06 Báo cáo & demo.

Ứng dụng chuyển đổi từ E-Office. Giữ React + TypeScript + Vite + Express; thay luồng đang chạy bằng quản lý hồ sơ, tổ chức, hợp đồng lao động, công, phép, lương và đánh giá.

- [Rà soát chức năng, thay đổi và phạm vi](docs/CHUYEN_DOI_NHAN_SU.md)
- [Kiểm thử và giới hạn môi trường](docs/KIEM_THU.md)
- [Bản cập nhật SHC Company: giao diện, bảng tin và thông báo](docs/CAP_NHAT_SHC.md)
- [UI/UX mới và đăng ký công khai có duyệt](docs/UI_UX_SHC.md)

## Trang ngoài và tài khoản tự đăng ký

Trang chủ `/`, đăng nhập `/login`, đăng ký `/register` và cổng nhân sự `/app` dùng nhận diện giấy ấm/đất nung. Minh họa chuyển động có nút tạm dừng, tự dừng ngoài màn hình và tôn trọng chế độ giảm chuyển động.

Đăng ký công khai tạo yêu cầu **chờ duyệt**, không cấp phiên đăng nhập. Admin/HR vào **Duyệt tài khoản**, gán mã nhân viên, phòng ban, chức vụ và ngày vào làm để kích hoạt. Tài khoản chỉ được cấp quyền nhân viên; không có tùy chọn tự cấp quyền quản trị. Dùng email và mật khẩu đã đăng ký sau khi được duyệt. Chưa có xác thực email, OAuth hoặc khôi phục mật khẩu qua email.

## Yêu cầu và cài đặt

Node.js 22.14+ và npm. Dự án vẫn giữ `bun.lock` để tương thích với Bun, nhưng không bắt buộc phải cài Bun. Chạy lệnh tại thư mục chứa package.json:

```sh
npm install
```

## Chạy bản demo

Dữ liệu mẫu hoàn toàn tách khỏi `data/db.json` và dữ liệu HR thật. Ví dụ PowerShell:

```powershell
$env:HR_DATA_FILE='work/demo/hr.json'
npm run hr:demo
npm run build
npm run start
```

Mở http://localhost:3000. Tài khoản demo: `ADMIN`, `HR01`, `QL01`, `NV001`. Mật khẩu ngẫu nhiên được ghi vào `work/demo/demo-access.txt`. Script không ghi đè tệp đã tồn tại. Khi chạy lại, chỉ cần giữ `HR_DATA_FILE` và chạy `bun run start`. Không dùng bộ tài khoản mẫu cho vận hành.

## Khởi tạo dữ liệu trống

1. Sao chép `.env.example` thành `.env`.
2. Điền `HR_ADMIN_EMAIL`, `HR_ADMIN_PASSWORD` (ít nhất 10 ký tự); giữ `HR_DATA_FILE=data/hr.json`.
3. Chạy `npm run hr:setup` một lần, sau đó xóa `HR_ADMIN_PASSWORD` khỏi `.env`.
4. `npm run build`, rồi `npm run start`.
5. Đăng nhập bằng `HRADMIN` hoặc email đã đặt; tạo tài khoản HR/trưởng phòng/nhân viên.

Chế độ phát triển: `npm run dev`. Nếu esbuild optimizer bị chặn trong môi trường Windows giới hạn, dùng bản production `npm run build` + `npm run start` để xem thử.

## Nhập hồ sơ từ dự án cũ

Dừng server trước khi chạy script nhập hoặc khởi tạo. Sao lưu tệp HR nếu đã có dữ liệu.

```powershell
$env:HR_IMPORT_START_DATE='2026-01-01'
npm run hr:import
```

Ngày trên chỉ là ví dụ: thay bằng ngày nhập mặc định do bạn xác nhận. Script nhập hồ sơ hợp lệ, bỏ qua mã/email trùng và giữ tất cả ở trạng thái chưa kích hoạt (`inactive`), quyền nhân viên, chưa có mật khẩu. Admin phải kiểm tra ngày vào làm, chức vụ, quyền và cấp mật khẩu trước khi cho dùng. Script không suy đoán ngày làm từ dữ liệu cũ, không nhập OTP giả, hợp đồng Sale, KPI hoặc lương cũ vào hợp đồng lao động. `data/db.json` được giữ nguyên.

## Kiểm tra

```sh
npm run typecheck:hr
npm test
npm run build
```

Lệnh test dùng tsx và Node test runner để chạy bộ kiểm tra. Kiểm thử chỉ tạo dữ liệu riêng dưới `work/`.

## Lưu trữ và triển khai

Bản này dành cho đồ án/demo với một tiến trình Node, lưu JSON nguyên tử vào `HR_DATA_FILE`. Không chạy đồng thời nhiều instance hoặc script sửa cùng tệp; restart server sau khi dùng script nhập. Sao lưu tệp khi server đã dừng. Phiên đăng nhập ở bộ nhớ, mất khi khởi động lại. Bản build server luôn chạy production; `bun run start` phục vụ `dist/` và API.

Mặc định chỉ nghe `127.0.0.1:3000`. Khi triển khai thật, cấu hình `HOST`, `PORT`, HTTPS/reverse proxy và `COOKIE_SECURE=true`, giới hạn quyền đọc tệp HR, tách dữ liệu demo, thiết lập sao lưu. Phần thuế, bảo hiểm, tăng ca, ngày lễ và chia kỳ lương giữa tháng chưa tự động hóa; xem tài liệu phạm vi trước khi mở rộng.
