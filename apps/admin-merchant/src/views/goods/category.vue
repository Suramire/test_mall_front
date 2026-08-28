<template>
  <el-card shadow="never">
    <template #header>
      <div class="hd">
        <span>商品分类（双渠道独立）</span>
        <el-radio-group v-model="channel" @change="load">
          <el-radio-button value="NORMAL">普通商城</el-radio-button>
          <el-radio-button value="POINTS">积分商城</el-radio-button>
        </el-radio-group>
      </div>
    </template>
    <el-table :data="tree" v-loading="loading" row-key="id" :tree-props="{ children: 'children' }" border>
      <el-table-column prop="name" label="分类名" />
      <el-table-column prop="sort" label="排序" width="100" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button link type="primary" @click="onAdd(row)">加子级</el-button>
          <el-button link type="primary" @click="onEdit(row)">改名</el-button>
          <el-popconfirm title="确认删除？" @confirm="onDelete(row)">
            <template #reference><el-button link type="danger">删除</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <el-button class="add-root" type="success" @click="onAdd(null)">+ 新增顶级分类</el-button>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { type SalesChannel, type CategoryNode } from '@mall/shared-types';
import { categoryList, categoryCreate, categoryUpdate, categoryDelete } from '@/api';

const channel = ref<SalesChannel>('NORMAL');
const loading = ref(false);
const tree = ref<CategoryNode[]>([]);

async function load() {
  loading.value = true;
  try { tree.value = await categoryList(channel.value); }
  catch (e: any) { tree.value = []; ElMessage.error(e?.response?.data?.message || e?.message || '分类加载失败'); }
  finally { loading.value = false; }
}
async function onAdd(parent: CategoryNode | null) {
  const { value } = await ElMessageBox.prompt('分类名称', parent ? '新增子分类' : '新增顶级分类');
  if (!value) return;
  try { await categoryCreate({ name: value, parentId: parent?.id ?? undefined, channel: channel.value, sort: 99 }); ElMessage.success('已添加'); await load(); }
  catch (e: any) { ElMessage.error(e?.response?.data?.message || e?.message || '新增失败'); }
}
async function onEdit(row: CategoryNode) {
  const { value } = await ElMessageBox.prompt('分类名称', '改名', { inputValue: row.name });
  if (!value) return;
  try { await categoryUpdate(row.id, { name: value }); ElMessage.success('已保存'); await load(); }
  catch (e: any) { ElMessage.error(e?.response?.data?.message || e?.message || '保存失败'); }
}
async function onDelete(row: CategoryNode) {
  try { await categoryDelete(row.id); ElMessage.success('已删除'); await load(); }
  catch (e: any) { ElMessage.error(e?.response?.data?.message || e?.message || '删除失败'); }
}
onMounted(load);
</script>

<style scoped>
.hd { display: flex; justify-content: space-between; align-items: center; }
.add-root { margin-top: 12px; }
</style>
