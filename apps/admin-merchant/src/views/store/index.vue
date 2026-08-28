<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span>门店管理</span>
        <el-button type="primary" @click="openCreate">新增门店</el-button>
      </div>
    </template>
    <el-table :data="rows" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="门店名称" min-width="140" />
      <el-table-column prop="address" label="地址" min-width="220" />
      <el-table-column prop="phone" label="电话" width="140" />
      <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'ENABLED' ? 'success' : 'info'">{{ row.status === 'ENABLED' ? '启用' : '停用' }}</el-tag></template></el-table-column>
      <el-table-column label="自提/核销" width="130"><template #default="{ row }">{{ row.isPickup ? '自提' : '' }}{{ row.isPickup && row.isVerify ? ' / ' : '' }}{{ row.isVerify ? '核销' : '' }}</template></el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-popconfirm title="确认删除该门店？" @confirm="onDelete(row)"><template #reference><el-button link type="danger">删除</el-button></template></el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="editing ? '编辑门店' : '新增门店'" width="520px">
    <el-form :model="form" label-width="90px">
      <el-form-item label="门店名称"><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
      <el-form-item label="电话"><el-input v-model="form.phone" /></el-form-item>
      <el-form-item label="状态" v-if="editing"><el-select v-model="form.status"><el-option label="启用" value="ENABLED" /><el-option label="停用" value="DISABLED" /></el-select></el-form-item>
      <el-form-item label="服务"><el-checkbox v-model="form.isPickup">支持自提</el-checkbox><el-checkbox v-model="form.isVerify">支持核销</el-checkbox></el-form-item>
    </el-form>
    <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="onSave">保存</el-button></template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { storeApi } from '@/api';

const rows = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editing = ref<any>(null);
const form = ref({ name: '', address: '', phone: '', status: 'ENABLED', isPickup: true, isVerify: true });

function resetForm(row?: any) { form.value = { name: row?.name || '', address: row?.address || '', phone: row?.phone || '', status: row?.status || 'ENABLED', isPickup: row?.isPickup !== 0, isVerify: row?.isVerify !== 0 }; }
function openCreate() { editing.value = null; resetForm(); dialogVisible.value = true; }
function openEdit(row: any) { editing.value = row; resetForm(row); dialogVisible.value = true; }
async function load() { loading.value = true; try { const r: any = await storeApi.list(); const d = r?.data ?? r; rows.value = d?.list ?? d?.items ?? (Array.isArray(d) ? d : []); } catch (e: any) { rows.value = []; ElMessage.error(e?.response?.data?.message || e?.message || '门店加载失败'); } finally { loading.value = false; } }
async function onSave() { saving.value = true; try { if (editing.value) await storeApi.update(editing.value.id, form.value); else await storeApi.create(form.value); ElMessage.success('保存成功'); dialogVisible.value = false; await load(); } catch (e: any) { ElMessage.error(e?.message || '保存失败'); } finally { saving.value = false; } }
async function onDelete(row: any) { try { await storeApi.remove(row.id); ElMessage.success('已删除'); await load(); } catch (e: any) { ElMessage.error(e?.message || '删除失败'); } }
onMounted(load);
</script>

<style scoped>
.card-header { display: flex; align-items: center; justify-content: space-between; }
</style>
