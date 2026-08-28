/**
 * 平台端 Mock 数据层（已停用，仅保留应急）。
 *
 * ⚠️ 当前联调基线：默认关闭 Mock，全部页面走真实后端 API（见 .env.development
 * VITE_ENABLE_MOCK=false）。main.ts 不再引用本文件；即使被误引入，也只有在
 * VITE_ENABLE_MOCK=true 时才会把拦截器挂到共享 axios 实例上。
 *
 * 统一响应体结构对齐 docs/architecture/03-API设计.md：
 *   { code: 0, message: 'ok', data: T, traceId: string }
 */
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { instance } from '@mall/web-kit';
import type {
  MerchantItem,
  MerchantStatus,
  DashboardKpi,
  TrendPoint,
  EndpointOpen,
  PfLoginResult,
  PfMeResult,
  AuditLogItem,
  AuditAction,
} from '@mall/shared-types';

const MOCK_ENABLED = import.meta.env.VITE_ENABLE_MOCK === 'true';

const ok = <T>(data: T) => ({ code: 0, message: 'ok', data, traceId: `mock-${Date.now()}` });

// 未启用时挂在一个孤立的 axios 实例上，保证绝不拦截真实请求
const mock = new MockAdapter(MOCK_ENABLED ? instance : axios.create(), { delayResponse: 300 });

const STATUSES: MerchantStatus[] = ['NORMAL', 'TRIAL', 'EXPIRED', 'DISABLED'];
const NAMES = ['优鲜生活', '潮玩星球', '暖居家品', '速达便利', '茶颜观色', '极客数码', '鲜丰果业', '衣品仓'];

function genMerchants(n: number): MerchantItem[] {
  return Array.from({ length: n }).map((_, i) => {
    const id = i + 1;
    return {
      id,
      tenantNo: `M${10000 + id}`,
      name: `${NAMES[i % NAMES.length]}${i >= NAMES.length ? id : ''}`,
      revenue: (Math.random() * 900000 + 10000).toFixed(2),
      memberCount: Math.floor(Math.random() * 5000 + 50),
      contactName: ['张伟', '李娜', '王强', '陈静', '刘洋'][i % 5],
      contactPhone: `138${String(1000 + i).padStart(4, '0')}1024`,
      expireAt: `2026-${String((i % 12) + 1).padStart(2, '0')}-15T00:00:00+08:00`,
      status: STATUSES[i % STATUSES.length],
      createdAt: `2025-${String((i % 12) + 1).padStart(2, '0')}-01T10:00:00+08:00`,
    } as MerchantItem;
  });
}

const merchants = genMerchants(86);

/* ============ 认证 ============ */
mock.onPost('/pf/auth/login').reply((config) => {
  const { account } = JSON.parse(config.data || '{}');
  const data: PfLoginResult = {
    accessToken: `mock-access-${account}`,
    refreshToken: `mock-refresh-${account}`,
    expiresIn: 7200,
    user: { id: 1, account, name: '平台管理员', roleName: '超级管理员' },
  };
  return [200, ok(data)];
});

mock.onGet('/pf/auth/me').reply(() => {
  const data: PfMeResult = {
    id: 1,
    account: 'admin',
    name: '平台管理员',
    roleName: '超级管理员',
    perms: ['PF_DASHBOARD', 'PF_MERCHANT_LIST', 'PF_MERCHANT_EDIT', 'PF_ROLE', 'PF_STAFF', 'PF_MSG_TEMPLATE'],
    pwdResetRequired: false,
  };
  return [200, ok(data)];
});

mock.onPost('/pf/auth/refresh').reply((config) => {
  const { refreshToken } = JSON.parse(config.data || '{}');
  return [200, ok({ accessToken: `mock-access-${Date.now()}`, refreshToken })];
});

mock.onPost('/pf/auth/logout').reply(() => [200, ok(null)]);
mock.onPut('/pf/auth/password').reply(() => [200, ok(null)]);

/* ============ 商家管理 ============ */
mock.onGet('/pf/merchant').reply((config) => {
  const params = config.params || {};
  const page = Number(params.page) || 1;
  const size = Number(params.size) || 10;
  const keyword = (params.keyword as string) || '';
  const status = params.status as string | undefined;
  let list = merchants;
  if (keyword) list = list.filter((m) => m.name.includes(keyword) || m.tenantNo.includes(keyword));
  if (status) list = list.filter((m) => m.status === status);
  const start = (page - 1) * size;
  return [
    200,
    ok({
      list: list.slice(start, start + size),
      total: list.length,
      page,
      size,
      pages: Math.ceil(list.length / size),
      hasMore: start + size < list.length,
    }),
  ];
});

mock.onGet(/\/pf\/merchant\/\d+\/detail/).reply((config) => {
  const id = Number(config.url?.match(/\/pf\/merchant\/(\d+)\/detail/)?.[1]);
  const m = merchants.find((x) => x.id === id) || merchants[0];
  return [
    200,
    ok({
      ...m,
      qualification: '营业执照 91440300MA5XXXXXX',
      remark: 'VIP 客户',
      openedAt: m.createdAt,
      goodsUsage: { used: 120, limit: 500 },
      memberUsage: { used: m.memberCount, limit: 10000 },
      storeUsage: { used: 3, limit: 10 },
      staffUsage: { used: 8, limit: 50 },
      wxAuth: { status: 'AUTHORIZED', appId: 'wx1234****abcd' },
      features: {
        user: { enabled: 12, total: 20 },
        pc: { enabled: 8, total: 15 },
        mp: { enabled: 10, total: 18 },
      },
    }),
  ];
});

mock.onPost('/pf/merchant').reply((config) => {
  const body = JSON.parse(config.data || '{}');
  const id = merchants.length + 1;
  merchants.unshift({ ...genMerchants(1)[0], id, name: body.name, tenantNo: `M${10000 + id}` });
  return [200, ok({ id, tenantNo: `M${10000 + id}`, adminInitPassword: 'Mall@123456' })];
});

mock.onPut(/\/pf\/merchant\/\d+/).reply(() => [200, ok(null)]);
mock.onPost(/\/pf\/merchant\/\d+\/(disable|enable|renew|impersonate)/).reply((config) => {
  if (config.url?.includes('/impersonate')) {
    return [200, ok({ token: `imp-${Date.now()}`, merchantName: '优鲜生活', expiresIn: 3600 })];
  }
  return [200, ok(null)];
});

/* ============ 看板 ============ */
mock.onGet('/pf/dashboard/kpi').reply(() => {
  const data: DashboardKpi = {
    merchantTotal: { value: 86, delta: 12 },
    monthGmv: { value: 1280450.5, delta: 8.3 },
    configuredMerchants: { value: 64, delta: 5 },
    pendingRenewal: { value: 7, delta: -2 },
  };
  return [200, ok(data)];
});

mock.onGet('/pf/dashboard/trend').reply(() => {
  const data: TrendPoint[] = Array.from({ length: 30 }).map((_, i) => ({
    date: `2026-07-${String(i + 1).padStart(2, '0')}`,
    gmv: Math.floor(Math.random() * 60000 + 20000),
  }));
  return [200, ok(data)];
});

mock.onGet('/pf/dashboard/endpoint-open').reply(() => {
  const data: EndpointOpen = {
    user: { count: 52, ratio: 0.61 },
    pc: { count: 40, ratio: 0.47 },
    mp: { count: 64, ratio: 0.75 },
  };
  return [200, ok(data)];
});

/* ============ 功能树 / 角色 / 员工 / 消息模板（骨架占位） ============ */
mock.onGet('/pf/feature-tree').reply(() => [
  200,
  ok({
    end: 'pc',
    endName: '商家PC',
    modules: [
      {
        name: '商品',
        children: [
          { name: '商品列表', code: 'GOODS_LIST' },
          { name: '商品分类', code: 'GOODS_CATEGORY' },
        ],
      },
      {
        name: '订单',
        children: [
          { name: '订单管理', code: 'ORDER_MANAGE' },
          { name: '退款管理', code: 'ORDER_REFUND' },
        ],
      },
    ],
  }),
]);

mock.onGet('/pf/role').reply(() => [
  200,
  ok([
    { id: 1, name: '超级管理员', remark: '系统内置', isSystem: true, userCount: 1 },
    { id: 2, name: '运营', remark: '日常运营', isSystem: false, userCount: 5 },
  ]),
]);

mock.onGet('/pf/staff').reply((config) => {
  const params = config.params || {};
  const page = Number(params.page) || 1;
  const size = Number(params.size) || 10;
  const list = Array.from({ length: 23 }).map((_, i) => ({
    id: i + 1,
    account: `staff${i + 1}`,
    name: ['赵敏', '钱昊', '孙倩', '周杰'][i % 4],
    phone: `139${String(2000 + i).padStart(4, '0')}8848`,
    roleName: i % 2 ? '运营' : '客服',
    lastLoginAt: `2026-07-${String((i % 28) + 1).padStart(2, '0')}T09:30:00+08:00`,
    status: i % 5 === 0 ? 'DISABLED' : 'ENABLED',
  }));
  return [
    200,
    ok({
      list: list.slice((page - 1) * size, page * size),
      total: list.length,
      page,
      size,
      pages: Math.ceil(list.length / size),
      hasMore: page * size < list.length,
    }),
  ];
});

mock.onGet('/pf/msg-template').reply(() => [
  200,
  ok([
    { id: 1, name: '订单支付通知', channel: 'SMS', content: '您的订单已支付成功' },
    { id: 2, name: '发货提醒', channel: 'WX', content: '您的包裹已发出' },
  ]),
]);

/* ============ 审计日志 ============ */
const AUDIT_ACTIONS: { action: AuditAction; name: string }[] = [
  { action: 'MERCHANT_CREATE', name: '开户' },
  { action: 'MERCHANT_EDIT', name: '编辑商家' },
  { action: 'MERCHANT_DISABLE', name: '禁用商家' },
  { action: 'MERCHANT_ENABLE', name: '启用商家' },
  { action: 'MERCHANT_RENEW', name: '续费' },
  { action: 'IMPERSONATE', name: '代客登录' },
  { action: 'ROLE_EDIT', name: '角色变更' },
  { action: 'STAFF_RESET_PWD', name: '员工重置密码' },
  { action: 'STAFF_TOGGLE', name: '员工状态切换' },
];

const auditLogs: AuditLogItem[] = Array.from({ length: 56 }).map((_, i) => {
  const a = AUDIT_ACTIONS[i % AUDIT_ACTIONS.length];
  const tid = (i % 12) + 1;
  return {
    id: i + 1,
    action: a.action,
    actionName: a.name,
    operator: ['张伟', '李娜', '王强', '陈静'][i % 4],
    tenantId: tid,
    tenantName: NAMES[tid % NAMES.length],
    detail: `${a.name} 操作`,
    createdAt: `2026-07-${String((i % 28) + 1).padStart(2, '0')}T${String((i % 12) + 8).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00+08:00`,
  } as AuditLogItem;
});

mock.onGet('/pf/audit').reply((config) => {
  const params = config.params || {};
  const page = Number(params.page) || 1;
  const size = Number(params.size) || 10;
  let list = auditLogs;
  if (params.action) list = list.filter((x) => x.action === params.action);
  if (params.tenantId) list = list.filter((x) => x.tenantId === Number(params.tenantId));
  if (params.operator) list = list.filter((x) => x.operator.includes(params.operator));
  return [
    200,
    ok({
      list: list.slice((page - 1) * size, page * size),
      total: list.length,
      page,
      size,
      pages: Math.ceil(list.length / size),
      hasMore: page * size < list.length,
    }),
  ];
});

export function setupMock() {
  if (!MOCK_ENABLED) {
    console.info('[mock] VITE_ENABLE_MOCK != true，跳过 mock，使用真实 API');
    return;
  }
  console.warn('[mock] 平台端 mock 数据已启用（仅限本地调试，勿用于验收）');
}
