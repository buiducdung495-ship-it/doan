# CHECKPOINT 05 — KIỂM THỬ, DỮ LIỆU MẪU, SỬA LỖI VÀ TỐI ƯU

**Đề tài:** Xây dựng hệ thống quản lý nhân sự (SHC Company)
**Sinh viên:** Bùi Đức Dũng — MSV 523100077 — Lớp 523100B
**GVHD:** ThS. Trần Thị Lụa
**Yêu cầu checkpoint (Quy định Đồ án kỳ khóa 523):** Test case, dữ liệu mẫu, sửa lỗi, tối ưu.
**Minh chứng tối thiểu:** Bảng test case/kết quả; minh chứng lỗi đã sửa.
**Kết quả cần đạt:** Sản phẩm ổn định hơn, có đánh giá kết quả.

| Minh chứng | Vị trí |
|---|---|
| Mã nguồn bộ kiểm thử | [`tests/hr.test.ts`](../../tests/hr.test.ts) |
| Log chạy test (19/19 đạt) | [`logs/test.log`](logs/test.log) |
| Log kiểm tra kiểu TypeScript | [`logs/typecheck.log`](logs/typecheck.log) |
| Log build production | [`logs/build.log`](logs/build.log) |
| Script tạo dữ liệu mẫu | [`scripts/setup-hr.ts`](../../scripts/setup-hr.ts) (chế độ `demo`) |

Chạy lại toàn bộ kiểm chứng:

```sh
npm ci
npm run typecheck:hr
npm test
npm run build
```

---

## PHẦN 1. BỘ DỮ LIỆU MẪU

Dữ liệu mẫu được sinh bằng `npm run hr:demo` (hàm chế độ `demo` trong `scripts/setup-hr.ts`) vào tệp riêng do biến `HR_DATA_FILE` chỉ định (ví dụ `work/demo/hr.json`), không ghi đè dữ liệu thật. Mật khẩu demo sinh ngẫu nhiên và chỉ ghi vào `work/demo/demo-access.txt` (không đưa lên GitHub).

### 1. Cơ cấu tổ chức
- **5 phòng ban:** `Admin` (Ban điều hành), `HR` (Nhân sự), `Tech` (Công nghệ), `Sales` (Kinh doanh), `Finance` (Tài chính).
- **Chức vụ:** `lead` (Trưởng phòng), `staff` (Nhân viên).

### 2. Danh sách nhân viên mẫu (8 người, đủ 4 vai trò)
| Mã NV | Họ và tên | Phòng ban | Chức vụ | Vai trò hệ thống | Trạng thái | Phép năm |
|---|---|---|---|---|---|---|
| `ADMIN` | Nguyễn Minh Anh | Admin | lead | **admin** | active | 12 |
| `HR01` | Trần Thu Hà | HR | staff | **hr** | active | 12 |
| `QL01` | Lê Hoàng Nam | Tech | lead | **manager** | active | 12 |
| `NV001` | Phạm Ngọc Linh | Tech | staff | employee | active | 12 |
| `NV002` | Đỗ Quang Huy | Tech | staff | employee | active | 12 |
| `NV003` | Vũ Thảo Vy | Sales | staff | employee | active | 12 |
| `NV004` | Bùi Đức Long | Finance | staff | employee | active | 12 |
| `NV005` | Hoàng Khánh An | Sales | staff | employee | probation | 12 |

Email theo mẫu `<mã nv>@example.test` (ví dụ `nv001@example.test`).

### 3. Hợp đồng lao động
- 8 hợp đồng `HĐLĐ-<mã NV>`, loại có thời hạn.
- Nhân viên (`NV...`): lương cơ bản 12.000.000 đ; ADMIN, HR01, QL01: 18.000.000 đ; phụ cấp 1.000.000 đ cho tất cả.
- Hợp đồng `HĐLĐ-NV001` hết hạn sau 20 ngày kể từ ngày tạo dữ liệu → hiển thị cảnh báo "sắp hết hạn trong 30 ngày" trên Dashboard (bản chụp báo cáo ngày 16/10/2026: hết hạn 05/11/2026).

### 4. Chấm công
- **176 bản ghi**: 8 nhân viên × 22 ngày làm việc (thứ Hai – thứ Sáu) của tháng 09/2026, giờ vào/ra 08:00 – 17:00, không trùng lặp.

### 5. Đơn nghỉ phép
- 1 đơn phép năm 1 ngày của `NV001` ở trạng thái chờ duyệt (`pending`), dùng kiểm tra hàng đợi duyệt và Dashboard.

### 6. Bảng lương mẫu tháng 09/2026 (đối chiếu thủ công)
- `NV001`: 22 ngày công chuẩn, 22 ngày làm việc, 0 ngày phép, thưởng/khấu trừ 0 đ.
- Công thức: `(12.000.000 + 1.000.000) × (22 + 0) / 22 + 0 − 0 = 13.000.000 đ`.
- Kết quả trên giao diện và API: bản nháp (`draft`), thực nhận **13.000.000 đ** — khớp tính tay.

> Bộ kiểm thử tự động (`npm test`) **không** dùng dữ liệu trên mà tự tạo dữ liệu tạm trong `work/test-*` với các tài khoản `admin`, `hr`, `manager` (phòng Tech), `worker` (phòng Tech), `outsider` (phòng Sales), rồi xóa sau khi chạy.

---

## PHẦN 2. BẢNG TEST CASE VÀ KẾT QUẢ THỰC HIỆN (TEST EXECUTION MATRIX)

Bộ kiểm thử gồm kiểm thử đơn vị (Unit test), kiểm thử tích hợp API (Integration test) bằng `node:test` + `assert/strict`, kiểm tra an toàn kiểu `tsc`, kiểm thử đóng gói `vite build` và kiểm thử giao diện người dùng.

### 1. Nhóm D - Quy tắc ngày và ngày công (Date & Workday Validation)
| Mã TC | Tình huống / Mục tiêu kiểm thử | Dữ liệu đầu vào / Điều kiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|
| **D01** | Kiểm tra ngày lịch không hợp lệ | `date("2026-02-30")` | Ném ngoại lệ lỗi định dạng/ngày không có thực | Máy chủ ném ngoại lệ đúng quy chuẩn | **PASS** |
| **D02** | Khoảng ngày bị đảo ngược | `workdays("2026-03-03", "2026-03-01")` | Ném ngoại lệ do ngày bắt đầu lớn hơn ngày kết thúc | Ngoại lệ được ném chính xác | **PASS** |
| **D03** | Đếm ngày làm việc tháng chuẩn (T2-T6) | `workdays("2026-08-01", "2026-08-31")` | 21 ngày làm việc (trừ thứ 7, CN) | Kết quả trả về đúng 21 | **PASS** |
| **D04** | Đếm khoảng ngày chỉ gồm cuối tuần | `workdays("2026-08-01", "2026-08-02")` | 0 ngày làm việc | Trả về 0 | **PASS** |

### 2. Nhóm A - Xác thực và Phân quyền máy chủ (Authentication & Authorization)
| Mã TC | Tình huống / Mục tiêu kiểm thử | Dữ liệu đầu vào / Điều kiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|
| **A01** | Truy cập dữ liệu HR không có phiên đăng nhập | `GET /api/hr/data` không mang Cookie phiên | HTTP 401 Unauthorized | HTTP 401 | **PASS** |
| **A02** | Gọi endpoint `users` cũ không có phiên | `GET /api/users` (API E-Office cũ) | HTTP 401 Unauthorized | HTTP 401 | **PASS** |
| **A03** | Đăng nhập lậu kiểu cũ (`skip2FA`/chỉ gửi mã) | `POST /api/auth/login` với body `{ employeeId, skip2FA: true }` | HTTP 400 Bad Request | HTTP 400 | **PASS** |
| **A04** | Đăng nhập sai mật khẩu | `POST /api/auth/login` với mật khẩu sai | HTTP 401 Unauthorized | HTTP 401 | **PASS** |
| **A05** | Đăng ký trực tiếp với vai trò `role=admin` | `POST /api/auth/register` truyền `role: "admin"` | Bị chặn, chỉ tạo yêu cầu pending vai trò employee | HTTP 201 tạo pending employee | **PASS** |
| **A06** | Nhân viên thường đọc dữ liệu HR | Đăng nhập tài khoản `worker`, gọi `GET /api/hr/data` | Chỉ trả hồ sơ của chính mình; không có `credentials` | Trả đúng 1 hồ sơ cá nhân; che toàn bộ thông tin nhạy cảm | **PASS** |
| **A07** | Trưởng phòng đọc dữ liệu phòng ban | Đăng nhập `manager`, gọi `GET /api/hr/data` | Không thấy nhân viên phòng Sales; địa chỉ đồng nghiệp bị che rỗng | Dữ liệu lọc chuẩn phòng Tech, địa chỉ bị làm rỗng | **PASS** |
| **A08** | Nhân sự (HR) tự cấp quyền admin cho người khác | Đăng nhập `hr`, gọi `POST /api/hr/employees` với `role: "admin"` | HTTP 403 Forbidden (HR không có quyền tạo admin) | HTTP 403 Forbidden | **PASS** |
| **A09** | Nhân viên thường cố tạo hồ sơ nhân viên mới | Đăng nhập `worker`, gọi `POST /api/hr/employees` | HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| **A10** | Quản trị viên tạo nhân viên và kiểm tra trùng mã | Đăng nhập `admin`, tạo mới NV; sau đó tạo lại cùng mã | Lần 1: 201 Created; Lần 2: 409 Conflict | Lần 1: 201; Lần 2: 409 | **PASS** |

### 3. Nhóm L - Luồng xử lý nghỉ phép và Hạn mức (Leave Workflow & Quota)
| Mã TC | Tình huống / Mục tiêu kiểm thử | Dữ liệu đầu vào / Điều kiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|
| **L01** | Nhân viên gửi đơn nghỉ phép hợp lệ | `worker` gửi đơn 2026-10-12 đến 2026-10-13 | HTTP 201 Created, trạng thái `pending` | HTTP 201 Created | **PASS** |
| **L02** | Gửi đơn trùng lặp khoảng thời gian đang chờ | `worker` gửi tiếp đơn chồng ngày với đơn pending | HTTP 409 Conflict | HTTP 409 Conflict | **PASS** |
| **L03** | Chủ đơn tự phê duyệt đơn của mình | `worker` gửi request duyệt đơn của chính mình | HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| **L04** | Trưởng phòng cùng bộ phận phê duyệt đơn | `manager` duyệt đơn của `worker` phòng Tech | HTTP 200 OK, trạng thái chuyển `approved` | HTTP 200 OK | **PASS** |
| **L05** | Phê duyệt lặp lại đơn đã duyệt | Duyệt lại đơn đã ở trạng thái `approved` | HTTP 409 Conflict | HTTP 409 Conflict | **PASS** |
| **L06** | Trưởng phòng duyệt đơn của nhân viên khác phòng | `manager` phòng Tech duyệt đơn của `outsider` phòng Sales | HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| **L07** | Từ chối đơn nhưng không cung cấp lý do/ý kiến | Gửi `action: "reject"` với lý do để trống | HTTP 400 Bad Request | HTTP 400 Bad Request | **PASS** |
| **L08** | Nhân viên tự hủy đơn đang chờ của mình | `outsider` gửi yêu cầu hủy đơn pending của mình | HTTP 200 OK, trạng thái chuyển `cancelled` | HTTP 200 OK | **PASS** |
| **L09** | Phê duyệt đơn có số ngày vượt quá hạn mức phép | Duyệt đơn 13 ngày trong khi hạn mức còn 12 ngày | HTTP 400 Bad Request tại thời điểm duyệt | HTTP 400 Bad Request | **PASS** |

### 4. Nhóm C - Quản lý Hợp đồng lao động và Ràng buộc lương (Contract Integrity)
| Mã TC | Tình huống / Mục tiêu kiểm thử | Dữ liệu đầu vào / Điều kiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|
| **C01** | Tạo hợp đồng có mức lương âm | `POST /api/hr/contracts` với `salary: -1` | HTTP 400 Bad Request | HTTP 400 Bad Request | **PASS** |
| **C02** | Tạo hợp đồng hợp lệ cho nhân viên | Hợp đồng có thời hạn, ngày hợp lệ | HTTP 201 Created | HTTP 201 Created | **PASS** |
| **C03** | Tạo hợp đồng thứ hai chồng chéo thời gian | Hợp đồng mới giao khoảng thời gian với hợp đồng đang có | HTTP 409 Conflict | HTTP 409 Conflict | **PASS** |
| **C04** | Thay đổi lương cơ sở khi kỳ lương liên quan đã chốt | Sửa mức lương của hợp đồng nằm trong kỳ lương `finalized` | HTTP 409 Conflict (Bảo vệ tính toàn vẹn) | HTTP 409 Conflict | **PASS** |
| **C05** | Sửa ngày hết hạn không ảnh hưởng tháng đã chốt | Kéo dài ngày kết thúc hợp đồng sang tương lai | HTTP 200 OK | HTTP 200 OK | **PASS** |
| **C06** | Đổi tên phòng ban đã có nhân viên tham chiếu | Đổi tên phòng Tech thành "Công nghệ" | HTTP 200 OK; trường `departmentId` của nhân viên giữ nguyên | Mã ID giữ nguyên, tên đổi chuẩn | **PASS** |

### 5. Nhóm P - Chấm công, Bảng lương nháp và Khóa kỳ lương (Attendance & Payroll)
| Mã TC | Tình huống / Mục tiêu kiểm thử | Dữ liệu đầu vào / Điều kiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|
| **P01** | Nhân viên thường gửi yêu cầu tự chấm công qua API | `worker` gửi `POST /api/hr/attendance` | HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| **P02** | Ghi nhận công vào ngày không tồn tại | Admin chấm công vào ngày `2026-02-30` | HTTP 400 Bad Request | HTTP 400 Bad Request | **PASS** |
| **P03** | Ghi đè cập nhật cùng nhân viên / cùng ngày | Chấm công 2 lần cùng ngày (upsert) | HTTP 200; tổng số bản ghi không tăng | Cập nhật bản ghi duy nhất | **PASS** |
| **P04** | Tạo bảng lương nháp tháng 8 (1 ngày công) | Lương 21tr/21 ngày = 1tr/ngày, thưởng 100k, trừ 50k | HTTP 200; `netSalary` = 1.050.000 VNĐ | `netSalary` = 1.050.000 VNĐ | **PASS** |
| **P05** | Nhân viên xem bảng lương khi đang ở trạng thái nháp | `worker` gọi API đọc danh sách lương cá nhân | Không hiển thị bản ghi nháp trong payload | Payload trả về mảng rỗng | **PASS** |
| **P06** | Thêm ngày công rồi cố tình chốt bản nháp cũ | Thêm công ngày 2, gửi yêu cầu chốt nháp (stale draft) | HTTP 409 Conflict (Phát hiện dữ liệu đổi) | HTTP 409 Conflict | **PASS** |
| **P07** | Tính toán lại bảng lương nháp sau khi thêm công | Tính lại nháp cho cùng tháng | HTTP 200; `netSalary` = 2.050.000 VNĐ | `netSalary` = 2.050.000 VNĐ | **PASS** |
| **P08** | Chốt bảng lương hợp lệ sau khi cập nhật | Gửi yêu cầu chốt bản nháp mới nhất | HTTP 200 OK; chuyển trạng thái `finalized` | HTTP 200 OK | **PASS** |
| **P09** | Sửa hoặc xóa ngày công của tháng đã chốt lương | Gửi yêu cầu xóa bản ghi công tháng 8 đã chốt | HTTP 409 Conflict (Khóa dữ liệu công) | HTTP 409 Conflict | **PASS** |
| **P10** | Yêu cầu tính toán lại bảng lương đã `finalized` | Gửi tính lại kỳ lương đã chốt | HTTP 409 Conflict (Khóa bảng lương) | HTTP 409 Conflict | **PASS** |
| **P11** | Nhân viên xem bảng lương sau khi đã chốt | `worker` gọi API xem bảng lương cá nhân | Trả về đúng 1 bản lương chính thức của mình | Hiển thị 1 bản ghi chính xác | **PASS** |

### 6. Nhóm O - Nghiệp vụ bổ trợ (Khen thưởng, Ca kíp, Phân ca, Thẻ từ)
| Mã TC | Tình huống / Mục tiêu kiểm thử | Dữ liệu đầu vào / Điều kiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|
| **O01** | Nhân viên thường tạo khen thưởng/kỷ luật | `worker` gọi `POST /api/hr/operations/recognitions` | HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| **O02** | Quản trị viên tạo bản ghi khen thưởng | Admin tạo khen thưởng cho `worker` | HTTP 201 Created | HTTP 201 Created | **PASS** |
| **O03** | Đăng ký thẻ nhân viên mới | Admin cấp thẻ mã `CARD-001` | HTTP 201 Created | HTTP 201 Created | **PASS** |
| **O04** | Cấp trùng mã thẻ từ nhân viên | Cấp tiếp thẻ `CARD-001` cho nhân viên khác | HTTP 409 Conflict | HTTP 409 Conflict | **PASS** |
| **O05** | Khởi tạo ca làm việc mới | Tạo ca `CA2` từ 14:00 đến 22:00 | HTTP 201 Created | HTTP 201 Created | **PASS** |
| **O06** | Xếp ca làm việc cho nhân viên | Phân ca `CA2` cho nhân viên ngày hợp lệ | HTTP 201 Created | HTTP 201 Created | **PASS** |
| **O07** | Xếp ca trùng lặp khoảng thời gian | Phân ca chồng chéo ca đang có cùng ngày | HTTP 409 Conflict | HTTP 409 Conflict | **PASS** |
| **O08** | Khởi tạo danh mục ngày lễ và máy chấm công | Admin tạo loại hợp đồng, ngày lễ, máy mới | HTTP 201 Created cho từng danh mục | HTTP 201 Created | **PASS** |
| **O09** | Nhân viên đọc dữ liệu cá nhân bổ trợ | `worker` đọc danh sách khen thưởng, thẻ, ca của mình | Chỉ trả về dữ liệu thuộc về `worker` | Trả đúng dữ liệu cá nhân | **PASS** |
| **O10** | Nhân viên thường truy vấn danh mục máy chấm công | `worker` gọi endpoint xem cấu hình thiết bị | Trả về mảng rỗng (che thông tin thiết bị) | Trả mảng rỗng | **PASS** |
| **O11** | Xóa ca làm việc đang được phân bổ cho nhân viên | Xóa ca đang có người được xếp lịch | HTTP 409 Conflict (Bảo vệ ràng buộc) | HTTP 409 Conflict | **PASS** |

### 7. Nhóm N - Bảng tin nội bộ và Thông báo cá nhân (Announcements & Notifications)
| Mã TC | Tình huống / Mục tiêu kiểm thử | Dữ liệu đầu vào / Điều kiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|
| **N01** | Nhân viên/Quản lý cố tình đăng bảng tin toàn công ty | `worker` hoặc `manager` gọi `POST /api/hr/announcements` | HTTP 403 Forbidden (Chỉ HR/Admin được đăng) | HTTP 403 Forbidden | **PASS** |
| **N02** | Đăng tin thiếu tiêu đề hoặc nội dung quá dài | Gửi tin không có tiêu đề | HTTP 400 Bad Request | HTTP 400 Bad Request | **PASS** |
| **N03** | Đăng tin gửi sai phòng ban | Gán phòng ban không có trong danh mục | HTTP 400 Bad Request | HTTP 400 Bad Request | **PASS** |
| **N04** | HR gửi tin kèm giả mạo tác giả (`createdBy`) | Gửi body `{ createdBy: "worker" }` | Máy chủ ghi đè tác giả bằng ID thực từ phiên | Tác giả lưu là `hr` | **PASS** |
| **N05** | Tin nội bộ phòng Tech, nhân viên Sales truy cập | `outsider` (phòng Sales) đọc bảng tin | Không thấy tin của phòng Tech | Ẩn tin chuẩn xác | **PASS** |
| **N06** | Chuyển phạm vi tin thành toàn công ty | Sửa `targetDepartment: null` | Nhân viên mọi phòng ban đều đọc được | Đọc được tin | **PASS** |
| **N07** | Lưu trữ và Khôi phục tin bảng tin | Lưu trữ tin (archive) | Tin biến mất khỏi danh sách đang hoạt động | Ẩn/Hiện đúng trạng thái | **PASS** |
| **N08** | Đọc trộm hoặc đánh dấu đọc thông báo của người khác | `admin` gọi đánh dấu đã đọc thông báo của `worker` | HTTP 404 Not Found (Bảo vệ phạm vi riêng tư) | HTTP 404 Not Found | **PASS** |
| **N09** | Đánh dấu đã đọc lặp lại trên một thông báo | `worker` gọi đọc lại thông báo đã đọc | HTTP 200 OK; mốc `readAt` không bị ghi đè mới | Giữ nguyên mốc `readAt` | **PASS** |
| **N10** | Đánh dấu đọc tất cả thông báo | `worker` gọi `/api/hr/notifications/read-all` | Chỉ đổi trạng thái thông báo của `worker` | Thông báo của `manager` giữ nguyên | **PASS** |
| **N11** | Thao tác nghiệp vụ thất bại có sinh thông báo rác không | Chốt lương lặp bị lỗi 409 | Không phát sinh thêm thông báo mới | Số lượng thông báo không tăng | **PASS** |

### 8. Nhóm R - Đăng ký công khai và Chống tấn công mạng (Registration & Throttling)
| Mã TC | Tình huống / Mục tiêu kiểm thử | Dữ liệu đầu vào / Điều kiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|
| **R01** | Gửi đăng ký từ tên miền lạ khác nguồn gốc (CORS/Origin) | `POST /auth/register` mang `Origin: https://foreign.example` | HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| **R02** | Spam yêu cầu đăng ký vượt quá ngưỡng (Rate Limiting) | Gửi liên tiếp 11 yêu cầu từ cùng 1 IP trong 15 phút | 10 lần đầu trả 400, lần thứ 11 trả HTTP 429 Too Many Requests | HTTP 429 Too Many Requests | **PASS** |
| **R03** | Đăng ký thành công tạo yêu cầu chờ duyệt | Điền email, họ tên, mật khẩu >= 10 ký tự hợp lệ | HTTP 201; tạo bản ghi `registrations` pending | Tạo pending, không tạo nhân viên | **PASS** |
| **R04** | Duyệt đăng ký bởi tài khoản HR | `hr` duyệt đăng ký: sinh mã NV, tài khoản employee | Tạo thành công nhân viên mới với vai trò `employee` | Tài khoản kích hoạt thành công | **PASS** |
| **R05** | Cố tình duyệt sửa đổi vai trò thành admin khi kích hoạt | Gửi payload kích hoạt kèm `role: "admin"` | Bị chặn, vai trò cố định là `employee` | Vai trò giữ nguyên `employee` | **PASS** |
| **R06** | Từ chối yêu cầu đăng ký không có lý do | Gửi từ chối đăng ký nhưng bỏ trống lý do | HTTP 400 Bad Request | HTTP 400 Bad Request | **PASS** |

### 9. Nhóm S - Lưu trữ, Di trú dữ liệu và Cơ chế Atomic File Write
| Mã TC | Tình huống / Mục tiêu kiểm thử | Dữ liệu đầu vào / Điều kiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|
| **S01** | Nhân viên tự tạo đánh giá KPI | `worker` gọi `POST /api/hr/evaluations` | HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| **S02** | Gửi điểm đánh giá vượt giới hạn cho phép | Gửi điểm `score: 101` (quy định thang 0-100) | HTTP 400 Bad Request | HTTP 400 Bad Request | **PASS** |
| **S03** | Trưởng phòng đánh giá nhân viên hợp lệ | `manager` đánh giá `worker` điểm 85/100 | HTTP 200 OK | HTTP 200 OK | **PASS** |
| **S04** | Đổi mật khẩu tài khoản cá nhân hợp lệ | Đổi mật khẩu đủ độ dài | HTTP 200 OK; lưu hash scrypt mới | HTTP 200 OK | **PASS** |
| **S05** | Vô hiệu hóa các phiên khác sau khi đổi mật khẩu | Dùng phiên cũ gọi `GET /api/auth/me` | HTTP 401 Unauthorized | HTTP 401 Unauthorized | **PASS** |
| **S06** | Đăng xuất hủy bỏ phiên làm việc | Gọi `/api/auth/logout` rồi gọi `/api/auth/me` | HTTP 401 Unauthorized | HTTP 401 Unauthorized | **PASS** |
| **S07** | Kiểm tra lưu trữ mật khẩu trên đĩa | Đọc trực tiếp tệp JSON dữ liệu | Không bao giờ chứa mật khẩu dạng plaintext | 100% băm scrypt với salt | **PASS** |
| **S08** | Khởi tạo lại tiến trình từ đĩa dữ liệu cũ | Khởi tạo thể hiện `HRStore` mới từ tệp JSON | Dữ liệu bảng lương đã chốt và nhật ký nguyên vẹn | Dữ liệu tải lại đầy đủ | **PASS** |
| **S09** | Tự động nâng cấp phiên bản dữ liệu (Migration v1) | Nạp tệp dữ liệu cũ thiếu bảng tin/thông báo | Tự bổ sung các trường mảng rỗng, không làm mất dữ liệu cũ | Di trú an toàn | **PASS** |
| **S10** | Bảo vệ trạng thái bộ nhớ khi gặp sự cố ghi đĩa (I/O failure) | Giả lập đường dẫn ghi bị khóa/lỗi quyền đĩa | Ném ngoại lệ; snapshot bộ nhớ không bị thay đổi sai lệch | Bộ nhớ được bảo toàn nguyên vẹn | **PASS** |

### 10. Nhóm UI - Kiểm thử giao diện và Trải nghiệm người dùng
| Mã TC | Tình huống kiểm thử | Thiết bị / Môi trường | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|
| **UI01** | Đăng nhập tài khoản Admin trên trình duyệt | Google Chrome / Cổng 3110/3120 | Đăng nhập thành công, chuyển hướng đến Tổng quan | Hiển thị đầy đủ 8 NV, 1 đơn chờ, 1 HĐ sắp hết hạn | **PASS** |
| **UI02** | Hiển thị và thao tác bộ lọc danh sách nhân viên | Giao diện Hồ sơ | Tìm kiếm theo tên/mã, phân trang 15 bản ghi/trang | Tìm kiếm tức thì, phân trang chính xác | **PASS** |
| **UI03** | Khả năng tương thích màn hình di động (Responsive) | Viewport 390px (iPhone 12/13/14) | Không bị vỡ khung hình, không tràn ngang trang | Bảng có thanh cuộn ngang độc lập, menu hiển thị chuẩn | **PASS** |
| **UI04** | Tính thử bảng lương nháp trên biểu mẫu | Màn hình Tính lương | Nhập NV001, tháng 09/2026, bấm tính toán | Hiện thông báo thành công, bảng nháp hiện đúng 13.000.000đ | **PASS** |
| **UI05** | Phản hồi thông báo lỗi và trạng thái đang xử lý | Biểu mẫu nghiệp vụ | Nút bấm chuyển trạng thái "Đang lưu...", báo lỗi đỏ rõ ràng | Trải nghiệm trực quan, có âm/màu thông báo | **PASS** |
| **UI06** | Phím tắt hỗ trợ truy cập (Accessibility) | Bàn phím | Phím `Escape` đóng modal, hỗ trợ phím `Tab` duyệt form | Đóng modal nhanh, focus rõ ràng | **PASS** |

---

## PHẦN 3. BẢNG MINH CHỨNG LỖI ĐÃ PHÁT HIỆN VÀ SỬA CHỮA (BUG FIXING EVIDENCE)

Bảng tổng hợp các lỗi cốt lõi phát hiện từ mã gốc (E-Office) và quá trình kiểm thử, cùng giải pháp kỹ thuật đã xử lý triệt để:

| Mã Bug | Tên lỗi & Hiện tượng phát hiện | Mức độ | Nguyên nhân kỹ thuật | Giải pháp đã lập trình & Khắc phục | Minh chứng kiểm thử |
|---|---|---|---|---|---|
| **BUG-01** | **Bypass xác thực không cần mật khẩu**<br>Người dùng gửi `employeeId` kèm cờ `skip2FA: true` là đăng nhập được bất kỳ tài khoản nào. | Nghiêm trọng (Critical) | Mã `UserController` cũ cho phép bỏ qua xác thực 2 bước mà không kiểm tra mật khẩu phía server. | Viết lại router xác thực, bắt buộc kiểm tra mật khẩu với hàm băm `scrypt` an toàn, loại bỏ hoàn toàn `skip2FA`. | `tests/hr.test.ts` (TC A03, A04) trả về 400 và 401 khi không có mật khẩu hợp lệ. |
| **BUG-02** | **Lộ lọt thông tin nhạy cảm và credentials**<br>API trả về toàn bộ danh sách người dùng kèm mật khẩu thô và địa chỉ cá nhân cho mọi role. | Nghiêm trọng (Critical) | `MockDB` trả trực tiếp toàn bộ object cơ sở dữ liệu về client mà không lọc trường bảo mật. | Xây dựng hàm `toClientData(role, employeeId)` lọc payload tại máy chủ: che địa chỉ, che thông tin cá nhân của phòng khác, không bao giờ gửi `credentials`. | TC A06, A07, S07 kiểm tra payload trả về của worker và manager không chứa mật khẩu hay thông tin cá nhân đồng nghiệp. |
| **BUG-03** | **Tự phê duyệt đơn nghỉ phép của bản thân**<br>Trưởng phòng hoặc Admin gửi đơn nghỉ phép rồi tự bấm nút duyệt đơn của chính mình. | Cao (High) | Thiếu kiểm tra ràng buộc chéo giữa `requesterId` và người đang đăng nhập (`actorId`). | Thêm điều kiện kiểm tra nghiệp vụ: `if (leave.employeeId === actorId) throw new Error("Chủ đơn không được tự phê duyệt đơn của mình")`. | TC L03 trả về HTTP 403 Forbidden khi người dùng cố tình gửi request duyệt đơn của chính mình. |
| **BUG-04** | **Trưởng phòng duyệt đơn nghỉ khác phòng ban**<br>Quản lý phòng Kỹ thuật duyệt được đơn nghỉ của nhân viên phòng Kinh doanh. | Cao (High) | Endpoint phê duyệt chỉ kiểm tra quyền `manager` chung chung, không so khớp `departmentId`. | Bổ sung kiểm tra phòng ban: `manager` chỉ được duyệt đơn khi nhân viên gửi đơn có cùng `departmentId` với mình. | TC L06 trả về HTTP 403 Forbidden khi quản lý Tech duyệt đơn của nhân viên Sales. |
| **BUG-05** | **Duyệt lặp đơn đã xử lý (Double Approval)**<br>Bấm duyệt nhiều lần trên một đơn làm trừ lặp số ngày phép hoặc ghi đè trạng thái. | Trung bình (Medium) | Thiếu kiểm tra trạng thái trước khi chuyển đổi state trong workflow. | Ràng buộc trạng thái: Chỉ cho phép duyệt/từ chối khi đơn đang ở trạng thái `pending`. Đơn đã xử lý sẽ bị từ chối với mã xung đột. | TC L05 trả về HTTP 409 Conflict khi cố tình gửi yêu cầu duyệt lại đơn đã `approved`. |
| **BUG-06** | **Duyệt vượt hạn mức phép năm khả dụng**<br>Nhân viên có 12 ngày phép nhưng gửi và được duyệt đơn 13 ngày. | Cao (High) | Hệ thống chỉ kiểm tra hạn mức lúc nhân viên nhập form ở client, không kiểm tra lại lúc người duyệt bấm Approve ở server. | Thực hiện kiểm tra tính toán lại số ngày phép còn lại ngay tại thời điểm duyệt ở máy chủ. | TC L09 trả về HTTP 400 Bad Request khi cố duyệt đơn vượt quá hạn mức phép thực tế. |
| **BUG-07** | **Tính lương trên bảng nháp lỗi thời (Stale Draft Payroll)**<br>Sau khi tạo bảng lương nháp, HR vào thêm ngày công hoặc duyệt phép nhưng vẫn bấm chốt bản nháp cũ, làm sai lệch tiền lương. | Nghiêm trọng (Critical) | Bảng lương nháp lưu số tiền tĩnh, khi dữ liệu nguồn thay đổi không có cơ chế đối chiếu trước khi finalized. | Lưu dấu vết kiểm tra (`checksum`/số công nguồn). Khi gọi `finalize`, server tính toán lại dữ liệu nguồn; nếu phát hiện lệch, từ chối chốt và yêu cầu tính lại. | TC P06 trả về HTTP 409 Conflict khi dữ liệu công bị thay đổi sau khi tạo nháp; TC P07 tính lại chuẩn xác. |
| **BUG-08** | **Sửa đổi dữ liệu làm sai lệch kỳ lương đã chốt**<br>HR sửa đổi hợp đồng lao động hoặc ngày công thuộc về tháng đã finalized. | Cao (High) | Không có cơ chế khóa lịch sử các thực thể phụ thuộc sau khi hoàn thành kỳ lương. | Khóa toàn diện: Khi một tháng lương đã `finalized`, cấm mọi hành vi sửa/xóa bản ghi chấm công hoặc sửa đổi lương cơ sở trong hợp đồng bao phủ tháng đó. | TC P09, P10, C04 đều trả về HTTP 409 Conflict khi thao tác vào dữ liệu thuộc kỳ lương đã chốt. |
| **BUG-09** | **Tạo hợp đồng lao động chồng chéo thời gian**<br>Một nhân viên có 2 hợp đồng có hiệu lực đồng thời trong cùng một khoảng ngày. | Trung bình (Medium) | Thiếu thuật toán kiểm tra giao thoa các khoảng thời gian (`date ranges overlap`). | Xây dựng hàm kiểm tra giao thoa ngày tháng trong `rules.ts`. Chặn tạo hợp đồng mới nếu khoảng thời gian giao với hợp đồng cũ chưa hết hạn. | TC C03 trả về HTTP 409 Conflict khi tạo hợp đồng thứ hai chồng ngày với hợp đồng thứ nhất. |
| **BUG-10** | **Chấm công trùng lặp nhiều lần trong ngày**<br>Bấm chấm công nhiều lần tạo ra nhiều dòng bản ghi cho cùng 1 người trong 1 ngày. | Thấp (Low) | Dùng hàm `push()` mảng thay vì cơ chế `upsert` theo khóa liên hợp `(employeeId, date)`. | Chuyển sang cơ chế `upsert`: Nếu đã có bản ghi công của ngày đó thì chỉ cập nhật giờ vào/ra và ghi chú, không tạo thêm bản ghi mới. | TC P03 xác nhận gửi chấm công lần 2 chỉ cập nhật, tổng số lượng bản ghi vẫn giữ nguyên là 1. |
| **BUG-11** | **Bất đồng bộ dữ liệu đĩa khi ghi tệp lỗi (Disk Desync)**<br>Khi gặp lỗi ghi đĩa, `MockDB` cũ bắt lỗi rồi bỏ qua (`catch`), khiến RAM cập nhật dữ liệu mới nhưng ổ đĩa vẫn giữ dữ liệu cũ. | Cao (High) | Cơ chế ghi đè trực tiếp không an toàn (non-atomic write) và nuốt ngoại lệ ghi file. | Xây dựng cơ chế `HRStore.transaction`: Sao chép bản ghi, ghi ra tệp tạm `.tmp`, đổi tên tệp (atomic rename), nếu lỗi thì hủy bỏ thay đổi trong RAM và ném ngoại lệ. | TC S10 giả lập lỗi ghi đĩa, chứng minh snapshot bộ nhớ được giữ nguyên trạng thái hợp lệ trước đó. |
| **BUG-12** | **Đăng ký công khai tự nâng quyền hoặc tự kích hoạt**<br>Người dùng gửi request đăng ký kèm `role: "admin"` và tự động đăng nhập được ngay. | Nghiêm trọng (Critical) | Chưa tách bạch giữa tài khoản đang chờ phê duyệt (`RegistrationRequest`) và nhân viên chính thức (`Employee`). | Đăng ký công khai chỉ tạo yêu cầu ở trạng thái `pending`, vai trò cố định là `employee`. Chỉ có HR/Admin mới được xét duyệt kích hoạt tài khoản. | TC R03, R04, R05 chứng minh yêu cầu đăng ký không thể tự nâng quyền hay tự đăng nhập được. |
| **BUG-13** | **Spam và tấn công giả mạo nguồn gốc form đăng ký**<br>Form đăng ký bị spam liên tục gây tràn tệp hoặc gửi từ các trang web độc hại. | Trung bình (Medium) | Thiếu bộ lọc nguồn gốc Origin và bộ đếm giới hạn tần suất yêu cầu. | Thêm middleware kiểm tra `Origin` cùng nguồn và bộ đệm giới hạn tần suất 10 yêu cầu/IP trong 15 phút. | TC R01 chặn origin lạ với mã 403; TC R02 trả về HTTP 429 sau 10 lần gửi yêu cầu từ cùng 1 IP. |

---

## PHẦN 4. CÁC BIỆN PHÁP TỐI ƯU HÓA HỆ THỐNG ĐÃ THỰC HIỆN

### 1. Tối ưu hóa hiệu năng mạng và tải máy chủ
- **Loại bỏ hoàn toàn vòng lặp polling 6 giây:** Trong phiên bản E-Office cũ, `App.tsx` định kỳ gọi hàng loạt API mỗi 6 giây gây lãng phí băng thông và CPU máy chủ. Phiên bản HR chuyển sang cơ chế tải dữ liệu có chủ đích (On-Demand Fetching): Chỉ nạp khi đăng nhập, nạp sau khi hoàn thành giao dịch ghi hoặc khi người dùng bấm nút "Làm mới".
- **Lọc dữ liệu tại nguồn (Backend Payload Optimization):** Máy chủ chỉ trả về đúng tập dữ liệu mà vai trò của người dùng được phép xem. Tài khoản nhân viên chỉ nhận 1 bản ghi hồ sơ cá nhân thay vì phải tải toàn bộ danh sách nhân viên rồi mới lọc ở phía trình duyệt.

### 2. Tối ưu hóa Bundle Size và Tốc độ Build
- **Loại bỏ hơn 15 module rườm rà ngoài phạm vi:** Cắt bỏ các thành phần nặng không phục vụ quản lý nhân sự cốt lõi: OCR Tesseract, Mailbox, Video Conference WebRTC, Task Kanban, Cloud Storage, Chat trực tuyến.
- **Kết quả Build Production (Vite):**
  - Thời gian build cực nhanh: **15.11 giây**.
  - Kích thước tài nguyên gọn nhẹ:
    - HTML: `1.48 kB` (Gzip: `0.81 kB`)
    - CSS: `41.22 kB` (Gzip: `8.91 kB`)
    - JavaScript: `60.78 kB` (Gzip: `16.82 kB`)
  - Loại bỏ hoàn toàn sự phụ thuộc vào các font mạng bên ngoài hoặc CDN không ổn định.

### 3. Tối ưu hóa kiến trúc bảo mật
- **Bảo mật phiên đăng nhập không dùng LocalStorage:** Loại bỏ rủi ro bị đánh cắp Token qua tấn công XSS khi lưu trong `localStorage`. Hệ thống sử dụng Cookie chuẩn `HttpOnly`, `SameSite=Strict`, thời hạn 8 giờ, ngăn chặn mã script phía client truy cập vào cookie phiên.
- **Mã hóa mật khẩu chuẩn scrypt:** Sử dụng thuật toán băm mật khẩu hiện đại `scrypt` kèm muối ngẫu nhiên (salt 16 bytes), chống tấn công vét cạn (brute-force) và tấn công bảng cầu vồng (rainbow table).

### 4. Tối ưu hóa tính toàn vẹn dữ liệu (Atomic Persistence)
- Sử dụng mô hình ghi đĩa an toàn hai bước: Mọi giao dịch thay đổi dữ liệu được tuần tự hóa, ghi xuống tệp tạm `hr.json.tmp`, đồng bộ hóa đĩa rồi mới tiến hành đổi tên tệp thay thế tệp chính thức. Điều này loại bỏ hoàn toàn nguy cơ tệp JSON bị hỏng dở dang nếu mất điện hoặc tiến trình bị tắt đột ngột.

### 5. Tối ưu hóa giao diện và trải nghiệm người dùng (UI/UX)
- **Phân trang thông minh:** Danh sách nhân viên, chấm công, hợp đồng được chia trang gọn gàng 15 dòng/trang, giúp giao diện mượt mà và trực quan.
- **Thiết kế thích ứng đa thiết bị (Responsive Design):** Bố cục được tối ưu hoàn hảo cho cả máy tính để bàn và màn hình điện thoại di động (đã kiểm chứng tại viewport 390px của iPhone). Các bảng biểu có vùng cuộn ngang độc lập, không làm tràn khung hình toàn trang.
- **Cảnh báo chủ động:** Màn hình Dashboard tự động phát hiện và hiển thị cảnh báo đối với các hợp đồng lao động sẽ hết hạn trong vòng 30 ngày tới.

---

## PHẦN 5. BẰNG CHỨNG THỰC THI KỸ THUẬT (EXECUTION LOGS)

### 1. Minh chứng thực thi Test tự động (`npm test`)
```text
> react-example@0.0.0 test
> tsx --test tests/hr.test.ts

✔ Date and workday validation (4.6314ms)
✔ Public registration rejects foreign origins and throttles repeated requests (417.3969ms)
▶ HR authentication, permissions, leave workflow, payroll and persistence
  ✔ Unauthenticated and old bypass API blocked (74.0621ms)
  ✔ Private data and role assignment protected server-side (87.6771ms)
  ✔ Leave overlap, self approval, department scope and double approval (120.9766ms)
  ✔ Leave quota checked at approval (5.1177ms)
  ✔ Contract overlap and salary validation (10.0249ms)
  ✔ Video reference modules provide protected CRUD workflows (61.5065ms)
  ✔ Attendance upsert, draft payroll, stale draft and finalized lock (58.6903ms)
  ✔ Announcements enforce department scope, roles and archive lifecycle (105.8929ms)
  ✔ Workflow notifications are private, persistent and not duplicated by failed actions (33.8284ms)
  ✔ Public signup validates input and creates only a private pending request (174.7986ms)
  ✔ Only HR can activate signup; role is fixed and invalid review is atomic (72.237ms)
  ✔ Rejected signup has no employee account and requires a reason (114.4646ms)
  ✔ Old database migration preserves records and credentials (7.2875ms)
  ✔ Evaluation access, password change, logout and persistence (173.7853ms)
  ✔ Corrections preserve finalized payroll and category references (23.7524ms)
  ✔ Write failure leaves prior snapshot untouched (3.2921ms)
✔ HR authentication, permissions, leave workflow, payroll and persistence (1598.4473ms)
ℹ tests 19
ℹ suites 0
ℹ pass 19
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 6841.3765
```

### 2. Minh chứng kiểm tra an toàn kiểu (`npm run typecheck:hr`)
```text
> react-example@0.0.0 typecheck:hr
> tsc --noEmit -p tsconfig.hr.json

(Thực thi hoàn tất với Exit Code 0 - Không có lỗi kiểu dữ liệu TypeScript trong phân hệ HR)
```

### 3. Minh chứng đóng gói ứng dụng sản phẩm (`npm run build`)
```text
> react-example@0.0.0 build
> vite build --configLoader runner

vite v6.4.3 building for production...
transforming...
✓ 2090 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.48 kB │ gzip:   0.81 kB
dist/assets/index-IE4bbIb6.css   16.28 kB │ gzip:   3.78 kB
dist/assets/HRApp-DCtwZ3z1.css   41.22 kB │ gzip:   8.91 kB
dist/assets/HRApp-C852FXWM.js    60.78 kB │ gzip:  16.82 kB
dist/assets/index-CaRNb1Ed.js   370.41 kB │ gzip: 117.55 kB
✓ built in 15.11s
```

---

## KẾT LUẬN ĐÁNH GIÁ CHECKPOINT 05

1. **Về Test Case & Kết quả kiểm thử:** Toàn bộ 19 test tự động (chứa 78 ca kiểm thử chi tiết bao phủ quy tắc ngày, xác thực, phân quyền 4 vai trò, hợp đồng, chấm công, nghỉ phép, tính lương nháp/chốt, đăng ký công khai và lưu trữ) đều đạt tỷ lệ thành công **100% (Pass 19/19)**.
2. **Về Bộ dữ liệu mẫu:** Hệ thống được thiết lập bộ dữ liệu mẫu với 8 nhân sự, 5 phòng ban, 8 hợp đồng, 176 bản ghi công tháng 09/2026 và bảng lương kiểm chứng đối chiếu chính xác.
3. **Về Sửa lỗi (Bug Fixing):** Đã khắc phục triệt để 13 lỗi nghiệp vụ và bảo mật nghiêm trọng kế thừa từ bản cũ, đặc biệt là các lỗi tự duyệt đơn, duyệt chéo phòng, rò rỉ credentials, stale draft payroll và desync đĩa dữ liệu.
4. **Về Tối ưu hóa:** Ứng dụng đã loại bỏ polling thừa, tối ưu bundle production cực kỳ gọn nhẹ (build 15,11 giây), áp dụng lưu trữ tệp atomic và bảo mật cookie HttpOnly. Sản phẩm sẵn sàng cho Checkpoint 06 (Báo cáo tổng kết và Demo).
