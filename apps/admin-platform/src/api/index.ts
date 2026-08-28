/**
 * 平台端 API（与后端 /api/pf 真实实现对齐，2026-08 联调核对）。
 * 统一走 @mall/web-kit 的 http：自动带 Token、自动解包 {code,message,data,traceId}。
 */
import http from "@mall/web-kit";
import type {
  PfLoginResult,
  TenantPage,
  TenantListItem,
  TenantDetailVO,
  OpenAccountPayload,
  UpdateTenantPayload,
  OpenAccountResult,
  ImpersonateResult,
  DashboardKpiVO,
  TrendPointVO,
  EndpointOpenVO,
  FeatureEnd,
  FeatureL1,
  RoleVO,
  StaffVO,
  StaffPayload,
  MsgTemplateVO,
  AuditVO,
} from "@/types";
import type { PageData } from "@mall/shared-types";

/** 平台端认证 */
export const authApi = {
  login: (data: { account: string; password: string }) =>
    http.post<PfLoginResult>("/pf/auth/login", data),
  /** 注意：后端当前返回空对象（JWT payload 未携带 user），登录态信息以 login.user 为准 */
  me: () => http.get<Record<string, unknown>>("/pf/auth/me"),
  logout: () => http.post<void>("/pf/auth/logout"),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    http.put<void>("/pf/auth/password", data),
};

/** 看板 */
export const dashboardApi = {
  kpi: () => http.get<DashboardKpiVO>("/pf/dashboard/kpi"),
  /** 后端入参为 days（1~90），PRD 的 range/granularity 未实现 */
  trend: (days = 30) =>
    http.get<TrendPointVO[]>("/pf/dashboard/trend", { days }),
  endpointOpen: () => http.get<EndpointOpenVO>("/pf/dashboard/endpoint-open"),
};

/** 商家（租户）管理 */
export const merchantApi = {
  list: (params: {
    page?: number;
    size?: number;
    keyword?: string;
    status?: string;
    expireStart?: string;
    expireEnd?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => http.get<TenantPage>("/pf/merchant", params as Record<string, unknown>),
  detail: (id: number) => http.get<TenantDetailVO>(`/pf/merchant/${id}/detail`),
  create: (data: OpenAccountPayload) =>
    http.post<OpenAccountResult>("/pf/merchant", data),
  update: (id: number, data: UpdateTenantPayload) =>
    http.put<void>(`/pf/merchant/${id}`, data),
  disable: (id: number) => http.post<void>(`/pf/merchant/${id}/disable`),
  enable: (id: number) => http.post<void>(`/pf/merchant/${id}/enable`),
  renew: (id: number, expireAt: string) =>
    http.post<void>(`/pf/merchant/${id}/renew`, { expireAt }),
  impersonate: (id: number) =>
    http.post<ImpersonateResult>(`/pf/merchant/${id}/impersonate`),
  /** 后端约定：ids 走 body，status 走 query */
  batchStatus: (ids: number[], status: string) =>
    http.post<{ updated: number; status: string }>(
      `/pf/merchant/batch-status?status=${encodeURIComponent(status)}`,
      ids,
    ),
  /** 后端返回 JSON 数组快照（非文件流），前端自行转 CSV */
  exportSnapshot: () => http.get<TenantListItem[]>("/pf/merchant/export"),
  /** 已开通功能码集合（后端不区分端，码本身带端前缀） */
  features: (id: number) => http.get<string[]>(`/pf/merchant/${id}/features`),
  setFeatures: (id: number, codes: string[]) =>
    http.put<void>(`/pf/merchant/${id}/features`, codes),
};

/** 功能树 */
export const featureApi = {
  tree: (end: FeatureEnd) => http.get<FeatureL1[]>("/pf/feature-tree", { end }),
};

/** 角色 */
export const roleApi = {
  list: () => http.get<RoleVO[]>("/pf/role"),
  permTree: () => http.get<string[]>("/pf/role/perm-tree"),
  detail: (id: number) => http.get<RoleVO>(`/pf/role/${id}`),
  perms: (id: number) => http.get<string[]>(`/pf/role/${id}/perms`),
  /** 后端约定：perms 为裸数组 body */
  setPerms: (id: number, perms: string[]) =>
    http.put<void>(`/pf/role/${id}/perms`, perms),
  create: (data: { name: string; remark?: string; perms: string[] }) =>
    http.post<void>("/pf/role", data),
  update: (
    id: number,
    data: { name: string; remark?: string; perms: string[] },
  ) => http.put<void>(`/pf/role/${id}`, data),
  remove: (id: number) => http.delete<void>(`/pf/role/${id}`),
};

/** 平台员工 */
export const staffApi = {
  /** 后端返回分页结构 { list, total, page, size }（phone 已脱敏） */
  list: (params?: { page?: number; size?: number }) =>
    http.get<PageData<StaffVO>>("/pf/staff", params as Record<string, unknown>),
  create: (data: StaffPayload) => http.post<void>("/pf/staff", data),
  update: (id: number, data: StaffPayload) =>
    http.put<void>(`/pf/staff/${id}`, data),
  resetPassword: (id: number) =>
    http.post<{ newPassword: string }>(`/pf/staff/${id}/reset-pwd`),
  toggleStatus: (id: number) =>
    http.post<{ status: string }>(`/pf/staff/${id}/toggle-status`),
};

/** 消息模板（后端当前仅实现 GET 列表） */
export const msgTemplateApi = {
  list: () => http.get<MsgTemplateVO[]>("/pf/msg-template"),
  create: (data: any) => http.post("/pf/msg-template", data),
  update: (id: number, data: any) => http.put(`/pf/msg-template/${id}`, data),
  toggle: (id: number) => http.post(`/pf/msg-template/${id}/toggle-status`),
  remove: (id: number) => http.delete(`/pf/msg-template/${id}`),
};

/** 审计日志 */
export const auditApi = {
  list: (params: {
    page?: number;
    size?: number;
    action?: string;
    tenantId?: number;
    operator?: string;
  }) =>
    http.get<PageData<AuditVO>>("/pf/audit", params as Record<string, unknown>),
};
