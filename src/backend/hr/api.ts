import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { HRStore, passwordHash, verifyPassword, type Database } from "./store";
import {
  ensure,
  text,
  number,
  choice,
  date,
  month,
  monthBounds,
  workdays,
  today,
  ValidationError,
} from "./rules";
import type { Employee, HRData, HRNotification } from "../../hr/types";

export function createHRRouter(store = new HRStore()) {
  const router = Router();
  const sessions = new Map<string, { employeeId: string; expires: number }>();
  const attempts = new Map<string, { count: number; reset: number }>();
  const registrationAttempts = new Map<string, { count: number; reset: number }>();
  const cleanup = setInterval(() => {
    for (const [key, value] of sessions)
      if (value.expires < Date.now()) sessions.delete(key);
    for (const [key, value] of attempts)
      if (value.reset < Date.now()) attempts.delete(key);
    for (const [key, value] of registrationAttempts)
      if (value.reset < Date.now()) registrationAttempts.delete(key);
  }, 60000);
  cleanup.unref();
  const tokenKey = (token: string) =>
    createHash("sha256").update(token).digest("hex");
  const cookie = (req: Request) =>
    (req.headers.cookie || "")
      .split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("hr_session="))
      ?.slice(11) || "";
  const privileged = (user: Employee) => ["admin", "hr"].includes(user.role);
  const hr = (user: Employee) =>
    ensure(
      privileged(user),
      "Chỉ nhân sự hoặc quản trị viên được thao tác.",
      403,
    );
  const audit = (
    db: Database,
    actor: Employee,
    action: string,
    targetId: string,
  ) =>
    db.audits.push({
      id: randomUUID(),
      actorId: actor.id,
      action,
      targetId,
      at: new Date().toISOString(),
    });
  const employee = (db: Database, id: string) => {
    const row = db.employees.find((x) => x.id === id);
    ensure(row, "Không tìm thấy nhân viên.", 404);
    return row;
  };
  const current = (res: Response): Employee => res.locals.user;
  const notify = (db: Database, employeeId: string, title: string, message: string, target: HRNotification['target']) => {
    db.notifications.push({ id: randomUUID(), employeeId, title, message, target, createdAt: new Date().toISOString() });
  };
  const sessionCookie = (res: Response, value: string, maxAge: number) =>
    res.cookie("hr_session", value, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.COOKIE_SECURE === "true",
      path: "/api",
      maxAge,
    });
  router.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      // JSON-only writes + same-origin checks protect cookie sessions against CSRF.
      if (!req.is("application/json"))
        return res.status(415).json({ error: "Yêu cầu JSON." });
      const origin = req.headers.origin;
      if (origin) {
        try {
          if (new URL(origin).host !== req.get("host"))
            return res
              .status(403)
              .json({ error: "Nguồn yêu cầu không hợp lệ." });
        } catch {
          return res.status(403).json({ error: "Nguồn yêu cầu không hợp lệ." });
        }
      }
    }
    next();
  });
  router.get("/health", (_req, res) => res.json({ status: "ok" }));
  router.post('/auth/register', (req, res) => {
    const key = req.ip || 'local';
    const now = Date.now();
    let attempt = registrationAttempts.get(key);
    if (!attempt || attempt.reset <= now) {
      attempt = { count: 0, reset: now + 15 * 60000 };
      registrationAttempts.set(key, attempt);
    }
    ensure(attempt.count < 10, 'Quá nhiều lần đăng ký. Vui lòng thử lại sau 15 phút.', 429);
    attempt.count++;
    ensure(req.body.role === undefined || req.body.role === 'employee', 'Không thể tự cấp quyền quản lý.', 400);
    const name = text(req.body.name, 'Họ tên', true, 120);
    const email = text(req.body.email, 'Email', true, 200).toLowerCase();
    ensure(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Email không hợp lệ.');
    const password = text(req.body.password, 'Mật khẩu', true, 200);
    ensure(password.length >= 10, 'Mật khẩu cần ít nhất 10 ký tự.');
    store.transaction(db => {
      ensure(!db.employees.some(x => x.email.toLowerCase() === email) &&
        !db.registrations.some(x => x.email === email), 'Email đã được sử dụng. Đăng nhập hoặc liên hệ quản trị viên.', 409);
      ensure(db.registrations.filter(x => x.status === 'pending').length < 500,
        'Đăng ký đang tạm dừng. Vui lòng liên hệ nhân sự.', 503);
      db.registrations.push({ id: randomUUID(), name, email, passwordHash: passwordHash(password),
        status: 'pending', createdAt: new Date().toISOString() });
    });
    // Public signup never grants a session or access to internal company data.
    res.status(201).json({ success: true, status: 'pending', message: 'Đăng ký thành công. Tài khoản đang chờ nhân sự kích hoạt.' });
  });
  router.post("/auth/login", (req, res) => {
    const key = req.ip || "local";
    const now = Date.now();
    let attempt = attempts.get(key);
    if (!attempt || attempt.reset <= now) {
      attempt = { count: 0, reset: now + 15 * 60000 };
      attempts.set(key, attempt);
    }
    ensure(
      attempt.count < 20,
      "Quá nhiều lần đăng nhập. Vui lòng thử lại sau 15 phút.",
      429,
    );
    attempt.count++;
    const identifier = text(
      req.body.identifier,
      "Email hoặc mã nhân viên",
    ).toLowerCase();
    const password = text(req.body.password, "Mật khẩu", true, 200);
    const db = store.read();
    const user = db.employees.find(
      (x) =>
        x.id.toLowerCase() === identifier ||
        x.email.toLowerCase() === identifier,
    );
    if (!user) {
      const signup = db.registrations.find(x => x.email === identifier && x.status !== 'approved');
      if (signup && verifyPassword(password, signup.passwordHash)) {
        attempts.delete(key);
        throw new ValidationError(signup.status === 'pending'
          ? 'Tài khoản đang chờ nhân sự kích hoạt. Bạn chưa thể truy cập dữ liệu nội bộ.'
          : 'Đăng ký chưa được chấp thuận. Vui lòng liên hệ nhân sự.', 403);
      }
    }
    ensure(
      user &&
        user.status !== "inactive" &&
        db.credentials[user.id] &&
        verifyPassword(password, db.credentials[user.id]),
      "Thông tin đăng nhập không chính xác.",
      401,
    );
    store.transaction((draft) => audit(draft, user, "Đăng nhập", user.id));
    attempts.delete(key);
    sessions.delete(tokenKey(cookie(req)));
    const token = randomBytes(32).toString("hex");
    sessions.set(tokenKey(token), {
      employeeId: user.id,
      expires: now + 8 * 3600000,
    });
    sessionCookie(res, token, 8 * 3600000);
    res.json({ user });
  });
  router.post("/auth/logout", (req, res) => {
    sessions.delete(tokenKey(cookie(req)));
    sessionCookie(res, "", 0);
    res.json({ success: true });
  });
  router.use((req, res, next) => {
    const session = sessions.get(tokenKey(cookie(req)));
    if (!session || session.expires <= Date.now())
      return res.status(401).json({ error: "Vui lòng đăng nhập lại." });
    const user = store
      .read()
      .employees.find(
        (x) => x.id === session.employeeId && x.status !== "inactive",
      );
    if (!user)
      return res.status(401).json({ error: "Tài khoản đã ngừng hoạt động." });
    res.locals.user = user;
    next();
  });
  router.get("/auth/me", (_req, res) => res.json({ user: current(res) }));
  router.post("/auth/password", (req, res) => {
    const user = current(res);
    const db = store.read();
    ensure(
      verifyPassword(
        text(req.body.currentPassword, "Mật khẩu hiện tại"),
        db.credentials[user.id],
      ),
      "Mật khẩu hiện tại không đúng.",
      400,
    );
    const password = text(req.body.password, "Mật khẩu mới");
    ensure(password.length >= 10, "Mật khẩu cần ít nhất 10 ký tự.");
    store.transaction((d) => {
      d.credentials[user.id] = passwordHash(password);
      audit(d, user, "Đổi mật khẩu", user.id);
    });
    for (const [key, session] of sessions)
      if (session.employeeId === user.id && key !== tokenKey(cookie(req)))
        sessions.delete(key);
    res.json({ success: true });
  });
  router.get("/hr/data", (_req, res) => {
    const db = store.read();
    const user = current(res);
    const isHR = privileged(user);
    const visible = (id: string) => isHR || id === user.id;
    const team = (id: string) =>
      visible(id) ||
      (user.role === "manager" &&
        db.employees.some(
          (e) => e.id === id && e.departmentId === user.departmentId,
        ));
    const result: HRData = {
      registrations: isHR ? db.registrations.map(({ passwordHash: _hash, ...row }) => row) : [],
      announcements: db.announcements
        .filter(x => isHR || (!x.archived && (!x.departmentId || x.departmentId === user.departmentId)))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt)),
      notifications: db.notifications.filter(x => x.employeeId === user.id).reverse(),
      employees: db.employees.filter((e) => visible(e.id)),
      departments: db.departments,
      positions: db.positions,
      contracts: db.contracts.filter((x) => visible(x.employeeId)),
      attendance: db.attendance.filter((x) => visible(x.employeeId)),
      leaves: db.leaves.filter((x) => team(x.employeeId)),
      payroll: db.payroll.filter(
        (x) => isHR || (x.employeeId === user.id && x.status === "finalized"),
      ),
      evaluations: db.evaluations.filter((x) => team(x.employeeId)),
      audits: isHR ? db.audits.slice(-200).reverse() : [],
      recognitions: db.recognitions.filter((x) => team(x.employeeId)),
      timeCards: db.timeCards.filter((x) => visible(x.employeeId)),
      shifts: db.shifts,
      shiftAssignments: db.shiftAssignments.filter((x) => team(x.employeeId)),
      contractTypes: db.contractTypes,
      holidays: db.holidays,
      attendanceMachines: isHR ? db.attendanceMachines : [],
    };
    // Managers receive only a directory for their team, never addresses or credentials.
    if (user.role === "manager")
      result.employees.push(
        ...db.employees
          .filter(
            (e) => e.id !== user.id && e.departmentId === user.departmentId,
          )
          .map((e) => ({
            ...e,
            email: "",
            phone: "",
            address: "",
            birthday: "",
          })),
      );
    res.json(result);
  });
  router.post('/hr/registrations/:id/review', (req, res) => {
    const user = current(res); hr(user);
    store.transaction(db => {
      const row = db.registrations.find(x => x.id === req.params.id);
      ensure(row, 'Không tìm thấy đăng ký.', 404);
      ensure(row.status === 'pending', 'Đăng ký đã được xử lý.', 409);
      const status = choice(req.body.status, ['approved', 'rejected'] as const, 'Kết quả');
      if (status === 'approved') {
        const id = text(req.body.employeeId, 'Mã nhân viên', true, 40);
        ensure(/^[a-zA-Z0-9_-]+$/.test(id), 'Mã nhân viên chỉ dùng chữ, số, dấu - và _.');
        ensure(!db.employees.some(x => x.id.toLowerCase() === id.toLowerCase() || x.email.toLowerCase() === row.email),
          'Mã nhân viên hoặc email đã tồn tại.', 409);
        const departmentId = text(req.body.departmentId, 'Phòng ban');
        const positionId = text(req.body.positionId, 'Chức vụ');
        ensure(db.departments.some(x => x.id === departmentId), 'Phòng ban không tồn tại.');
        ensure(db.positions.some(x => x.id === positionId), 'Chức vụ không tồn tại.');
        db.employees.push({ id, name: row.name, email: row.email, phone: '', address: '', birthday: '',
          role: 'employee', status: 'probation', departmentId, positionId,
          startDate: date(req.body.startDate, 'Ngày vào làm'), annualLeave: number(req.body.annualLeave, 'Phép năm', 0, 60) });
        db.credentials[id] = row.passwordHash;
        row.employeeId = id;
        audit(db, user, 'Kích hoạt đăng ký nhân viên', id);
      } else {
        row.reviewNote = text(req.body.reviewNote, 'Lý do từ chối', true, 500);
        audit(db, user, 'Từ chối đăng ký', row.id);
      }
      row.status = status; row.reviewedAt = new Date().toISOString(); row.reviewedBy = user.id;
    });
    res.json({ success: true });
  });
  function employeeFields(body: any, db: Database) {
    const departmentId = text(body.departmentId, "Phòng ban");
    const positionId = text(body.positionId, "Chức vụ");
    ensure(
      db.departments.some((x) => x.id === departmentId),
      "Phòng ban không tồn tại.",
    );
    ensure(
      db.positions.some((x) => x.id === positionId),
      "Chức vụ không tồn tại.",
    );
    const email = text(body.email, "Email").toLowerCase();
    ensure(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "Email không hợp lệ.");
    const birthday = body.birthday ? date(body.birthday, "Ngày sinh") : "";
    ensure(!birthday || birthday < today(), "Ngày sinh phải trước hôm nay.");
    return {
      name: text(body.name, "Họ tên"),
      email,
      phone: text(body.phone ?? "", "Điện thoại", false, 30),
      address: text(body.address ?? "", "Địa chỉ", false, 500),
      birthday,
      departmentId,
      positionId,
      role: choice(
        body.role,
        ["admin", "hr", "manager", "employee"] as const,
        "Vai trò",
      ),
      status: choice(
        body.status,
        ["probation", "active", "inactive"] as const,
        "Trạng thái",
      ),
      startDate: date(body.startDate, "Ngày vào làm"),
      annualLeave: number(body.annualLeave, "Phép năm", 0, 60),
    };
  }
  router.post("/hr/employees", (req, res) => {
    const user = current(res);
    hr(user);
    const id = text(req.body.id, "Mã nhân viên", true, 40);
    ensure(
      /^[a-zA-Z0-9_-]+$/.test(id),
      "Mã nhân viên chỉ dùng chữ, số, dấu - và _.",
    );
    const password = text(req.body.password, "Mật khẩu");
    ensure(password.length >= 10, "Mật khẩu cần ít nhất 10 ký tự.");
    store.transaction((db) => {
      const fields = employeeFields(req.body, db);
      ensure(
        user.role === "admin" || fields.role === "employee",
        "Chỉ quản trị viên được cấp quyền quản lý.",
        403,
      );
      ensure(
        !db.employees.some(
          (x) =>
            x.id.toLowerCase() === id.toLowerCase() || x.email === fields.email,
        ),
        "Mã nhân viên hoặc email đã tồn tại.",
        409,
      );
      db.employees.push({ id, ...fields });
      db.credentials[id] = passwordHash(password);
      audit(db, user, "Thêm nhân viên", id);
    });
    res.status(201).json({ success: true });
  });
  router.put("/hr/employees/:id", (req, res) => {
    const user = current(res);
    hr(user);
    store.transaction((db) => {
      const target = employee(db, req.params.id);
      const fields = employeeFields(req.body, db);
      ensure(
        user.role === "admin" ||
          (target.role === "employee" && fields.role === "employee"),
        "Chỉ quản trị viên được sửa tài khoản quản lý.",
        403,
      );
      ensure(
        !db.employees.some(
          (x) => x.id !== target.id && x.email === fields.email,
        ),
        "Email đã tồn tại.",
        409,
      );
      ensure(
        target.id !== user.id ||
          (fields.status !== "inactive" && fields.role === user.role),
        "Không thể tự khóa hoặc đổi quyền tài khoản đang dùng.",
      );
      ensure(
        target.role !== "admin" ||
          (fields.role === "admin" && fields.status !== "inactive") ||
          db.employees.some(
            (x) =>
              x.id !== target.id &&
              x.role === "admin" &&
              x.status !== "inactive",
          ),
        "Phải giữ ít nhất một quản trị viên.",
      );
      const used = db.leaves
        .filter(
          (x) =>
            x.employeeId === target.id &&
            x.type === "annual" &&
            x.status === "approved" &&
            x.startDate.startsWith(today().slice(0, 4)),
        )
        .reduce((n, x) => n + x.days, 0);
      ensure(
        fields.annualLeave >= used,
        "Phép năm không được ít hơn số ngày đã duyệt.",
      );
      ensure(
        !db.contracts.some(
          (x) => x.employeeId === target.id && x.startDate < fields.startDate,
        ) &&
          !db.attendance.some(
            (x) => x.employeeId === target.id && x.date < fields.startDate,
          ),
        "Ngày vào làm không được sau hợp đồng hoặc ngày công đã lưu.",
      );
      Object.assign(target, fields);
      audit(db, user, "Cập nhật hồ sơ", target.id);
    });
    res.json({ success: true });
  });
  router.post("/hr/employees/:id/password", (req, res) => {
    const user = current(res);
    ensure(
      user.role === "admin",
      "Chỉ quản trị viên được đặt lại mật khẩu.",
      403,
    );
    const password = text(req.body.password, "Mật khẩu");
    ensure(password.length >= 10, "Mật khẩu cần ít nhất 10 ký tự.");
    store.transaction((db) => {
      employee(db, req.params.id);
      db.credentials[req.params.id] = passwordHash(password);
      audit(db, user, "Đặt lại mật khẩu", req.params.id);
    });
    for (const [key, session] of sessions)
      if (session.employeeId === req.params.id) sessions.delete(key);
    res.json({ success: true });
  });
  router.post("/hr/categories/:kind", (req, res) => {
    const user = current(res);
    hr(user);
    const kind = choice(
      req.params.kind,
      ["departments", "positions"] as const,
      "Danh mục",
    );
    store.transaction((db) => {
      const name = text(req.body.name, "Tên danh mục");
      ensure(
        !db[kind].some((x) => x.name.toLowerCase() === name.toLowerCase()),
        "Tên đã tồn tại.",
        409,
      );
      const id = randomUUID();
      db[kind].push({ id, name });
      audit(db, user, "Thêm danh mục", id);
    });
    res.status(201).json({ success: true });
  });
  router.delete("/hr/categories/:kind/:id", (req, res) => {
    const user = current(res);
    hr(user);
    const kind = choice(
      req.params.kind,
      ["departments", "positions"] as const,
      "Danh mục",
    );
    store.transaction((db) => {
      ensure(
        !db.employees.some(
          (x) =>
            x[kind === "departments" ? "departmentId" : "positionId"] ===
            req.params.id,
        ),
        "Danh mục đang có nhân viên, không thể xóa.",
        409,
      );
      ensure(kind !== 'departments' || !db.announcements.some(x => x.departmentId === req.params.id),
        'Phòng ban đang được sử dụng trong bảng tin, không thể xóa.', 409);
      const i = db[kind].findIndex((x) => x.id === req.params.id);
      ensure(i >= 0, "Không tìm thấy danh mục.", 404);
      db[kind].splice(i, 1);
      audit(db, user, "Xóa danh mục", req.params.id);
    });
    res.json({ success: true });
  });
  router.put("/hr/categories/:kind/:id", (req, res) => {
    const user = current(res);
    hr(user);
    const kind = choice(
      req.params.kind,
      ["departments", "positions"] as const,
      "Danh mục",
    );
    store.transaction((db) => {
      const row = db[kind].find((x) => x.id === req.params.id);
      ensure(row, "Không tìm thấy danh mục.", 404);
      const name = text(req.body.name, "Tên danh mục");
      ensure(
        !db[kind].some(
          (x) => x.id !== row.id && x.name.toLowerCase() === name.toLowerCase(),
        ),
        "Tên đã tồn tại.",
        409,
      );
      row.name = name;
      audit(db, user, "Đổi tên danh mục", row.id);
    });
    res.json({ success: true });
  });
  router.post("/hr/contracts", (req, res) => {
    const user = current(res);
    hr(user);
    store.transaction((db) => {
      const b = req.body;
      const target = employee(db, text(b.employeeId, "Nhân viên"));
      ensure(target.status !== "inactive", "Nhân viên đã nghỉ việc.");
      const typeValue = text(b.type, "Loại hợp đồng");
      const contractType = db.contractTypes.find(
        (x) => x.id === typeValue && x.status === "active",
      );
      ensure(contractType, "Loại hợp đồng không tồn tại hoặc đã ngừng dùng.");
      const type = contractType.id;
      const startDate = date(b.startDate);
      const endDate = contractType.durationMonths === 0 ? "" : date(b.endDate);
      ensure(
        !endDate || endDate >= startDate,
        "Ngày hết hạn phải từ ngày bắt đầu.",
      );
      ensure(startDate >= target.startDate, "Hợp đồng phải từ ngày vào làm.");
      const code = text(b.code, "Số hợp đồng");
      ensure(
        !db.contracts.some((x) => x.code.toLowerCase() === code.toLowerCase()),
        "Số hợp đồng đã tồn tại.",
        409,
      );
      ensure(
        !db.contracts.some(
          (x) =>
            x.employeeId === target.id &&
            x.startDate <= (endDate || "9999-12-31") &&
            (x.endDate || "9999-12-31") >= startDate,
        ),
        "Hợp đồng bị trùng thời gian.",
        409,
      );
      const id = randomUUID();
      db.contracts.push({
        id,
        employeeId: target.id,
        code,
        type,
        startDate,
        endDate,
        salary: number(b.salary, "Lương cơ bản"),
        allowance: number(b.allowance, "Phụ cấp"),
      });
      audit(db, user, "Thêm hợp đồng lao động", id);
    });
    res.status(201).json({ success: true });
  });
  router.post("/hr/attendance", (req, res) => {
    const user = current(res);
    hr(user);
    store.transaction((db) => {
      const b = req.body;
      const target = employee(db, text(b.employeeId, "Nhân viên"));
      const day = date(b.date);
      ensure(
        day >= target.startDate && day <= today(),
        "Ngày công phải từ ngày vào làm đến hôm nay.",
      );
      ensure(target.status !== "inactive", "Nhân viên đã nghỉ việc.");
      ensure(
        workdays(day, day) === 1,
        "Bản đồ án áp dụng lịch thứ Hai đến thứ Sáu.",
      );
      ensure(
        !db.payroll.some(
          (x) =>
            x.employeeId === target.id &&
            x.month === day.slice(0, 7) &&
            x.status === "finalized",
        ),
        "Kỳ lương đã chốt, không thể sửa công.",
        409,
      );
      ensure(
        !db.leaves.some(
          (x) =>
            x.employeeId === target.id &&
            x.status === "approved" &&
            x.startDate <= day &&
            x.endDate >= day,
        ),
        "Ngày này đã có nghỉ phép được duyệt.",
        409,
      );
      const time = (v: unknown) => {
        ensure(
          typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v),
          "Giờ công không hợp lệ.",
        );
        return v;
      };
      const checkIn = time(b.checkIn);
      const checkOut = time(b.checkOut);
      ensure(checkOut > checkIn, "Giờ ra phải sau giờ vào.");
      const existing = db.attendance.find(
        (x) => x.employeeId === target.id && x.date === day,
      );
      const row = {
        id: existing?.id || randomUUID(),
        employeeId: target.id,
        date: day,
        checkIn,
        checkOut,
        note: text(b.note ?? "", "Ghi chú", false, 500),
      };
      if (existing) Object.assign(existing, row);
      else db.attendance.push(row);
      audit(db, user, "Ghi nhận chấm công", row.id);
    });
    res.json({ success: true });
  });
  router.delete("/hr/attendance/:id", (req, res) => {
    const user = current(res);
    hr(user);
    store.transaction((db) => {
      const index = db.attendance.findIndex((x) => x.id === req.params.id);
      ensure(index >= 0, "Không tìm thấy ngày công.", 404);
      const row = db.attendance[index];
      ensure(
        !db.payroll.some(
          (x) =>
            x.employeeId === row.employeeId &&
            x.month === row.date.slice(0, 7) &&
            x.status === "finalized",
        ),
        "Kỳ lương đã chốt, không thể xóa công.",
        409,
      );
      db.attendance.splice(index, 1);
      audit(db, user, "Xóa ngày công ghi nhầm", row.id);
    });
    res.json({ success: true });
  });
  router.put("/hr/contracts/:id", (req, res) => {
    const user = current(res);
    hr(user);
    store.transaction((db) => {
      const row = db.contracts.find((x) => x.id === req.params.id);
      ensure(row, "Không tìm thấy hợp đồng.", 404);
      const b = req.body;
      const code = text(b.code, "Số hợp đồng");
      const typeValue = text(b.type, "Loại hợp đồng");
      const contractType = db.contractTypes.find((x) => x.id === typeValue);
      ensure(contractType, "Loại hợp đồng không tồn tại.");
      const type = contractType.id;
      const startDate = date(b.startDate);
      const endDate = contractType.durationMonths === 0 ? "" : date(b.endDate);
      ensure(
        !endDate || endDate >= startDate,
        "Ngày hết hạn phải từ ngày bắt đầu.",
      );
      ensure(
        startDate >= employee(db, row.employeeId).startDate,
        "Hợp đồng phải từ ngày vào làm.",
      );
      const salary = number(b.salary, "Lương cơ bản");
      const allowance = number(b.allowance, "Phụ cấp");
      ensure(
        !db.contracts.some(
          (x) => x.id !== row.id && x.code.toLowerCase() === code.toLowerCase(),
        ),
        "Số hợp đồng đã tồn tại.",
        409,
      );
      ensure(
        !db.contracts.some(
          (x) =>
            x.id !== row.id &&
            x.employeeId === row.employeeId &&
            x.startDate <= (endDate || "9999-12-31") &&
            (x.endDate || "9999-12-31") >= startDate,
        ),
        "Hợp đồng bị trùng thời gian.",
        409,
      );
      for (const payroll of db.payroll.filter(
        (x) => x.employeeId === row.employeeId && x.status === "finalized",
      )) {
        const [first, last] = monthBounds(payroll.month);
        if (row.startDate <= last && (!row.endDate || row.endDate >= first))
          ensure(
            salary === row.salary &&
              allowance === row.allowance &&
              startDate <= first &&
              (!endDate || endDate >= last),
            "Không được thay đổi hợp đồng ảnh hưởng kỳ lương đã chốt. Tạo hợp đồng kế tiếp để đổi lương.",
            409,
          );
      }
      Object.assign(row, { code, type, startDate, endDate, salary, allowance });
      audit(db, user, "Cập nhật hợp đồng", row.id);
    });
    res.json({ success: true });
  });
  router.post("/hr/leaves", (req, res) => {
    const user = current(res);
    store.transaction((db) => {
      const startDate = date(req.body.startDate);
      const endDate = date(req.body.endDate);
      ensure(
        startDate >= user.startDate && startDate >= today(),
        "Chỉ gửi đơn từ hôm nay và sau ngày vào làm.",
      );
      ensure(
        startDate.slice(0, 4) === endDate.slice(0, 4),
        "Vui lòng tách đơn theo từng năm.",
      );
      const days = workdays(startDate, endDate);
      ensure(days > 0, "Đơn cần có ít nhất một ngày làm việc.");
      const type = choice(
        req.body.type,
        ["annual", "unpaid"] as const,
        "Loại nghỉ",
      );
      ensure(
        !db.leaves.some(
          (x) =>
            x.employeeId === user.id &&
            ["pending", "approved"].includes(x.status) &&
            x.startDate <= endDate &&
            x.endDate >= startDate,
        ),
        "Đã có đơn nghỉ trong khoảng này.",
        409,
      );
      const id = randomUUID();
      db.leaves.push({
        id,
        employeeId: user.id,
        startDate,
        endDate,
        days,
        type,
        reason: text(req.body.reason, "Lý do", true, 1000),
        status: "pending",
      });
      audit(db, user, "Gửi đơn nghỉ phép", id);
      for (const reviewer of db.employees.filter(x => x.id !== user.id && x.status !== 'inactive' &&
        (privileged(x) || (x.role === 'manager' && x.departmentId === user.departmentId)))) {
        notify(db, reviewer.id, 'Đơn nghỉ phép cần duyệt', `${user.name} vừa gửi một đơn nghỉ phép.`, 'leaves');
      }
    });
    res.status(201).json({ success: true });
  });
  router.post("/hr/leaves/:id/review", (req, res) => {
    const user = current(res);
    store.transaction((db) => {
      const row = db.leaves.find((x) => x.id === req.params.id);
      ensure(row, "Không tìm thấy đơn.", 404);
      ensure(row.status === "pending", "Đơn đã được xử lý.", 409);
      const status = choice(
        req.body.status,
        ["approved", "rejected", "cancelled"] as const,
        "Kết quả",
      );
      if (status === "cancelled")
        ensure(row.employeeId === user.id, "Chỉ người gửi được hủy đơn.", 403);
      else {
        ensure(
          user.id !== row.employeeId,
          "Không được tự duyệt đơn của mình.",
          403,
        );
        ensure(
          privileged(user) ||
            (user.role === "manager" &&
              employee(db, row.employeeId).departmentId === user.departmentId),
          "Không có quyền duyệt đơn này.",
          403,
        );
      }
      if (status === "approved") {
        ensure(
          !db.attendance.some(
            (x) =>
              x.employeeId === row.employeeId &&
              x.date >= row.startDate &&
              x.date <= row.endDate,
          ),
          "Đã có chấm công trong thời gian nghỉ.",
          409,
        );
        ensure(
          !db.payroll.some(
            (x) =>
              x.employeeId === row.employeeId &&
              x.status === "finalized" &&
              x.month >= row.startDate.slice(0, 7) &&
              x.month <= row.endDate.slice(0, 7),
          ),
          "Có kỳ lương đã chốt trong thời gian nghỉ.",
          409,
        );
        const used = db.leaves
          .filter(
            (x) =>
              x.employeeId === row.employeeId &&
              x.type === "annual" &&
              x.status === "approved" &&
              x.startDate.slice(0, 4) === row.startDate.slice(0, 4),
          )
          .reduce((n, x) => n + x.days, 0);
        ensure(
          row.type !== "annual" ||
            used + row.days <= employee(db, row.employeeId).annualLeave,
          "Không đủ số dư phép năm.",
        );
      }
      row.status = status;
      row.reviewerId = user.id;
      row.reviewNote = text(
        req.body.reviewNote ?? "",
        "Ý kiến",
        status === "rejected",
        500,
      );
      audit(db, user, `Nghỉ phép: ${status}`, row.id);
      if (status !== 'cancelled') notify(db, row.employeeId, 'Kết quả đơn nghỉ phép',
        `Đơn nghỉ từ ${row.startDate} đến ${row.endDate} ${status === 'approved' ? 'đã được duyệt' : 'đã bị từ chối'}.`, 'leaves');
    });
    res.json({ success: true });
  });
  router.post("/hr/payroll", (req, res) => {
    const user = current(res);
    hr(user);
    store.transaction((db) => {
      const b = req.body;
      const target = employee(db, text(b.employeeId, "Nhân viên"));
      const period = month(b.month);
      const [start, end] = monthBounds(period);
      ensure(end < today(), "Chỉ lập bảng lương sau khi kết thúc tháng.");
      const existing = db.payroll.find(
        (x) => x.employeeId === target.id && x.month === period,
      );
      ensure(existing?.status !== "finalized", "Kỳ lương đã chốt.", 409);
      const contract = db.contracts.find(
        (x) =>
          x.employeeId === target.id &&
          x.startDate <= start &&
          (!x.endDate || x.endDate >= end),
      );
      ensure(
        contract,
        "Cần một hợp đồng bao phủ cả tháng; kỳ thay đổi hợp đồng/vào làm giữa tháng cần xử lý riêng.",
      );
      const standardDays = workdays(start, end);
      const workedDays = db.attendance.filter(
        (x) => x.employeeId === target.id && x.date >= start && x.date <= end,
      ).length;
      const paidLeaveDays = db.leaves
        .filter(
          (x) =>
            x.employeeId === target.id &&
            x.status === "approved" &&
            x.type === "annual" &&
            x.startDate <= end &&
            x.endDate >= start,
        )
        .reduce(
          (n, x) =>
            n +
            workdays(
              x.startDate > start ? x.startDate : start,
              x.endDate < end ? x.endDate : end,
            ),
          0,
        );
      const bonus = number(b.bonus, "Thưởng");
      const deduction = number(b.deduction, "Khấu trừ");
      ensure(
        workedDays + paidLeaveDays <= standardDays,
        "Tổng ngày hưởng lương vượt ngày chuẩn.",
      );
      const gross = Math.round(
        ((contract.salary + contract.allowance) *
          (workedDays + paidLeaveDays)) /
          standardDays +
          bonus,
      );
      ensure(deduction <= gross, "Khấu trừ vượt thu nhập.");
      const row = {
        id: existing?.id || randomUUID(),
        employeeId: target.id,
        month: period,
        baseSalary: contract.salary,
        allowance: contract.allowance,
        standardDays,
        workedDays,
        paidLeaveDays,
        bonus,
        deduction,
        net: gross - deduction,
        status: "draft" as const,
      };
      if (existing) Object.assign(existing, row);
      else db.payroll.push(row);
      audit(db, user, "Tính bảng lương nháp", row.id);
    });
    res.json({ success: true });
  });
  router.post("/hr/payroll/:id/finalize", (req, res) => {
    const user = current(res);
    hr(user);
    store.transaction((db) => {
      const row = db.payroll.find((x) => x.id === req.params.id);
      ensure(row, "Không tìm thấy bảng lương.", 404);
      ensure(row.status === "draft", "Bảng lương đã chốt.", 409);
      const [start, end] = monthBounds(row.month);
      const contract = db.contracts.find(
        (x) =>
          x.employeeId === row.employeeId &&
          x.startDate <= start &&
          (!x.endDate || x.endDate >= end),
      );
      ensure(
        contract &&
          contract.salary === row.baseSalary &&
          contract.allowance === row.allowance,
        "Hợp đồng đã thay đổi. Vui lòng tính lại bảng lương.",
        409,
      );
      const worked = db.attendance.filter(
        (x) =>
          x.employeeId === row.employeeId && x.date >= start && x.date <= end,
      ).length;
      const paid = db.leaves
        .filter(
          (x) =>
            x.employeeId === row.employeeId &&
            x.status === "approved" &&
            x.type === "annual" &&
            x.startDate <= end &&
            x.endDate >= start,
        )
        .reduce(
          (n, x) =>
            n +
            workdays(
              x.startDate > start ? x.startDate : start,
              x.endDate < end ? x.endDate : end,
            ),
          0,
        );
      ensure(
        worked === row.workedDays && paid === row.paidLeaveDays,
        "Dữ liệu công/phép đã đổi. Vui lòng tính lại bảng lương.",
        409,
      );
      row.status = "finalized";
      audit(db, user, "Chốt bảng lương", row.id);
      notify(db, row.employeeId, 'Bảng lương đã sẵn sàng', `Bảng lương tháng ${row.month} đã được chốt.`, 'payroll');
    });
    res.json({ success: true });
  });
  router.post("/hr/evaluations", (req, res) => {
    const user = current(res);
    store.transaction((db) => {
      const target = employee(db, text(req.body.employeeId, "Nhân viên"));
      ensure(
        user.id !== target.id &&
          (privileged(user) ||
            (user.role === "manager" &&
              target.departmentId === user.departmentId)),
        "Không được tự đánh giá hoặc đánh giá ngoài quyền.",
        403,
      );
      const period = month(req.body.month);
      const existing = db.evaluations.find(
        (x) => x.employeeId === target.id && x.month === period,
      );
      const row = {
        id: existing?.id || randomUUID(),
        employeeId: target.id,
        month: period,
        score: number(req.body.score, "Điểm", 0, 100),
        note: text(req.body.note, "Nhận xét", true, 1000),
        reviewerId: user.id,
      };
      if (existing) Object.assign(existing, row);
      else db.evaluations.push(row);
      audit(db, user, "Đánh giá nhân viên", row.id);
    });
    res.json({ success: true });
  });
  const operationKinds = [
    "recognitions",
    "time-cards",
    "shifts",
    "shift-assignments",
    "contract-types",
    "holidays",
    "attendance-machines",
  ] as const;
  type OperationKind = (typeof operationKinds)[number];
  const operationCollection = (db: Database, kind: OperationKind): any[] =>
    ({
      recognitions: db.recognitions,
      "time-cards": db.timeCards,
      shifts: db.shifts,
      "shift-assignments": db.shiftAssignments,
      "contract-types": db.contractTypes,
      holidays: db.holidays,
      "attendance-machines": db.attendanceMachines,
    })[kind];
  const timeValue = (value: unknown, label: string) => {
    ensure(
      typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
      `${label} không hợp lệ.`,
    );
    return value;
  };
  function operationFields(
    kind: OperationKind,
    body: any,
    db: Database,
    currentId = "",
  ) {
    if (kind === "recognitions") {
      const employeeId = text(body.employeeId, "Nhân viên");
      employee(db, employeeId);
      return {
        employeeId,
        kind: choice(body.kind, ["reward", "discipline"] as const, "Phân loại"),
        date: date(body.date, "Ngày quyết định"),
        title: text(body.title, "Hình thức", true, 200),
        note: text(body.note ?? "", "Ghi chú", false, 1000),
      };
    }
    if (kind === "time-cards") {
      const employeeId = text(body.employeeId, "Nhân viên");
      employee(db, employeeId);
      const cardNumber = text(body.cardNumber, "Mã thẻ", true, 80);
      ensure(
        !db.timeCards.some(
          (x) => x.id !== currentId && x.cardNumber.toLowerCase() === cardNumber.toLowerCase(),
        ),
        "Mã thẻ đã được đăng ký.",
        409,
      );
      return {
        employeeId,
        cardNumber,
        type: choice(body.type, ["new", "replace", "reissue"] as const, "Loại đăng ký"),
        note: text(body.note ?? "", "Ghi chú", false, 1000),
      };
    }
    if (kind === "shifts") {
      const code = text(body.code, "Mã ca", true, 40).toUpperCase();
      ensure(/^[A-Z0-9_-]+$/.test(code), "Mã ca chỉ dùng chữ, số, dấu - và _.");
      ensure(
        !db.shifts.some((x) => x.id !== currentId && x.code.toLowerCase() === code.toLowerCase()),
        "Mã ca đã tồn tại.",
        409,
      );
      return {
        code,
        name: text(body.name, "Tên ca", true, 120),
        startTime: timeValue(body.startTime, "Giờ bắt đầu"),
        endTime: timeValue(body.endTime, "Giờ kết thúc"),
      };
    }
    if (kind === "shift-assignments") {
      const employeeId = text(body.employeeId, "Nhân viên");
      employee(db, employeeId);
      const shiftId = text(body.shiftId, "Ca làm việc");
      ensure(db.shifts.some((x) => x.id === shiftId), "Ca làm việc không tồn tại.");
      const startDate = date(body.startDate, "Từ ngày");
      const endDate = date(body.endDate, "Đến ngày");
      ensure(endDate >= startDate, "Đến ngày phải từ ngày bắt đầu.");
      ensure(
        !db.shiftAssignments.some(
          (x) =>
            x.id !== currentId &&
            x.employeeId === employeeId &&
            x.startDate <= endDate &&
            x.endDate >= startDate,
        ),
        "Nhân viên đã được xếp ca trong khoảng thời gian này.",
        409,
      );
      return { employeeId, shiftId, startDate, endDate };
    }
    if (kind === "contract-types") {
      const code = text(body.code, "Mã loại hợp đồng", true, 40).toLowerCase();
      ensure(/^[a-z0-9_-]+$/.test(code), "Mã loại chỉ dùng chữ thường, số, dấu - và _.");
      ensure(
        !db.contractTypes.some(
          (x) => x.id !== currentId && x.code.toLowerCase() === code,
        ),
        "Mã loại hợp đồng đã tồn tại.",
        409,
      );
      return {
        code,
        name: text(body.name, "Tên hợp đồng", true, 160),
        englishName: text(body.englishName ?? "", "Tên tiếng Anh", false, 160),
        durationMonths: number(body.durationMonths, "Số tháng", 0, 1200),
        status: choice(body.status, ["active", "inactive"] as const, "Trạng thái"),
      };
    }
    if (kind === "holidays") {
      const holidayDate = date(body.date, "Ngày nghỉ");
      ensure(
        !db.holidays.some((x) => x.id !== currentId && x.date === holidayDate),
        "Ngày nghỉ này đã tồn tại.",
        409,
      );
      return { name: text(body.name, "Tên ngày nghỉ", true, 160), date: holidayDate };
    }
    const code = text(body.code, "Mã máy", true, 40).toUpperCase();
    ensure(
      !db.attendanceMachines.some(
        (x) => x.id !== currentId && x.code.toLowerCase() === code.toLowerCase(),
      ),
      "Mã máy đã tồn tại.",
      409,
    );
    return {
      code,
      name: text(body.name, "Tên máy", true, 160),
      englishName: text(body.englishName ?? "", "Tên tiếng Anh", false, 160),
      location: text(body.location, "Vị trí", true, 160),
      brand: text(body.brand, "Thương hiệu", true, 120),
      model: text(body.model, "Kiểu máy", true, 120),
      status: choice(body.status, ["active", "inactive"] as const, "Trạng thái"),
    };
  }
  router.post("/hr/operations/:kind", (req, res) => {
    const user = current(res);
    hr(user);
    const kind = choice(req.params.kind, operationKinds, "Chức năng");
    store.transaction((db) => {
      const row = { id: randomUUID(), ...operationFields(kind, req.body, db) };
      operationCollection(db, kind).push(row);
      audit(db, user, `Thêm ${kind}`, row.id);
    });
    res.status(201).json({ success: true });
  });
  router.put("/hr/operations/:kind/:id", (req, res) => {
    const user = current(res);
    hr(user);
    const kind = choice(req.params.kind, operationKinds, "Chức năng");
    store.transaction((db) => {
      const row = operationCollection(db, kind).find((x) => x.id === req.params.id);
      ensure(row, "Không tìm thấy dữ liệu.", 404);
      Object.assign(row, operationFields(kind, req.body, db, row.id));
      audit(db, user, `Cập nhật ${kind}`, row.id);
    });
    res.json({ success: true });
  });
  router.delete("/hr/operations/:kind/:id", (req, res) => {
    const user = current(res);
    hr(user);
    const kind = choice(req.params.kind, operationKinds, "Chức năng");
    store.transaction((db) => {
      const rows = operationCollection(db, kind);
      const index = rows.findIndex((x) => x.id === req.params.id);
      ensure(index >= 0, "Không tìm thấy dữ liệu.", 404);
      if (kind === "shifts")
        ensure(!db.shiftAssignments.some((x) => x.shiftId === req.params.id), "Ca đang được phân công, không thể xóa.", 409);
      if (kind === "contract-types")
        ensure(!db.contracts.some((x) => x.type === req.params.id), "Loại hợp đồng đang được sử dụng, không thể xóa.", 409);
      rows.splice(index, 1);
      audit(db, user, `Xóa ${kind}`, req.params.id);
    });
    res.json({ success: true });
  });
  function announcementFields(body: any, db: Database) {
    const departmentId = text(body.departmentId ?? '', 'Phòng ban', false);
    ensure(!departmentId || db.departments.some(x => x.id === departmentId), 'Phòng ban không tồn tại.');
    ensure(typeof body.pinned === 'boolean', 'Trạng thái ghim không hợp lệ.');
    return { title: text(body.title, 'Tiêu đề', true, 120), body: text(body.body, 'Nội dung', true, 4000), departmentId, pinned: body.pinned };
  }
  router.post('/hr/announcements', (req, res) => {
    const user = current(res); hr(user);
    store.transaction(db => {
      const fields = announcementFields(req.body, db);
      const at = new Date().toISOString();
      const row = { ...fields, id: randomUUID(), archived: false, createdBy: user.id, authorName: user.name, createdAt: at, updatedAt: at };
      db.announcements.push(row);
      audit(db, user, 'Đăng bảng tin', row.id);
    });
    res.status(201).json({ success: true });
  });
  router.put('/hr/announcements/:id', (req, res) => {
    const user = current(res); hr(user);
    store.transaction(db => {
      const row = db.announcements.find(x => x.id === req.params.id);
      ensure(row, 'Không tìm thấy bản tin.', 404);
      Object.assign(row, announcementFields(req.body, db), { updatedAt: new Date().toISOString() });
      audit(db, user, 'Cập nhật bảng tin', row.id);
    });
    res.json({ success: true });
  });
  router.post('/hr/announcements/:id/archive', (req, res) => {
    const user = current(res); hr(user);
    ensure(typeof req.body.archived === 'boolean', 'Trạng thái lưu trữ không hợp lệ.');
    store.transaction(db => {
      const row = db.announcements.find(x => x.id === req.params.id);
      ensure(row, 'Không tìm thấy bản tin.', 404);
      row.archived = req.body.archived;
      row.updatedAt = new Date().toISOString();
      audit(db, user, row.archived ? 'Lưu trữ bản tin' : 'Khôi phục bản tin', row.id);
    });
    res.json({ success: true });
  });
  router.post('/hr/notifications/read-all', (_req, res) => {
    const user = current(res);
    store.transaction(db => {
      const at = new Date().toISOString();
      for (const row of db.notifications) if (row.employeeId === user.id && !row.readAt) row.readAt = at;
    });
    res.json({ success: true });
  });
  router.post('/hr/notifications/:id/read', (req, res) => {
    const user = current(res);
    store.transaction(db => {
      const row = db.notifications.find(x => x.id === req.params.id && x.employeeId === user.id);
      ensure(row, 'Không tìm thấy thông báo.', 404);
      row.readAt ||= new Date().toISOString();
    });
    res.json({ success: true });
  });
  router.use((_req, res) =>
    res
      .status(404)
      .json({ error: "Chức năng không có trong hệ thống nhân sự." }),
  );
  router.use(
    (err: Error, _req: Request, res: Response, _next: NextFunction) => {
      if (!(err instanceof ValidationError)) console.error(err);
      res
        .status(err instanceof ValidationError ? err.status : 500)
        .json({
          error:
            err instanceof ValidationError
              ? err.message
              : "Không thể lưu dữ liệu. Vui lòng thử lại hoặc kiểm tra máy chủ.",
        });
    },
  );
  return router;
}
