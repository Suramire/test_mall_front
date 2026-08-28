/**
 * 共享类型定义（对齐 docs/architecture/03-API设计.md）
 * 统一响应体 / 分页 / 字段类型约定 / 公共枚举
 */

/** 统一响应体 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  traceId: string;
}

/** 分页查询参数 */
export interface PageQuery {
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** 分页响应结构 */
export interface PageData<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
  hasMore: boolean;
}

/** 金额（字符串，两位小数） */
export type Money = string;

/** 时间（ISO-8601 带时区，如 2026-07-05T10:23:00+08:00） */
export type ISODateTime = string;

/** ID（整数，JS 安全范围内） */
export type IntID = number;

/** 枚举（大写 code） */
export type EnumCode = string;

/** 分页响应包装 */
export type PageResponse<T> = ApiResponse<PageData<T>>;

/** 空数据响应 */
export type VoidResponse = ApiResponse<null>;

/* ===================== 认证 ===================== */

export interface PfUserInfo {
  id: IntID;
  account: string;
  name: string;
  roleName: string;
}

export interface PfLoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: PfUserInfo;
}

export interface PfMeResult extends PfUserInfo {
  perms: string[];
  pwdResetRequired?: boolean;
}

/* ===================== 租户管理（/api/pf/merchant） ===================== */

/** 商家（租户）状态 */
export const MERCHANT_STATUS = {
  NORMAL: 'NORMAL', // 正常
  TRIAL: 'TRIAL', // 试用中
  EXPIRED: 'EXPIRED', // 已到期
  DISABLED: 'DISABLED', // 已禁用
} as const;
export type MerchantStatus = (typeof MERCHANT_STATUS)[keyof typeof MERCHANT_STATUS];

/** 商家列表项 */
export interface MerchantItem {
  id: IntID;
  tenantNo: string; // 如 M10001
  name: string;
  revenue: Money;
  memberCount: number;
  contactName: string;
  contactPhone: string; // 脱敏
  expireAt: string;
  status: MerchantStatus;
  createdAt: string;
}

/** 配额用量 */
export interface QuotaUsage {
  used: number;
  limit: number; // 0 = 不限
}

/** 小程序授权 */
export interface WxAuthInfo {
  status: 'AUTHORIZED' | 'UNAUTHORIZED';
  appId: string; // 脱敏
}

/** 商家详情 */
export interface MerchantDetail {
  id: IntID;
  tenantNo: string;
  name: string;
  contactName: string;
  contactPhone: string;
  qualification?: string;
  remark?: string;
  expireAt: string;
  openedAt: string;
  status: MerchantStatus;
  goodsUsage: QuotaUsage;
  memberUsage: QuotaUsage;
  storeUsage: QuotaUsage;
  staffUsage: QuotaUsage;
  wxAuth: WxAuthInfo;
  features: {
    user: { enabled: number; total: number };
    pc: { enabled: number; total: number };
    mp: { enabled: number; total: number };
  };
}

/** 开户请求体 */
export interface MerchantCreatePayload {
  name: string;
  contactName: string;
  contactPhone: string;
  qualification?: string;
  status: MerchantStatus;
  expireAt: string;
  goodsLimit: number;
  memberLimit: number;
  storeLimit: number;
  staffLimit: number;
  wxAppid?: string;
  wxSecret?: string;
  adminAccount: string;
  adminName: string;
  adminPhone: string;
  remark?: string;
  features: string[]; // feature_code[]
}

/** 开户结果 */
export interface MerchantCreateResult {
  id: IntID;
  tenantNo: string;
  adminInitPassword: string; // 仅此一次返回
}

/* ===================== 功能树 ===================== */

/** 功能树节点（三级：模块→分组→叶子） */
export interface FeatureTreeNode {
  name: string;
  code?: string; // 叶子才有
  desc?: string;
  children?: FeatureTreeNode[];
}

/** 功能树响应 */
export interface FeatureTreeData {
  end: string; // user | pc | mp
  endName: string;
  modules: FeatureTreeNode[];
}

/* ===================== 角色 / 员工 ===================== */

export interface PfRoleItem {
  id: IntID;
  name: string;
  remark?: string;
  isSystem: boolean;
  userCount: number;
}

export interface PfStaffItem {
  id: IntID;
  account: string;
  name: string;
  phone: string; // 脱敏
  roleName: string;
  lastLoginAt?: string;
  status: 'ENABLED' | 'DISABLED';
}

/* ===================== 审计日志 ===================== */

/** 审计动作类型 */
export const AUDIT_ACTION = {
  MERCHANT_CREATE: 'MERCHANT_CREATE',
  MERCHANT_EDIT: 'MERCHANT_EDIT',
  MERCHANT_DISABLE: 'MERCHANT_DISABLE',
  MERCHANT_ENABLE: 'MERCHANT_ENABLE',
  MERCHANT_RENEW: 'MERCHANT_RENEW',
  IMPERSONATE: 'IMPERSONATE',
  ROLE_EDIT: 'ROLE_EDIT',
  STAFF_RESET_PWD: 'STAFF_RESET_PWD',
  STAFF_TOGGLE: 'STAFF_TOGGLE',
} as const;
export type AuditAction = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];

/** 审计日志项 */
export interface AuditLogItem {
  id: IntID;
  action: AuditAction;
  actionName: string;
  operator: string; // 平台操作员
  tenantId?: IntID;
  tenantName?: string;
  detail?: string;
  createdAt: ISODateTime;
}

/** 审计查询参数 */
export interface AuditQuery extends PageQuery {
  action?: AuditAction;
  tenantId?: IntID;
  operator?: string;
  start?: string;
  end?: string;
}

/* ===================== 看板 ===================== */

export interface KpiItem {
  value: number;
  delta: number;
}

export interface DashboardKpi {
  merchantTotal: KpiItem;
  monthGmv: KpiItem;
  configuredMerchants: KpiItem;
  pendingRenewal: KpiItem;
}

export interface TrendPoint {
  date: string;
  gmv: number;
}

export interface EndpointOpen {
  user: { count: number; ratio: number };
  pc: { count: number; ratio: number };
  mp: { count: number; ratio: number };
}

/* ===================== 商家PC端认证（/api/mc/auth）— 对齐 be-dev-2 T-031 契约 ===================== */

/** 租户状态（后端枚举：ENABLED/DISABLED/EXPIRED） */
export const MC_TENANT_STATUS = {
  ENABLED: 'ENABLED',
  DISABLED: 'DISABLED',
  EXPIRED: 'EXPIRED',
} as const;
export type McTenantStatus = (typeof MC_TENANT_STATUS)[keyof typeof MC_TENANT_STATUS];

export interface McTenant {
  id: IntID;
  name: string;
  tenantNo?: string;
  status: McTenantStatus;
  expireAt: ISODateTime;
}

/** 商家员工（login/me/sso 返回的 staff 字段） */
export interface McStaff {
  id: IntID;
  name: string;
  account: string;
  roleId: IntID;
  roleName: string;
  isAdmin: boolean;
}

export interface McLoginResult {
  token: string;
  refreshToken: string;
  expireAt: number; // 秒级时间戳
  staff: McStaff;
  tenant: McTenant;
  perms: string[];
  features: string[];
}

export interface McMeResult {
  staff: McStaff;
  tenant: McTenant;
  perms: string[];
  features: string[];
}

/** 代客 SSO 回跳换 Token 返回（P0） */
export interface McSsoResult {
  token: string;
  refreshToken: string;
  impersonating: true;
  tenantName: string;
  staff: McStaff;
  tenant: McTenant;
  perms: string[];
  features: string[];
}

/* ===================== 商家PC端工作台（/api/mc/dashboard） ===================== */

export interface McKpiItem {
  value: number | string;
  delta: number;
}

export interface McDashboardKpi {
  todayOrders: McKpiItem;
  todaySales: McKpiItem;
  newMembers: McKpiItem;
  todayVerify: McKpiItem;
}

export interface McTodo {
  pendingShip: number;
  pendingRefund: number;
  pendingVerify: number;
  pendingPickup: number;
}

export interface McRecentOrder {
  id: IntID;
  orderNo: string;
  buyerName: string;
  amount: Money;
  status: EnumCode;
  createdAt: ISODateTime;
}

export interface McTrendPoint {
  date: string;
  sales: number;
  orders: number;
}

/* ===================== 商家PC端工作台权限码 ===================== */
export const MC_PERMS = {
  DASHBOARD: 'ORDER_LIST', // 工作台概览（recent-orders 需 ORDER_LIST）
  ORDER_LIST: 'ORDER_LIST',
  GOODS_LIST: 'GOODS_LIST',
  GOODS_CREATE: 'GOODS_CREATE',
  GOODS_EDIT: 'GOODS_EDIT',
  GOODS_SHELF: 'GOODS_SHELF',
  GOODS_STOCK: 'GOODS_STOCK',
  GOODS_DELETE: 'GOODS_DELETE',
  CATEGORY_MANAGE: 'CATEGORY_MANAGE',
  FREIGHT_MANAGE: 'FREIGHT_MANAGE',
  MEMBER_LIST: 'MEMBER_LIST',
  VERIFY_LOG: 'VERIFY_LOG',
} as const;

/* ===================== 商家PC端商品域（/api/mc/goods） ===================== */

/** 商品类型 */
export const GOODS_TYPE = {
  PHYSICAL: 'PHYSICAL', // 实体
  VIRTUAL: 'VIRTUAL', // 虚拟
  TICKET: 'TICKET', // 核销券
} as const;
export type GoodsType = (typeof GOODS_TYPE)[keyof typeof GOODS_TYPE];

/** 销售渠道 */
export const SALES_CHANNEL = {
  NORMAL: 'NORMAL', // 普通商城
  POINTS: 'POINTS', // 积分商城
  BOTH: 'BOTH', // 双渠道
} as const;
export type SalesChannel = (typeof SALES_CHANNEL)[keyof typeof SALES_CHANNEL];

/** 商品状态 */
export const GOODS_STATUS = {
  ON_SALE: 'ON_SALE', // 在售（两渠道任一在售）
  OFF_SALE: 'OFF_SALE', // 下架
  SOLD_OUT: 'SOLD_OUT', // 售罄
  DRAFT: 'DRAFT', // 草稿
} as const;
export type GoodsStatus = (typeof GOODS_STATUS)[keyof typeof GOODS_STATUS];

/** 价格模式（积分商品） */
export const PRICE_MODE = {
  CASH: 'CASH', // 纯现金
  POINTS: 'POINTS', // 纯积分
  MIXED: 'MIXED', // 现金+积分
} as const;
export type PriceMode = (typeof PRICE_MODE)[keyof typeof PRICE_MODE];

/** 库存变更类型 */
export const STOCK_CHANGE_TYPE = {
  ADD: 'ADD', // 入库
  SUB: 'SUB', // 出库
  SET: 'SET', // 设为
} as const;
export type StockChangeType = (typeof STOCK_CHANGE_TYPE)[keyof typeof STOCK_CHANGE_TYPE];

export interface GoodsSkuStock {
  channel: SalesChannel;
  totalStock: number;
  warnStock: number;
}

export interface GoodsSku {
  id?: IntID;
  specJson: Record<string, string>;
  skuCode: string;
  price: Money;
  originalPrice?: Money;
  priceMode: PriceMode;
  points?: number;
  cash?: Money;
  weight?: number;
  stocks: GoodsSkuStock[];
}

export interface TicketConfig {
  validType: 'DAYS_AFTER_PAY' | 'FIXED_DATE';
  validDays?: number;
  verifyStoreIds: IntID[];
  verifyDesc?: string;
  expireRefundPolicy: 'FULL_CASH' | 'FULL_POINTS' | 'NONE';
}

export interface GoodsItem {
  id: IntID;
  name: string;
  type: GoodsType;
  channel: SalesChannel;
  status: GoodsStatus;
  mainImage: string;
  price: Money;
  totalStock: number; // 两渠道库存总和
  categoryId: IntID;
  createdAt: ISODateTime;
  detail?: string;
  images?: string[];
  skus?: GoodsSku[];
  ticketConfig?: TicketConfig;
}

export interface GoodsQuery extends PageQuery {
  keyword?: string;
  type?: GoodsType;
  channel?: SalesChannel;
  status?: GoodsStatus;
  categoryId?: IntID;
}

export interface GoodsSpecOption {
  name: string;
  values: string[];
}

export interface GoodsPayload {
  name: string;
  type: GoodsType;
  channel: SalesChannel;
  normalCategoryId?: IntID;
  pointsCategoryId?: IntID;
  mainImage: string;
  images: string[];
  detail: string;
  hasSku: boolean;
  specConfig: GoodsSpecOption[];
  freightTemplateId?: IntID;
  skus: GoodsSku[];
  ticketConfig?: TicketConfig;
  pointsLimitPerUser?: number;
  pointsLimitPerDay?: number;
}

export interface StockLogItem {
  id: IntID;
  skuId: IntID;
  channel: SalesChannel;
  changeType: StockChangeType;
  value: number;
  afterStock: number;
  operator: string;
  createdAt: ISODateTime;
}

export interface CategoryNode {
  id: IntID;
  name: string;
  parentId: IntID | null;
  channel: SalesChannel;
  sort: number;
  children?: CategoryNode[];
}

export interface FreightTemplate {
  id: IntID;
  name: string;
  type: 'FREE' | 'COUNT' | 'WEIGHT';
  amount: Money;
  createdAt: ISODateTime;
}
