import { http } from '@mall/web-kit';
import axios from 'axios';
import type {
  McLoginResult,
  McMeResult,
  McSsoResult,
  McDashboardKpi,
  McTodo,
  McRecentOrder,
  McTrendPoint,
  VoidResponse,
  GoodsItem,
  GoodsQuery,
  GoodsPayload,
  StockLogItem,
  CategoryNode,
  FreightTemplate,
  SalesChannel,
  StockChangeType,
  PageData,
} from '@mall/shared-types';

/** 商家PC端登录 */
export function mcLogin(account: string, password: string) {
  return http.post<McLoginResult>('/mc/auth/login', { account, password });
}

/** 代客 SSO 回跳换 Token（ticket 由平台端代客登录一次性链接携带） */
export function mcSsoExchange(ticket: string) {
  return http.post<McSsoResult>('/mc/auth/sso', { ticket });
}

/** 刷新 Token */
export function mcRefresh() {
  return http.post<McLoginResult>('/mc/auth/refresh', {});
}
export async function uploadImage(file: File) { const body = new FormData(); body.append('file', file); const r = await axios.post('/api/common/upload', body, { headers: { Authorization: `Bearer ${localStorage.getItem('mc_access_token') || ''}` } }); return r.data?.data?.url || r.data?.data?.path || r.data?.url || r.data?.path; }
export const goodsBatchStatus = (ids:number[], status:string) => http.post('/mc/goods/batch-status', {ids,status});
export const goodsExport = (params:any) => http.get('/mc/goods/export', params);
export const goodsImport = (file:File) => { const body=new FormData(); body.append('file',file); return axios.post('/api/mc/goods/import',body,{headers:{Authorization:`Bearer ${localStorage.getItem('mc_access_token')||''}`}}); };

/** 登出 */
export function mcLogout() {
  return http.post<VoidResponse>('/mc/auth/logout', {});
}

/** 当前用户信息 + perms + features + tenant */
export function mcMe() {
  return http.get<McMeResult>('/mc/auth/me');
}

/** 修改密码 */
export function mcChangePassword(oldPassword: string, newPassword: string) {
  return http.put<VoidResponse>('/mc/auth/password', {
    oldPassword,
    newPassword,
  });
}

/** 工作台 KPI */
export function mcDashboardKpi() {
  return http.get<McDashboardKpi>('/mc/dashboard/kpi');
}

/** 工作台待办计数 */
export function mcDashboardTodo() {
  return http.get<McTodo>('/mc/dashboard/todo');
}

/** 最近 10 单 */
export function mcRecentOrders() {
  return http.get<McRecentOrder[]>('/mc/dashboard/recent-orders');
}

/** 销售趋势 */
export function mcDashboardTrend(days = 30) {
  return http.get<McTrendPoint[]>('/mc/dashboard/trend', { days });
}
export const mcGoodsRank = (limit=10) => http.get<any[]>('/mc/dashboard/goods-rank',{limit});
export const mcMemberRank = (limit=10) => http.get<any[]>('/mc/dashboard/member-rank',{limit});

/* ===================== 商品域（/mc/goods, /category, /freight-template） ===================== */

export function goodsList(params: GoodsQuery) {
  return http.get<PageData<GoodsItem>>('/mc/goods', params as Record<string, unknown>);
}
export function goodsDetail(id: number) {
  return http.get<GoodsItem>('/mc/goods/' + id);
}
export function goodsCreate(payload: GoodsPayload) {
  return http.post<GoodsItem>('/mc/goods', payload);
}
export function goodsUpdate(id: number, payload: Partial<GoodsPayload>) {
  return http.put<GoodsItem>('/mc/goods/' + id, payload);
}
export function goodsDelete(id: number) {
  return http.delete<VoidResponse>('/mc/goods/' + id);
}
export function goodsShelf(id: number, channel: SalesChannel, onSale: boolean) {
  return http.post<VoidResponse>(`/mc/goods/${id}/shelf`, { channel, onSale });
}
export function goodsStock(id: number, items: { skuId: number; channel: SalesChannel; changeType: StockChangeType; value: number }[]) {
  return http.put<VoidResponse>(`/mc/goods/${id}/stock`, { items });
}
export function goodsStockLog(id: number) {
  return http.get<StockLogItem[]>('/mc/goods/' + id + '/stock-log');
}

export function categoryList(channel: SalesChannel) {
  return http.get<CategoryNode[]>('/mc/category', { channel });
}
export function categoryCreate(payload: { name: string; parentId?: number; channel: SalesChannel; sort?: number }) {
  return http.post<CategoryNode>('/mc/category', payload);
}
export function categoryUpdate(id: number, payload: { name?: string; sort?: number }) {
  return http.put<CategoryNode>(`/mc/category/${id}`, payload);
}
export function categoryDelete(id: number) {
  return http.delete<VoidResponse>('/mc/category/' + id);
}

export function freightList() {
  return http.get<FreightTemplate[]>('/mc/freight-template');
}
export function freightCreate(payload: { name: string; type: 'FREE' | 'COUNT' | 'WEIGHT'; amount: string }) {
  return http.post<FreightTemplate>('/mc/freight-template', payload);
}
export function freightUpdate(id: number, payload: { name?: string; type?: 'FREE' | 'COUNT' | 'WEIGHT'; amount?: string }) {
  return http.put<FreightTemplate>(`/mc/freight-template/${id}`, payload);
}
export function freightDelete(id: number) {
  return http.delete<VoidResponse>('/mc/freight-template/' + id);
}
export const orderApi = {
  list: (params?: Record<string, unknown>) => http.get<any[]>('/mc/order', params),
  statusCounts: () => http.get<Record<string, number>>('/mc/order/status-counts'),
  detail: (id: number) => http.get<any>(`/mc/order/${id}`),
  ship: (id: number, payload: any) => http.post(`/mc/order/${id}/ship`, payload),
  batchShip: (ids:number[], payload:any) => http.post('/mc/order/batch-ship', {ids, ...payload}),
  stocking: (id: number, payload: any = {}) => http.post(`/mc/order/${id}/stocking`, payload),
  pickupConfirm: (id: number, payload: any) => http.post(`/mc/order/${id}/pickup-confirm`, payload),
};
export const verifyApi = {
  query: (code: string) => http.get<any>('/mc/verify/query', { code }),
  verify: (code: string) => http.post('/mc/verify', { code }),
  logs: (params?: Record<string, unknown>) => http.get<any[]>('/mc/verify/log', params),
};
export const memberApi = {
  list: (params?: Record<string, unknown>) => http.get<any[]>('/mc/member', params),
  detail: (id: number) => http.get<any>(`/mc/member/${id}`),
  orders: (id: number) => http.get<any[]>(`/mc/member/${id}/orders`),
  pointsLog: (id: number) => http.get<any[]>(`/mc/member/${id}/points-log`),
  phone: (id: number) => http.get<any>(`/mc/member/${id}/phone`),
  updateTags: (id:number, tags:string[]) => http.put(`/mc/member/${id}/tags`, {tags}),
  points: (id: number, points: number, remark: string, idempotencyKey: string) => http.post('/mc/points/adjust', { memberId: id, points, remark, idempotencyKey }),
};

export const shopApi = {
  get: () => http.get<any>('/mc/shop'),
  update: (payload: Record<string, unknown>) => http.put('/mc/shop', payload),
};

export const storeApi = {
  list: () => http.get<any[]>('/mc/store'),
  create: (payload: Record<string, unknown>) => http.post('/mc/store', payload),
  update: (id: number, payload: Record<string, unknown>) => http.put(`/mc/store/${id}`, payload),
  remove: (id: number) => http.delete(`/mc/store/${id}`),
};

export const pointsRuleApi = {
  get: () => http.get<any>('/mc/points/rule'),
  update: (payload: Record<string, unknown>) => http.put('/mc/points/rule', payload),
};

export const pointsLogApi = {
  list: (params?: Record<string, unknown>) => http.get<any[]>('/mc/points/log', params),
};
export const staffApi={list:()=>http.get<any[]>('/mc/staff'),create:(p:any)=>http.post('/mc/staff',p),update:(id:number,p:any)=>http.put(`/mc/staff/${id}`,p),toggle:(id:number,enable:boolean)=>http.put(`/mc/staff/${id}`,{status:enable?'ENABLED':'DISABLED'})};
export const roleApi={list:()=>http.get<any[]>('/mc/role'),create:(p:any)=>http.post('/mc/role',p),update:(id:number,p:any)=>http.put(`/mc/role/${id}`,p),remove:(id:number)=>http.delete(`/mc/role/${id}`)};
export const messageApi={list:()=>http.get<any[]>('/mc/message'),update:(id:number,p:any)=>http.put(`/mc/message/${id}`,p)};
export const levelApi={list:()=>http.get<any[]>('/mc/level'),update:(id:number,payload:Record<string,unknown>)=>http.put(`/mc/level/${id}`,payload)};
export const refundApi={list:(params?:Record<string,unknown>)=>http.get<any[]>('/mc/refund',params),detail:(id:number)=>http.get<any>(`/mc/refund/${id}`),rollbackPreview:(id:number)=>http.get<any>(`/mc/refund/${id}/rollback-preview`),approve:(id:number)=>http.post(`/mc/refund/${id}/approve`),reject:(id:number,reason:string)=>http.post(`/mc/refund/${id}/reject`,{reason})};
