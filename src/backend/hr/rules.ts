export class ValidationError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function ensure(
  condition: unknown,
  message: string,
  status = 400,
): asserts condition {
  if (!condition) throw new ValidationError(message, status);
}
export function text(
  value: unknown,
  label: string,
  required = true,
  max = 200,
) {
  ensure(
    typeof value === "string" && value.length <= max,
    `${label} không hợp lệ.`,
  );
  const result = value.trim();
  ensure(
    !required || result.length > 0,
    `Vui lòng nhập ${label.toLowerCase()}.`,
  );
  return result;
}
export function number(value: unknown, label: string, min = 0, max = 1e10) {
  ensure(
    typeof value === "number" &&
      Number.isFinite(value) &&
      value >= min &&
      value <= max,
    `${label} phải từ ${min} đến ${max}.`,
  );
  return value;
}
export function choice<T extends string>(
  value: unknown,
  options: readonly T[],
  label: string,
): T {
  ensure(options.includes(value as T), `${label} không hợp lệ.`);
  return value as T;
}
export function date(value: unknown, label = "Ngày") {
  ensure(
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value),
    `${label} không hợp lệ.`,
  );
  const parsed = new Date(`${value}T00:00:00Z`);
  ensure(
    !isNaN(+parsed) && parsed.toISOString().slice(0, 10) === value,
    `${label} không hợp lệ.`,
  );
  return value;
}
export function month(value: unknown) {
  ensure(
    typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value),
    "Kỳ lương không hợp lệ.",
  );
  return value;
}
export function workdays(start: string, end: string) {
  date(start);
  date(end);
  ensure(end >= start, "Ngày kết thúc phải từ ngày bắt đầu.");
  ensure(
    (+new Date(end) - +new Date(start)) / 86400000 <= 366,
    "Khoảng ngày tối đa 366 ngày.",
  );
  let count = 0;
  const cursor = new Date(`${start}T00:00:00Z`);
  while (cursor.toISOString().slice(0, 10) <= end) {
    if (![0, 6].includes(cursor.getUTCDay())) count++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}
export function monthBounds(value: string) {
  month(value);
  const [year, m] = value.split("-").map(Number);
  return [
    `${value}-01`,
    new Date(Date.UTC(year, m, 0)).toISOString().slice(0, 10),
  ] as const;
}
export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
