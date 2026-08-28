<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-brand">
        <div class="brand-mark">M</div>
        <div class="brand-title">商城 SaaS</div>
        <div class="brand-role">平台管理后台</div>
        <div class="brand-sub">多租户商城 · 运营中枢</div>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="onSubmit">
        <el-form-item label="账号" prop="account">
          <el-input v-model="form.account" placeholder="请输入账号" :prefix-icon="User" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" :prefix-icon="Lock" @keyup.enter="onSubmit" />
        </el-form-item>
        <el-button type="primary" class="login-btn" :loading="loading" @click="onSubmit">登 录</el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { authApi } from '@/api';
import { setToken } from '@mall/web-kit';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const user = useUserStore();
const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({ account: 'admin', password: 'admin123' });
const rules: FormRules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

async function onSubmit() {
  await formRef.value?.validate();
  loading.value = true;
  try {
    const login = await authApi.login(form);
    setToken(login.accessToken, login.refreshToken);
    // 后端 /pf/auth/me 当前返回空对象（JWT payload 未携带 user），登录态以 login.user 为准
    user.setAuth({ token: login.accessToken, user: login.user });
    ElMessage.success('登录成功');
    router.replace('/dashboard');
  } catch {
    ElMessage.error('登录失败，请重试');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page { position: relative; min-height: 100vh; display: grid; place-items: center; overflow: hidden; padding: 24px; background: radial-gradient(circle at 14% 16%, rgba(96, 165, 250, .52), transparent 30%), radial-gradient(circle at 84% 88%, rgba(30, 64, 175, .38), transparent 34%), linear-gradient(135deg, #0b1430, #16285b 55%, #1d4ed8); }
.login-page::before, .login-page::after { position: absolute; width: 420px; height: 420px; border: 1px solid rgba(255, 255, 255, .13); border-radius: 50%; content: ''; }.login-page::before { top: -210px; right: -70px; }.login-page::after { bottom: -250px; left: -90px; }
.login-card { position: relative; z-index: 1; width: min(100%, 410px); padding: 38px; border: 1px solid rgba(255, 255, 255, .7); border-radius: 20px; background: rgba(255, 255, 255, .96); box-shadow: 0 28px 70px rgba(3, 12, 38, .34); }
.login-brand { display: grid; justify-items: center; margin-bottom: 28px; text-align: center; }.brand-mark { width: 48px; height: 48px; display: grid; place-items: center; margin-bottom: 14px; border-radius: 15px; color: #fff; background: linear-gradient(135deg, #60a5fa, #2563eb); font-size: 21px; font-weight: 800; box-shadow: 0 10px 22px rgba(37, 99, 235, .3); }.brand-title { color: var(--color-text); font-size: 23px; font-weight: 750; letter-spacing: -.02em; }.brand-role { margin-top: 4px; color: var(--brand-primary); font-size: 13px; font-weight: 600; }.brand-sub { margin-top: 6px; color: var(--color-text-secondary); font-size: 13px; }.login-btn { width: 100%; height: 42px; margin-top: 8px; border-radius: 10px; }.login-tip { font-size: 12px; color: var(--color-text-tertiary); text-align: center; margin-top: 12px; }
@media (max-width: 480px) { .login-page { padding: 16px; }.login-card { padding: 30px 24px; } }
</style>
