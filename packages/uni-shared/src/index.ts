/**
 * uni-app 小程序共享工具
 * 供 mp-merchant / mp-user 使用
 */

const TOKEN_KEY = 'mp_token';
const TENANT_KEY = 'mp_tenant_appid';

/**
 * 小程序端统一真实 API 请求。业务页不得自行拼装未携带 Token 的 uni.request；
 * H5 保留业务页传入的相对路径，交给开发代理或同源部署；微信小程序必须由
 * VITE_API_BASE_URL 注入已经备案且配置为合法域名的 HTTPS API 根地址。
 */
export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  // #ifdef H5
  return path;
  // #endif
  // #ifndef H5
  const rawBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
  if (!/^https:\/\//i.test(rawBase)) {
    throw new Error('小程序未配置 HTTPS API 地址，请设置 VITE_API_BASE_URL');
  }
  // Permit a base URL that already includes /api without generating /api/api.
  if (rawBase.endsWith('/api') && path.startsWith('/api/')) return `${rawBase}${path.slice(4)}`;
  return `${rawBase}/${path.replace(/^\//, '')}`;
  // #endif
}

export async function apiRequest<T = unknown>(options: {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: Record<string, unknown>;
  auth?: boolean;
}): Promise<T> {
  const token = getToken();
  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: resolveApiUrl(options.url),
      method: options.method || 'GET',
      data: options.data,
      header: options.auth === false || !token ? {} : { Authorization: `Bearer ${token}` },
      success: (response: any) => {
        const body = response.data || {};
        if (body.code !== undefined && body.code !== 0) {
          if (body.code === 40100 || body.code === 40101) clearToken();
          reject(new Error(body.message || '请求失败'));
          return;
        }
        resolve((body.data ?? body) as T);
      },
      fail: () => reject(new Error('网络异常，请检查网络后重试')),
    });
  });
}

export function getToken(): string | null {
  try {
    return uni.getStorageSync(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  uni.setStorageSync(TOKEN_KEY, token);
}

export function clearToken(): void {
  try {
    uni.removeStorageSync(TOKEN_KEY);
  } catch {
    /* noop */
  }
}

/** 当前租户 AppID（用户小程序按租户 AppID 登录） */
export function getTenantAppId(): string {
  try {
    return uni.getStorageSync(TENANT_KEY) || '';
  } catch {
    return '';
  }
}

export function setTenantAppId(appid: string): void {
  uni.setStorageSync(TENANT_KEY, appid);
}

/** 金额字符串 → 展示文本 */
export function formatMoney(value: string | number): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '0.00';
  return num.toFixed(2);
}

/** 手机号脱敏 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
}

/** 跳转登录 */
export function toLogin(): void {
  uni.navigateTo({ url: '/pages/login/index' });
}

/** 提示 */
export function toast(title: string, icon: 'none' | 'success' | 'error' = 'none'): void {
  uni.showToast({ title, icon });
}
