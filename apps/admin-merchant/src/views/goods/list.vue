<template>
  <div class="goods-list">
    <el-card shadow="never">
      <el-form :inline="true" :model="query" class="filters">
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="商品名" clearable @keyup.enter="onSearch" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="query.type" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="(v, k) in GOODS_TYPE" :key="k" :label="labelType(v)" :value="v" />
          </el-select>
        </el-form-item>
        <el-form-item label="渠道">
          <el-select v-model="query.channel" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="(v, k) in SALES_CHANNEL" :key="k" :label="labelChannel(v)" :value="v" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="(v, k) in GOODS_STATUS" :key="k" :label="labelStatus(v)" :value="v" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button type="success" @click="goCreate">新增商品</el-button>
          <el-button :disabled="!selected.length || batchLoading" :loading="batchLoading" @click="batch('ON_SALE')">批量上架</el-button><el-button :disabled="!selected.length || batchLoading" :loading="batchLoading" @click="batch('OFF_SALE')">批量下架</el-button><el-button @click="exportData">导出CSV</el-button><el-button @click="importInput?.click()">导入CSV</el-button><input ref="importInput" hidden type="file" accept=".csv" @change="importData" />
        </el-form-item>
      </el-form>

      <el-table :data="rows" v-loading="loading" stripe @selection-change="selected=$event"><el-table-column type="selection" width="48" />
        <el-table-column label="商品" min-width="240">
          <template #default="{ row }">
            <div class="g-cell">
              <img :src="row.mainImage" class="thumb" />
              <div>
                <div class="g-name">{{ row.name }}</div>
                <div class="g-meta">#{{ row.id }} · {{ labelType(row.type) }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="渠道" width="110">
          <template #default="{ row }"><el-tag size="small">{{ labelChannel(row.channel) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="价格" width="120">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column label="总库存" width="100" prop="totalStock" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }"><el-tag :type="statusTag(row.status)" size="small">{{ labelStatus(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row.id)">详情</el-button>
            <el-button link type="primary" @click="goEdit(row.id)">编辑</el-button>
            <el-dropdown trigger="click" @command="(c: string) => onShelf(row, c)">
              <el-button link type="primary">上下架<i class="el-icon-arrow-down" /></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="NORMAL:on">普通渠道上架</el-dropdown-item>
                  <el-dropdown-item command="NORMAL:off">普通渠道下架</el-dropdown-item>
                  <el-dropdown-item command="POINTS:on">积分渠道上架</el-dropdown-item>
                  <el-dropdown-item command="POINTS:off">积分渠道下架</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-popconfirm title="确认删除该商品？" @confirm="onDelete(row)">
              <template #reference><el-button link type="danger">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination class="pager" v-model:current-page="query.page" :page-size="query.size"
        :total="total" layout="total, prev, pager, next" @current-change="load" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  GOODS_TYPE, GOODS_STATUS, SALES_CHANNEL,
  type GoodsType, type GoodsStatus, type SalesChannel,
} from '@mall/shared-types';
import { goodsList, goodsDelete, goodsShelf, goodsBatchStatus, goodsExport, goodsImport } from '@/api';

const router = useRouter();
const loading = ref(false);
const rows = ref<any[]>([]);
const total = ref(0);
const selected = ref<any[]>([]); const batchLoading = ref(false); const importInput = ref<HTMLInputElement>();
const query = reactive({ keyword: '', type: '' as GoodsType | '', channel: '' as SalesChannel | '', status: '' as GoodsStatus | '', page: 1, size: 20 });

function labelType(v: GoodsType) { return ({ PHYSICAL: '实体', VIRTUAL: '虚拟', TICKET: '核销券' } as Record<string, string>)[v] || v; }
function labelChannel(v: SalesChannel) { return ({ NORMAL: '普通', POINTS: '积分', BOTH: '双渠道' } as Record<string, string>)[v] || v; }
function labelStatus(v: GoodsStatus) { return ({ ON_SALE: '在售', OFF_SALE: '下架', SOLD_OUT: '售罄', DRAFT: '草稿' } as Record<string, string>)[v] || v; }
function statusTag(v: GoodsStatus) { return v === 'ON_SALE' ? 'success' : v === 'SOLD_OUT' ? 'warning' : v === 'DRAFT' ? 'info' : ''; }

async function load() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = { page: query.page, size: query.size };
    if (query.keyword) params.keyword = query.keyword;
    if (query.type) params.type = query.type;
    if (query.channel) params.channel = query.channel;
    if (query.status) params.status = query.status;
    const response: any = await goodsList(params as any);
    const data = response?.data ?? response;
    rows.value = data?.list ?? data?.items ?? (Array.isArray(data) ? data : []);
    total.value = Number(data?.total ?? data?.totalElements ?? rows.value.length);
  } catch (e: any) {
    rows.value = [];
    total.value = 0;
    ElMessage.error(e?.response?.data?.message || e?.message || '商品加载失败');
  } finally {
    loading.value = false;
  }
}
function onSearch() { query.page = 1; load(); }
async function batch(status:string){if(batchLoading.value||!selected.value.length)return;batchLoading.value=true;try{await goodsBatchStatus(selected.value.map(x=>x.id),status);ElMessage.success('批量操作成功');selected.value=[];await load()}catch(e:any){ElMessage.error(e?.message||'批量操作失败')}finally{batchLoading.value=false}}
async function exportData(){try{const r:any=await goodsExport(query);const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([r.data||r],{type:'text/csv'}));a.download='goods.csv';a.click()}catch(e:any){ElMessage.error(e?.message||'导出失败')}}
async function importData(e:Event){const f=(e.target as HTMLInputElement).files?.[0];if(!f)return;try{await goodsImport(f);ElMessage.success('导入完成');await load()}catch(e:any){ElMessage.error(e?.message||'导入失败')}finally{(e.target as HTMLInputElement).value=''}}
function goCreate() { router.push('/goods/new'); }
function goDetail(id: number) { router.push('/goods/' + id + '/detail'); }
function goEdit(id: number) { router.push('/goods/' + id + '/edit'); }
async function onDelete(row: any) {
  try {
    await goodsDelete(row.id);
    ElMessage.success('已删除');
    await load();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败');
  }
}
async function onShelf(row: any, cmd: string) {
  const [channel, action] = cmd.split(':') as [SalesChannel, 'on' | 'off'];
  if (!channel || !action) { ElMessage.warning('无效的上下架操作'); return; }
  try {
    await goodsShelf(row.id, channel, action === 'on');
    ElMessage.success('已' + (action === 'on' ? '上架' : '下架'));
    await load();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '上下架失败');
  }
}

onMounted(load);
</script>

<style scoped>
.goods-list { padding: 8px; }
.filters { margin-bottom: 8px; }
.g-cell { display: flex; align-items: center; gap: 10px; }
.thumb { width: 44px; height: 44px; border-radius: 6px; object-fit: cover; }
.g-name { font-weight: 600; }
.g-meta { color: #909399; font-size: 12px; }
.pager { margin-top: 12px; justify-content: flex-end; display: flex; }
</style>
