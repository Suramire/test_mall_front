<template>
  <el-card shadow="never">
    <template #header>
      <div class="hd"><span>运费模板</span><el-button type="success" @click="onAdd">+ 新增</el-button></div>
    </template>
    <el-table :data="rows" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="模板名" />
      <el-table-column label="计费方式" width="120">
        <template #default="{ row }">{{ ({FREE:'包邮',COUNT:'按件',WEIGHT:'按重',BY_PIECE:'按件',BY_WEIGHT:'按重'} as any)[row.type] || '-' }}</template>
      </el-table-column>
      <el-table-column label="金额" width="120"><template #default="{ row }">¥{{ row.amount ?? '-' }}</template></el-table-column>
      <el-table-column prop="createdAt" label="创建时间" />
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button link type="primary" @click="onEdit(row)">编辑</el-button>
          <el-popconfirm title="确认删除？" @confirm="onDelete(row)">
            <template #reference><el-button link type="danger">删除</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { type FreightTemplate } from '@mall/shared-types';
import { freightList, freightCreate, freightUpdate, freightDelete } from '@/api';

const loading = ref(false);
const rows = ref<FreightTemplate[]>([]);

async function load() {
  loading.value = true;
  try { const r: any = await freightList(); const d = r?.data ?? r; rows.value = d?.list ?? d?.items ?? (Array.isArray(d) ? d : []); } catch (e: any) { rows.value = []; ElMessage.error(e?.response?.data?.message || e?.message || '运费模板加载失败'); } finally { loading.value = false; }
}
async function onAdd() {
  const { value: name } = await ElMessageBox.prompt('模板名称', '新增运费模板');
  const { value: amount } = await ElMessageBox.prompt('金额（包邮填0）', '运费金额', { inputValue: '0.00' });
  try { await freightCreate({ name, type: Number(amount) > 0 ? 'COUNT' : 'FREE', amount }); ElMessage.success('已添加'); await load(); } catch (e: any) { ElMessage.error(e?.response?.data?.message || e?.message || '新增失败'); }
}
async function onEdit(row: FreightTemplate) {
  const { value: name } = await ElMessageBox.prompt('模板名称', '编辑', { inputValue: row.name });
  try { await freightUpdate(row.id, { name }); ElMessage.success('已保存'); await load(); } catch (e: any) { ElMessage.error(e?.response?.data?.message || e?.message || '保存失败'); }
}
async function onDelete(row: FreightTemplate) {
  try { await freightDelete(row.id); ElMessage.success('已删除'); await load(); } catch (e: any) { ElMessage.error(e?.response?.data?.message || e?.message || '删除失败'); }
}
onMounted(load);
</script>

<style scoped>
.hd { display: flex; justify-content: space-between; align-items: center; }
</style>
