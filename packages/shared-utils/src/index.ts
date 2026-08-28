/**
 * 通用工具函数
 */

/** 金额字符串格式化：'128.00' → 千分位，如 '128.00' / '1,280.50' */
export function formatMoney(value: string | number): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '0.00';
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** 数字千分位（不带小数） */
export function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN');
}

/** 手机号脱敏：138****1024 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
}

/** 展示时区：全站统一按东八区渲染，不随浏览器本地时区漂移 */
export const DISPLAY_TIME_ZONE = 'Asia/Shanghai';

function shanghaiParts(iso: string, opts: Intl.DateTimeFormatOptions): Record<string, string> | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: DISPLAY_TIME_ZONE,
    hourCycle: 'h23',
    ...opts,
  }).formatToParts(d);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return map;
}

/** 时间格式化：ISO 字符串 → 'YYYY-MM-DD'（后端日期字段可为 null，空值/非法值返回 '-'） */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  const p = shanghaiParts(iso, { year: 'numeric', month: '2-digit', day: '2-digit' });
  if (!p) return '-';
  return `${p.year}-${p.month}-${p.day}`;
}

/** 时间格式化：ISO 字符串 → 'YYYY-MM-DD HH:mm:ss'（后端日期字段可为 null，空值/非法值返回 '-'） */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  const p = shanghaiParts(iso, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  if (!p) return '-';
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

/** 防抖 */
export function debounce<T extends (...args: never[]) => void>(fn: T, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (this: unknown, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/** 深度合并（简易版） */
export function deepMerge<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    const val = override[key as keyof T];
    if (val && typeof val === 'object' && !Array.isArray(val) && typeof base[key as keyof T] === 'object') {
      result[key] = deepMerge(
        base[key as keyof T] as Record<string, unknown>,
        val as Record<string, unknown>,
      );
    } else {
      result[key] = val;
    }
  }
  return result as T;
}

/** 生成唯一 id */
export function genId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
