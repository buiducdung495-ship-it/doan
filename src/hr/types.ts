export type Role = "admin" | "hr" | "manager" | "employee";
export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  positionId: string;
  role: Role;
  status: "probation" | "active" | "inactive";
  startDate: string;
  birthday: string;
  address: string;
  annualLeave: number;
}
export interface Category {
  id: string;
  name: string;
}
export interface Contract {
  id: string;
  employeeId: string;
  code: string;
  type: string;
  startDate: string;
  endDate: string;
  salary: number;
  allowance: number;
}
export interface Recognition {
  id: string;
  employeeId: string;
  kind: "reward" | "discipline";
  date: string;
  title: string;
  note: string;
}
export interface TimeCardRegistration {
  id: string;
  employeeId: string;
  cardNumber: string;
  type: "new" | "replace" | "reissue";
  note: string;
}
export interface WorkShift {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
}
export interface ShiftAssignment {
  id: string;
  employeeId: string;
  shiftId: string;
  startDate: string;
  endDate: string;
}
export interface ContractType {
  id: string;
  code: string;
  name: string;
  englishName: string;
  durationMonths: number;
  status: "active" | "inactive";
}
export interface Holiday {
  id: string;
  name: string;
  date: string;
}
export interface AttendanceMachine {
  id: string;
  code: string;
  name: string;
  englishName: string;
  location: string;
  brand: string;
  model: string;
  status: "active" | "inactive";
}
export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  note: string;
}
export interface Leave {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  days: number;
  type: "annual" | "unpaid";
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reviewerId?: string;
  reviewNote?: string;
}
export interface Payroll {
  id: string;
  employeeId: string;
  month: string;
  baseSalary: number;
  allowance: number;
  standardDays: number;
  workedDays: number;
  paidLeaveDays: number;
  bonus: number;
  deduction: number;
  net: number;
  status: "draft" | "finalized";
}
export interface Evaluation {
  id: string;
  employeeId: string;
  month: string;
  score: number;
  note: string;
  reviewerId: string;
}
export interface Audit {
  id: string;
  actorId: string;
  action: string;
  targetId: string;
  at: string;
}
export interface HRData {
  registrations: Registration[];
  announcements: Announcement[];
  notifications: HRNotification[];
  employees: Employee[];
  departments: Category[];
  positions: Category[];
  contracts: Contract[];
  attendance: Attendance[];
  leaves: Leave[];
  payroll: Payroll[];
  evaluations: Evaluation[];
  audits: Audit[];
  recognitions: Recognition[];
  timeCards: TimeCardRegistration[];
  shifts: WorkShift[];
  shiftAssignments: ShiftAssignment[];
  contractTypes: ContractType[];
  holidays: Holiday[];
  attendanceMachines: AttendanceMachine[];
}
export interface Registration {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  employeeId?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
}
export interface Announcement {
  id: string;
  title: string;
  body: string;
  departmentId: string;
  pinned: boolean;
  archived: boolean;
  createdBy: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}
export interface HRNotification {
  id: string;
  employeeId: string;
  title: string;
  message: string;
  target: 'leaves' | 'payroll';
  createdAt: string;
  readAt?: string;
}
