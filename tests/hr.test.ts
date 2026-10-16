import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import { HRStore, passwordHash } from "../src/backend/hr/store";
import { createHRRouter } from "../src/backend/hr/api";
import { today, workdays, date } from "../src/backend/hr/rules";

test("Date and workday validation", () => {
  assert.throws(() => date("2026-02-30"));
  assert.throws(() => workdays("2026-03-03", "2026-03-01"));
  assert.equal(workdays("2026-08-01", "2026-08-31"), 21);
  assert.equal(workdays("2026-08-01", "2026-08-02"), 0);
});

test('Public registration rejects foreign origins and throttles repeated requests', async () => {
  const store = new HRStore(path.join(process.cwd(), 'work', `signup-rate-${Date.now()}`, 'hr.json'));
  const app = express(); app.use(express.json()); app.use('/api', createHRRouter(store));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/auth/register`;
  try {
    assert.equal((await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://foreign.example' }, body: '{}' })).status, 403);
    for (let index = 0; index < 10; index++) assert.equal((await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 400);
    assert.equal((await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 429);
    assert.equal(store.read().registrations.length, 0);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
test("HR authentication, permissions, leave workflow, payroll and persistence", async (t) => {
  const folder = path.join(process.cwd(), "work", `test-${Date.now()}`);
  const filename = path.join(folder, "hr.json");
  const store = new HRStore(filename);
  const password = "Test-only-password-123!";
  const employee = (
    id: string,
    role: "admin" | "hr" | "manager" | "employee",
    departmentId = "Tech",
  ) => ({
    id,
    name: id,
    email: `${id}@example.test`,
    phone: "",
    birthday: "",
    address: "Private address",
    departmentId,
    positionId: "staff",
    role,
    status: "active" as const,
    startDate: "2020-01-01",
    annualLeave: 12,
  });
  store.transaction((db) => {
    db.employees.push(
      employee("admin", "admin"),
      employee("hr", "hr", "HR"),
      employee("manager", "manager"),
      employee("worker", "employee"),
      employee("outsider", "employee", "Sales"),
    );
    for (const row of db.employees)
      db.credentials[row.id] = passwordHash(password);
  });
  const app = express();
  app.use(express.json());
  app.use("/api", createHRRouter(store));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const port = (server.address() as { port: number }).port;
  const base = `http://127.0.0.1:${port}/api`;
  const send = async (
    url: string,
    method = "GET",
    body?: unknown,
    cookie = "",
    headers = {},
  ) => {
    const res = await fetch(base + url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return {
      status: res.status,
      data: await res.json(),
      cookie: res.headers.get("set-cookie")?.split(";")[0] || "",
    };
  };
  const login = async (id: string) => {
    const r = await send("/auth/login", "POST", { identifier: id, password });
    assert.equal(r.status, 200);
    assert.ok(r.cookie);
    return r.cookie;
  };
  try {
    await t.test("Unauthenticated and old bypass API blocked", async () => {
      assert.equal((await send("/hr/data")).status, 401);
      assert.equal((await send("/users")).status, 401);
      assert.equal(
        (
          await send("/auth/login", "POST", {
            identifier: "admin",
            employeeId: "admin",
            skip2FA: true,
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await send("/auth/login", "POST", {
            identifier: "admin",
            password: "wrong",
          })
        ).status,
        401,
      );
      assert.equal(
        (await send("/auth/register", "POST", { role: "admin" })).status,
        400,
      );
    });
    const admin = await login("admin");
    const hr = await login("hr");
    const manager = await login("manager");
    const worker = await login("worker");
    await t.test(
      "Private data and role assignment protected server-side",
      async () => {
        const own = await send("/hr/data", "GET", undefined, worker);
        assert.deepEqual(
          own.data.employees.map((x: any) => x.id),
          ["worker"],
        );
        assert.equal(own.data.credentials, undefined);
        const team = await send("/hr/data", "GET", undefined, manager);
        assert.ok(!team.data.employees.some((x: any) => x.id === "outsider"));
        assert.equal(
          team.data.employees.find((x: any) => x.id === "worker").address,
          "",
        );
        assert.equal(
          (
            await send(
              "/hr/employees",
              "POST",
              { ...employee("new", "admin"), password },
              hr,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await send(
              "/hr/employees",
              "POST",
              { ...employee("new", "employee"), password },
              worker,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await send(
              "/hr/employees",
              "POST",
              { ...employee("new", "employee"), password },
              admin,
            )
          ).status,
          201,
        );
        assert.equal(
          (
            await send(
              "/hr/employees",
              "POST",
              { ...employee("new", "employee"), password },
              admin,
            )
          ).status,
          409,
        );
        assert.equal(
          (
            await send(
              "/hr/employees/admin",
              "PUT",
              { ...employee("admin", "admin"), status: "inactive" },
              admin,
            )
          ).status,
          400,
        );
        assert.equal(
          (await send("/hr/categories/departments/Tech", "DELETE", {}, admin))
            .status,
          409,
        );
        assert.equal(
          (
            await send(
              "/hr/categories/positions",
              "POST",
              { name: "Cross origin" },
              admin,
              { Origin: "https://evil.example" },
            )
          ).status,
          403,
        );
        assert.equal(
          (await send("/tasks", "GET", undefined, admin)).status,
          404,
        );
      },
    );
    let leaveId = "";
    await t.test(
      "Leave overlap, self approval, department scope and double approval",
      async () => {
        const next = new Date(`${today()}T00:00:00Z`);
        next.setUTCDate(next.getUTCDate() + 1);
        while ([0, 6].includes(next.getUTCDay()))
          next.setUTCDate(next.getUTCDate() + 1);
        const start = next.toISOString().slice(0, 10);
        const body = {
          startDate: start,
          endDate: start,
          type: "annual",
          reason: "Test request",
        };
        assert.equal(
          (await send("/hr/leaves", "POST", body, worker)).status,
          201,
        );
        assert.equal(
          (await send("/hr/leaves", "POST", body, worker)).status,
          409,
        );
        leaveId = store.read().leaves[0].id;
        assert.equal(
          (
            await send(
              `/hr/leaves/${leaveId}/review`,
              "POST",
              { status: "approved" },
              worker,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await send(
              `/hr/leaves/${leaveId}/review`,
              "POST",
              { status: "approved" },
              manager,
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await send(
              `/hr/leaves/${leaveId}/review`,
              "POST",
              { status: "approved" },
              admin,
            )
          ).status,
          409,
        );
        const outsider = await login("outsider");
        assert.equal(
          (await send("/hr/leaves", "POST", body, outsider)).status,
          201,
        );
        const otherId = store
          .read()
          .leaves.find((x) => x.employeeId === "outsider")!.id;
        assert.equal(
          (
            await send(
              `/hr/leaves/${otherId}/review`,
              "POST",
              { status: "approved" },
              manager,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await send(
              `/hr/leaves/${otherId}/review`,
              "POST",
              { status: "rejected", reviewNote: "" },
              admin,
            )
          ).status,
          400,
        );
        assert.equal(
          (
            await send(
              `/hr/leaves/${otherId}/review`,
              "POST",
              { status: "cancelled" },
              outsider,
            )
          ).status,
          200,
        );
      },
    );
    await t.test("Leave quota checked at approval", async () => {
      store.transaction((db) => {
        const existing = db.leaves[0];
        db.leaves.push({
          ...existing,
          id: "over-quota",
          days: 13,
          status: "pending",
        });
      });
      assert.equal(
        (
          await send(
            "/hr/leaves/over-quota/review",
            "POST",
            { status: "approved" },
            admin,
          )
        ).status,
        400,
      );
    });
    await t.test("Contract overlap and salary validation", async () => {
      const contract = {
        employeeId: "worker",
        code: "HD-001",
        type: "fixed",
        startDate: "2020-01-01",
        endDate: "2030-12-31",
        salary: 21000000,
        allowance: 0,
      };
      assert.equal(
        (
          await send(
            "/hr/contracts",
            "POST",
            { ...contract, salary: -1 },
            admin,
          )
        ).status,
        400,
      );
      assert.equal(
        (await send("/hr/contracts", "POST", contract, admin)).status,
        201,
      );
      assert.equal(
        (
          await send(
            "/hr/contracts",
            "POST",
            { ...contract, code: "HD-002" },
            admin,
          )
        ).status,
        409,
      );
    });
    await t.test("Video reference modules provide protected CRUD workflows", async () => {
      const recognition = {
        employeeId: "worker",
        kind: "reward",
        date: "2026-08-20",
        title: "Cá nhân xuất sắc",
        note: "Hoàn thành tốt mục tiêu",
      };
      assert.equal(
        (await send("/hr/operations/recognitions", "POST", recognition, worker))
          .status,
        403,
      );
      assert.equal(
        (await send("/hr/operations/recognitions", "POST", recognition, admin))
          .status,
        201,
      );
      const card = {
        employeeId: "worker",
        cardNumber: "CARD-001",
        type: "new",
        note: "Nhân viên mới",
      };
      assert.equal(
        (await send("/hr/operations/time-cards", "POST", card, admin)).status,
        201,
      );
      assert.equal(
        (await send("/hr/operations/time-cards", "POST", card, admin)).status,
        409,
      );
      assert.equal(
        (
          await send(
            "/hr/operations/shifts",
            "POST",
            {
              code: "CA2",
              name: "Ca 2",
              startTime: "14:00",
              endTime: "22:00",
            },
            admin,
          )
        ).status,
        201,
      );
      const shiftId = store.read().shifts.find((x) => x.code === "CA2")!.id;
      const assignment = {
        employeeId: "worker",
        shiftId,
        startDate: "2026-08-01",
        endDate: "2026-08-31",
      };
      assert.equal(
        (
          await send(
            "/hr/operations/shift-assignments",
            "POST",
            assignment,
            admin,
          )
        ).status,
        201,
      );
      assert.equal(
        (
          await send(
            "/hr/operations/shift-assignments",
            "POST",
            { ...assignment, startDate: "2026-08-15" },
            admin,
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await send(
            "/hr/operations/contract-types",
            "POST",
            {
              code: "intern",
              name: "Hợp đồng thực tập",
              englishName: "Intern contract",
              durationMonths: 3,
              status: "active",
            },
            admin,
          )
        ).status,
        201,
      );
      assert.equal(
        (
          await send(
            "/hr/operations/holidays",
            "POST",
            { name: "Ngày thành lập", date: "2026-10-10" },
            admin,
          )
        ).status,
        201,
      );
      assert.equal(
        (
          await send(
            "/hr/operations/attendance-machines",
            "POST",
            {
              code: "MCC01",
              name: "Máy chấm công số 1",
              englishName: "TimeKeeper No. 1",
              location: "Văn phòng",
              brand: "Ronald Jack",
              model: "4000",
              status: "active",
            },
            admin,
          )
        ).status,
        201,
      );
      const own = (await send("/hr/data", "GET", undefined, worker)).data;
      assert.equal(own.recognitions.length, 1);
      assert.equal(own.timeCards.length, 1);
      assert.equal(own.shiftAssignments.length, 1);
      assert.equal(own.attendanceMachines.length, 0);
      assert.equal(
        (
          await send(
            `/hr/operations/shifts/${shiftId}`,
            "DELETE",
            {},
            admin,
          )
        ).status,
        409,
      );
    });
    await t.test(
      "Attendance upsert, draft payroll, stale draft and finalized lock",
      async () => {
        const attendance = {
          employeeId: "worker",
          date: "2026-08-03",
          checkIn: "08:00",
          checkOut: "17:00",
          note: "",
        };
        assert.equal(
          (await send("/hr/attendance", "POST", attendance, worker)).status,
          403,
        );
        assert.equal(
          (
            await send(
              "/hr/attendance",
              "POST",
              { ...attendance, date: "2026-02-30" },
              admin,
            )
          ).status,
          400,
        );
        assert.equal(
          (await send("/hr/attendance", "POST", attendance, admin)).status,
          200,
        );
        assert.equal(
          (
            await send(
              "/hr/attendance",
              "POST",
              { ...attendance, checkIn: "08:15" },
              admin,
            )
          ).status,
          200,
        );
        assert.equal(store.read().attendance.length, 1);
        const payroll = {
          employeeId: "worker",
          month: "2026-08",
          bonus: 100000,
          deduction: 50000,
        };
        assert.equal(
          (await send("/hr/payroll", "POST", payroll, admin)).status,
          200,
        );
        let row = store.read().payroll[0];
        assert.equal(row.net, 1050000);
        assert.equal(
          (await send("/hr/data", "GET", undefined, worker)).data.payroll
            .length,
          0,
        );
        assert.equal(
          (
            await send(
              "/hr/attendance",
              "POST",
              { ...attendance, date: "2026-08-04" },
              admin,
            )
          ).status,
          200,
        );
        assert.equal(
          (await send(`/hr/payroll/${row.id}/finalize`, "POST", {}, admin))
            .status,
          409,
        );
        assert.equal(
          (await send("/hr/payroll", "POST", payroll, admin)).status,
          200,
        );
        row = store.read().payroll[0];
        assert.equal(row.net, 2050000);
        assert.equal(
          (await send(`/hr/payroll/${row.id}/finalize`, "POST", {}, admin))
            .status,
          200,
        );
        assert.equal(
          (await send("/hr/attendance", "POST", attendance, admin)).status,
          409,
        );
        assert.equal(
          (await send("/hr/payroll", "POST", payroll, admin)).status,
          409,
        );
        assert.equal(
          (await send("/hr/data", "GET", undefined, worker)).data.payroll
            .length,
          1,
        );
      },
    );
    await t.test('Announcements enforce department scope, roles and archive lifecycle', async () => {
      const fields = { title: 'Lịch sinh hoạt SHC', body: 'Nội dung\nDòng thứ hai', departmentId: 'Tech', pinned: true };
      assert.equal((await send('/hr/announcements', 'POST', fields, worker)).status, 403);
      assert.equal((await send('/hr/announcements', 'POST', fields, manager)).status, 403);
      assert.equal((await send('/hr/announcements', 'POST', { ...fields, title: '' }, admin)).status, 400);
      assert.equal((await send('/hr/announcements', 'POST', { ...fields, body: 'x'.repeat(4001) }, admin)).status, 400);
      assert.equal((await send('/hr/announcements', 'POST', { ...fields, departmentId: 'missing' }, admin)).status, 400);
      assert.equal((await send('/hr/announcements', 'POST', { ...fields, pinned: 'true' }, admin)).status, 400);
      assert.equal(store.read().announcements.length, 0);
      assert.equal((await send('/hr/announcements', 'POST', { ...fields, createdBy: 'worker' }, hr)).status, 201);
      const row = store.read().announcements[0];
      assert.equal(row.createdBy, 'hr');
      assert.equal((await send('/hr/data', 'GET', undefined, worker)).data.announcements.length, 1);
      const outsider = await login('outsider');
      assert.equal((await send('/hr/data', 'GET', undefined, outsider)).data.announcements.length, 0);
      assert.equal((await send(`/hr/announcements/${row.id}`, 'PUT', { ...fields, departmentId: '' }, admin)).status, 200);
      assert.equal((await send('/hr/data', 'GET', undefined, outsider)).data.announcements.length, 1);
      assert.equal((await send(`/hr/announcements/${row.id}`, 'PUT', fields, worker)).status, 403);
      assert.equal((await send(`/hr/announcements/${row.id}/archive`, 'POST', { archived: true }, worker)).status, 403);
      assert.equal((await send(`/hr/announcements/${row.id}/archive`, 'POST', { archived: true }, hr)).status, 200);
      assert.equal((await send('/hr/data', 'GET', undefined, worker)).data.announcements.length, 0);
      assert.equal((await send('/hr/data', 'GET', undefined, hr)).data.announcements[0].archived, true);
      assert.equal((await send(`/hr/announcements/${row.id}/archive`, 'POST', { archived: false }, hr)).status, 200);
      assert.equal((await send('/hr/data', 'GET', undefined, worker)).data.announcements.length, 1);
      assert.equal(new HRStore(filename).read().announcements[0].body, fields.body);
      // A department with a targeted announcement cannot be deleted even if it has no staff.
      store.transaction(db => {
        db.departments.push({ id: 'BoardOnly', name: 'Board only' });
        db.announcements[0].departmentId = 'BoardOnly';
      });
      assert.equal((await send('/hr/categories/departments/BoardOnly', 'DELETE', {}, admin)).status, 409);
    });
    await t.test('Workflow notifications are private, persistent and not duplicated by failed actions', async () => {
      const own = (await send('/hr/data', 'GET', undefined, worker)).data.notifications;
      assert.ok(own.some((x: any) => x.target === 'leaves'));
      assert.equal(own.filter((x: any) => x.target === 'payroll').length, 1);
      assert.ok(own.every((x: any) => x.employeeId === 'worker'));
      const reviewers = (await send('/hr/data', 'GET', undefined, manager)).data.notifications;
      assert.ok(reviewers.some((x: any) => x.title === 'Đơn nghỉ phép cần duyệt'));
      assert.ok(reviewers.every((x: any) => x.employeeId === 'manager'));
      const privateId = own[0].id;
      assert.equal((await send(`/hr/notifications/${privateId}/read`, 'POST', {}, admin)).status, 404);
      assert.equal((await send(`/hr/notifications/${privateId}/read`, 'POST', {}, worker)).status, 200);
      const at = store.read().notifications.find(x => x.id === privateId)!.readAt;
      assert.ok(at);
      assert.equal((await send(`/hr/notifications/${privateId}/read`, 'POST', {}, worker)).status, 200);
      assert.equal(store.read().notifications.find(x => x.id === privateId)!.readAt, at);
      assert.equal((await send('/hr/notifications/read-all', 'POST', {}, worker)).status, 200);
      assert.ok(new HRStore(filename).read().notifications.filter(x => x.employeeId === 'worker').every(x => x.readAt));
      assert.ok(store.read().notifications.some(x => x.employeeId === 'manager' && !x.readAt));
      const count = store.read().notifications.length;
      const payroll = store.read().payroll[0];
      assert.equal((await send(`/hr/payroll/${payroll.id}/finalize`, 'POST', {}, admin)).status, 409);
      assert.equal(store.read().notifications.length, count);
    });
    await t.test('Public signup validates input and creates only a private pending request', async () => {
      const payload = { name: 'Người đăng ký', email: 'New.Person@example.test', password };
      assert.equal((await send('/auth/register', 'POST', { ...payload, email: 'invalid' })).status, 400);
      assert.equal((await send('/auth/register', 'POST', { ...payload, password: 'short' })).status, 400);
      const count = store.read().employees.length;
      const result = await send('/auth/register', 'POST', payload);
      assert.equal(result.status, 201);
      assert.equal(result.cookie, '');
      assert.equal(result.data.status, 'pending');
      assert.equal(result.data.passwordHash, undefined);
      assert.equal(store.read().employees.length, count);
      const signup = store.read().registrations.find(x => x.email === 'new.person@example.test')!;
      assert.ok(signup.passwordHash && signup.passwordHash !== password);
      assert.equal(signup.status, 'pending');
      assert.equal((await send('/auth/register', 'POST', { ...payload, email: 'NEW.PERSON@example.test' })).status, 409);
      assert.equal((await send('/auth/register', 'POST', { ...payload, email: 'ADMIN@example.test' })).status, 409);
      assert.equal((await send('/auth/login', 'POST', { identifier: payload.email, password })).status, 403);
      assert.equal((await send('/auth/login', 'POST', { identifier: payload.email, password: 'incorrect' })).status, 401);
      assert.equal((await send('/hr/data')).status, 401);
      for (const cookie of [admin, hr]) {
        const result = await send('/hr/data', 'GET', undefined, cookie);
        assert.equal(result.data.registrations.find((x: any) => x.id === signup.id).passwordHash, undefined);
        assert.ok(!JSON.stringify(result.data).includes(signup.passwordHash));
      }
      for (const cookie of [worker, manager]) assert.deepEqual((await send('/hr/data', 'GET', undefined, cookie)).data.registrations, []);
    });
    await t.test('Only HR can activate signup; role is fixed and invalid review is atomic', async () => {
      const signup = store.read().registrations.find(x => x.email === 'new.person@example.test')!;
      const url = `/hr/registrations/${signup.id}/review`;
      const values = { status: 'approved', employeeId: 'REGISTER01', departmentId: 'Tech', positionId: 'staff', startDate: today(), annualLeave: 12, role: 'admin' };
      for (const cookie of [worker, manager]) assert.equal((await send(url, 'POST', values, cookie)).status, 403);
      assert.equal((await send(url, 'POST', { ...values, departmentId: 'missing' }, hr)).status, 400);
      assert.equal((await send(url, 'POST', { ...values, employeeId: 'worker' }, hr)).status, 409);
      assert.equal(store.read().registrations.find(x => x.id === signup.id)!.status, 'pending');
      assert.equal((await send(url, 'POST', values, hr)).status, 200);
      assert.equal(store.read().employees.find(x => x.id === values.employeeId)!.role, 'employee');
      assert.equal((await send(url, 'POST', values, hr)).status, 409);
      const session = await send('/auth/login', 'POST', { identifier: signup.email, password });
      assert.equal(session.status, 200);
      assert.ok(session.cookie);
      const data = await send('/hr/data', 'GET', undefined, session.cookie);
      assert.deepEqual(data.data.employees.map((x: any) => x.id), ['REGISTER01']);
      assert.deepEqual(data.data.registrations, []);
      assert.equal(data.data.credentials, undefined);
    });
    await t.test('Rejected signup has no employee account and requires a reason', async () => {
      assert.equal((await send('/auth/register', 'POST', { name: 'Rejected person', email: 'rejected@example.test', password })).status, 201);
      const signup = store.read().registrations.find(x => x.email === 'rejected@example.test')!;
      const url = `/hr/registrations/${signup.id}/review`;
      assert.equal((await send(url, 'POST', { status: 'rejected' }, admin)).status, 400);
      assert.equal((await send(url, 'POST', { status: 'rejected', reviewNote: 'Chưa thuộc công ty' }, admin)).status, 200);
      assert.ok(!store.read().employees.some(x => x.email === signup.email));
      const response = await send('/auth/login', 'POST', { identifier: signup.email, password });
      assert.equal(response.status, 403);
      assert.equal(response.cookie, '');
    });
    await t.test('Old database migration preserves records and credentials', () => {
      const legacy = { ...store.read() } as any;
      delete legacy.announcements; delete legacy.notifications;
      delete legacy.registrations;
      const legacyFile = path.join(folder, 'legacy.json');
      fs.writeFileSync(legacyFile, JSON.stringify(legacy));
      const migrated = new HRStore(legacyFile);
      assert.deepEqual(migrated.read().employees, legacy.employees);
      assert.deepEqual(migrated.read().credentials, legacy.credentials);
      assert.deepEqual(migrated.read().payroll, legacy.payroll);
      assert.deepEqual(migrated.read().announcements, []);
      assert.deepEqual(migrated.read().notifications, []);
      assert.deepEqual(migrated.read().registrations, []);
      migrated.transaction(db => { db.audits.push({ id: 'migration', actorId: 'admin', action: 'test', targetId: '', at: new Date().toISOString() }); });
      assert.deepEqual(new HRStore(legacyFile).read().employees, legacy.employees);
    });
    await t.test(
      "Evaluation access, password change, logout and persistence",
      async () => {
        const evaluation = {
          employeeId: "worker",
          month: "2026-08",
          score: 80,
          note: "Good work",
        };
        assert.equal(
          (await send("/hr/evaluations", "POST", evaluation, worker)).status,
          403,
        );
        assert.equal(
          (
            await send(
              "/hr/evaluations",
              "POST",
              { ...evaluation, score: 101 },
              manager,
            )
          ).status,
          400,
        );
        assert.equal(
          (await send("/hr/evaluations", "POST", evaluation, manager)).status,
          200,
        );
        const second = await login("worker");
        assert.equal(
          (
            await send(
              "/auth/password",
              "POST",
              { currentPassword: password, password: "New-test-password-456!" },
              worker,
            )
          ).status,
          200,
        );
        assert.equal(
          (await send("/auth/me", "GET", undefined, second)).status,
          401,
        );
        assert.equal(
          (await send("/auth/logout", "POST", {}, worker)).status,
          200,
        );
        assert.equal(
          (await send("/auth/me", "GET", undefined, worker)).status,
          401,
        );
        assert.ok(new HRStore(filename).read().audits.length > 10);
        assert.equal(
          new HRStore(filename).read().payroll[0].status,
          "finalized",
        );
        assert.ok(!fs.readFileSync(filename, "utf8").includes(password));
      },
    );
    await t.test("Corrections preserve finalized payroll and category references", async () => {
      const contract = store.read().contracts[0];
      assert.equal((await send('/hr/contracts/' + contract.id, 'PUT', { ...contract, salary: contract.salary + 1 }, admin)).status, 409);
      assert.equal((await send('/hr/contracts/' + contract.id, 'PUT', { ...contract, endDate: '2026-08-31' }, admin)).status, 200);
      const attendance = store.read().attendance[0];
      assert.equal((await send('/hr/attendance/' + attendance.id, 'DELETE', {}, admin)).status, 409);
      assert.equal((await send('/hr/categories/departments/Tech', 'PUT', { name: 'Engineering' }, admin)).status, 200);
      assert.equal(store.read().departments.find(x => x.id === 'Tech')!.name, 'Engineering');
      assert.equal(store.read().employees.find(x => x.id === 'worker')!.departmentId, 'Tech');
    });
    await t.test("Write failure leaves prior snapshot untouched", () => {
      const blocked = new HRStore(path.join(folder, "block", "hr.json"));
      fs.writeFileSync(path.join(folder, "block"), "file, not directory");
      assert.throws(() =>
        blocked.transaction((db) =>
          db.departments.push({ id: "bad", name: "Bad" }),
        ),
      );
      assert.ok(!blocked.read().departments.some((x) => x.id === "bad"));
    });
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    assert.ok(path.resolve(folder).startsWith(path.resolve(process.cwd(), 'work') + path.sep));
    fs.rmSync(folder, { recursive: true, force: true });
  }
});
