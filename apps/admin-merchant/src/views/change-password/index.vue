<template>
  <el-card class="pwd-card">
    <template #header>修改密码</template>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" style="max-width: 420px">
      <el-form-item label="原密码" prop="oldPassword">
        <el-input v-model="form.oldPassword" type="password" show-password />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="form.newPassword" type="password" show-password />
      </el-form-item>
      <el-form-item label="确认新密码" prop="confirm">
        <el-input v-model="form.confirm" type="password" show-password />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="onSubmit">提交</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { mcChangePassword } from '@/api';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();
const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({ oldPassword: '', newPassword: '', confirm: '' });
const rules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [{ required: true, min: 6, message: '新密码至少6位', trigger: 'blur' }, { validator: (_r, v, cb) => (/^(.)\1+$/.test(String(v || '')) ? cb(new Error('新密码过于简单')) : cb()), trigger: 'blur' }],
  confirm: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_r, v, cb) => (v === form.newPassword ? cb() : cb(new Error('两次输入不一致'))),
      trigger: 'blur',
    },
  ],
};

async function onSubmit() {
  if (loading.value || !formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) { ElMessage.warning('请先修正表单中的错误'); return; }
  loading.value = true;
  try {
    await mcChangePassword(form.oldPassword, form.newPassword);
    ElMessage.success('密码修改成功，请重新登录');
    userStore.logout();
    router.push('/login');
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '修改密码失败，请检查原密码');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.pwd-card { max-width: 560px; }
</style>
