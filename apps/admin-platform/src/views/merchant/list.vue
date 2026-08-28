<template>
  <div class="merchant-list">
    <el-card shadow="never">
      <el-form inline @submit.prevent>
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="商家名 / 租户号" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="(label, val) in STATUS_LABEL" :key="val" :label="label" :value="val" />
          </el-select>
        </el-form-item>
        <el-button type="primary" :icon="Search" @click="load(1)">查询</el-button>
        <el-button @click="reset">重置</el-button><el-button @click="exportCsv">导出</el-button><el-button :loading="batchLoading" :disabled="!selected.length" @click="batch('DISABLED')">批量禁用</el-button>
        <el-button :icon="Plus" type="success" @click="goCreate">新增商家</el-button>
      </el-form>

      <el-table :data="rows" v-loading="loading" border @selection-change="selected=$event"><el-table-column type="selection" width="45" />
        <el-table-column prop="tenantNo" label="租户号" width="100" />
        <el-table-column prop="name" label="商家名称" min-width="140" />
        <el-table-column prop="revenue" label="累计营收" width="130" sortable="custom" @sort-change="onSort">
          <template #default="{ row }">¥{{ (Number(row.revenue ?? row.totalRevenue ?? 0) || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</template>
        </el-table-column>
        <el-table-column prop="memberCount" label="会员数" width="90" sortable="custom" @sort-change="onSort" />
        <el-table-column label="联系人" width="120">
          <template #default="{ row }">{{ row.contactName }} / {{ maskPhone(row.contactPhone) }}</template>
        </el-table-column>
        <el-table-column label="到期时间" width="120">
          <template #default="{ row }">{{ formatDate(row.expireAt) }}</template>
        </el-table-column>
        <el-table-column label="开通时间" width="120"><template #default="{row}">{{ formatDate((row as any).openedAt) }}</template></el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><el-tag :type="statusType(row.status)">{{ STATUS_LABEL[row.status as TenantStatus] }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row.id)">详情</el-button>
            <el-button link type="primary" @click="goEdit(row.id)">编辑</el-button>
            <el-button v-if="row.status !== 'DISABLED'" link type="warning" :loading="statusLoading===row.id" @click="disable(row)">禁用</el-button>
            <el-button v-else link type="success" :loading="statusLoading===row.id" @click="enable(row)">启用</el-button>
            <el-button link type="info" :disabled="!canImpersonate" :loading="impersonatingId === row.id" @click="impersonate(row)">代登录</el-button>
            <el-button link type="success" :disabled="!canImpersonate" :loading="impersonatingId === row.id" @click="impersonate(row)">进入租户</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination class="pager" v-model:current-page="query.page" v-model:page-size="query.size"
        :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @current-change="load" @size-change="load(1)" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus } from '@element-plus/icons-vue';
import { merchantApi } from '@/api';
import { useUserStore } from '@/stores/user';
import { maskPhone, formatDate } from '@mall/shared-utils';
import type { TenantListItem, TenantStatus } from '@/types';

const router = useRouter();
const user = useUserStore();
const canImpersonate = computed(() => user.hasPerm('PF_MERCHANT_IMPERSONATE'));
const batchLoading = ref(false);
const statusLoading = ref<number>();
const impersonatingId = ref<number | null>(null);
const loading = ref(false);
const rows = ref<TenantListItem[]>([]);
const selected = ref<TenantListItem[]>([]);
const total = ref(0);

const STATUS_LABEL: Record<TenantStatus, string> = {
  NORMAL: '正常',
  TRIAL: '试用中',
  EXPIRED: '已到期',
  DISABLED: '已禁用',
};
function statusType(s: TenantStatus) {
  return s === 'NORMAL' ? 'success' : s === 'TRIAL' ? 'warning' : s === 'EXPIRED' ? 'danger' : 'info';
}

const query = reactive({ keyword: '', status: '', page: 1, size: 10 });
function onSort(s:any){(query as any).sortBy=s.prop;(query as any).sortOrder=s.order;load(1)}

async function load(p?: number) {
  if (p) query.page = p;
  loading.value = true;
  try {
    const res = await merchantApi.list({ ...query });
    const d:any=(res as any)?.data||res; rows.value = d?.list||d?.items||[]; total.value = d?.total||0;
  } finally {
    loading.value = false;
  }
}

function goCreate() { router.push('/merchant/new'); }
function reset(){query.keyword='';query.status='';load(1)}
/** 后端 /pf/merchant/export 返回 JSON 数组快照（非文件流），前端自行转 CSV 下载 */
async function exportCsv() {
  const rowsData = await merchantApi.exportSnapshot();
  if (!rowsData?.length) { ElMessage.warning('暂无可导出数据'); return; }
  const cols: { key: keyof TenantListItem; label: string }[] = [
    { key: 'tenantNo', label: '租户号' }, { key: 'name', label: '商家名称' },
    { key: 'contactName', label: '联系人' }, { key: 'contactPhone', label: '联系电话' },
    { key: 'status', label: '状态' }, { key: 'expireAt', label: '到期时间' },
    { key: 'openedAt', label: '开通时间' }, { key: 'memberCount', label: '会员数' },
    { key: 'revenue', label: '累计营收' },
  ];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [
    cols.map((c) => esc(c.label)).join(','),
    ...rowsData.map((r) => cols.map((c) => esc(r[c.key])).join(',')),
  ].join('\r\n');
  // UTF-8 BOM，保证 Excel 中文不乱码
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tenants.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}
async function batch(status:string){if(batchLoading.value)return;batchLoading.value=true;try{await merchantApi.batchStatus(selected.value.map(x=>x.id),status);ElMessage.success('批量操作成功');await load()}catch(e:any){ElMessage.error(e?.response?.data?.message||e?.message||'批量操作失败')}finally{batchLoading.value=false}}
function goDetail(id: number) { router.push(`/merchant/${id}/detail`); }
function goEdit(id: number) { router.push(`/merchant/${id}/edit`); }

async function disable(row: TenantListItem) {
  if (statusLoading.value === row.id) return;
  await ElMessageBox.confirm(`确认禁用「${row.name}」？`, '提示', { type: 'warning' });
  statusLoading.value=row.id;
  try { await merchantApi.disable(row.id); ElMessage.success('已禁用'); await load(); }
  catch(e:any){ElMessage.error(e?.response?.data?.message||e?.message||'禁用失败')} finally {statusLoading.value=undefined}
}
async function enable(row: TenantListItem) {
  if (statusLoading.value === row.id) return; statusLoading.value=row.id;
  try { await merchantApi.enable(row.id); ElMessage.success('已启用'); await load(); }
  catch(e:any){ElMessage.error(e?.response?.data?.message||e?.message||'启用失败')} finally {statusLoading.value=undefined}
}
/** 后端仅返回 {redirectUrl, ticket}（60s 一次性），商家名取列表行数据 */
async function impersonate(row: TenantListItem) {
  if (!canImpersonate.value) { ElMessage.warning('当前账号无商家代登录权限'); return; }
  if (impersonatingId.value !== null) return;
  impersonatingId.value = row.id;
  try {
    const r: any = await merchantApi.impersonate(row.id);
    const payload = r?.data ?? r;
    if (!payload?.redirectUrl) throw new Error('后端未返回代登录地址');
    const rawUrl = String(payload.redirectUrl);
    const merchantOrigin = 'http://localhost:3002';
    let ticket = payload.ticket ? String(payload.ticket) : '';
    if (!ticket) {
      try { ticket = new URL(rawUrl, window.location.origin).searchParams.get('ticket') || ''; } catch { /* ignore malformed URL */ }
    }
    if (!ticket) throw new Error('后端未返回代登录 ticket');
    const targetUrl = `${merchantOrigin}/sso/callback?ticket=${encodeURIComponent(ticket)}`;
    ElMessage.success(`已生成「${row.name}」代登录凭证，正在打开商家后台`);
    const opened = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      ElMessage.warning('浏览器阻止了新窗口，将在当前页面打开商家后台');
      window.location.assign(targetUrl);
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '代登录失败');
  } finally {
    impersonatingId.value = null;
  }
}

onMounted(() => load());
</script>

<style scoped>
.pager { margin-top: 16px; justify-content: flex-end; }
</style>
