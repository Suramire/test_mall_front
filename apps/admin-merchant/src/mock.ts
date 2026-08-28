import MockAdapter from 'axios-mock-adapter';
import { instance } from '@mall/web-kit';
import type {
  McLoginResult,
  McMeResult,
  McSsoResult,
  McDashboardKpi,
  McTodo,
  McRecentOrder,
  McTrendPoint,
  GoodsItem,
  GoodsPayload,
  GoodsSku,
  CategoryNode,
  FreightTemplate,
  SalesChannel,
  StockLogItem,
} from '@mall/shared-types';

const mock = new MockAdapter(instance, { delayResponse: 200, onNoMatch: 'passthrough' });

function ok<T>(data: T): [number, unknown] {
  return [200, { code: 0, message: 'success', data, traceId: 'mock-' + Date.now() }];
}

const TICKET_STORE: Record<string, { tenantName: string }> = {
  // 模拟平台端代客登录下发的 60s 一次性 ticket
  demo_ticket_123: { tenantName: '乐享生活超市' },
};

const TENANT = { id: 2001, name: '乐享生活超市', status: 'ENABLED' as const, expireAt: '2027-06-30T23:59:59+08:00' };
const ME: McMeResult = {
  staff: { id: 1001, account: 'merchant_admin', name: '商家管理员', roleId: 1, roleName: '超级管理员', isAdmin: true },
  perms: [
    'DASHBOARD',
    'ORDER_LIST',
    'GOODS_LIST',
    'MEMBER_LIST',
    'VERIFY_LOG',
    'SET_SHOP',
    'SET_STORE',
  ],
  features: ['merchant_pc.goods.list', 'merchant_pc.order', 'merchant_pc.member'],
  tenant: TENANT,
};

export function setupMock() {
  // 登录
  mock.onPost('/api/mc/auth/login').reply((cfg) => {
    const body = JSON.parse(cfg.data || '{}');
    if (body.account === 'merchant_admin' && body.password === '123456') {
      const data: McLoginResult = {
        token: 'mc-access-' + Date.now(),
        refreshToken: 'mc-refresh-' + Date.now(),
        expireAt: Math.floor(Date.now() / 1000) + 7200,
        staff: ME.staff,
        tenant: TENANT,
        perms: ME.perms,
        features: ME.features,
      };
      return ok(data);
    }
    return [
      200,
      { code: 40100, message: '账号或密码错误', data: null, traceId: 'mock-err' },
    ];
  });

  // 代客 SSO 回跳换 Token（P0）
  mock.onPost('/api/mc/auth/sso').reply((cfg) => {
    const body = JSON.parse(cfg.data || '{}');
    const ticket = body.ticket as string;
    const rec = TICKET_STORE[ticket];
    if (!rec) {
      return [200, { code: 40301, message: 'ticket 无效或已过期', data: null, traceId: 'mock-err' }];
    }
    const data: McSsoResult = {
      impersonating: true,
      tenantName: rec.tenantName,
      token: 'mc-sso-access-' + Date.now(),
      refreshToken: 'mc-sso-refresh-' + Date.now(),
      staff: ME.staff,
      tenant: { ...TENANT, name: rec.tenantName },
      perms: ME.perms,
      features: ME.features,
    };
    return ok(data);
  });

  mock.onPost('/api/mc/auth/refresh').reply(() =>
    ok<McLoginResult>({
      token: 'mc-access-' + Date.now(),
      refreshToken: 'mc-refresh-' + Date.now(),
      expireAt: Math.floor(Date.now() / 1000) + 7200,
      staff: ME.staff,
      tenant: TENANT,
      perms: ME.perms,
      features: ME.features,
    }),
  );
  mock.onPost('/api/mc/auth/logout').reply(() => ok(null));
  mock.onGet('/api/mc/auth/me').reply(() => ok(ME));
  mock.onPut('/api/mc/auth/password').reply(() => ok(null));

  // 工作台
  mock.onGet('/api/mc/dashboard/kpi').reply(() => {
    const data: McDashboardKpi = {
      todayOrders: { value: 128, delta: 12.5 },
      todaySales: { value: '12860.50', delta: 8.3 },
      newMembers: { value: 24, delta: -3.1 },
      todayVerify: { value: 56, delta: 5.0 },
    };
    return ok(data);
  });
  mock.onGet('/api/mc/dashboard/todo').reply(() => {
    const data: McTodo = {
      pendingShip: 12,
      pendingRefund: 3,
      pendingVerify: 8,
      pendingPickup: 5,
    };
    return ok(data);
  });
  mock.onGet('/api/mc/dashboard/recent-orders').reply(() => {
    const data: McRecentOrder[] = Array.from({ length: 10 }).map((_, i) => ({
      id: 9000 + i,
      orderNo: 'ORD2026' + String(100000 + i),
      buyerName: '会员' + (i + 1),
      amount: (Math.random() * 500 + 50).toFixed(2),
      status: ['PENDING_PAY', 'PENDING_SHIP', 'PENDING_RECEIVE', 'COMPLETED'][i % 4],
      createdAt: '2026-08-07T' + String(9 + (i % 8)) + ':00:00+08:00',
    }));
    return ok(data);
  });
  mock.onGet('/api/mc/dashboard/trend').reply((cfg) => {
    const days = Number(cfg.params?.days || 30);
    const data: McTrendPoint[] = Array.from({ length: days }).map((_, i) => ({
      date: '08-' + String(i + 1).padStart(2, '0'),
      sales: Math.round(8000 + Math.random() * 6000),
      orders: Math.round(80 + Math.random() * 80),
    }));
    return ok(data);
  });

  /* ===================== 商品域 ===================== */
  const mkSku = (id: number, spec: Record<string, string>, c: SalesChannel): GoodsSku => ({
    id,
    specJson: spec,
    skuCode: 'SKU' + (10086000 + id),
    price: '199.00',
    originalPrice: '299.00',
    priceMode: 'MIXED',
    points: 500,
    cash: '9.90',
    weight: 0.25,
    stocks: [
      { channel: 'NORMAL', totalStock: 100, warnStock: 10 },
      { channel: 'POINTS', totalStock: 50, warnStock: 5 },
    ].filter((s) => c === 'BOTH' || s.channel === c) as GoodsSku['stocks'],
  });
  const GOODS_DB: GoodsItem[] = Array.from({ length: 46 }).map((_, i) => {
    const type = (['PHYSICAL', 'VIRTUAL', 'TICKET'] as const)[i % 3];
    const channel = (['NORMAL', 'POINTS', 'BOTH'] as const)[i % 3];
    const sku = mkSku(i + 1, { 颜色: i % 2 ? '枪灰' : '玫瑰金', 尺寸: i % 2 ? 'S' : 'L' }, channel);
    return {
      id: i + 1,
      name: ['轻钛镜架', '会员季卡', '到店核销券', '纯棉T恤', '积分兑换水杯'][i % 5] + ' #' + (i + 1),
      type,
      channel,
      status: (['ON_SALE', 'OFF_SALE', 'SOLD_OUT', 'DRAFT'] as const)[i % 4],
      mainImage: 'https://picsum.photos/seed/' + (i + 1) + '/200',
      price: (Math.random() * 500 + 50).toFixed(2),
      totalStock: 150,
      categoryId: 11 + (i % 3),
      createdAt: '2026-08-0' + ((i % 7) + 1) + 'T10:00:00+08:00',
      skus: [sku],
      ticketConfig: type === 'TICKET' ? {
        validType: 'DAYS_AFTER_PAY', validDays: 30, verifyStoreIds: [1, 2],
        verifyDesc: '到店出示核销码', expireRefundPolicy: 'FULL_CASH',
      } : undefined,
    };
  });

  mock.onGet('/api/mc/goods').reply((cfg) => {
    const p = cfg.params || {};
    let list = GOODS_DB.slice();
    if (p.keyword) list = list.filter((g) => g.name.includes(String(p.keyword)));
    if (p.type) list = list.filter((g) => g.type === p.type);
    if (p.channel) list = list.filter((g) => g.channel === p.channel || g.channel === 'BOTH');
    if (p.status) list = list.filter((g) => g.status === p.status);
    const page = Number(p.page || 1);
    const size = Number(p.size || 20);
    const total = list.length;
    const slice = list.slice((page - 1) * size, page * size);
    return ok({ list: slice, total, page, size, pages: Math.ceil(total / size), hasMore: page * size < total });
  });
  mock.onGet(/\/api\/mc\/goods\/\d+$/).reply((cfg) => {
    const id = Number(cfg.url?.split('/').pop());
    const g = GOODS_DB.find((x) => x.id === id) || GOODS_DB[0];
    return ok(g);
  });
  mock.onPost('/api/mc/goods').reply((cfg) => {
    const body = JSON.parse(cfg.data || '{}') as GoodsPayload;
    const id = GOODS_DB.length + 1;
    const item: GoodsItem = {
      id,
      name: body.name,
      type: body.type,
      channel: body.channel,
      status: 'ON_SALE',
      mainImage: body.mainImage,
      price: body.skus[0]?.price || '0.00',
      totalStock: (body.skus[0]?.stocks || []).reduce((s, x) => s + x.totalStock, 0),
      categoryId: body.normalCategoryId || body.pointsCategoryId || 0,
      createdAt: '2026-08-07T10:00:00+08:00',
      skus: body.skus,
      ticketConfig: body.ticketConfig,
    };
    GOODS_DB.unshift(item);
    return ok(item);
  });
  mock.onPut(/\/api\/mc\/goods\/\d+$/).reply((cfg) => {
    const id = Number(cfg.url?.split('/').pop());
    const body = JSON.parse(cfg.data || '{}') as Partial<GoodsPayload>;
    const g = GOODS_DB.find((x) => x.id === id);
    if (g) Object.assign(g, body);
    return ok(g || GOODS_DB[0]);
  });
  mock.onDelete(/\/api\/mc\/goods\/\d+$/).reply(() => ok(null));
  mock.onPost(/\/api\/mc\/goods\/\d+\/shelf$/).reply(() => ok(null));
  mock.onPut(/\/api\/mc\/goods\/\d+\/stock$/).reply(() => ok(null));
  mock.onGet(/\/api\/mc\/goods\/\d+\/stock-log$/).reply(() => {
    const data: StockLogItem[] = Array.from({ length: 8 }).map((_, i) => ({
      id: i + 1, skuId: 10086001 + i, channel: i % 2 ? 'POINTS' : 'NORMAL',
      changeType: (['ADD', 'SUB', 'SET'] as const)[i % 3], value: 10 * (i + 1),
      afterStock: 100 - i * 5, operator: '商家管理员', createdAt: '2026-08-07T09:00:00+08:00',
    }));
    return ok(data);
  });

  /* 分类（双渠道独立树） */
  const CATE_DB: CategoryNode[] = [
    { id: 11, name: '镜架', parentId: null, channel: 'NORMAL', sort: 1, children: [
      { id: 12, name: '钛架', parentId: 11, channel: 'NORMAL', sort: 1 },
      { id: 13, name: '板材架', parentId: 11, channel: 'NORMAL', sort: 2 },
    ] },
    { id: 31, name: '积分好物', parentId: null, channel: 'POINTS', sort: 1 },
  ];
  mock.onGet('/api/mc/category').reply((cfg) => {
    const ch = (cfg.params?.channel as SalesChannel) || 'NORMAL';
    const filter = (nodes: CategoryNode[]): CategoryNode[] =>
      nodes.filter((n) => n.channel === ch).map((n) => ({ ...n, children: n.children ? filter(n.children) : undefined }));
    return ok(filter(CATE_DB));
  });
  mock.onPost('/api/mc/category').reply((cfg) => {
    const body = JSON.parse(cfg.data || '{}');
    const node: CategoryNode = { id: Date.now(), name: body.name, parentId: body.parentId ?? null, channel: body.channel, sort: body.sort ?? 99 };
    CATE_DB.push(node);
    return ok(node);
  });
  mock.onPut(/\/api\/mc\/category\/\d+$/).reply(() => ok(CATE_DB[0]));
  mock.onDelete(/\/api\/mc\/category\/\d+$/).reply(() => ok(null));

  /* 运费模板 */
  const FREIGHT_DB: FreightTemplate[] = [
    { id: 1, name: '包邮', type: 'FREE', amount: '0.00', createdAt: '2026-08-01T10:00:00+08:00' },
    { id: 2, name: '按件计费', type: 'COUNT', amount: '8.00', createdAt: '2026-08-02T10:00:00+08:00' },
  ];
  mock.onGet('/api/mc/freight-template').reply(() => ok(FREIGHT_DB));
  mock.onPost('/api/mc/freight-template').reply((cfg) => {
    const body = JSON.parse(cfg.data || '{}');
    const t: FreightTemplate = { id: Date.now(), name: body.name, type: body.type, amount: body.amount, createdAt: '2026-08-07T10:00:00+08:00' };
    FREIGHT_DB.push(t);
    return ok(t);
  });
  mock.onPut(/\/api\/mc\/freight-template\/\d+$/).reply(() => ok(FREIGHT_DB[0]));
  mock.onDelete(/\/api\/mc\/freight-template\/\d+$/).reply(() => ok(null));
}
