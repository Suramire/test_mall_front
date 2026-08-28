<template>
  <el-card shadow="never">
    <template #header>
      <div class="flex-between">
        <span>审计日志</span>
        <el-button text type="primary" @click="load">刷新</el-button>
      </div>
    </template>
    <el-form :inline="true" class="filters">
      <el-form-item label="动作">
        <el-select v-model="filters.action" placeholder="全部" clearable style="width: 160px" @change="load">
          <el-option v-for="a in ACTIONS" :key="a.value" :label="a.label" :value="a.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="商家ID">
        <el-input v-model="filters.tenantId" placeholder="租户ID" clearable style="width: 120px" @keyup.enter="load" />
      </el-form-item>
      <el-form-item label="操作员">
        <el-input v-model="filters.operator" placeholder="操作员" clearable style="width: 140px" @keyup.enter="load" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="load">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="rows" border v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="actionName" label="动作" width="120" />
      <el-table-column prop="operator" label="操作员" width="100" />
      <el-table-column label="商家" min-width="140">
        <template #default="{ row }">{{ row.tenantName ? `#${row.tenantId} ${row.tenantName}` : '—' }}</template>
      </el-table-column>
      <el-table-column label="详情" min-width="160" show-overflow-tooltip><template #default="{row}">{{ formatDetail(row.detail) }}</template></el-table-column>
      <el-table-column prop="createdAt" label="时间" width="180" />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button link type="primary" @click="detail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      class="pager"
      layout="total, prev, pager, next"
      :total="total"
      :current-page="page"
      :page-size="size"
      @current-change="onPage"
    />
  </el-card>
  <el-dialog v-model="detailOpen" title="审计详情" width="560px"><el-descriptions v-if="selected" :column="1" border><el-descriptions-item label="操作人">{{ selected.operator || '-' }}</el-descriptions-item><el-descriptions-item label="IP">{{ selected.ip || selected.operatorIp || '-' }}</el-descriptions-item><el-descriptions-item label="时间">{{ selected.createdAt || '-' }}</el-descriptions-item><el-descriptions-item label="动作">{{ selected.actionName || selected.action || '-' }}</el-descriptions-item><el-descriptions-item label="详情"><pre class="detail">{{ formatDetail(selected.detail) }}</pre></el-descriptions-item></el-descriptions></el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { auditApi } from '@/api';
import { AUDIT_ACTION } from '@mall/shared-types';

const ACTIONS = Object.entries(AUDIT_ACTION).map(([value, label]) => ({
  value,
  label: label.replace(/_/g, ' '),
}));

const loading = ref(false);
const rows = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(10);
const filters = reactive<{ action?: string; tenantId?: string; operator?: string }>({});
const detailOpen = ref(false);
const selected = ref<any>();

async function load() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = { page: page.value, size: size.value };
    if (filters.action) params.action = filters.action;
    if (filters.tenantId) params.tenantId = Number(filters.tenantId);
    if (filters.operator) params.operator = filters.operator;
    const response: any = await auditApi.list(params as any);
    const envelope = response?.data ?? response;
    const data = envelope?.data ?? envelope;
    rows.value = data?.list ?? data?.items ?? (Array.isArray(data) ? data : []);
    total.value = Number(data?.total ?? data?.totalElements ?? rows.value.length);
  } catch (e: any) {
    rows.value = []; total.value = 0;
    ElMessage.error(e?.response?.data?.message || e?.message || '审计日志加载失败');
  } finally {
    loading.value = false;
  }
}

function onPage(p: number) {
  page.value = p;
  load();
}

function detail(row: any) {
  selected.value = row;
  detailOpen.value = true;
}
function formatDetail(value: unknown): string { if (value == null || value === '') return '无'; if (typeof value === 'string') return value; try { return JSON.stringify(value); } catch { return '详情不可解析'; } }

onMounted(load);
</script>

<style scoped>
.flex-between { display: flex; align-items: center; justify-content: space-between; }
.filters { margin-bottom: 12px; }
.pager { margin-top: 12px; justify-content: flex-end; }
</style>
