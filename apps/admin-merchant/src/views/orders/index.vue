<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span>订单管理</span>
        <el-button :loading="loading" @click="load">刷新</el-button>
      </div>
    </template>

    <el-tabs v-model="query.status" @tab-change="load">
      <el-tab-pane label="全部" name="" />
      <el-tab-pane v-for="status in statuses" :key="status.value" :name="status.value">
        <template #label>{{ status.label }}({{ counts[status.value] || 0 }})</template>
      </el-tab-pane>
    </el-tabs>

    <el-form :model="query" inline class="filters">
      <el-form-item label="订单号"><el-input v-model="query.orderNo" clearable placeholder="订单号" /></el-form-item>
      <el-form-item label="商品名"><el-input v-model="query.goodsName" clearable placeholder="商品名" /></el-form-item>
      <el-form-item label="类型">
        <el-select v-model="query.type" clearable placeholder="全部" style="width: 120px">
          <el-option label="实体" value="PHYSICAL" />
          <el-option label="虚拟" value="VIRTUAL" />
          <el-option label="核销券" value="TICKET" />
        </el-select>
      </el-form-item>
      <el-form-item label="渠道">
        <el-select v-model="query.channel" clearable placeholder="全部" style="width: 120px">
          <el-option label="普通" value="NORMAL" />
          <el-option label="积分" value="POINTS" />
        </el-select>
      </el-form-item>
      <el-form-item label="手机号"><el-input v-model="query.phone" clearable placeholder="脱敏手机号" /></el-form-item>
      <el-form-item>
        <el-button type="primary" @click="load">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-alert v-if="error" :title="error" type="error" show-icon />
    <el-button :disabled="!selected.length" @click="openBatchShip">批量发货</el-button><el-table :data="rows" v-loading="loading" border @selection-change="selected=$event">
      <el-table-column type="selection" width="48" />
      <el-table-column label="订单号" min-width="150">
        <template #default="{ row }">{{ row.orderNo || '-' }}</template>
      </el-table-column>
      <el-table-column label="商品" min-width="180">
        <template #default="{ row }">{{ row.goodsName || row.firstGoodsName || '-' }}</template>
      </el-table-column>
      <el-table-column label="类型" width="100">
        <template #default="{ row }">{{ typeLabel(row.type) }}</template>
      </el-table-column>
      <el-table-column label="用户" min-width="130">
        <template #default="{ row }">{{ row.buyerName || row.nickname || row.phoneMask || '-' }}</template>
      </el-table-column>
      <el-table-column label="支付内容" min-width="130">
        <template #default="{ row }">{{ payText(row) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template #default="{ row }">{{ statusLabel(row.status) }}</template>
      </el-table-column>
      <el-table-column label="下单时间" min-width="170">
        <template #default="{ row }">{{ row.createdAt || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="210" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="$router.push('/orders/' + row.id)">详情</el-button>
          <el-button v-if="canShip(row.status)" link type="primary" @click="openShip(row)">发货</el-button>
          <el-button v-if="row.status === 'PENDING_STOCK'" link type="warning" @click="stock(row)">确认备货</el-button>
          <el-button v-if="row.status === 'PENDING_PICKUP'" link type="success" @click="pickup(row)">确认自提</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="shipVisible" title="订单发货" width="420px">
    <el-form :model="shipForm" label-width="90px">
      <el-form-item label="订单号">{{ activeOrder?.orderNo || '-' }}</el-form-item>
      <el-form-item label="快递公司"><el-input v-model="shipForm.expressCompany" placeholder="如 顺丰速运" /></el-form-item>
      <el-form-item label="快递单号"><el-input v-model="shipForm.expressNo" placeholder="请输入快递单号" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="shipVisible = false">取消</el-button>
      <el-button type="primary" :loading="shipLoading" @click="submitShip">确认发货</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { orderApi } from '@/api';

const rows = ref<any[]>([]);
const counts = ref<Record<string, number>>({});
const loading = ref(false);
const error = ref('');
const shipVisible = ref(false);
const shipLoading = ref(false);
const activeOrder = ref<any>();
const shipForm = reactive({ expressCompany: '', expressNo: '' });
const selected = ref<any[]>([]); const batchMode = ref(false);
const query = reactive({ status: '', orderNo: '', goodsName: '', type: '', channel: '', phone: '' });
const route = useRoute();

const statuses = [
  { value: 'PENDING_PAY', label: '待付款' },
  { value: 'PENDING_STOCK', label: '待备货' },
  { value: 'PAID', label: '已支付' },
  { value: 'STOCKED', label: '备货中' },
  { value: 'PENDING_SHIP', label: '待发货' },
  { value: 'PENDING_PICKUP', label: '待自提' },
  { value: 'PENDING_VERIFY', label: '待核销' },
  { value: 'SHIPPED', label: '已发货' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CLOSED', label: '已关闭' },
  { value: 'REFUNDING', label: '退款中' },
  { value: 'REFUNDED', label: '已退款' },
];

const normalize = (res: any) => { const envelope = res?.data ?? res; const d = envelope?.data ?? envelope; const list = d?.list ?? d?.items ?? d; return Array.isArray(list) ? list : []; };
const statusLabel = (status: string) => statuses.find((item) => item.value === status)?.label || ({ PENDING_SHIP: '待发货' } as Record<string, string>)[status] || status || '-';
const typeLabel = (type: string) => ({ PHYSICAL: '实体', VIRTUAL: '虚拟', TICKET: '核销券' } as Record<string, string>)[type] || type || '-';
const canShip = (status: string) => ['PAID', 'STOCKED', 'PENDING_SHIP','PENDING_STOCK'].includes(status);
const payText = (row: any) => {
  if (row.payText) return row.payText;
  const cash = row.amount || row.payAmount;
  const points = row.pointsAmount || row.points;
  if (points && cash) return `${points}积分 + ¥${cash}`;
  if (points) return `${points}积分`;
  return cash ? `¥${cash}` : '-';
};

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const params = Object.fromEntries(Object.entries(query).filter(([, value]) => value !== ''));
    const [listRes, countRes] = await Promise.all([orderApi.list(params), orderApi.statusCounts().catch(() => ({}))]);
    rows.value = normalize(listRes);
    const countEnvelope: any = countRes as any;
    const countData = countEnvelope?.data?.data ?? countEnvelope?.data ?? countEnvelope;
    counts.value = countData && typeof countData === 'object' ? countData : {};
  } catch (e: any) {
    error.value = e?.message || '订单加载失败';
  } finally {
    loading.value = false;
  }
}

function reset() {
  Object.assign(query, { status: '', orderNo: '', goodsName: '', type: '', channel: '', phone: '' });
  load();
}

function openShip(row: any) {
  activeOrder.value = row;
  shipForm.expressCompany = '';
  shipForm.expressNo = '';
  shipVisible.value = true;
}
function openBatchShip(){batchMode.value=true;activeOrder.value={orderNo:`已选 ${selected.value.length} 单`};shipVisible.value=true;shipForm.expressCompany='';shipForm.expressNo='';}

async function submitShip() {
  if (!activeOrder.value) return;
  if (!shipForm.expressCompany || !shipForm.expressNo) return ElMessage.warning('请填写快递公司和快递单号');
  shipLoading.value = true;
  try {
    if(batchMode.value) await orderApi.batchShip(selected.value.map(x=>x.id), {...shipForm}); else await orderApi.ship(activeOrder.value.id, { ...shipForm });
    ElMessage.success('发货成功');
    shipVisible.value = false;
    batchMode.value=false;selected.value=[];
    await load();
  } catch (e: any) {
    ElMessage.error(e?.message || '发货失败');
  } finally {
    shipLoading.value = false;
  }
}
async function stock(row:any){try{await orderApi.stocking(row.id);ElMessage.success('备货成功');await load()}catch(e:any){ElMessage.error(e?.message||'备货失败')}}
async function pickup(row:any){try{await orderApi.pickupConfirm(row.id,{});ElMessage.success('自提确认成功');await load()}catch(e:any){ElMessage.error(e?.message||'自提确认失败')}}

onMounted(() => { if (typeof route.query.status === 'string') query.status = route.query.status; load(); });
</script>

<style scoped>
.card-header { display: flex; align-items: center; justify-content: space-between; }
.filters { margin: 8px 0 12px; }
</style>
