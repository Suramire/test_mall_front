<template>
  <el-card shadow="never" v-loading="loading">
    <template #header>
      <div class="head">
        <span>员工管理</span>
        <el-button type="primary" size="small" :icon="Plus" @click="dialog = true">新增员工</el-button>
      </div>
    </template>
    <el-table :data="rows" border>
      <el-table-column prop="account" label="账号" width="120" />
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column label="手机" width="140"><template #default="{ row }">{{ maskPhone(row.phone) }}</template></el-table-column>
      <el-table-column prop="roleName" label="角色" width="100" />
      <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag :type="row.status === 'ENABLED' ? 'success' : 'info'">{{ row.status === 'ENABLED' ? '启用' : '禁用' }}</el-tag></template></el-table-column>
      <el-table-column label="最后登录" width="160"><template #default="{ row }">{{ formatDate(row.lastLoginAt) }}</template></el-table-column>
      <el-table-column label="操作" width="200"><template #default="{ row }">
        <el-button link type="primary" :loading="action === 'toggle' + row.id" @click="toggle(row)">{{ row.status === 'ENABLED' ? '禁用' : '启用' }}</el-button>
        <el-button link type="warning" :loading="action === 'reset' + row.id" @click="reset(row)">重置密码</el-button>
      </template></el-table-column>
    </el-table>
    <el-pagination class="pager" v-model:current-page="page" :total="total" :page-size="size" layout="total, prev, pager, next" @current-change="load" />
  </el-card>

  <el-dialog v-model="dialog" title="新增员工" width="480px">
    <el-form :model="form" label-width="80px">
      <el-form-item label="账号"><el-input v-model="form.account" /></el-form-item>
      <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="手机"><el-input v-model="form.phone" /></el-form-item>
      <el-form-item label="角色ID"><el-input-number v-model="form.roleId" :min="1" /></el-form-item>
      <el-form-item label="密码"><el-input v-model="form.password" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialog = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">创建</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { staffApi } from '@/api';
import { maskPhone, formatDate } from '@mall/shared-utils';
import type { StaffVO } from '@/types';

const loading = ref(false);
/** 后端 GET /pf/staff 返回分页结构，直接使用服务端分页 */
const rows = ref<StaffVO[]>([]);
const page = ref(1);
const size = ref(10);
const total = ref(0);

const dialog = ref(false);
const action = ref('');
const saving = ref(false);
const form = reactive({ account: '', name: '', phone: '', roleId: 2, password: 'Staff@123' });

async function load(p?: number) {
  if (p) page.value = p;
  loading.value = true;
  try {
    const r = await staffApi.list({ page: page.value, size: size.value });
    const response: any = r;
    const envelope = response?.data ?? response;
    const data = envelope?.data ?? envelope;
    rows.value = data?.list ?? data?.items ?? (Array.isArray(data) ? data : []);
    total.value = Number(data?.total ?? data?.totalElements ?? rows.value.length);
  } catch (e: any) { rows.value = []; total.value = 0; ElMessage.error(e?.response?.data?.message || e?.message || '员工加载失败');
  } finally { loading.value = false; }
}
/** 后端 toggle-status 自行翻转状态，不接受目标值入参 */
async function toggle(row: StaffVO) {
  if (action.value) return; action.value = 'toggle' + row.id;
  try { await staffApi.toggleStatus(row.id); ElMessage.success('已更新'); await load(); }
  catch (e: any) { ElMessage.error(e?.message || '状态更新失败'); }
  finally { action.value = ''; }
}
async function reset(row: StaffVO) {
  if (action.value) return; action.value = 'reset' + row.id;
  try { const r = await staffApi.resetPassword(row.id); ElMessage.success(`临时密码：${r.newPassword || '已重置'}`); }
  catch (e: any) { ElMessage.error(e?.message || '重置失败'); }
  finally { action.value = ''; }
}
async function submit() {
  saving.value = true;
  try {
    await staffApi.create({ ...form });
    ElMessage.success('已创建'); dialog.value = false; Object.assign(form, { account: '', name: '', phone: '', roleId: 2, password: 'Staff@123' }); await load();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '创建员工失败');
  } finally { saving.value = false; }
}
onMounted(load);
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: center; }
.pager { margin-top: 16px; justify-content: flex-end; }
</style>
