# Đối chiếu chức năng với video HRM

Video tham chiếu dài 56 giây đã được rà soát theo toàn bộ luồng: đăng nhập, dashboard, hồ sơ nhân viên, khen thưởng, kỷ luật, chấm công, đăng ký thẻ, phân ca, loại hợp đồng, phòng ban và máy chấm công.

## Phần đã có trước khi đối chiếu

- Đăng nhập và phân quyền quản trị/HR/trưởng phòng/nhân viên.
- Hồ sơ nhân viên, phòng ban, chức vụ và hợp đồng lao động.
- Chấm công theo ngày, nghỉ phép, bảng lương, đánh giá và nhật ký.
- Tìm kiếm, lọc, phân trang, xuất CSV và giao diện responsive.

## Phần bổ sung theo video

- Khen thưởng và kỷ luật: thêm, sửa, xóa, tìm kiếm và lọc theo tháng.
- Đăng ký thẻ chấm công: đăng ký mới, đổi thẻ, cấp lại; kiểm tra trùng mã thẻ.
- Danh mục ca làm việc và phân ca theo khoảng ngày; ngăn một nhân viên bị xếp ca trùng thời gian.
- Danh mục loại hợp đồng có tên Việt/Anh, thời hạn và trạng thái. Biểu mẫu hợp đồng dùng trực tiếp danh mục này.
- Danh mục ngày nghỉ lễ.
- Danh mục máy chấm công: tên Việt/Anh, vị trí, thương hiệu, kiểu máy và trạng thái.
- Dashboard có thêm sinh nhật trong tháng và tỷ lệ nhân viên đã được xếp ca.
- Sidebar chia thành nhóm **Chức năng** và **Danh mục**, theo cấu trúc trong video.

## Bảo vệ dữ liệu

- Các thao tác ghi ở các module mới chỉ dành cho quản trị viên hoặc HR và được kiểm tra tại API.
- Nhân viên chỉ xem dữ liệu của mình; trưởng phòng chỉ xem dữ liệu trong phạm vi nhóm.
- Tệp JSON phiên bản cũ tự nhận các collection mới mà không xóa hồ sơ, tài khoản, hợp đồng, lương hoặc dữ liệu đã có.
- Không cho xóa ca đang được phân công hoặc loại hợp đồng đang được sử dụng.

## Giới hạn còn giữ

- Máy chấm công mới là danh mục quản trị; chưa đồng bộ trực tiếp thiết bị vật lý.
- Ngày nghỉ lễ chưa tự động tham gia công thức lương.
- Tăng ca, phụ cấp động và công thức lương tùy biến chưa xuất hiện trực tiếp trong các màn video đã duyệt nên chưa được tự động hóa.

