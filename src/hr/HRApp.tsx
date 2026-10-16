import React, { useEffect, useRef, useState } from "react";
import {
  Users,
  LayoutDashboard,
  Building2,
  FileSignature,
  Clock3,
  CalendarDays,
  Wallet,
  Award,
  ShieldCheck,
  LogOut,
  Plus,
  Search,
  Download,
  RefreshCw,
  X,
  LockKeyhole,
  Bell,
  Megaphone,
  UserPlus,
  Menu,
} from "lucide-react";
import type { Employee, HRData } from "./types";
import LoginPage from "./LoginPage";
import { AnnouncementBoard, NotificationCenter } from "./Communication";
import "./hr.css";
import { BrandMark } from "../ui/Brand";
import "./workspace.css";
import { cn } from "../ui/cn";

const tabs = [
  ["dashboard", "Tổng quan", LayoutDashboard],
  ["announcements", "Bảng tin", Megaphone],
  ["notifications", "Thông báo", Bell],
  ["employees", "Hồ sơ nhân viên", Users],
  ["registrations", "Duyệt tài khoản", UserPlus],
  ["rewards", "Khen thưởng", Award],
  ["discipline", "Kỷ luật", ShieldCheck],
  ["shiftAssignments", "Sắp ca làm việc", CalendarDays],
  ["timecards", "Đăng ký thẻ", Clock3],
  ["attendance", "Chấm công", Clock3],
  ["leaves", "Nghỉ phép", CalendarDays],
  ["payroll", "Bảng lương", Wallet],
  ["contracts", "Hợp đồng lao động", FileSignature],
  ["evaluations", "Đánh giá", Award],
  ["organization", "Phòng ban & chức vụ", Building2],
  ["shiftCatalog", "Ca làm việc", Clock3],
  ["contractTypes", "Loại hợp đồng", FileSignature],
  ["holidays", "Ngày nghỉ lễ", CalendarDays],
  ["attendanceMachines", "Máy chấm công", Clock3],
  ["audits", "Nhật ký hệ thống", ShieldCheck],
] as const;
const navSections = [
  { label: "Không gian làm việc", ids: ["dashboard", "announcements", "notifications"] },
  { label: "Con người", ids: ["employees", "registrations", "contracts", "rewards", "discipline", "evaluations"] },
  { label: "Thời gian & thu nhập", ids: ["attendance", "leaves", "shiftAssignments", "timecards", "payroll"] },
  {
    label: "Thiết lập",
    ids: [
      "organization",
      "contractTypes",
      "holidays",
      "attendanceMachines",
      "shiftCatalog",
      "audits",
    ],
  },
];
const labels: Record<string, string> = {
  admin: "Quản trị viên",
  hr: "Nhân sự",
  manager: "Trưởng phòng",
  employee: "Nhân viên",
  probation: "Thử việc",
  active: "Đang làm việc",
  inactive: "Đã nghỉ việc",
  fixed: "Có thời hạn",
  indefinite: "Không thời hạn",
  annual: "Phép năm",
  unpaid: "Không lương",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
  draft: "Bản nháp",
  finalized: "Đã chốt",
  reward: "Khen thưởng",
  discipline: "Kỷ luật",
  new: "Đăng ký mới",
  replace: "Đổi thẻ",
  reissue: "Cấp lại",
};
const currency = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    n,
  );
const day = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const previousMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
async function api(path: string, method = "GET", body?: unknown) {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || "Không thể kết nối máy chủ.");
    Object.assign(error, { status: response.status });
    throw error;
  }
  return data;
}
type Field = {
  key: string;
  label: string;
  type?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  min?: number;
  max?: number;
};
type FormState = {
  title: string;
  path: string;
  method?: string;
  values: Record<string, any>;
  fields: Field[];
};
const options = (...values: string[]) =>
  values.map((value) => ({ value, label: labels[value] || value }));
function RecordDialog({
  form,
  close,
  submit,
  busy,
}: {
  form: FormState;
  close: () => void;
  submit: (values: Record<string, any>) => Promise<void>;
  busy: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState(form.values);
  const [error, setError] = useState("");
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) close();
      }}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            await submit(values);
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <div className="dialog-head">
          <h2 id="dialog-title">{form.title}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Đóng"
            onClick={close}
            disabled={busy}
          >
            <X size={20} />
          </button>
        </div>
        <div className="fields">
          {form.fields.map((field) => (
            <label key={field.key}>
              <span className="field-label">{field.label}{field.required !== false && <span className="required-mark" aria-hidden="true"> *</span>}</span>
              {field.options ? (
                <select
                  required={field.required !== false}
                  value={values[field.key] ?? ""}
                  onChange={(e) =>
                    setValues({ ...values, [field.key]: e.target.value })
                  }
                >
                  <option value="">Chọn…</option>
                  {field.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  required={field.required !== false}
                  maxLength={1000}
                  value={values[field.key] ?? ""}
                  onChange={(e) =>
                    setValues({ ...values, [field.key]: e.target.value })
                  }
                />
              ) : (
                <input
                  required={field.required !== false}
                  type={field.type || "text"}
                  min={field.min}
                  max={field.max}
                  maxLength={field.type === "password" ? 200 : 500}
                  minLength={
                    field.type === "password" && field.key !== "currentPassword"
                      ? 10
                      : undefined
                  }
                  step={field.type === "number" ? "any" : undefined}
                  value={values[field.key] ?? ""}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      [field.key]:
                        field.type === "number"
                          ? e.target.value === ""
                            ? ""
                            : Number(e.target.value)
                          : e.target.value,
                    })
                  }
                  autoComplete={
                    field.type === "password" ? "new-password" : "off"
                  }
                />
              )}
            </label>
          ))}
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" onClick={close} disabled={busy}>
            Hủy
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu thông tin"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
function Login({ onLogin }: { onLogin: (user: Employee) => void }) {
  return <LoginPage onLogin={onLogin} authenticate={async (identifier, password) => (await api('/auth/login', 'POST', { identifier, password })).user} />;
}
type Confirmation = { title: string; description: string; path: string; values?: unknown; method?: string; label?: string };
function ConfirmDialog({ request, close, submit, busy }: { request: Confirmation; close: () => void; submit: () => Promise<void>; busy: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");
  useEffect(() => { ref.current?.showModal(); return () => ref.current?.close(); }, []);
  return <dialog ref={ref} role="alertdialog" aria-labelledby="confirmation-title" aria-describedby="confirmation-description" className="confirmation-dialog" onCancel={event => { event.preventDefault(); if (!busy) close(); }}>
    <div className="dialog-head"><h2 id="confirmation-title">{request.title}</h2></div>
    <p id="confirmation-description" className="confirmation-description">{request.description}</p>
    {error && <p className="error" role="alert">{error}</p>}
    <div className="dialog-actions"><button autoFocus disabled={busy} onClick={close}>Quay lại</button><button className="primary" disabled={busy} onClick={async () => { setError(""); try { await submit(); close(); } catch (err) { setError((err as Error).message); } }}>{busy ? "Đang xử lý…" : request.label || "Xác nhận"}</button></div>
  </dialog>;
}
export default function HRApp() {
  const [user, setUser] = useState<Employee | null>(null);
  const [booting, setBooting] = useState(true);
  const [data, setData] = useState<HRData | null>(null);
  const [tab, setTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [period, setPeriod] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const isHR = !!user && ["admin", "hr"].includes(user.role);
  const isReviewer = isHR || user?.role === "manager";
  useEffect(() => {
    if (user) { document.title = `${tabs.find(item => item[0] === tab)?.[1] || "Nhân sự"} · SHC Company`; window.scrollTo({ top: 0, behavior: "instant" }); }
  }, [tab, user?.id]);
  useEffect(() => {
    api("/auth/me")
      .then((x) => setUser(x.user))
      .catch((err) => {
        if (err.status !== 401) setError(err.message);
      })
      .finally(() => setBooting(false));
  }, []);
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const result = await api("/hr/data");
      setData(result);
      const me = result.employees.find((x: Employee) => x.id === user?.id);
      if (me) setUser(me);
    } catch (err) {
      if ((err as any).status === 401) {
        setUser(null);
        setData(null);
      }
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (user) void refresh();
  }, [user?.id]);
  useEffect(() => {
    setPage(1);
  }, [search, filter, period, tab]);
  const name = (id: string) =>
    data?.employees.find((x) => x.id === id)?.name || id;
  const category = (kind: "departments" | "positions", id: string) =>
    data?.[kind].find((x) => x.id === id)?.name || id;
  const contractTypeName = (id: string) =>
    data?.contractTypes.find((x) => x.id === id)?.name || labels[id] || id;
  const shiftName = (id: string) =>
    data?.shifts.find((x) => x.id === id)?.name || id;
  const personField: Field = {
    key: "employeeId",
    label: "Nhân viên",
    options: (data?.employees || []).map((x) => ({
      value: x.id,
      label: `${x.id} · ${x.name}`,
    })),
  };
  async function mutate(path: string, values: unknown, method = "POST") {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(path, method, values);
      setNotice("Đã lưu thay đổi.");
      setForm(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  async function action(path: string, values: unknown = {}, method = "POST") {
    try {
      await mutate(path, values, method);
    } catch (err) {
      setError((err as Error).message);
    }
  }
  function employeeForm(row?: Employee) {
    setForm({
      title: row ? "Cập nhật hồ sơ nhân viên" : "Thêm nhân viên",
      path: row
        ? `/hr/employees/${encodeURIComponent(row.id)}`
        : "/hr/employees",
      method: row ? "PUT" : "POST",
      values: row
        ? { ...row }
        : {
            role: "employee",
            status: "probation",
            startDate: day(),
            annualLeave: 12,
            departmentId: data?.departments[0]?.id,
            positionId: data?.positions[0]?.id,
          },
      fields: [
        ...(!row
          ? [
              { key: "id", label: "Mã nhân viên" },
              {
                key: "password",
                label: "Mật khẩu ban đầu (ít nhất 10 ký tự)",
                type: "password",
              },
            ]
          : []),
        { key: "name", label: "Họ và tên" },
        { key: "email", label: "Email", type: "email" },
        { key: "phone", label: "Điện thoại", required: false },
        {
          key: "departmentId",
          label: "Phòng ban",
          options: data?.departments.map((x) => ({
            value: x.id,
            label: x.name,
          })),
        },
        {
          key: "positionId",
          label: "Chức vụ",
          options: data?.positions.map((x) => ({ value: x.id, label: x.name })),
        },
        {
          key: "role",
          label: "Quyền truy cập",
          options:
            user?.role === "admin"
              ? options("employee", "manager", "hr", "admin")
              : options("employee"),
        },
        {
          key: "status",
          label: "Trạng thái",
          options: options("probation", "active", "inactive"),
        },
        { key: "startDate", label: "Ngày vào làm", type: "date" },
        { key: "birthday", label: "Ngày sinh", type: "date", required: false },
        {
          key: "annualLeave",
          label: "Hạn mức phép mỗi năm (ngày)",
          type: "number",
          min: 0,
          max: 60,
        },
        { key: "address", label: "Địa chỉ", required: false },
      ],
    });
  }
  function add(row?: any) {
    if (tab === "employees") return employeeForm();
    const configs: Record<string, FormState> = {
      contracts: {
        title: row ? "Cập nhật hợp đồng lao động" : "Thêm hợp đồng lao động",
        path: row ? "/hr/contracts/" + row.id : "/hr/contracts",
        method: row ? "PUT" : "POST",
        values: row
          ? { ...row }
          : { type: "fixed", salary: 0, allowance: 0, startDate: day() },
        fields: [
          ...(row ? [] : [personField]),
          { key: "code", label: "Số hợp đồng" },
          {
            key: "type",
            label: "Loại hợp đồng",
            options: (data?.contractTypes || [])
              .filter((x) => x.status === "active" || x.id === row?.type)
              .map((x) => ({ value: x.id, label: x.name })),
          },
          { key: "startDate", label: "Ngày bắt đầu", type: "date" },
          {
            key: "endDate",
            label: "Ngày hết hạn (bỏ trống nếu không thời hạn)",
            type: "date",
            required: false,
          },
          {
            key: "salary",
            label: "Lương cơ bản / tháng (VND)",
            type: "number",
            min: 0,
          },
          {
            key: "allowance",
            label: "Phụ cấp / tháng (VND)",
            type: "number",
            min: 0,
          },
        ],
      },
      attendance: {
        title: "Ghi nhận / cập nhật ngày công",
        path: "/hr/attendance",
        values: { date: day(), checkIn: "08:00", checkOut: "17:00" },
        fields: [
          personField,
          { key: "date", label: "Ngày công", type: "date" },
          { key: "checkIn", label: "Giờ vào", type: "time" },
          { key: "checkOut", label: "Giờ ra", type: "time" },
          { key: "note", label: "Ghi chú", required: false },
        ],
      },
      leaves: {
        title: "Gửi đơn nghỉ phép của tôi",
        path: "/hr/leaves",
        values: { type: "annual", startDate: day(), endDate: day() },
        fields: [
          {
            key: "type",
            label: "Loại nghỉ",
            options: options("annual", "unpaid"),
          },
          { key: "startDate", label: "Từ ngày", type: "date" },
          { key: "endDate", label: "Đến ngày", type: "date" },
          { key: "reason", label: "Lý do", type: "textarea" },
        ],
      },
      payroll: {
        title: "Tính / cập nhật bảng lương nháp",
        path: "/hr/payroll",
        values: { month: previousMonth(), bonus: 0, deduction: 0 },
        fields: [
          personField,
          { key: "month", label: "Tháng đã kết thúc", type: "month" },
          { key: "bonus", label: "Thưởng (VND)", type: "number", min: 0 },
          {
            key: "deduction",
            label: "Tổng khấu trừ đã xác định (VND)",
            type: "number",
            min: 0,
          },
        ],
      },
      evaluations: {
        title: "Đánh giá nhân viên theo tháng",
        path: "/hr/evaluations",
        values: { month: day().slice(0, 7), score: 80 },
        fields: [
          personField,
          { key: "month", label: "Tháng đánh giá", type: "month" },
          {
            key: "score",
            label: "Điểm (0–100)",
            type: "number",
            min: 0,
            max: 100,
          },
          {
            key: "note",
            label: "Nhận xét & mục tiêu cải thiện",
            type: "textarea",
          },
        ],
      },
      rewards: {
        title: row ? "Cập nhật khen thưởng" : "Thêm khen thưởng",
        path: row
          ? `/hr/operations/recognitions/${row.id}`
          : "/hr/operations/recognitions",
        method: row ? "PUT" : "POST",
        values: row ? { ...row } : { kind: "reward", date: day() },
        fields: [
          personField,
          { key: "date", label: "Ngày khen thưởng", type: "date" },
          { key: "title", label: "Hình thức khen thưởng" },
          { key: "note", label: "Ghi chú", type: "textarea", required: false },
        ],
      },
      discipline: {
        title: row ? "Cập nhật kỷ luật" : "Thêm kỷ luật",
        path: row
          ? `/hr/operations/recognitions/${row.id}`
          : "/hr/operations/recognitions",
        method: row ? "PUT" : "POST",
        values: row ? { ...row } : { kind: "discipline", date: day() },
        fields: [
          personField,
          { key: "date", label: "Ngày kỷ luật", type: "date" },
          { key: "title", label: "Hình thức kỷ luật" },
          { key: "note", label: "Ghi chú", type: "textarea", required: false },
        ],
      },
      timecards: {
        title: row ? "Cập nhật đăng ký thẻ" : "Đăng ký thẻ chấm công",
        path: row
          ? `/hr/operations/time-cards/${row.id}`
          : "/hr/operations/time-cards",
        method: row ? "PUT" : "POST",
        values: row ? { ...row } : { type: "new" },
        fields: [
          personField,
          { key: "cardNumber", label: "Mã thẻ nhân viên" },
          {
            key: "type",
            label: "Loại đăng ký",
            options: options("new", "replace", "reissue"),
          },
          { key: "note", label: "Ghi chú", type: "textarea", required: false },
        ],
      },
      shiftAssignments: {
        title: row ? "Cập nhật phân ca" : "Sắp ca làm việc",
        path: row
          ? `/hr/operations/shift-assignments/${row.id}`
          : "/hr/operations/shift-assignments",
        method: row ? "PUT" : "POST",
        values: row ? { ...row } : { startDate: day(), endDate: day() },
        fields: [
          personField,
          {
            key: "shiftId",
            label: "Ca làm việc",
            options: (data?.shifts || []).map((x) => ({
              value: x.id,
              label: `${x.name} (${x.startTime}–${x.endTime})`,
            })),
          },
          { key: "startDate", label: "Từ ngày", type: "date" },
          { key: "endDate", label: "Đến ngày", type: "date" },
        ],
      },
      shiftCatalog: {
        title: row ? "Cập nhật ca làm việc" : "Thêm ca làm việc",
        path: row
          ? `/hr/operations/shifts/${row.id}`
          : "/hr/operations/shifts",
        method: row ? "PUT" : "POST",
        values: row
          ? { ...row }
          : { startTime: "08:00", endTime: "17:00" },
        fields: [
          { key: "code", label: "Mã ca" },
          { key: "name", label: "Tên ca" },
          { key: "startTime", label: "Giờ bắt đầu", type: "time" },
          { key: "endTime", label: "Giờ kết thúc", type: "time" },
        ],
      },
      contractTypes: {
        title: row ? "Cập nhật loại hợp đồng" : "Thêm loại hợp đồng",
        path: row
          ? `/hr/operations/contract-types/${row.id}`
          : "/hr/operations/contract-types",
        method: row ? "PUT" : "POST",
        values: row
          ? { ...row }
          : { durationMonths: 12, status: "active" },
        fields: [
          { key: "code", label: "Mã loại hợp đồng" },
          { key: "name", label: "Tên hợp đồng (VN)" },
          { key: "englishName", label: "Tên hợp đồng (EN)", required: false },
          { key: "durationMonths", label: "Số tháng (0 = vô thời hạn)", type: "number", min: 0, max: 1200 },
          { key: "status", label: "Trạng thái", options: options("active", "inactive") },
        ],
      },
      holidays: {
        title: row ? "Cập nhật ngày nghỉ lễ" : "Thêm ngày nghỉ lễ",
        path: row
          ? `/hr/operations/holidays/${row.id}`
          : "/hr/operations/holidays",
        method: row ? "PUT" : "POST",
        values: row ? { ...row } : { date: day() },
        fields: [
          { key: "name", label: "Tên ngày nghỉ" },
          { key: "date", label: "Ngày nghỉ", type: "date" },
        ],
      },
      attendanceMachines: {
        title: row ? "Cập nhật máy chấm công" : "Thêm máy chấm công",
        path: row
          ? `/hr/operations/attendance-machines/${row.id}`
          : "/hr/operations/attendance-machines",
        method: row ? "PUT" : "POST",
        values: row ? { ...row } : { status: "active" },
        fields: [
          { key: "code", label: "Mã máy" },
          { key: "name", label: "Tên máy chấm công (VN)" },
          { key: "englishName", label: "Tên máy chấm công (EN)", required: false },
          { key: "location", label: "Vị trí" },
          { key: "brand", label: "Thương hiệu" },
          { key: "model", label: "Kiểu máy" },
          { key: "status", label: "Trạng thái", options: options("active", "inactive") },
        ],
      },
    };
    if (configs[tab]) setForm(configs[tab]);
  }
  if (booting)
    return (
      <main className="loading" role="status">
        Đang kiểm tra phiên đăng nhập…
      </main>
    );
  if (!user)
    return (
      <>
        <Login
          onLogin={(u) => {
            setUser(u);
            setError("");
            setTab("dashboard");
          }}
        />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </>
    );
  const title = tabs.find((x) => x[0] === tab)?.[1];
  const canAdd =
    tab === "leaves" ||
    (isHR &&
      [
        "employees",
        "contracts",
        "attendance",
        "payroll",
        "rewards",
        "discipline",
        "timecards",
        "shiftAssignments",
        "shiftCatalog",
        "contractTypes",
        "holidays",
        "attendanceMachines",
      ].includes(tab)) ||
    (isReviewer && tab === "evaluations");
  type Row = {
    id: string;
    cells: React.ReactNode[];
    raw: string[];
    source: any;
  };
  let headers: string[] = [];
  let rows: Row[] = [];
  const badge = (value: string) => (
    <span className={cn("badge", value)}>{labels[value] || value}</span>
  );
  if (data) {
    if (tab === "registrations" && isHR) {
      headers = ["Họ tên", "Email đăng ký", "Ngày gửi", "Trạng thái", "Mã nhân viên", "Ý kiến duyệt"];
      rows = (data.registrations || []).map(x => {
        const raw = [x.name, x.email, new Date(x.createdAt).toLocaleString("vi-VN"), labels[x.status], x.employeeId || "—", x.reviewNote || "—"];
        return { id: x.id, raw, cells: [raw[0], raw[1], raw[2], badge(x.status), raw[4], raw[5]], source: x };
      });
    }
    if (tab === "employees") {
      headers = [
        "Mã NV",
        "Họ tên",
        "Phòng ban",
        "Chức vụ",
        "Email",
        "Ngày vào làm",
        "Trạng thái",
      ];
      rows = data.employees.map((x) => {
        const raw = [
          x.id,
          x.name,
          category("departments", x.departmentId),
          category("positions", x.positionId),
          x.email,
          x.startDate,
          labels[x.status],
        ];
        return {
          id: x.id,
          raw,
          cells: [...raw.slice(0, -1), badge(x.status)],
          source: x,
        };
      });
    }
    if (tab === "contracts") {
      headers = [
        "Số HĐ",
        "Nhân viên",
        "Loại",
        "Bắt đầu",
        "Hết hạn",
        "Lương cơ bản",
        "Phụ cấp",
      ];
      rows = data.contracts.map((x) => {
        const raw = [
          x.code,
          name(x.employeeId),
          contractTypeName(x.type),
          x.startDate,
          x.endDate || "Không thời hạn",
          currency(x.salary),
          currency(x.allowance),
        ];
        return { id: x.id, raw, cells: raw, source: x };
      });
    }
    if (tab === "rewards" || tab === "discipline") {
      const kind = tab === "rewards" ? "reward" : "discipline";
      headers = ["Nhân viên", "Phòng ban", "Ngày", "Hình thức", "Ghi chú"];
      rows = data.recognitions
        .filter((x) => x.kind === kind)
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((x) => {
          const person = data.employees.find((e) => e.id === x.employeeId);
          const raw = [
            name(x.employeeId),
            person ? category("departments", person.departmentId) : "",
            x.date,
            x.title,
            x.note,
          ];
          return { id: x.id, raw, cells: raw, source: x };
        });
    }
    if (tab === "timecards") {
      headers = ["Nhân viên", "Vị trí làm việc", "Mã thẻ", "Loại đăng ký", "Ghi chú"];
      rows = data.timeCards.map((x) => {
        const person = data.employees.find((e) => e.id === x.employeeId);
        const raw = [
          name(x.employeeId),
          person
            ? `${category("departments", person.departmentId)} · ${category("positions", person.positionId)}`
            : "",
          x.cardNumber,
          labels[x.type],
          x.note,
        ];
        return { id: x.id, raw, cells: raw, source: x };
      });
    }
    if (tab === "shiftAssignments") {
      headers = ["Nhân viên", "Vị trí làm việc", "Ca làm việc", "Từ ngày", "Đến ngày"];
      rows = data.shiftAssignments
        .slice()
        .sort((a, b) => b.startDate.localeCompare(a.startDate))
        .map((x) => {
          const person = data.employees.find((e) => e.id === x.employeeId);
          const raw = [
            name(x.employeeId),
            person
              ? `${category("departments", person.departmentId)} · ${category("positions", person.positionId)}`
              : "",
            shiftName(x.shiftId),
            x.startDate,
            x.endDate,
          ];
          return { id: x.id, raw, cells: raw, source: x };
        });
    }
    if (tab === "shiftCatalog") {
      headers = ["Mã ca", "Tên ca làm việc", "Giờ bắt đầu", "Giờ kết thúc"];
      rows = data.shifts.map((x) => {
        const raw = [x.code, x.name, x.startTime, x.endTime];
        return { id: x.id, raw, cells: raw, source: x };
      });
    }
    if (tab === "contractTypes") {
      headers = ["Tên hợp đồng VN", "Tên hợp đồng EN", "Số tháng", "Trạng thái"];
      rows = data.contractTypes.map((x) => {
        const raw = [
          x.name,
          x.englishName,
          x.durationMonths ? String(x.durationMonths) : "Không thời hạn",
          labels[x.status],
        ];
        return {
          id: x.id,
          raw,
          cells: [...raw.slice(0, -1), badge(x.status)],
          source: x,
        };
      });
    }
    if (tab === "holidays") {
      headers = ["Tên ngày nghỉ", "Ngày nghỉ"];
      rows = data.holidays
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((x) => {
          const raw = [x.name, x.date];
          return { id: x.id, raw, cells: raw, source: x };
        });
    }
    if (tab === "attendanceMachines") {
      headers = ["Tên máy VN", "Tên máy EN", "Vị trí", "Thương hiệu", "Kiểu máy", "Trạng thái"];
      rows = data.attendanceMachines.map((x) => {
        const raw = [x.name, x.englishName, x.location, x.brand, x.model, labels[x.status]];
        return {
          id: x.id,
          raw,
          cells: [...raw.slice(0, -1), badge(x.status)],
          source: x,
        };
      });
    }
    if (tab === "attendance") {
      headers = ["Nhân viên", "Ngày công", "Giờ vào", "Giờ ra", "Ghi chú"];
      rows = data.attendance
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((x) => {
          const raw = [
            name(x.employeeId),
            x.date,
            x.checkIn,
            x.checkOut,
            x.note,
          ];
          return { id: x.id, raw, cells: raw, source: x };
        });
    }
    if (tab === "leaves") {
      headers = [
        "Nhân viên",
        "Loại nghỉ",
        "Từ ngày",
        "Đến ngày",
        "Số ngày",
        "Lý do",
        "Trạng thái",
        "Ý kiến duyệt",
      ];
      rows = data.leaves
        .slice()
        .reverse()
        .map((x) => {
          const raw = [
            name(x.employeeId),
            labels[x.type],
            x.startDate,
            x.endDate,
            String(x.days),
            x.reason,
            labels[x.status],
            x.reviewNote || "",
          ];
          return {
            id: x.id,
            raw,
            cells: [...raw.slice(0, 6), badge(x.status), raw[7]],
            source: x,
          };
        });
    }
    if (tab === "payroll") {
      headers = [
        "Nhân viên",
        "Kỳ lương",
        "Công / Chuẩn",
        "Phép hưởng lương",
        "Lương cơ bản",
        "Phụ cấp",
        "Thưởng",
        "Khấu trừ",
        "Thực nhận",
        "Trạng thái",
      ];
      rows = data.payroll
        .slice()
        .sort((a, b) => b.month.localeCompare(a.month))
        .map((x) => {
          const raw = [
            name(x.employeeId),
            x.month,
            `${x.workedDays} / ${x.standardDays}`,
            String(x.paidLeaveDays),
            currency(x.baseSalary),
            currency(x.allowance),
            currency(x.bonus),
            currency(x.deduction),
            currency(x.net),
            labels[x.status],
          ];
          return {
            id: x.id,
            raw,
            cells: [...raw.slice(0, -1), badge(x.status)],
            source: x,
          };
        });
    }
    if (tab === "evaluations") {
      headers = [
        "Nhân viên",
        "Tháng",
        "Điểm / 100",
        "Nhận xét",
        "Người đánh giá",
      ];
      rows = data.evaluations.map((x) => {
        const raw = [
          name(x.employeeId),
          x.month,
          String(x.score),
          x.note,
          name(x.reviewerId),
        ];
        return { id: x.id, raw, cells: raw, source: x };
      });
    }
    if (tab === "audits") {
      headers = ["Thời gian", "Người thao tác", "Hành động", "Đối tượng"];
      rows = data.audits.map((x) => {
        const raw = [
          new Date(x.at).toLocaleString("vi-VN"),
          name(x.actorId),
          x.action,
          x.targetId,
        ];
        return { id: x.id, raw, cells: raw, source: x };
      });
    }
  }
  rows = rows.filter(
    (row) =>
      row.raw
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(search.toLocaleLowerCase("vi")) &&
      (!filter || row.source.status === filter) &&
      (!period ||
        (
          row.source.month ||
          row.source.date ||
          row.source.startDate ||
          ""
        ).startsWith(period)),
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / 15));
  const currentPage = Math.min(page, pageCount);
  function exportCSV() {
    const cell = (value: string) =>
      '"' +
      (/^[=+\-@\t\r]/.test(value) ? "'" + value : value).replaceAll('"', '""') +
      '"';
    const csv =
      "\ufeff" +
      [headers, ...rows.map((row) => row.raw)]
        .map((row) => row.map(cell).join(","))
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `nhan-su-${tab}-${day()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function rowActions(row: Row) {
    const x = row.source;
    if (tab === "registrations" && isHR && x.status === "pending") return <>
      <button disabled={busy} onClick={() => setForm({
        title: `Kích hoạt tài khoản · ${x.name}`, path: `/hr/registrations/${encodeURIComponent(x.id)}/review`,
        values: { status: "approved", startDate: day(), annualLeave: 12, departmentId: data?.departments[0]?.id, positionId: data?.positions[0]?.id },
        fields: [{ key: "employeeId", label: "Mã nhân viên mới" }, { key: "departmentId", label: "Phòng ban", options: data?.departments.map(d => ({ value: d.id, label: d.name })) }, { key: "positionId", label: "Chức vụ", options: data?.positions.map(p => ({ value: p.id, label: p.name })) }, { key: "startDate", label: "Ngày vào làm", type: "date" }, { key: "annualLeave", label: "Phép năm (ngày)", type: "number", min: 0, max: 60 }]
      })}>Kích hoạt</button>
      <button disabled={busy} onClick={() => setForm({ title: `Từ chối đăng ký · ${x.name}`, path: `/hr/registrations/${encodeURIComponent(x.id)}/review`, values: { status: "rejected" }, fields: [{ key: "reviewNote", label: "Lý do từ chối", type: "textarea" }] })}>Từ chối</button>
    </>;
    if (tab === "contracts" && isHR)
      return (
        <button disabled={busy} onClick={() => add(x)}>
          Sửa
        </button>
      );
    if (tab === "attendance" && isHR)
      return (
        <button
          disabled={busy}
          onClick={() => {
            setConfirmation({ title: "Xóa ngày công?", description: "Ngày công sẽ được gỡ khỏi hồ sơ. Kỳ lương đã chốt sẽ không cho phép xóa.", path: "/hr/attendance/" + x.id, method: "DELETE", label: "Xóa ngày công" });
          }}
        >
          Xóa công
        </button>
      );
    if (tab === "employees" && isHR)
      return (
        <>
          <button
            disabled={busy || (user.role !== "admin" && x.role !== "employee")}
            onClick={() => employeeForm(x)}
          >
            Sửa
          </button>
          {user.role === "admin" && (
            <button
              disabled={busy}
              onClick={() =>
                setForm({
                  title: `Đặt lại mật khẩu · ${x.name}`,
                  path: `/hr/employees/${encodeURIComponent(x.id)}/password`,
                  values: {},
                  fields: [
                    {
                      key: "password",
                      label: "Mật khẩu mới",
                      type: "password",
                    },
                  ],
                })
              }
            >
              Mật khẩu
            </button>
          )}
        </>
      );
    if (tab === "leaves" && x.status === "pending")
      return x.employeeId === user!.id ? (
        <button
          disabled={busy}
          onClick={() => {
            setConfirmation({ title: "Hủy đơn nghỉ phép?", description: "Đơn này sẽ chuyển sang trạng thái đã hủy. Bạn có thể gửi một đơn mới nếu cần.", path: `/hr/leaves/${x.id}/review`, values: { status: "cancelled" }, label: "Hủy đơn" });
          }}
        >
          Hủy đơn
        </button>
      ) : isReviewer ? (
        <button
          disabled={busy}
          onClick={() =>
            setForm({
              title: `Xử lý nghỉ phép · ${name(x.employeeId)}`,
              path: `/hr/leaves/${x.id}/review`,
              values: { status: "approved" },
              fields: [
                {
                  key: "status",
                  label: "Quyết định",
                  options: options("approved", "rejected"),
                },
                {
                  key: "reviewNote",
                  label: "Ý kiến (bắt buộc khi từ chối)",
                  type: "textarea",
                  required: false,
                },
              ],
            })
          }
        >
          Xử lý
        </button>
      ) : null;
    if (tab === "payroll" && isHR && x.status === "draft")
      return (
        <button
          disabled={busy}
          onClick={() => {
            setConfirmation({ title: "Chốt bảng lương?", description: "Ngày công và nghỉ phép của kỳ này sẽ bị khóa. Hãy kiểm tra số liệu trước khi chốt.", path: `/hr/payroll/${x.id}/finalize`, label: "Chốt lương" });
          }}
        >
          Chốt lương
        </button>
      );
    const operationByTab: Record<string, string> = {
      rewards: "recognitions",
      discipline: "recognitions",
      timecards: "time-cards",
      shiftAssignments: "shift-assignments",
      shiftCatalog: "shifts",
      contractTypes: "contract-types",
      holidays: "holidays",
      attendanceMachines: "attendance-machines",
    };
    if (isHR && operationByTab[tab])
      return (
        <>
          <button disabled={busy} onClick={() => add(x)}>
            Sửa
          </button>
          <button
            className="danger-button"
            disabled={busy}
            onClick={() => {
              setConfirmation({ title: "Xóa bản ghi?", description: "Thao tác này không thể hoàn tác. Dữ liệu đang được sử dụng sẽ không thể xóa.", path: `/hr/operations/${operationByTab[tab]}/${x.id}`, method: "DELETE", label: "Xóa bản ghi" });
            }}
          >
            Xóa
          </button>
        </>
      );
    return null;
  }
  const hasActions =
    ([
      "registrations",
      "employees",
      "contracts",
      "attendance",
      "rewards",
      "discipline",
      "timecards",
      "shiftAssignments",
      "shiftCatalog",
      "contractTypes",
      "holidays",
      "attendanceMachines",
    ].includes(tab) && isHR) ||
    tab === "leaves" ||
    (tab === "payroll" && isHR);
  const year = day().slice(0, 4);
  const usedLeave =
    data?.leaves
      .filter(
        (x) =>
          x.employeeId === user.id &&
          x.status === "approved" &&
          x.type === "annual" &&
          x.startDate.startsWith(year),
      )
      .reduce((n, x) => n + x.days, 0) || 0;
  return (
    <div className="hr-shell">
      <a className="skip-link" href="#main">
        Đến nội dung chính
      </a>
      <aside className={cn("sidebar", navOpen && "nav-open")}>
        <div className="brand">
          <span className="brand-mark">
            <BrandMark />
          </span>
          <div>
            SHC<span>PEOPLE &amp; WORK</span>
          </div>
        </div>
        <button className="workspace-menu" aria-expanded={navOpen} aria-controls="workspace-navigation" onClick={() => setNavOpen(!navOpen)}><Menu size={18} />{navOpen ? "Đóng danh mục" : "Danh mục"}</button>
        <nav id="workspace-navigation" aria-label="Chức năng nhân sự">
          {navSections.map((section) => {
            const items = section.ids
              .map((id) => tabs.find((item) => item[0] === id))
              .filter(
                (item): item is (typeof tabs)[number] =>
                  !!item &&
                  (isHR ||
                    ![
                      "organization",
                      "shiftCatalog",
                      "contractTypes",
                      "attendanceMachines",
                      "audits",
                      "registrations",
                    ].includes(item[0])),
              );
            if (!items.length) return null;
            return (
              <section className="nav-group" key={section.label}>
                <p className="nav-label">{section.label}</p>
                {items.map(([id, label, Icon]) => (
                  <button
                    key={id}
                    className={cn(tab === id && "selected")}
                    aria-current={tab === id ? "page" : undefined}
                    onClick={() => {
                      setTab(id);
                      setNavOpen(false);
                      setSearch("");
                      setFilter("");
                      setPeriod("");
                      setNotice("");
                      if (id === "announcements" || id === "notifications")
                        void refresh();
                    }}
                  >
                    <Icon size={18} />
                    {label}
                    {id === "registrations" && !!data?.registrations?.some(x => x.status === "pending") && <span className="nav-count">{data.registrations.filter(x => x.status === "pending").length}</span>}
                  </button>
                ))}
              </section>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <ShieldCheck size={18} />
          <span>
            {labels[user.role] || user.role}
            <small>Cổng nhân sự nội bộ</small>
          </span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="muted">Không gian làm việc <span aria-hidden="true">/</span> <strong>{title}</strong></span>
          <div>
            <button className="icon-button shc-bell" aria-label={`Thông báo: ${data?.notifications.filter(x => !x.readAt).length || 0} chưa đọc`} title="Thông báo" onClick={() => { setTab('notifications'); void refresh(); }}>
              <Bell size={20}/>
              {!!data?.notifications.some(x => !x.readAt) && <span className="shc-badge" aria-hidden="true">{Math.min(data.notifications.filter(x => !x.readAt).length, 99)}</span>}
            </button>
            <span className="avatar">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <span>
              {user.name}
              <small>{user.id} · {labels[user.role] || user.role}</small>
            </span>
            <button
              className="icon-button"
              title="Đổi mật khẩu"
              aria-label="Đổi mật khẩu"
              onClick={() =>
                setForm({
                  title: "Đổi mật khẩu",
                  path: "/auth/password",
                  values: {},
                  fields: [
                    {
                      key: "currentPassword",
                      label: "Mật khẩu hiện tại",
                      type: "password",
                    },
                    {
                      key: "password",
                      label: "Mật khẩu mới",
                      type: "password",
                    },
                  ],
                })
              }
            >
              <LockKeyhole size={19} />
            </button>
            <button
              className="icon-button"
              title="Đăng xuất"
              aria-label="Đăng xuất"
              disabled={busy}
              onClick={async () => {
                try {
                  await api("/auth/logout", "POST", {});
                  setUser(null);
                  setData(null);
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>
        <main id="main">
          <div className="page-head">
            <div>
              <p className="eyebrow">
                NHÂN SỰ / {isHR ? "QUẢN TRỊ" : "CỔNG NHÂN VIÊN"}
              </p>
              <h1>{tab === "dashboard" ? `Chào ${user.name.split(" ").pop()},` : title}</h1>
              <p className="muted">
                {tab === "dashboard"
                  ? `Cùng bắt đầu một ngày có tổ chức. ${new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}.`
                  : tab === "employees"
                    ? isHR
                      ? "Quản lý vòng đời nhân viên từ tiếp nhận đến nghỉ việc."
                      : "Thông tin nhân viên trong phạm vi được cấp quyền."
                    : tab === "leaves"
                      ? `Phép năm ${year} của tôi: còn ${user.annualLeave - usedLeave} / ${user.annualLeave} ngày.`
                      : ""}
              </p>
            </div>
            <div className="head-actions">
              <button disabled={loading || busy} onClick={() => void refresh()}>
                <RefreshCw size={16} />
                Làm mới
              </button>
              {canAdd && (
                <button
                  className="primary"
                  disabled={!data || busy}
                  onClick={() => add()}
                >
                  <Plus size={17} />
                  {tab === "attendance"
                    ? "Ghi nhận công"
                    : tab === "payroll"
                      ? "Tính lương"
                      : tab === "leaves"
                        ? "Gửi đơn nghỉ"
                        : "Thêm mới"}
                </button>
              )}
            </div>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="success" role="status">
              {notice}
            </p>
          )}
          {loading && (
            <p className="muted" role="status">
              Đang cập nhật dữ liệu…
            </p>
          )}
          {data && tab === "dashboard" && (
            <>
              <div className="stats">
                <article>
                  <span>Nhân viên đang làm</span>
                  <strong>
                    {
                      data.employees.filter((x) => x.status !== "inactive")
                        .length
                    }
                  </strong>
                  <small>
                    {isHR ? "Toàn công ty" : "Trong phạm vi được xem"}
                  </small>
                </article>
                <article>
                  <span>Sinh nhật trong tháng</span>
                  <strong>
                    {
                      data.employees.filter(
                        (x) =>
                          x.birthday &&
                          x.birthday.slice(5, 7) === day().slice(5, 7),
                      ).length
                    }
                  </strong>
                  <small>Nhắc việc chăm sóc nhân sự</small>
                </article>
                <article>
                  <span>Đơn nghỉ chờ duyệt</span>
                  <strong>
                    {data.leaves.filter((x) => x.status === "pending").length}
                  </strong>
                  <button onClick={() => setTab("leaves")}>
                    Xem đơn nghỉ →
                  </button>
                </article>
                <article>
                  <span>Hợp đồng sắp hết hạn</span>
                  <strong>
                    {
                      data.contracts.filter(
                        (x) =>
                          x.endDate &&
                          x.endDate >= day() &&
                          +new Date(x.endDate) - +new Date(day()) <=
                            30 * 86400000,
                      ).length
                    }
                  </strong>
                  <small>Trong 30 ngày tới</small>
                </article>
                <article>
                  <span>Phép năm còn lại của tôi</span>
                  <strong>
                    {user.annualLeave - usedLeave}
                    <em> ngày</em>
                  </strong>
                  <small>Năm {year}</small>
                </article>
                <article>
                  <span>Nhân viên đã xếp ca</span>
                  <strong>
                    {
                      new Set(
                        data.shiftAssignments
                          .filter(
                            (x) => x.startDate <= day() && x.endDate >= day(),
                          )
                          .map((x) => x.employeeId),
                      ).size
                    }
                    <em>
                      {" "}
                      /{" "}
                      {
                        data.employees.filter((x) => x.status !== "inactive")
                          .length
                      }
                    </em>
                  </strong>
                  <button onClick={() => setTab("shiftAssignments")}>
                    Xem lịch phân ca →
                  </button>
                </article>
              </div>
              <div className="dashboard-grid">
                <section className="panel">
                  <div className="section-head">
                    <h2>{isHR ? "Phân bố nhân sự" : "Hồ sơ của tôi"}</h2>
                    <Users size={20} />
                  </div>
                  {isHR ? (
                    data.departments.map((d) => {
                      const count = data.employees.filter(
                        (x) =>
                          x.departmentId === d.id && x.status !== "inactive",
                      ).length;
                      return (
                        <div className="department-row" key={d.id}>
                          <div>
                            <span>{d.name}</span>
                            <strong>{count}</strong>
                          </div>
                          <progress
                            value={count}
                            max={Math.max(
                              1,
                              data.employees.filter(
                                (x) => x.status !== "inactive",
                              ).length,
                            )}
                            aria-label={`Nhân viên phòng ${d.name}`}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <dl>
                      <dt>Phòng ban</dt>
                      <dd>{category("departments", user.departmentId)}</dd>
                      <dt>Chức vụ</dt>
                      <dd>{category("positions", user.positionId)}</dd>
                      <dt>Ngày vào làm</dt>
                      <dd>{user.startDate}</dd>
                      <dt>Email</dt>
                      <dd>{user.email}</dd>
                    </dl>
                  )}
                </section>
                <section className="panel">
                  <div className="section-head">
                    <h2>Cần theo dõi</h2>
                    <CalendarDays size={20} />
                  </div>
                  {data.contracts
                    .filter(
                      (x) =>
                        x.endDate &&
                        +new Date(x.endDate) - +new Date(day()) <=
                          30 * 86400000,
                    )
                    .slice(0, 6)
                    .map((x) => (
                      <div className="attention-row" key={x.id}>
                        <span>
                          <strong>{name(x.employeeId)}</strong>
                          <small>
                            {x.code} · Hết hạn {x.endDate}
                          </small>
                        </span>
                        <span
                          className={cn("badge", x.endDate < day() ? "rejected" : "pending")}
                        >
                          {x.endDate < day() ? "Đã hết hạn" : "Sắp hết hạn"}
                        </span>
                      </div>
                    ))}
                  {!data.contracts.some(
                    (x) =>
                      x.endDate &&
                      +new Date(x.endDate) - +new Date(day()) <= 30 * 86400000,
                  ) && (
                    <div className="empty">
                      <ShieldCheck size={30} />
                      <p>Chưa có hợp đồng cần gia hạn.</p>
                    </div>
                  )}
                  <div className="quick-actions">
                    <button onClick={() => setTab("attendance")}>
                      Xem ngày công
                    </button>
                    <button onClick={() => setTab("payroll")}>
                      Xem bảng lương
                    </button>
                  </div>
                </section>
              </div>
            </>
          )}
          {data && tab === "organization" && isHR && (
            <div className="dashboard-grid">
              {(["departments", "positions"] as const).map((kind) => (
                <section className="panel" key={kind}>
                  <div className="section-head">
                    <h2>{kind === "departments" ? "Phòng ban" : "Chức vụ"}</h2>
                    <button
                      disabled={busy}
                      onClick={() =>
                        setForm({
                          title:
                            kind === "departments"
                              ? "Thêm phòng ban"
                              : "Thêm chức vụ",
                          path: `/hr/categories/${kind}`,
                          values: {},
                          fields: [{ key: "name", label: "Tên" }],
                        })
                      }
                    >
                      <Plus size={16} />
                      Thêm
                    </button>
                  </div>
                  {data[kind].map((x) => (
                    <div className="attention-row" key={x.id}>
                      <span>
                        <strong>{x.name}</strong>
                        <small>
                          {
                            data.employees.filter(
                              (e) =>
                                e[
                                  kind === "departments"
                                    ? "departmentId"
                                    : "positionId"
                                ] === x.id,
                            ).length
                          }{" "}
                          nhân viên
                        </small>
                      </span>
                      <button
                        disabled={busy}
                        onClick={() =>
                          setForm({
                            title: "Đổi tên danh mục",
                            path: "/hr/categories/" + kind + "/" + x.id,
                            method: "PUT",
                            values: { name: x.name },
                            fields: [{ key: "name", label: "Tên" }],
                          })
                        }
                      >
                        Sửa
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => {
                          setConfirmation({ title: `Xóa ${x.name}?`, description: "Thao tác này không thể hoàn tác. Danh mục đang sử dụng sẽ không được xóa.", path: `/hr/categories/${kind}/${x.id}`, method: "DELETE", label: "Xóa danh mục" });
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          )}
          {tab === "payroll" && (
            <p className="info">
              Công thức đồ án: (lương cơ bản + phụ cấp) × (ngày công + phép
              hưởng lương) / ngày làm việc chuẩn + thưởng − khấu trừ. Lịch thứ
              Hai–thứ Sáu, một bản ghi công tính một ngày. Chưa tự tính thuế,
              bảo hiểm, tăng ca hoặc ngày lễ.
            </p>
          )}
          {tab === "attendance" && (
            <p className="info">
              Nhân sự ghi nhận công theo ngày. Ghi lại cùng nhân viên và ngày sẽ
              cập nhật bản ghi đó. Danh mục máy chấm công và lịch phân ca được
              quản lý riêng; kết nối dữ liệu trực tiếp từ thiết bị vật lý chưa
              được bật.
            </p>
          )}
          {tab === "registrations" && isHR && <p className="info">Tài khoản tự đăng ký chưa được truy cập dữ liệu nội bộ. Khi kích hoạt, hãy gán mã nhân viên, phòng ban và chức vụ; hệ thống chỉ cấp quyền nhân viên.</p>}
          {data && tab === 'announcements' && <AnnouncementBoard data={data} isHR={isHR} busy={busy} mutate={mutate}/>}
          {data && tab === 'notifications' && <NotificationCenter data={data} busy={busy} mutate={mutate} navigate={next => { setTab(next); setSearch(''); setFilter(''); setPeriod(''); }}/>}
          {data && !["dashboard", "organization", "announcements", "notifications"].includes(tab) && (
            <section className={cn("table-panel", `table-${tab}`)}>
              <div className="toolbar">
                <label className="search">
                  <Search size={18} />
                  <input
                    aria-label="Tìm kiếm trong danh sách"
                    placeholder="Tìm theo tên, mã hoặc nội dung…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                {[
                  "registrations",
                  "employees",
                  "leaves",
                  "payroll",
                  "contractTypes",
                  "attendanceMachines",
                ].includes(tab) && (
                  <select
                    aria-label="Lọc trạng thái"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="">Tất cả trạng thái</option>
                    {(tab === "employees"
                      ? options("active", "probation", "inactive")
                      : tab === "registrations" ? options("pending", "approved", "rejected") : tab === "leaves"
                        ? options(
                            "pending",
                            "approved",
                            "rejected",
                            "cancelled",
                          )
                      : tab === "payroll"
                        ? options("draft", "finalized")
                        : options("active", "inactive")
                    ).map((x) => (
                      <option key={x.value} value={x.value}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                )}
                {[
                  "attendance",
                  "leaves",
                  "payroll",
                  "evaluations",
                  "rewards",
                  "discipline",
                  "shiftAssignments",
                  "holidays",
                ].includes(tab) && (
                  <input
                    type="month"
                    aria-label="Lọc tháng"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                  />
                )}
                <button onClick={exportCSV} disabled={!rows.length}>
                  <Download size={16} />
                  Xuất CSV
                </button>
              </div>
              <p className="mobile-table-hint">↔ Vuốt ngang bảng để xem thêm thông tin</p>
              <div className="table-scroll" tabIndex={0} role="region" aria-label={`Bảng ${title}`}>
                <table>
                  <thead>
                    <tr>
                      {headers.map((h) => (
                        <th key={h} scope="col">
                          {h}
                        </th>
                      ))}
                      {hasActions && <th className="table-action-heading" scope="col">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows
                      .slice((currentPage - 1) * 15, currentPage * 15)
                      .map((row) => (
                        <tr key={row.id}>
                          {row.cells.map((cell, i) => (
                            <td key={i}>{cell}</td>
                          ))}
                          {hasActions && (
                            <td className="table-action-cell">
                              <div className="row-actions">
                                {rowActions(row)}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {!rows.length && (
                <div className="empty">
                  <Users size={30} />
                  <h3>Chưa có dữ liệu phù hợp</h3>
                  <p>
                    {search || filter || period
                      ? "Thử thay đổi bộ lọc tìm kiếm."
                      : canAdd
                        ? "Bắt đầu bằng nút thêm mới ở phía trên."
                        : "Dữ liệu sẽ xuất hiện khi được nhân sự cập nhật."}
                  </p>
                </div>
              )}
              <div className="pagination">
                <span>
                  {rows.length} bản ghi · Trang {currentPage}/{pageCount}
                </span>
                <div>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Trước
                  </button>
                  <button
                    disabled={currentPage === pageCount}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Sau
                  </button>
                </div>
              </div>
            </section>
          )}
        </main>
        <footer>SHC Company <span>Con người là khởi đầu của mọi công việc.</span></footer>
      </div>
      {form && (
        <RecordDialog
          key={`${form.path}-${form.title}`}
          form={form}
          close={() => {
            if (!busy) setForm(null);
          }}
          submit={(values) => mutate(form.path, values, form.method)}
          busy={busy}
        />
      )}
      {confirmation && <ConfirmDialog request={confirmation} busy={busy} close={() => { if (!busy) setConfirmation(null); }} submit={() => mutate(confirmation.path, confirmation.values || {}, confirmation.method)} />}
    </div>
  );
}
