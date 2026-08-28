import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getToken, clearToken } from '@mall/web-kit';
import type { PfAuthUser } from '@/types';

const STORAGE_KEY = 'pf_user_profile';

function loadProfile(): { user: PfAuthUser; perms: string[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.user) return parsed;
  } catch {
    /* 忽略损坏的本地数据 */
  }
  return null;
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(getToken());
  const cached = loadProfile();
  const userInfo = ref<PfAuthUser | null>(cached?.user ?? null);
  const perms = ref<string[]>(cached?.perms ?? []);
  const pwdResetRequired = ref<boolean>(!!cached?.user?.pwdResetRequired);

  /** 登录成功后写入（user 来自 POST /pf/auth/login 的 data.user） */
  function setAuth(payload: { token: string; user: PfAuthUser }) {
    token.value = payload.token;
    userInfo.value = payload.user;
    perms.value = payload.user.perms || [];
    pwdResetRequired.value = !!payload.user.pwdResetRequired;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: userInfo.value, perms: perms.value }),
    );
  }

  function hasPerm(code: string): boolean {
    return perms.value.includes(code);
  }

  function markPwdResetDone() {
    pwdResetRequired.value = false;
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, pwdResetRequired: false };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user: userInfo.value, perms: perms.value }),
      );
    }
  }

  function logout() {
    clearToken();
    localStorage.removeItem(STORAGE_KEY);
    token.value = null;
    userInfo.value = null;
    perms.value = [];
    pwdResetRequired.value = false;
  }

  return { token, userInfo, perms, pwdResetRequired, setAuth, hasPerm, markPwdResetDone, logout };
});
