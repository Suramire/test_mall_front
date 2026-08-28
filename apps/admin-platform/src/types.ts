/**
 * 平台端本地类型（与后端 /api/pf 实际返回逐字段对齐）。
 * 说明：@mall/shared-types 中部分模型（如 MerchantDetail）仍是 PRD 早期口径，
 * 后端实现已有差异（见 docs/architecture/03-API设计.md），本文件以真实接口为准。
 */
import type { PageData } from '@mall/shared-types';

/* ============ 认证 ============ */

/** 登录返回的用户信息（后端 user 内不含 account，此处放宽为可选） */
export interface PfAuthUser {
  id: number;
  account?: string;
  name: string;
  roleName: string;
  perms: string[];
  pwdResetRequired?: boolean;
}

export interface PfLoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: PfAuthUser;
}

/* ============ 商家（租户）管理 ============ */

export type TenantStatus = 'NORMAL' | 'TRIAL' | 'EXPIRED' | 'DISABLED';

/** GET /pf/merchant 列表项 */
export interface TenantListItem {
  id: number;
  tenantNo: string;
  name: string;
  contactName: string;
  contactPhone: string;
  status: TenantStatus;
  expireAt: string | null;
  openedAt: string | null;
  goodsLimit: number;
  memberLimit: number;
  staffLimit: number;
  storeLimit: number;
  goodsUsed: number;
  memberUsed: number;
  memberCount: number;
  revenue: string;
}

export type TenantPage = PageData<TenantListItem>;

/** GET /pf/merchant/{id}/detail */
export interface TenantDetailVO {
  id: number;
  tenantNo: string;
  name: string;
  contactName: string;
  contactPhone: string;
  qualification: string;
  status: TenantStatus;
  expireAt: string | null;
  goodsLimit: number;
  memberLimit: number;
  storeLimit: number;
  staffLimit: number;
  wxAppid: string;
  wxAuthStatus: number; // 0 未授权 / 1 已授权
  permVer: number;
  remark: string | null;
  openedAt: string | null;
  createdAt: string | null;
  featureCount: number;
  staffCount: number;
  goodsUsed?: number;
  memberUsed?: number;
  storeUsed?: number;
  staffUsed?: number;
  limits?: { goods?: number; member?: number; store?: number; staff?: number };
}

/** POST /pf/merchant 开户请求 */
export interface OpenAccountPayload {
  name: string;
  contactName: string;
  contactPhone: string;
  qualification: string;
  status: TenantStatus;
  expireAt: string | null;
  goodsLimit: number;
  memberLimit: number;
  storeLimit: number;
  staffLimit: number;
  wxAppid: string;
  wxSecret: string;
  features: string[];
  adminAccount: string;
  adminName: string;
  adminPhone: string;
  remark: string;
}

/** PUT /pf/merchant/{id} 编辑请求（后端不含 status/features/管理员字段） */
export interface UpdateTenantPayload {
  name?: string;
  contactName?: string;
  contactPhone?: string;
  qualification?: string;
  expireAt?: string | null;
  goodsLimit?: number;
  memberLimit?: number;
  storeLimit?: number;
  staffLimit?: number;
  wxAppid?: string;
  wxSecret?: string;
  remark?: string;
}

export interface OpenAccountResult {
  id: number;
  tenantNo: string;
  adminInitPassword: string;
}

/** POST /pf/merchant/{id}/impersonate */
export interface ImpersonateResult {
  redirectUrl: string;
  ticket: string;
}

/* ============ 看板 ============ */

export interface KpiItem {
  value: number;
  delta: number;
}

export interface DashboardKpiVO {
  merchantTotal: KpiItem;
  monthGmv: KpiItem;
  configuredMerchants: KpiItem;
  pendingRenewal: KpiItem;
}

export interface TrendPointVO {
  date: string;
  newTenants: number;
  gmv: number;
}

export interface EndpointOpenVO {
  user: { count: number; ratio: number };
  pc: { count: number; ratio: number };
  mp: { count: number; ratio: number };
}

/* ============ 功能树 ============ */

export type FeatureEnd = 'user' | 'merchant_pc' | 'merchant_mp';

export interface FeatureLeaf {
  code: string;
  name: string;
  defaultOn: number;
}

/** GET /pf/feature-tree?end=xxx 返回项（一级模块） */
export interface FeatureL1 {
  end: FeatureEnd;
  l1: string;
  groups: { l2: string; items: FeatureLeaf[] }[];
}

/* ============ 角色 ============ */

export interface RoleVO {
  id: number;
  name: string;
  remark: string;
  perms: string[];
  isSystem: number;
}

/* ============ 员工 ============ */

export interface StaffVO {
  id: number;
  account: string;
  name: string;
  phone: string;
  roleId: number;
  roleName: string;
  status: 'ENABLED' | 'DISABLED';
  lastLoginAt: string | null;
}

export interface StaffPayload {
  account: string;
  name: string;
  password: string;
  phone: string;
  roleId: number;
}

/* ============ 消息模板 ============ */

export interface MsgTemplateVO {
  id: number;
  templateNo: string;
  name: string;
  channel: string;
  scene: string;
  variables: string[];
  content: string;
  status: string;
}

/* ============ 审计日志 ============ */

export interface AuditVO {
  id: number;
  operatorId: number;
  operatorName: string;
  scope: string;
  tenantId: number | null;
  action: string;
  targetType: string;
  targetId: string;
  detail: unknown;
  ip: string;
  createdAt: string | null;
}
