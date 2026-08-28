<template>
  <div v-loading="loading">
    <el-alert v-if="error" :title="error" type="error" show-icon />
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>订单详情</span>
          <el-button @click="$router.back()">返回</el-button>
        </div>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="订单号">{{ data?.orderNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusLabel(data?.status) }}</el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ data?.createdAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="商品金额">¥{{ data?.goodsAmount || data?.amount || '0.00' }}</el-descriptions-item>
        <el-descriptions-item label="实付金额">¥{{ data?.payAmount || data?.amount || '0.00' }}</el-descriptions-item>
        <el-descriptions-item label="履约方式">{{ deliveryLabel(data?.deliveryType) }}</el-descriptions-item>
        <el-descriptions-item label="收货人">{{ data?.receiverName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ data?.receiverPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="地址">{{ data?.receiverAddress || '-' }}</el-descriptions-item>
        <el-descriptions-item label="快递公司">{{ data?.expressCompany || '-' }}</el-descriptions-item>
        <el-descriptions-item label="快递单号">{{ data?.expressNo || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="never" class="mt">
      <template #header>商品清单</template>
      <el-table :data="data?.items || []" border>
        <el-table-column prop="goodsName" label="商品" min-width="180" />
        <el-table-column prop="specText" label="规格" min-width="120" />
        <el-table-column label="单价" width="120"><template #default="{ row }">¥{{ row.price || '0.00' }}</template></el-table-column>
        <el-table-column prop="quantity" label="数量" width="90" />
        <el-table-column label="小计" width="120"><template #default="{ row }">¥{{ row.subtotalAmount || row.amount || '0.00' }}</template></el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="never" class="mt">
      <template #header>操作时间线</template>
      <el-timeline>
        <el-timeline-item v-if="data?.createdAt" :timestamp="data.createdAt">下单</el-timeline-item>
        <el-timeline-item v-if="data?.paidAt" :timestamp="data.paidAt">支付</el-timeline-item>
        <el-timeline-item v-if="data?.shippedAt" :timestamp="data.shippedAt">发货</el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { orderApi } from '@/api';

const route = useRoute();
const loading = ref(false);
const error = ref('');
const data = ref<any>();
const statusLabel = (status: string) => ({ PAID: '已支付', STOCKED: '备货中', PENDING_SHIP: '待发货', SHIPPED: '已发货', COMPLETED: '已完成' } as Record<string, string>)[status] || status || '-';
const deliveryLabel = (type: string) => ({ EXPRESS: '快递', PICKUP: '自提', VERIFY: '核销' } as Record<string, string>)[type] || type || '-';

onMounted(async () => {
  loading.value = true;
  try {
    const res: any = await orderApi.detail(Number(route.params.id));
    data.value = res?.data || res;
  } catch (e: any) {
    error.value = e?.message || '加载失败';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.card-header { display: flex; align-items: center; justify-content: space-between; }
.mt { margin-top: 12px; }
</style>
