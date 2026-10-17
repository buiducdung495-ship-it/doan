# CHECKPOINT 06 — BÁO CÁO VÀ DEMO

**Đề tài:** Xây dựng hệ thống quản lý nhân sự (SHC Company)
**Sinh viên:** Bùi Đức Dũng — MSV 523100077 — Lớp 523100B
**GVHD:** ThS. Trần Thị Lụa
**Yêu cầu checkpoint (Quy định Đồ án kỳ khóa 523):** Báo cáo, demo, cải tiến và hướng phát triển.
**Minh chứng tối thiểu:** Báo cáo cuối; source code; video/link demo.
**Kết quả cần đạt:** Hoàn thiện sản phẩm và hồ sơ đồ án.

| Minh chứng | Vị trí |
|---|---|
| Báo cáo cuối | Nộp riêng cho GVHD (không lưu trên repo) |
| Source code | Thư mục gốc repo này |
| Video demo | _Bổ sung link video demo (YouTube/Google Drive) tại đây_ |

---

## 1. Kịch bản demo (khoảng 10 phút)

Theo mục VI của Quy định — Yêu cầu trình bày khi báo cáo/demo cuối kỳ:

| # | Phần trình bày | Nội dung demo | Tài khoản |
|---|---|---|---|
| 1 | Bài toán & mục tiêu | Doanh nghiệp vừa và nhỏ quản lý nhân sự bằng Excel/giấy; mục tiêu MT01–MT07 | — |
| 2 | Phân tích & thiết kế | Use case tổng quan, kiến trúc, quan hệ dữ liệu ([CP03](../CP03_thiet_ke/README.md)) | — |
| 3 | Sản phẩm demo | Đăng ký công khai → HR duyệt kích hoạt; Dashboard; hồ sơ; hợp đồng; chấm công | Khách, `HR01`, `ADMIN` |
| | | Nhân viên gửi đơn nghỉ → Trưởng phòng duyệt → nhân viên nhận thông báo | `NV001`, `QL01` |
| | | Tính lương nháp NV001 tháng 09/2026 = 13.000.000 đ → chốt → nhân viên xem phiếu lương | `HR01`, `NV001` |
| 4 | Kiểm thử & đánh giá | Chạy `npm test` trực tiếp (19/19), bảng test case và 13 lỗi đã sửa ([CP05](../CP05_kiem_thu/README.md)) | — |
| 5 | Cải tiến kỹ thuật | 3 cải tiến bên dưới, minh họa trước/sau | — |
| 6 | Tự học & phát triển | Công nghệ tự học, minh chứng áp dụng, kế hoạch tiếp theo (báo cáo mục 3.4) | — |

## 2. Cải tiến kỹ thuật (báo cáo mục 3.3)

| Cải tiến | Trước | Sau | Minh chứng |
|---|---|---|---|
| 1. Phân quyền và lọc dữ liệu tại máy chủ | Chỉ ẩn nút trên giao diện; API trả toàn bộ nhân viên kèm thông tin nhạy cảm | Mọi tuyến ghi kiểm tra vai trò/phòng ban; `GET /hr/data` lọc theo vai trò, không gửi credentials | TC A05–A09, L03, L06 |
| 2. Chống chốt lương nháp lỗi thời, khóa kỳ đã chốt | Chốt chỉ đổi trạng thái, không đối chiếu dữ liệu nguồn | Tính lại từ nguồn khi chốt, lệch thì trả 409; cấm sửa công/hợp đồng kỳ đã chốt | TC P06, P07, P09, P10, C04 |
| 3. Ghi JSON nguyên tử | Ghi đè trực tiếp, nuốt lỗi ghi → RAM và đĩa lệch nhau | `HRStore.transaction`: làm trên bản sao, ghi `.tmp`, đổi tên; lỗi thì hủy và ném ngoại lệ | TC S08, S10 |

## 3. Kết quả đạt được

- Ứng dụng web quản lý nhân sự với 4 vai trò, chạy được trên dữ liệu mẫu (8 nhân viên, 176 bản ghi công).
- 78 ca kiểm thử tự động (19/19 test của `npm test`) và 6 ca kiểm thử giao diện đều đạt; 13 lỗi đã phát hiện và khắc phục.
- Kiểm tra kiểu TypeScript không lỗi; build production thành công.

## 4. Hạn chế và hướng phát triển

| Hạn chế hiện tại | Hướng phát triển |
|---|---|
| Lưu JSON trong một tiến trình Node, phiên lưu trong bộ nhớ | Chuyển sang PostgreSQL, phân trang phía máy chủ, lưu phiên bền vững |
| Lương chỉ gồm lương cơ bản, phụ cấp, công, phép, thưởng/khấu trừ nhập tay | Tích hợp ngày lễ, ca làm việc, tăng ca, bảo hiểm và thuế TNCN theo quy định hiện hành |
| Máy chấm công mới là danh mục, chưa kết nối thiết bị | Đồng bộ dữ liệu từ thiết bị chấm công |
| Kiểm thử giao diện còn thủ công; chưa kiểm thử tải | Tự động hóa bằng Playwright; đo thời gian phản hồi khi dữ liệu lớn |
| Chưa có xác minh email, khôi phục mật khẩu qua email | Bổ sung xác minh email và quên mật khẩu |
