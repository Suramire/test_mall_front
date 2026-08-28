/**
 * 设计令牌（Design Tokens）
 * 管理后台主题变量，供 admin-platform / admin-merchant 使用
 */

export const palette = {
  /** 品牌色（深蓝→蓝渐变，对齐 01-PRD 登录页） */
  brand: {
    primary: '#1677ff',
    gradientStart: '#0b1f4d',
    gradientEnd: '#1677ff',
  },
  /** 语义色 */
  status: {
    success: '#52c41a',
    warning: '#faad14',
    danger: '#f5222d',
    info: '#1677ff',
  },
  /** 涨红跌绿（国内习惯） */
  trend: {
    up: '#f5222d', // 上涨=红
    down: '#52c41a', // 下跌=绿
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  base: 14,
  md: 16,
  lg: 18,
  xl: 24,
} as const;

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
} as const;
