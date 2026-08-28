<template>
  <div class="login-page">
    <el-card class="login-card" shadow="never">
      <div class="login-brand"><div class="brand-mark">M</div><h2 class="title">商城 SaaS</h2><div class="brand-role">商家管理后台</div></div>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="onSubmit">
        <el-form-item label="账号" prop="account">
          <el-input v-model="form.account" placeholder="merchant_admin" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="123456" @keyup.enter="onSubmit" />
        </el-form-item>
        <el-button type="primary" :loading="loading" class="submit" @click="onSubmit">登录</el-button>
      </el-form>
      <p class="tip">演示账号：merchant_admin / 123456</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { mcLogin } from '@/api';

const router = useRouter();
const userStore = useUserStore();
const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({ account: 'merchant_admin', password: '123456' });
const rules: FormRules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

async function onSubmit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    const res = await mcLogin(form.account, form.password);
    const d = res;
    const x:any=d; userStore.setAuth(x.accessToken || x.token, x.refreshToken, x.expiresIn || x.expireAt);
    await userStore.fetchMe();
    ElMessage.success('登录成功');
    router.push('/dashboard');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '登录失败';
    ElMessage.error(msg);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page { position: relative; min-height: 100vh; display: grid; place-items: center; overflow: hidden; padding: 24px; background: radial-gradient(circle at 14% 16%, rgba(96, 165, 250, .52), transparent 30%), radial-gradient(circle at 84% 88%, rgba(30, 64, 175, .38), transparent 34%), linear-gradient(135deg, #0b1430, #16285b 55%, #1d4ed8); }.login-page::before, .login-page::after { position: absolute; width: 420px; height: 420px; border: 1px solid rgba(255, 255, 255, .13); border-radius: 50%; content: ''; }.login-page::before { top: -210px; right: -70px; }.login-page::after { bottom: -250px; left: -90px; }
.login-card { position: relative; z-index: 1; width: min(100%, 410px); border: 1px solid rgba(255, 255, 255, .7); border-radius: 20px; background: rgba(255, 255, 255, .96); box-shadow: 0 28px 70px rgba(3, 12, 38, .34); }.login-brand { display: grid; justify-items: center; margin-bottom: 28px; text-align: center; }.brand-mark { width: 48px; height: 48px; display: grid; place-items: center; margin-bottom: 14px; border-radius: 15px; color: #fff; background: linear-gradient(135deg, #60a5fa, #2563eb); font-size: 21px; font-weight: 800; box-shadow: 0 10px 22px rgba(37, 99, 235, .3); }.title { margin: 0; color: var(--color-text); font-size: 23px; font-weight: 750; letter-spacing: -.02em; }.brand-role { margin-top: 4px; color: var(--brand-primary); font-size: 13px; font-weight: 600; }.submit { width: 100%; height: 42px; border-radius: 10px; }.tip { text-align: center; color: var(--color-text-tertiary); font-size: 12px; margin: 16px 0 0; }
@media (max-width: 480px) { .login-page { padding: 16px; }.login-card :deep(.el-card__body) { padding: 30px 24px; } }
</style>
