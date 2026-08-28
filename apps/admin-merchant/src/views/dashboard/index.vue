<template>
  <div class="dashboard">
    <div class="dashboard-heading"><div><span class="eyebrow">经营概览</span><h2>今日经营数据</h2><p>用关键指标安排当天的店铺运营</p></div></div>
    <el-alert v-if="userStore.tenant" type="info" :closable="false" class="tenant-banner">
      当前租户：{{ userStore.tenant.name || '未命名租户' }}（租户号 {{ userStore.tenant.tenantNo || '-' }}，ID {{ userStore.tenant.id ?? '-' }}）
      <span v-if="userStore.impersonating"> · 代客访问</span>
    </el-alert>
    <el-alert v-else type="warning" :closable="false" show-icon class="tenant-banner" title="租户信息加载中，加载失败将显示会话错误" />
    <el-alert v-if="userStore.impersonating" type="warning" :closable="false" show-icon
      title="当前为平台代客登录态，部分敏感操作已禁用" class="imp-tip" />

    <el-row :gutter="16" class="kpi-row">
      <el-col :xs="24" :sm="12" :lg="6" v-for="k in kpis" :key="k.label">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-label">{{ k.label }}</div>
          <div class="kpi-value">{{ k.value }}</div>
          <div class="kpi-delta" :class="k.delta >= 0 ? 'up' : 'down'">
            {{ k.delta >= 0 ? '▲' : '▼' }} {{ Math.abs(k.delta) }}% 环比
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mid-row">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never">
          <template #header><div class="card-header">销售趋势（近{{days}}天）<el-radio-group v-model="days" size="small" @change="load"><el-radio-button :value="7">7天</el-radio-button><el-radio-button :value="30">30天</el-radio-button><el-radio-button :value="90">90天</el-radio-button></el-radio-group></div></template>
          <div ref="trendEl" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="todo-card">
          <template #header>待办事项</template>
          <div class="todo-grid">
            <div class="todo-item" v-for="t in todos" :key="t.label" @click="goTodo(t.label)">
              <div class="todo-num">{{ t.value }}</div>
              <div class="todo-label">{{ t.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="recent">
      <template #header>最近订单</template>
      <el-table :data="recent" stripe>
        <el-table-column prop="orderNo" label="订单号" width="200" />
        <el-table-column prop="buyerName" label="买家" width="120" />
        <el-table-column label="金额" width="120">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column label="状态" width="140">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" />
      </el-table>
    </el-card>
    <el-row :gutter="16" class="rank-row"><el-col :span="12"><el-card><template #header>商品销量排行</template><el-table :data="goodsRank" v-loading="rankLoading"><el-table-column prop="goodsName" label="商品"/><el-table-column prop="sales" label="销量"/></el-table><el-empty v-if="!rankLoading&&!goodsRank.length" description="暂无排行"/></el-card></el-col><el-col :span="12"><el-card><template #header>会员消费排行</template><el-table :data="memberRank" v-loading="rankLoading"><el-table-column prop="memberName" label="会员"/><el-table-column prop="amount" label="消费金额"/></el-table><el-empty v-if="!rankLoading&&!memberRank.length" description="暂无排行"/></el-card></el-col></el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type * as echarts from 'echarts';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';
import {
  mcDashboardKpi,
  mcDashboardTodo,
  mcRecentOrders,
  mcDashboardTrend,
  mcGoodsRank, mcMemberRank,
} from '@/api';
import type { EnumCode, McDashboardKpi, McTodo } from '@mall/shared-types';

const userStore = useUserStore();
const router = useRouter();
function goTodo(label:string){ if(label==='待退款') router.push('/refunds'); else if(label==='待核销') router.push('/verify'); else router.push({path:'/orders',query:{status:label==='待发货'?'PENDING_SHIP':'PENDING_PICKUP'}}); }
const trendEl = ref<HTMLElement>();
let chart: echarts.ECharts | null = null;

const kpiData = ref<McDashboardKpi | null>(null);
const todoData = ref<McTodo | null>(null);
const recent = ref<any[]>([]);
const trend = ref<{ date: string; sales: number; orders: number }[]>([]);
const days = ref(30);
const goodsRank=ref<any[]>([]),memberRank=ref<any[]>([]),rankLoading=ref(false);

const kpis = computed(() => [
  { label: '今日订单', value: kpiData.value?.todayOrders.value ?? '-', delta: kpiData.value?.todayOrders.delta ?? 0 },
  { label: '今日销售额', value: '¥' + (kpiData.value?.todaySales.value ?? '-'), delta: kpiData.value?.todaySales.delta ?? 0 },
  { label: '新增会员', value: kpiData.value?.newMembers.value ?? '-', delta: kpiData.value?.newMembers.delta ?? 0 },
  { label: '今日核销', value: kpiData.value?.todayVerify.value ?? '-', delta: kpiData.value?.todayVerify.delta ?? 0 },
]);
const todos = computed(() => [
  { label: '待发货', value: todoData.value?.pendingShip ?? 0 },
  { label: '待退款', value: todoData.value?.pendingRefund ?? 0 },
  { label: '待核销', value: todoData.value?.pendingVerify ?? 0 },
  { label: '待自提', value: todoData.value?.pendingPickup ?? 0 },
]);

function statusType(s: EnumCode) {
  return s === 'COMPLETED' ? 'success' : s === 'PENDING_PAY' ? 'warning' : 'info';
}
function statusText(s: EnumCode) {
  return (
    { PENDING_PAY: '待付款', PENDING_SHIP: '待发货', PENDING_RECEIVE: '待收货', COMPLETED: '已完成', SHIPPED:'已发货', PAID:'已支付' } as Record<string, string>
  )[s] || s;
}

async function renderChart() {
  if (!trendEl.value) return;
  // 动态导入：echarts 约 1MB，仅工作台需要，避免拖慢其它页面首屏
  if (!chart) {
    const echartsMod = await import('echarts');
    if (!trendEl.value) return;
    chart = echartsMod.init(trendEl.value);
  }
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['销售额', '订单数'] },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: trend.value.map((d) => d.date) },
    yAxis: [{ type: 'value', name: '销售额' }, { type: 'value', name: '订单数' }],
    series: [
      { name: '销售额', type: 'line', smooth: true, data: trend.value.map((d) => d.sales) },
      { name: '订单数', type: 'bar', yAxisIndex: 1, data: trend.value.map((d) => d.orders) },
    ],
  });
}

async function load() {
  rankLoading.value=true;
  const [kpi, todo, rec, tr, gr, mr] = await Promise.all([
    mcDashboardKpi(),
    mcDashboardTodo(),
    mcRecentOrders(),
    mcDashboardTrend(days.value),
    mcGoodsRank(), mcMemberRank(),
  ]);
  kpiData.value = kpi;
  todoData.value = todo;
  recent.value = rec;
  trend.value = tr;
  goodsRank.value=(gr as any)?.data??gr??[]; memberRank.value=(mr as any)?.data??mr??[]; rankLoading.value=false;
  renderChart();
}

onMounted(load);
watch(trend, renderChart);
</script>

<style scoped>
.dashboard { max-width: 1600px; }.dashboard-heading { margin-bottom: 22px; }.dashboard-heading h2 { margin: 2px 0 4px; color: var(--color-text); font-size: 24px; letter-spacing: -.03em; }.dashboard-heading p { margin: 0; color: var(--color-text-secondary); }.eyebrow { color: var(--brand-primary); font-size: 12px; font-weight: 700; letter-spacing: .08em; }.imp-tip, .tenant-banner { margin-bottom: 16px; border-radius: var(--radius-sm); }.kpi-row { margin-bottom: 20px; }.kpi-card { min-height: 138px; border-radius: var(--radius-md); transition: transform var(--transition-base), box-shadow var(--transition-base); }.kpi-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }.kpi-label { color: var(--color-text-secondary); font-size: 13px; }.kpi-value { color: var(--color-text); font-size: 30px; font-weight: 750; letter-spacing: -.03em; margin: 10px 0 7px; }.kpi-delta { display: inline-flex; padding: 3px 7px; border-radius: var(--radius-pill); background: #f8fafc; font-size: 12px; }.up { color: var(--color-success); }.down { color: var(--color-danger); }.mid-row { margin-bottom: 20px; }.chart { height: 320px; }.todo-card { height: 100%; }.todo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 4px 0; }.todo-item { padding: 17px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: #fbfdff; cursor: pointer; transition: transform var(--transition-base), border-color var(--transition-base); }.todo-item:hover { border-color: #bfd4ff; transform: translateY(-1px); }.todo-num { color: var(--brand-primary); font-size: 28px; font-weight: 750; }.todo-label { color: var(--color-text-secondary); font-size: 13px; margin-top: 4px; }
@media (max-width: 991px) { .mid-row :deep(.el-col + .el-col) { margin-top: 20px; } } @media (max-width: 640px) { .dashboard-heading h2 { font-size: 21px; }.kpi-card { margin-bottom: 12px; } }
</style>
