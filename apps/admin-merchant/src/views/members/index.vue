<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span>会员积分</span>
        <el-button :loading="loading" @click="load">刷新</el-button>
      </div>
    </template>
    <el-table :data="rows" v-loading="loading" border>
      <el-table-column prop="memberNo" label="编号" min-width="120" />
      <el-table-column prop="nickname" label="会员" min-width="120" />
      <el-table-column label="手机号" min-width="130"><template #default="{ row }">{{ row.phoneMask || row.phone || '-' }}</template></el-table-column>
      <el-table-column prop="pointsBalance" label="积分" width="100" />
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button link type="primary" @click="$router.push('/members/' + row.id)">详情</el-button>
          <el-button link type="primary" @click="adjust(row)">调整积分</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { memberApi } from '@/api';

const rows = ref<any[]>([]);
const loading = ref(false);
const normalize = (res: any) => res?.data?.list || res?.data?.items || res?.list || res?.items || res?.data || res || [];

async function adjust(row: any) {
  const points = await ElMessageBox.prompt('输入积分变更（可负数）', '调整积分').catch(() => null);
  if (!points) return;
  const remark = await ElMessageBox.prompt('请输入调整备注（必填）', '调整原因').catch(() => null);
  if (!remark || !remark.value?.trim()) return ElMessage.warning('备注必填');
  try {
    await memberApi.points(row.id, Number(points.value), remark.value.trim(), 'm-' + Date.now());
    ElMessage.success('调整成功');
    await load();
  } catch (e: any) {
    ElMessage.error(e?.message || '调整失败');
  }
}

async function load() {
  loading.value = true;
  try {
    rows.value = normalize(await memberApi.list());
  } catch (e: any) {
    ElMessage.error(e?.message || '会员加载失败');
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.card-header { display: flex; align-items: center; justify-content: space-between; }
</style>
