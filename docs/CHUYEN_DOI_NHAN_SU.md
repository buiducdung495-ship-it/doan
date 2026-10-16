# Rà soát và chuyển đổi E-Office sang quản lý nhân sự

Nguồn đối chiếu: nhánh `master`, commit `5c382f9dc294e370023e4af2f18e9f282ee0c956` của `buiducdung495-ship-it/nhom1thuctap`. Kho có nhánh mặc định `main`, nhưng bản này dựa đúng nhánh `master` trong liên kết được cung cấp.

## 1. Những gì tìm thấy trong mã gốc

| Phần gốc                                                   | Kết quả kiểm tra                                                                                                      | Xử lý trong bản nhân sự                                                                                                         |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Người dùng (`UserManager`, `UserProfileModal`)             | Có thông tin cá nhân, phòng ban, chức danh, lương nhưng trộn hồ sơ với tài khoản                                      | Tách kiểu dữ liệu HR; thêm ngày vào làm, trạng thái thử việc/đang làm/đã nghỉ, phép năm, danh mục phòng ban/chức vụ và quyền HR |
| Đăng nhập (`AuthPage`, `UserController`)                   | Đăng nhập bằng email/điện thoại + mã nhân viên, `skip2FA` do trình duyệt gửi; chưa có mật khẩu và phiên xác thực thật | Thay bằng mật khẩu băm scrypt và phiên cookie HttpOnly, SameSite; bỏ OTP mô phỏng. Từ 03/10/2026 có đăng ký công khai chờ Admin/HR duyệt, không tự cấp quyền nội bộ. |
| API (`src/backend/routes/api.ts`)                          | Không có middleware xác thực/phân quyền; người gọi có thể gửi dữ liệu cập nhật tùy ý                                  | Server chỉ gắn router HR mới, kiểm tra quyền và dữ liệu từng thao tác; API E-Office cũ không còn được phục vụ                   |
| Hợp đồng (`ContractManager`)                               | Là hợp đồng Sale: đối tác, giá trị bán hàng, nhân viên sale; lưu `localStorage`                                       | Thay bằng hợp đồng lao động liên kết nhân viên: thử việc, có thời hạn, không thời hạn, ngày hiệu lực, lương và phụ cấp          |
| KPI (`KPIManager`)                                         | Nhập thủ công số ngày làm việc vào bản ghi KPI                                                                        | Tách chấm công theo ngày và đánh giá theo tháng; lương lấy công/phép từ dữ liệu máy chủ                                         |
| Quy trình/đơn từ (`WorkflowPortal`, `ApprovalInbox`)       | Phục vụ nhiều quy trình văn phòng                                                                                     | Đơn nghỉ phép chuyên biệt: gửi, hủy khi chờ, duyệt/từ chối, ý kiến, hạn mức và kiểm tra trùng ngày                              |
| Dashboard (`DashboardAnalytics`)                           | Theo công việc, văn bản và nghiệp vụ E-Office                                                                         | Chỉ số nhân sự, phân bố phòng ban, đơn chờ và hợp đồng sắp hết hạn                                                              |
| Công văn đến/đi/nội bộ, OCR, lưu trữ cloud                 | Ngoài trọng tâm quản lý nhân sự cơ bản                                                                                | Bỏ khỏi điều hướng và API đang chạy; mã cũ còn trong Git để tham khảo                                                           |
| Task, lịch công việc, chat/video, AI, thanh toán văn phòng | Làm phạm vi đồ án rộng, tăng tải và phụ thuộc                                                                         | Bỏ khỏi bản HR đang chạy                                                                                                        |
| Tài sản bàn giao                                           | Có thể phục vụ tiếp nhận/nghỉ việc nhưng chưa phải phần cốt lõi                                                       | Đề xuất giai đoạn sau; bản hiện tại chưa nối nghiệp vụ bàn giao                                                                 |
| `MockDB.save()`                                            | Bắt lỗi ghi tệp rồi chỉ ghi cảnh báo, dữ liệu trong bộ nhớ có thể khác dữ liệu trên đĩa                               | Kho HR ghi tệp tạm và đổi tên trước khi công bố trạng thái mới; lỗi ghi trả về thất bại                                         |

Việc “bỏ” là ngừng phục vụ module, không xóa dữ liệu E-Office cũ hoặc cố chuyển hợp đồng bán hàng thành hợp đồng lao động. Nhánh master vẫn là điểm khôi phục.

## 2. Chức năng đã triển khai

- Hồ sơ: thêm, cập nhật, tìm kiếm/lọc, chuyển trạng thái nghỉ việc thay vì xóa nhân viên; ngăn trùng mã/email; đặt lại mật khẩu bởi admin.
- Phòng ban/chức vụ: thêm, đổi tên, xóa khi chưa được nhân viên sử dụng.
- Hợp đồng lao động: thêm, sửa, tra cứu, cảnh báo hết hạn; ngăn khoảng hiệu lực trùng và sửa dữ liệu ảnh hưởng lương đã chốt.
- Chấm công: ghi nhận giờ vào/ra theo ngày, cập nhật cùng nhân viên/ngày, xóa công ghi nhầm trước khi chốt lương.
- Nghỉ phép: người lao động gửi/hủy đơn chờ; HR/admin hoặc trưởng phòng cùng phòng duyệt; không tự duyệt, không xử lý hai lần; kiểm tra số dư và ngày công xung đột.
- Lương: lập/tính lại nháp theo nhân viên/tháng, tính từ hợp đồng + công + phép hưởng lương; thưởng và khấu trừ nhập rõ; chốt và khóa kỳ; nhân viên chỉ thấy lương của mình đã chốt.
- Đánh giá: điểm 0–100 theo tháng, nhận xét và người đánh giá; không tự chấm điểm.
- Nhật ký: máy chủ tự ghi người thực hiện, hành động, đối tượng và thời điểm; giao diện hiển thị 200 sự kiện gần nhất.
- Tiện ích: xuất CSV theo danh sách đã lọc, phân trang 15 dòng trên giao diện, biểu mẫu có lỗi/thành công/trạng thái đang lưu, hỗ trợ bàn phím và màn hình nhỏ.

## 3. Ma trận quyền

| Hoạt động                           | Admin                | HR                              | Trưởng phòng                           | Nhân viên            |
| ----------------------------------- | -------------------- | ------------------------------- | -------------------------------------- | -------------------- |
| Xem hồ sơ                           | Tất cả               | Tất cả                          | Bản thân + danh bạ tối giản cùng phòng | Bản thân             |
| Sửa hồ sơ/tạo nhân viên             | Tất cả               | Chỉ tài khoản vai trò nhân viên | Không                                  | Không                |
| Cấp quyền quản lý, đặt lại mật khẩu | Có                   | Không                           | Không                                  | Không                |
| Đổi mật khẩu của mình               | Có                   | Có                              | Có                                     | Có                   |
| Hợp đồng, công, lương               | Quản lý toàn bộ      | Quản lý toàn bộ                 | Chỉ dữ liệu của mình                   | Chỉ dữ liệu của mình |
| Duyệt nghỉ/đánh giá                 | Tất cả, trừ bản thân | Tất cả, trừ bản thân            | Cùng phòng, trừ bản thân               | Không                |
| Gửi nghỉ phép                       | Cho bản thân         | Cho bản thân                    | Cho bản thân                           | Cho bản thân         |
| Danh mục, nhật ký                   | Có                   | Có                              | Không                                  | Không                |

Quyền được kiểm tra lại ở máy chủ trong mỗi yêu cầu. Sửa giao diện hoặc gửi `role`/`operatorId` giả từ trình duyệt không cấp thêm quyền.

## 4. Quy ước nghiệp vụ của đồ án

- Lịch làm việc thứ Hai đến thứ Sáu. Một bản ghi công hợp lệ bằng một ngày, chưa quy đổi thời lượng, ca đêm, nửa ngày, tăng ca hoặc ngày lễ.
- Phép năm là hạn mức cấu hình cho từng nhân viên, chưa tự tính theo thâm niên hoặc thời gian làm việc trong năm. Đơn qua năm phải tách theo năm. Hạn mức trừ theo đơn đã duyệt, không trừ đơn đang chờ.
- Chỉ lập lương sau khi tháng kết thúc. Công thức: `(lương cơ bản + phụ cấp) × (công + phép hưởng lương) / ngày chuẩn + thưởng − khấu trừ`, làm tròn đến VND.
- Đây là công thức mô phỏng phục vụ đồ án, không phải bộ máy tính lương tuân thủ pháp luật. Thuế, BHXH/BHYT/BHTN và các khoản khấu trừ không được tự suy đoán; tổng khấu trừ do HR nhập sau khi xác định riêng.
- Kỳ lương cần một hợp đồng bao phủ cả tháng. Trường hợp vào/nghỉ việc hoặc đổi hợp đồng giữa tháng bị chặn với thông báo, chưa tự chia kỳ.
- Bảng lương chốt không thể mở lại trong bản này. Cần kiểm tra nháp trước khi chốt. Công/phép/hợp đồng thay đổi khiến nháp lỗi thời phải tính lại.
- Đổi lương cho các kỳ sau: điều chỉnh ngày kết thúc hợp đồng cũ không ảnh hưởng kỳ đã chốt, rồi tạo hợp đồng nối tiếp không trùng ngày.

## 5. Kiến trúc và tối ưu

Giữ React, TypeScript, Vite, Express và cấu trúc frontend/backend của dự án. `src/App.tsx` chuyển sang giao diện `src/hr/HRApp.tsx`; server chỉ phục vụ `src/backend/hr/api.ts`. Các kiểu HR dùng chung đặt tại `src/hr/types.ts`; kiểm tra nghiệp vụ và lưu trữ tách thành `rules.ts`, `store.ts`.

- Không tải/bundle các component chat, công văn, OCR, biểu đồ E-Office cũ vào frontend mới.
- Bỏ vòng lặp tải hàng loạt API mỗi 6 giây trong App cũ; tải dữ liệu khi đăng nhập, sau thay đổi và khi bấm Làm mới.
- Loại bỏ CSS Tailwind quét module cũ khỏi giao diện HR; giao diện mới dùng stylesheet riêng, không cần tải font ngoài.
- Không lưu hồ sơ, lương hoặc quyền vào localStorage. Phiên dùng cookie HttpOnly trong 8 giờ; trạng thái dữ liệu lấy lại từ máy chủ.
- Giới hạn JSON đầu vào 64 KB, chống ghi chéo nguồn đối với phiên cookie, giới hạn thử đăng nhập, khóa người nghỉ việc, giới hạn trường cập nhật và kiểm tra dữ liệu tham chiếu.
- Dữ liệu HR ở `data/hr.json`, tách `data/db.json`. Tệp HR, mật khẩu demo, `.env`, build và thư viện được bỏ khỏi Git.

Kho JSON phục vụ demo/đồ án với **một tiến trình máy chủ**, không phù hợp nhiều instance hay khối lượng dữ liệu lớn. Phân trang hiện tại ở trình duyệt; API trả toàn bộ dữ liệu trong phạm vi được phép. Bản này không tuyên bố đã tối ưu cho vận hành doanh nghiệp quy mô lớn.

## 6. Đề xuất mở rộng sau bản này

1. PostgreSQL/MySQL hoặc một cơ sở dữ liệu thống nhất có migration, khóa giao dịch, ràng buộc unique, index và phân trang API; phiên dùng kho dùng chung khi chạy nhiều instance.
2. Lịch lễ, ca, tăng ca, nửa ngày, nghỉ giữa kỳ, quy tắc thuế/bảo hiểm có hiệu lực theo thời gian và kiểm tra với yêu cầu nghiệp vụ thực tế.
3. Lưu tệp hợp đồng/hồ sơ có phân quyền tải xuống, giới hạn dung lượng, sao lưu và chính sách lưu giữ dữ liệu.
4. Tuyển dụng, onboarding/offboarding và bàn giao tài sản nếu phạm vi giảng viên yêu cầu.
5. Quản trị quy tắc phép theo năm, điều chỉnh có nhật ký, mở lại kỳ lương với quy trình phê duyệt.

## 7. Gợi ý trình bày đồ án

Tên đề tài: **Xây dựng website quản lý nhân sự cho doanh nghiệp**. Trình bày 4 tác nhân (quản trị, HR, trưởng phòng, nhân viên), mô hình dữ liệu Employee–Department–Position–Contract–Attendance–Leave–Payroll–Evaluation–Audit, và ba luồng demo chính: tiếp nhận nhân viên; gửi/duyệt nghỉ; ghi công/tính/chốt lương. Phân biệt rõ nghiệp vụ đã thực hiện và hướng phát triển.
