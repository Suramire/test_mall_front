/**
 * 基于 Axios 的统一请求封装
 * - 对齐 docs/architecture/03-API设计.md 契约：
 *   HTTP 状态码恒为 200，业务错误码在响应体 code 字段
 *   Authorization: Bearer <JWT>，40101 触发 refresh 重试
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiResponse } from '@mall/shared-types';

export interface RequestOptions {
  /** 跳过业务错误拦截（如手动处理 401） */
  skipErrorHandler?: boolean;
  /** 响应体直接返回 data 字段 */
  unwrap?: boolean;
}

/** 端命名空间：平台后台 pf / 商家后台 mc / 商家小程序 mp / 用户端 c */
export type TokenNs = 'pf' | 'mc' | 'mp' | 'c';

let tokenNs: TokenNs = 'pf';

/**
 * 配置当前端的 token 命名空间，各端 main.ts 在挂载前调用一次。
 * 避免平台端与商家端同域部署时 token 互相覆盖，同时决定 refresh 走哪个 scope。
 */
export function configureTokenNs(ns: TokenNs): void {
  tokenNs = ns;
}

const tokenKey = () => `${tokenNs}_access_token`;
const refreshTokenKey = () => `${tokenNs}_refresh_token`;

export function getToken(): string | null {
  return localStorage.getItem(tokenKey());
}
export function getRefreshToken(): string | null {
  return localStorage.getItem(refreshTokenKey());
}
export function setRefreshToken(refresh: string): void {
  localStorage.setItem(refreshTokenKey(), refresh);
}
export function setToken(access: string, refresh: string): void {
  localStorage.setItem(tokenKey(), access);
  localStorage.setItem(refreshTokenKey(), refresh);
}
export function clearToken(): void {
  localStorage.removeItem(tokenKey());
  localStorage.removeItem(refreshTokenKey());
}

/** 是否正在刷新 token，用于串行化并发请求 */
let isRefreshing = false;
let pendingQueue: Array<(token: string) => void> = [];

function flushQueue(token: string) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
});

// 请求拦截：注入 token
instance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截：统一处理业务错误码
instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const body = response.data;
    // 文件下载等非标准响应直接放行
    if (body == null || typeof body.code !== 'number') {
      return response;
    }
    if (body.code !== 0) {
      return Promise.reject(new ApiBizError(body.code, body.message));
    }
    return response;
  },
  async (error) => {
    const { response, config } = error;
    // 40101 Token 过期 → 尝试 refresh 后重放原请求
    const body = response?.data;
    if (body?.code === 40101 && config && !config._retried) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingQueue.push((token: string) => {
            config._retried = true;
            config.headers.Authorization = `Bearer ${token}`;
            resolve(instance(config));
          });
        });
      }
      isRefreshing = true;
      config._retried = true;
      try {
        const refreshToken = getRefreshToken();
        // 用裸 axios 发送以避开响应拦截器递归，因此需手动带上 Authorization：
        // 后端按 URL 前缀强制校验 token scope，缺头会被中间件判定为无 scope
        const staleToken = getToken();
        const rsp = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string; token?: string }>>(
          `${instance.defaults.baseURL}/${tokenNs}/auth/refresh`,
          { refreshToken },
          staleToken ? { headers: { Authorization: `Bearer ${staleToken}` } } : undefined,
        );
        const data = rsp.data.data;
        const access = data.accessToken || data.token || '';
        // 拿不到新 token 视为刷新失败，否则会存下空 token 并让后续请求持续 401
        if (!access) throw new Error('refresh 未返回 accessToken');
        // 后端可能不下发新的 refreshToken，此时保留原值，避免被 undefined 覆盖
        setToken(access, data.refreshToken || refreshToken || ''); flushQueue(access);
        config.headers.Authorization = `Bearer ${access}`;
        return instance(config);
      } catch (e) {
        flushQueue('');
        clearToken();
        // 跳转登录页
        window.location.href = '/login';
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    // 后端错误响应目前是 4xx + 业务信封（契约要求的 HTTP 200 尚未兑现）。
    // 此处从非 2xx 响应中提取 code/message，使业务层拿到的错误与 200 分支一致。
    if (body && typeof body.code === 'number' && body.code !== 0) {
      return Promise.reject(new ApiBizError(body.code, body.message));
    }
    return Promise.reject(error);
  },
);

/** 业务错误 */
export class ApiBizError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'ApiBizError';
  }
}

/** 统一请求方法：返回 data 字段 */
export async function request<T>(config: AxiosRequestConfig, options: RequestOptions = {}): Promise<T> {
  const opts: RequestOptions = { unwrap: true, ...options };
  try {
    const response = await instance.request<ApiResponse<T>>(config);
    const body = response.data;
    if (opts.unwrap && body && typeof body.code === 'number') {
      return body.data as T;
    }
    return body as unknown as T;
  } catch (error) {
    if (!opts.skipErrorHandler) {
      const msg =
        error instanceof ApiBizError
          ? error.message
          : '网络开小差了，请稍后重试';
      // 交由业务层通过 ElMessage 提示；此处仅透传
      if (error instanceof Error) error.message = msg;
    }
    throw error;
  }
}

export const http = {
  get: <T>(url: string, params?: Record<string, unknown>, options?: RequestOptions) =>
    request<T>({ url, method: 'GET', params }, options),
  post: <T>(url: string, data?: unknown, options?: RequestOptions) =>
    request<T>({ url, method: 'POST', data }, options),
  put: <T>(url: string, data?: unknown, options?: RequestOptions) =>
    request<T>({ url, method: 'PUT', data }, options),
  delete: <T>(url: string, params?: Record<string, unknown>, options?: RequestOptions) =>
    request<T>({ url, method: 'DELETE', params }, options),
};

// 扩展 AxiosRequestConfig 类型，支持自定义字段
declare module 'axios' {
  export interface AxiosRequestConfig {
    _retried?: boolean;
  }
}

/** 导出底层 axios 实例，供 mock 拦截（联调阶段使用） */
export { instance };

export default http;
