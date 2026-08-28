<template>
  <div class="dashboard"><div class="dashboard-heading"><div><span class="eyebrow">运营概览</span><h2>业务增长一览</h2><p>实时了解商家经营与端点开通情况</p></div><el-button type="primary" @click="exportData">导出数据</el-button></div>
    <el-row :gutter="20">
      <el-col v-for="k in kpiCards" :key="k.key" :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-label">{{ k.label }}</div>
          <div class="kpi-value">{{ k.display }}</div>
          <div class="kpi-delta" :class="k.delta >= 0 ? 'trend-up' : 'trend-down'">
            {{ k.delta >= 0 ? '▲' : '▼' }} {{ Math.abs(k.delta) }}{{ k.suffix }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="row-2">
      <el-col :xs="24" :lg="16">
        <el-card shadow="never" header="GMV 趋势（近30天）">
          <div ref="trendRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="never" header="端点开通率">
          <div v-for="e in endpointCards" :key="e.key" class="ep-item">
            <div class="ep-head"><span>{{ e.label }}</span><span>{{ e.count }} 家 ({{ (e.ratio * 100).toFixed(0) }}%)</span></div>
            <el-progress :percentage="Math.round(e.ratio * 100)" :color="e.color" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from 'vue';
import { dashboardApi } from '@/api';
import { ElMessage } from 'element-plus';
import { formatNumber } from '@mall/shared-utils';
import type { DashboardKpi, EndpointOpen, TrendPoint } from '@mall/shared-types';

const kpi = ref<DashboardKpi | null>(null);
const trend = ref<TrendPoint[]>([]);
const endpoint = ref<EndpointOpen | null>(null);
const endpointCards = ref<Array<{ key: string; label: string; count: number; ratio: number; color: string }>>([]);
function exportData(){const a=document.createElement('a');a.href='data:text/json;charset=utf-8,'+encodeURIComponent(JSON.stringify({kpi:kpi.value,trend:trend.value}));a.download='dashboard.json';a.click();}
const trendRef = ref<HTMLDivElement>();

const kpiCards = computed(() => {
  const k = kpi.value;
  if (!k) return [];
  const n:any=(x:any)=>({value:Number(x?.value??0),delta:Number(x?.delta??0)});
  return [
    { key: 'merchantTotal', label: '商家总数', display: formatNumber(n(k.merchantTotal).value), delta: n(k.merchantTotal).delta, suffix: ' 家' },
    { key: 'monthGmv', label: '本月GMV', display: '¥' + formatNumber(Math.round(n(k.monthGmv).value)), delta: n(k.monthGmv).delta, suffix: '%' },
    { key: 'configured', label: '已配置商家', display: formatNumber(n(k.configuredMerchants).value), delta: n(k.configuredMerchants).delta, suffix: ' 家' },
    { key: 'renewal', label: '待续费', display: formatNumber(n(k.pendingRenewal).value), delta: n(k.pendingRenewal).delta, suffix: ' 家' },
  ];
});

async function renderTrend() {
  if (!trendRef.value) return;
  // 动态导入：echarts 约 1MB，仅工作台需要，避免拖慢其它页面首屏
  const echarts = await import('echarts');
  if (!trendRef.value) return;
  const chart = echarts.init(trendRef.value);
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: trend.value.map((t) => t.date.slice(5)) },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', barMaxWidth: 24, data: trend.value.map((t) => t.gmv), itemStyle: { color: '#1677ff', borderRadius: [4,4,0,0] } }],
  });
  window.addEventListener('resize', () => chart.resize());
}

onMounted(async () => {
 try { const [k0, t0, e0] = await Promise.all([dashboardApi.kpi(), dashboardApi.trend(), dashboardApi.endpointOpen()]); const k:any=(k0 as any)?.data||k0, t:any=(t0 as any)?.data||t0, e:any=(e0 as any)?.data||e0;
  const ep = e as EndpointOpen | null;
  kpi.value = k as DashboardKpi;
  trend.value = t as TrendPoint[];
  endpoint.value = ep;
  if (ep) {
    endpointCards.value = [
      { key: 'user', label: '用户端', count: ep.user.count, ratio: ep.user.ratio, color: '#1677ff' },
      { key: 'pc', label: '商家PC', count: ep.pc.count, ratio: ep.pc.ratio, color: '#52c41a' },
      { key: 'mp', label: '小程序', count: ep.mp.count, ratio: ep.mp.ratio, color: '#faad14' },
    ];
  }
  await nextTick(); renderTrend(); } catch(e:any) { ElMessage.error(e?.message || '数据加载失败'); }
});
</script>

<style scoped>
.dashboard-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 24px; }.dashboard-heading h2 { margin: 2px 0 4px; color: var(--color-text); font-size: 24px; letter-spacing: -.03em; }.dashboard-heading p { margin: 0; color: var(--color-text-secondary); }.eyebrow { color: var(--brand-primary); font-size: 12px; font-weight: 700; letter-spacing: .08em; }.kpi-card { min-height: 138px; border-radius: var(--radius-md); transition: transform var(--transition-base), box-shadow var(--transition-base); }.kpi-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }.kpi-label { color: var(--color-text-secondary); font-size: 13px; }.kpi-value { color: var(--color-text); font-size: 30px; font-weight: 750; letter-spacing: -.03em; margin: 10px 0 7px; }.kpi-delta { display: inline-flex; padding: 3px 7px; border-radius: var(--radius-pill); background: #f8fafc; font-size: 12px; }.row-2 { margin-top: 20px; }.chart { height: 320px; }.ep-item { margin-bottom: 21px; }.ep-head { display: flex; justify-content: space-between; color: var(--color-text-secondary); font-size: 13px; margin-bottom: 8px; }
@media (max-width: 991px) { .row-2 :deep(.el-col + .el-col) { margin-top: 20px; } } @media (max-width: 640px) { .dashboard-heading { align-items: start; flex-direction: column; }.dashboard-heading h2 { font-size: 21px; }.dashboard-heading .el-button { width: 100%; }.kpi-card { margin-bottom: 12px; } }
</style>
