import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { HRStore, passwordHash } from "../src/backend/hr/store";
import {
  ensure,
  date,
  today,
  workdays,
  monthBounds,
} from "../src/backend/hr/rules";

const store = new HRStore();
const mode = process.argv[2] || "admin";
if (mode === "admin") {
  const email = process.env.HR_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.HR_ADMIN_PASSWORD;
  ensure(
    email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    "Đặt HR_ADMIN_EMAIL trong .env.",
  );
  ensure(
    password && password.length >= 10,
    "Đặt HR_ADMIN_PASSWORD ít nhất 10 ký tự trong .env.",
  );
  store.transaction((db) => {
    ensure(
      !db.employees.some((x) => x.role === "admin" && x.status !== "inactive"),
      "Đã có quản trị viên. Công cụ không ghi đè tài khoản.",
    );
    ensure(
      !db.employees.some((x) => x.id === "HRADMIN" || x.email === email),
      "Mã/email quản trị đã tồn tại.",
    );
    db.employees.push({
      id: "HRADMIN",
      name: "Quản trị nhân sự",
      email,
      phone: "",
      departmentId: "Admin",
      positionId: "lead",
      role: "admin",
      status: "active",
      startDate: today(),
      birthday: "",
      address: "",
      annualLeave: 12,
    });
    db.credentials.HRADMIN = passwordHash(password);
  });
  console.log(
    "Đã tạo tài khoản HRADMIN. Xóa HR_ADMIN_PASSWORD khỏi .env sau khi thiết lập.",
  );
} else if (mode === "import") {
  // Explicit import only: no guessed start dates or automatic account activation.
  const source = process.argv[3] || path.join("data", "db.json");
  const startDate = date(
    process.env.HR_IMPORT_START_DATE,
    "HR_IMPORT_START_DATE",
  );
  const legacy = JSON.parse(fs.readFileSync(source, "utf8"));
  let added = 0,
    skipped = 0;
  store.transaction((db) => {
    for (const row of legacy.users || []) {
      const id = String(row.id || "");
      const email = String(row.email || "")
        .trim()
        .toLowerCase();
      if (
        !/^[a-zA-Z0-9_-]{1,40}$/.test(id) ||
        !row.name ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        db.employees.some(
          (x) => x.id.toLowerCase() === id.toLowerCase() || x.email === email,
        )
      ) {
        skipped++;
        continue;
      }
      const departmentId = String(row.department || "HR");
      if (!db.departments.some((x) => x.id === departmentId))
        db.departments.push({ id: departmentId, name: departmentId });
      db.employees.push({
        id,
        name: String(row.name),
        email,
        phone: String(row.phoneNumber || ""),
        departmentId,
        positionId: "staff",
        role: "employee",
        status: "inactive",
        startDate,
        birthday: "",
        address: String(row.address || ""),
        annualLeave: 12,
      });
      // No credential is imported: administrator verifies profile and sets a password.
      added++;
    }
  });
  console.log(
    `Đã nhập ${added} hồ sơ ở trạng thái chưa kích hoạt; bỏ qua ${skipped} hồ sơ trùng/không hợp lệ. Kiểm tra ngày vào làm, chức vụ, vai trò trước khi kích hoạt.`,
  );
} else if (mode === "demo") {
  ensure(
    process.env.HR_DATA_FILE,
    "Demo yêu cầu HR_DATA_FILE riêng, ví dụ work/demo/hr.json.",
  );
  ensure(
    !fs.existsSync(store.filename),
    "Tệp đích đã tồn tại; demo không ghi đè dữ liệu.",
  );
  const password =
    process.env.HR_DEMO_PASSWORD || randomBytes(16).toString("base64url");
  ensure(password.length >= 10, "Mật khẩu demo cần ít nhất 10 ký tự.");
  const now = today();
  const prior = new Date(`${now.slice(0, 7)}-01T00:00:00Z`);
  prior.setUTCMonth(prior.getUTCMonth() - 1);
  const period = prior.toISOString().slice(0, 7);
  const [start, end] = monthBounds(period);
  store.transaction((db) => {
    const people = [
      ["ADMIN", "Nguyễn Minh Anh", "admin", "Admin", "lead"],
      ["HR01", "Trần Thu Hà", "hr", "HR", "staff"],
      ["QL01", "Lê Hoàng Nam", "manager", "Tech", "lead"],
      ["NV001", "Phạm Ngọc Linh", "employee", "Tech", "staff"],
      ["NV002", "Đỗ Quang Huy", "employee", "Tech", "staff"],
      ["NV003", "Vũ Thảo Vy", "employee", "Sales", "staff"],
      ["NV004", "Bùi Đức Long", "employee", "Finance", "staff"],
      ["NV005", "Hoàng Khánh An", "employee", "Sales", "staff"],
    ];
    for (const [id, name, role, departmentId, positionId] of people) {
      db.employees.push({
        id,
        name,
        email: `${id.toLowerCase()}@example.test`,
        phone: "",
        departmentId,
        positionId,
        role: role as any,
        status: id === "NV005" ? "probation" : "active",
        startDate: `${Number(now.slice(0, 4)) - 1}-01-01`,
        birthday: "",
        address: "",
        annualLeave: 12,
      });
      db.credentials[id] = passwordHash(password);
      const expiry = new Date(`${now}T00:00:00Z`);
      expiry.setUTCDate(expiry.getUTCDate() + 20);
      db.contracts.push({
        id: randomUUID(),
        employeeId: id,
        code: `HĐLĐ-${id}`,
        type: "fixed",
        startDate: `${Number(now.slice(0, 4)) - 1}-01-01`,
        endDate:
          id === "NV001"
            ? expiry.toISOString().slice(0, 10)
            : `${Number(now.slice(0, 4)) + 1}-12-31`,
        salary: id.startsWith("NV") ? 12000000 : 18000000,
        allowance: 1000000,
      });
      const cursor = new Date(`${start}T00:00:00Z`);
      while (cursor.toISOString().slice(0, 10) <= end) {
        const value = cursor.toISOString().slice(0, 10);
        if (workdays(value, value))
          db.attendance.push({
            id: randomUUID(),
            employeeId: id,
            date: value,
            checkIn: "08:00",
            checkOut: "17:00",
            note: "Dữ liệu minh họa",
          });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }
    const leaveDate = new Date(`${now}T00:00:00Z`);
    leaveDate.setUTCDate(leaveDate.getUTCDate() + 3);
    while ([0, 6].includes(leaveDate.getUTCDay()))
      leaveDate.setUTCDate(leaveDate.getUTCDate() + 1);
    db.leaves.push({
      id: randomUUID(),
      employeeId: "NV001",
      startDate: leaveDate.toISOString().slice(0, 10),
      endDate: leaveDate.toISOString().slice(0, 10),
      days: 1,
      type: "annual",
      reason: "Việc gia đình — dữ liệu minh họa",
      status: "pending",
    });
    db.evaluations.push({
      id: randomUUID(),
      employeeId: "NV001",
      month: period,
      score: 88,
      note: "Hoàn thành mục tiêu tháng. Tiếp tục cải thiện kỹ năng báo cáo.",
      reviewerId: "QL01",
    });
  });
  if (!process.env.HR_DEMO_PASSWORD) {
    const credentialsFile = path.join(
      path.dirname(store.filename),
      "demo-access.txt",
    );
    fs.writeFileSync(
      credentialsFile,
      `DỮ LIỆU DEMO, KHÔNG DÙNG CHO VẬN HÀNH\nTài khoản: ADMIN / HR01 / QL01 / NV001\nMật khẩu chung: ${password}\n`,
      { mode: 0o600 },
    );
    console.log(
      `Đã tạo dữ liệu demo và thông tin truy cập tại ${credentialsFile}.`,
    );
  } else console.log("Đã tạo demo bằng mật khẩu được cung cấp.");
} else throw new Error("Chế độ không hợp lệ: admin | import | demo");
