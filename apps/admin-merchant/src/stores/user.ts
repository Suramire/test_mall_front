import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getToken, setToken, clearToken, getRefreshToken, setRefreshToken } from '@mall/web-kit';
import { mcMe, mcSsoExchange } from '@/api';
import type { McMeResult } from '@mall/shared-types';

export const useUserStore = defineStore('mc-user', () => {
  const token = ref<string>(getToken() || '');
  const refreshToken = ref<string>(getRefreshToken() || '');
  const user = ref<McMeResult['staff'] | null>(null);
  const tenant = ref<McMeResult['tenant'] | null>(null);
  const perms = ref<string[]>([]);
  const features = ref<string[]>([]);
  const impersonating = ref<boolean>(false);

  function setAuth(accessToken: string, refresh: string, expiresIn: number) {
    token.value = accessToken;
    refreshToken.value = refresh;
    setToken(accessToken, refresh);
    setRefreshToken(refresh);
    // expiresIn 仅用于前端过期判断，可在此扩展
    void expiresIn;
  }

  function setProfile(data: McMeResult) {
    const raw: any = data as any;
    const profile: any = raw?.data ?? raw;
    const t: any = profile?.tenant;
    user.value = profile?.staff ?? null;
    tenant.value = t ? {
      ...t,
      name: t.name ?? t.tenantName ?? '',
      tenantNo: t.tenantNo ?? t.tenantCode ?? t.code,
    } : null;
    perms.value = Array.isArray(profile?.perms) ? profile.perms : [];
    features.value = Array.isArray(profile?.features) ? profile.features : [];
  }

  function hasPerm(p?: string): boolean {
    if (!p) return true;
    return perms.value.includes('MC_ALL') || perms.value.includes(p);
  }

  async function fetchMe() {
    const data = await mcMe();
    setProfile(data);
    return data;
  }

  /** 代客 SSO 回跳：用 ticket 换 Token 并载入档案 */
  async function exchangeSso(ticket: string) {
    const d = await mcSsoExchange(ticket);
    const x:any=d; setAuth(x.accessToken || x.token, x.refreshToken, x.expiresIn || x.expireAt || 0);
    impersonating.value = d.impersonating === true;
    // 换票后 me 接口返回代客态档案
    await fetchMe();
  }

  function logout() {
    clearToken();
    token.value = '';
    refreshToken.value = '';
    user.value = null;
    tenant.value = null;
    perms.value = [];
    features.value = [];
    impersonating.value = false;
  }

  return {
    token,
    refreshToken,
    user,
    tenant,
    perms,
    features,
    impersonating,
    setAuth,
    setProfile,
    hasPerm,
    fetchMe,
    exchangeSso,
    logout,
  };
});
