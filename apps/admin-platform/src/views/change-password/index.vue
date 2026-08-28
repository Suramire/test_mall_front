<template>
  <el-card shadow="never" style="max-width: 480px">
    <template #header><span>修改密码</span></template>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="原密码" prop="oldPassword"><el-input v-model="form.oldPassword" type="password" show-password /></el-form-item>
      <el-form-item label="新密码" prop="newPassword"><el-input v-model="form.newPassword" type="password" show-password /></el-form-item>
      <el-form-item label="确认新密码" prop="confirm">
        <el-input v-model="form.confirm" type="password" show-password />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="onSubmit">提交</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { authApi } from '@/api';

const formRef = ref<FormInstance>();
const saving = ref(false);
const form = reactive({ oldPassword: '', newPassword: '', confirm: '' });

const rules: FormRules = {
  oldPassword: [{ required: true, message: '必填', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }, { min: 6, message: '新密码至少6位', trigger: 'blur' }, { validator: (_r, v, cb) => (/^(.)\1+$/.test(String(v || '')) ? cb(new Error('新密码过于简单')) : cb()), trigger: 'blur' }],
  confirm: [{ required: true, message: '请确认新密码', trigger: 'blur' }, { validator: (_r, v, cb) => (v === form.newPassword ? cb() : cb(new Error('两次输入不一致'))), trigger: 'blur' }],
};

async function onSubmit() {
  if (saving.value || !formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) { ElMessage.warning('请先修正表单中的错误'); return; }
  saving.value = true;
  try {
    await authApi.changePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword });
    ElMessage.success('密码已修改');
    form.oldPassword = ''; form.newPassword = ''; form.confirm = '';
    formRef.value.resetFields();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '修改密码失败，请检查原密码');
  } finally { saving.value = false; }
}
</script>
