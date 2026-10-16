import fs from "node:fs";
import path from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { HRData, Registration } from "../../hr/types";

export interface Database extends Omit<HRData, 'registrations'> {
  registrations: (Registration & { passwordHash: string })[];
  version: 1;
  credentials: Record<string, string>;
}
export function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, hash: string) {
  const [salt, key] = hash.split(":");
  if (!salt || !key || key.length !== 128) return false;
  return timingSafeEqual(
    Buffer.from(key, "hex"),
    scryptSync(password, salt, 64),
  );
}
export function emptyDatabase(): Database {
  return {
    version: 1,
    registrations: [],
    employees: [],
    credentials: {},
    departments: [
      { id: "HR", name: "Nhân sự" },
      { id: "Tech", name: "Công nghệ" },
      { id: "Finance", name: "Tài chính" },
      { id: "Sales", name: "Kinh doanh" },
      { id: "Admin", name: "Ban điều hành" },
    ],
    positions: [
      { id: "staff", name: "Nhân viên" },
      { id: "lead", name: "Trưởng phòng" },
    ],
    contracts: [],
    attendance: [],
    leaves: [],
    payroll: [],
    evaluations: [],
    audits: [],
    announcements: [],
    notifications: [],
    recognitions: [],
    timeCards: [],
    shifts: [
      { id: "office", code: "HC", name: "Ca hành chính", startTime: "08:00", endTime: "17:00" },
      { id: "shift-1", code: "CA1", name: "Ca 1", startTime: "06:00", endTime: "14:00" },
    ],
    shiftAssignments: [],
    contractTypes: [
      { id: "probation", code: "probation", name: "Hợp đồng thử việc", englishName: "Probation contract", durationMonths: 2, status: "active" },
      { id: "fixed", code: "fixed", name: "Hợp đồng có thời hạn", englishName: "Fixed-term contract", durationMonths: 12, status: "active" },
      { id: "indefinite", code: "indefinite", name: "Hợp đồng vô thời hạn", englishName: "Indefinite contract", durationMonths: 0, status: "active" },
    ],
    holidays: [],
    attendanceMachines: [],
  };
}
// Single-process local storage: commit on disk before exposing the next snapshot.
export class HRStore {
  private data: Database;
  constructor(
    readonly filename = process.env.HR_DATA_FILE ||
      path.join(process.cwd(), "data", "hr.json"),
  ) {
    this.data = fs.existsSync(filename)
      ? JSON.parse(fs.readFileSync(filename, "utf8"))
      : emptyDatabase();
    if (
      this.data.version !== 1 ||
      !Array.isArray(this.data.employees) ||
      !this.data.credentials
    )
      throw new Error("Unsupported HR database");
    // Older version-1 files keep all records and credentials; new collections start empty.
    this.data.announcements ??= [];
    this.data.registrations ??= [];
    this.data.notifications ??= [];
    this.data.recognitions ??= [];
    this.data.timeCards ??= [];
    this.data.shifts ??= [
      { id: "office", code: "HC", name: "Ca hành chính", startTime: "08:00", endTime: "17:00" },
      { id: "shift-1", code: "CA1", name: "Ca 1", startTime: "06:00", endTime: "14:00" },
    ];
    this.data.shiftAssignments ??= [];
    this.data.contractTypes ??= [
      { id: "probation", code: "probation", name: "Hợp đồng thử việc", englishName: "Probation contract", durationMonths: 2, status: "active" },
      { id: "fixed", code: "fixed", name: "Hợp đồng có thời hạn", englishName: "Fixed-term contract", durationMonths: 12, status: "active" },
      { id: "indefinite", code: "indefinite", name: "Hợp đồng vô thời hạn", englishName: "Indefinite contract", durationMonths: 0, status: "active" },
    ];
    this.data.holidays ??= [];
    this.data.attendanceMachines ??= [];
    if (!Array.isArray(this.data.announcements) || !Array.isArray(this.data.notifications) || !Array.isArray(this.data.registrations))
      throw new Error("Unsupported communication data");
  }
  read(): Database {
    return structuredClone(this.data);
  }
  transaction<T>(fn: (draft: Database) => T): T {
    const next = this.read();
    const result = fn(next);
    fs.mkdirSync(path.dirname(this.filename), { recursive: true });
    const temporary = `${this.filename}.${randomBytes(6).toString("hex")}.tmp`;
    try {
      fs.writeFileSync(temporary, JSON.stringify(next, null, 2), {
        encoding: "utf8",
        mode: 0o600,
      });
      fs.renameSync(temporary, this.filename);
    } finally {
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
    this.data = next;
    return result;
  }
}
