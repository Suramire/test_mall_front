<template>
  <el-card shadow="never">
    <template #header>手动核销</template>
    <el-form inline>
      <el-form-item label="核销码"><el-input v-model="code" placeholder="输入或扫码核销码" /></el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="queryLoading" @click="queryCode">查询</el-button>
        <el-button type="success" :loading="verifyLoading" :disabled="!ticket" @click="confirmVerify">确认核销</el-button>
      </el-form-item>
    </el-form>
    <el-alert v-if="error" :title="error" type="error" show-icon />
    <el-descriptions v-if="ticket" :column="2" border>
      <el-descriptions-item label="券码">{{ ticket.code || code }}</el-descriptions-item>
      <el-descriptions-item label="状态">{{ statusLabel(ticket.status) }}</el-descriptions-item>
      <el-descriptions-item label="商品">{{ ticket.goodsName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="会员">{{ ticket.memberName || ticket.nickname || '-' }}</el-descriptions-item>
      <el-descriptions-item label="订单号">{{ ticket.orderNo || '-' }}</el-descriptions-item>
      <el-descriptions-item label="有效期">{{ ticket.validEnd || ticket.validEndAt || '-' }}</el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { verifyApi } from '@/api';

const code = ref('HXDEMO000001');
const ticket = ref<any>();
const error = ref('');
const queryLoading = ref(false);
const verifyLoading = ref(false);
const statusLabel = (status: string) => ({ UNUSED: '未核销', VERIFIED: '已核销', EXPIRED: '已过期' } as Record<string, string>)[status] || status || '-';

async function queryCode() {
  if (!code.value) return ElMessage.warning('请输入券码');
  queryLoading.value = true;
  error.value = '';
  ticket.value = undefined;
  try {
    const res: any = await verifyApi.query(code.value);
    ticket.value = res?.data || res;
  } catch (e: any) {
    error.value = e?.message || '核销码查询失败';
  } finally {
    queryLoading.value = false;
  }
}

async function confirmVerify() {
  if (!ticket.value) return;
  verifyLoading.value = true;
  try {
    await verifyApi.verify(code.value);
    ElMessage.success('核销成功');
    await queryCode();
  } catch (e: any) {
    ElMessage.error(e?.message || '核销失败');
  } finally {
    verifyLoading.value = false;
  }
}
</script>
