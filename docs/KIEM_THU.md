# Kiểm thử bản nhân sự

## Tự động

Ngày 03/10/2026: `npm run typecheck:hr` kiểm tra TypeScript strict cho luồng HR đang chạy; `npm test` dùng tsx/Node test runner, đạt 19/19 kiểm tra (gồm các kiểm tra con). `npm run build` tạo bản production thành công. `npm run lint` cũng kiểm tra luồng HR; `typecheck:legacy` dành riêng cho toàn bộ mã cũ còn được giữ tham khảo.

Các kiểm tra bao gồm:

- Ngày không tồn tại, khoảng ngày đảo ngược, loại trừ cuối tuần.
- API nội bộ không đăng nhập và lối đăng nhập `skip2FA` cũ bị chặn.
- Đăng ký công khai: email hợp lệ/không trùng không phân biệt hoa thường, mật khẩu tối thiểu 10 ký tự được băm; yêu cầu pending không sinh nhân viên/phiên đăng nhập. Chỉ Admin/HR kích hoạt, quyền cố định employee; review lỗi không thay đổi dữ liệu, duyệt lặp bị chặn, từ chối cần lý do. Hash không xuất qua API, nhân viên/trưởng phòng không đọc danh sách đăng ký.
- Giới hạn đăng ký 10 lần/IP/15 phút; nguồn website khác bị từ chối.
- Phạm vi dữ liệu nhân viên/trưởng phòng; HR không tự cấp quyền admin; không xóa phòng ban đang sử dụng; không tự khóa tài khoản.
- Nguồn yêu cầu chéo website bị từ chối; endpoint công việc cũ không phục vụ.
- Nghỉ trùng, tự duyệt, duyệt ngoài phòng, duyệt lặp, thiếu ý kiến từ chối, hủy đơn và vượt phép năm.
- Hợp đồng trùng thời gian, lương âm.
- Công cập nhật không tạo bản ghi trùng; lương nháp tính đúng; nhân viên không thấy nháp; dữ liệu thay đổi buộc tính lại; kỳ chốt khóa công và lương.
- Đánh giá ngoài quyền, điểm vượt phạm vi; đổi mật khẩu hủy phiên khác; đăng xuất hủy phiên.
- Tải lại dữ liệu từ đĩa, không lưu mật khẩu thô; lỗi ghi không làm thay đổi ảnh chụp dữ liệu đang dùng.

Kiểm thử dùng thư mục riêng dưới `work/`, không sửa dữ liệu E-Office hoặc dữ liệu demo đang mở.

## Trực tiếp trên trình duyệt

- Đăng nhập ADMIN bằng dữ liệu demo riêng; xác nhận tổng quan hiện 8 nhân viên và cảnh báo hợp đồng.
- Mở biểu mẫu hồ sơ, kiểm tra các trường; tìm NV001 chỉ còn đúng một dòng.
- Kiểm tra bố cục tại viewport 390 px; trang không tràn ngang toàn bộ, bảng có vùng cuộn riêng.
- Lập bảng lương tháng mẫu cho NV001 từ hợp đồng và ngày công; xác nhận kết quả xuất hiện.

## Ghi chú môi trường

Bản UI/UX ngày 03/10 được xem bằng production server trên cổng 3120, dữ liệu riêng `work/ui-demo/hr.json`. Đã kiểm tra đăng ký → kích hoạt qua giao diện → đăng nhập nhân viên mới; menu mobile cả mục cuối, lỗi mật khẩu xác nhận, nút tạm dừng minh họa, hộp thoại và Escape. Xem ảnh trong `work/ui-review/` và tài liệu `UI_UX_SHC.md`.

Môi trường Windows sandbox chặn tra cứu tài khoản hệ điều hành của tsx và thao tác dò thư mục cha của binary esbuild. Đã dùng Bun cho chạy TypeScript và đóng gói server; Vite build với `configLoader: runner`; server đóng gói đích Node và cố định chế độ production. Kiểm thử Node được kiểm chứng bằng bản test bundle riêng. Đây không phải lý do bỏ kiểm tra API.

Các module E-Office cũ không còn được import vào ứng dụng HR. Kiểm tra strict HR không phải chứng nhận các module cũ đã hết lỗi; chúng được giữ để tham khảo và phục hồi.
