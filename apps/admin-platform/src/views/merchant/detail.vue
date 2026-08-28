<template>
  <div class="merchant-detail" v-loading="loading">
    <el-page-header @back="router.back()" title="返回">
      <template #content><span class="title">{{ detail?.name }}</span></template>
    </el-page-header>

    <el-row :gutter="16" class="mt">
      <el-col :span="12">
        <el-descriptions title="基础信息" :column="2" border>
          <el-descriptions-item label="租户号">{{ detail?.tenantNo }}</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag>{{ STATUS_LABEL[detail?.status ?? 'NORMAL'] }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="联系人">{{ detail?.contactName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ detail ? maskPhone(detail.contactPhone) : '' }}</el-descriptions-item>
          <el-descriptions-item label="开业时间">{{ detail ? formatDate(detail.openedAt) : '' }}</el-descriptions-item>
          <el-descriptions-item label="到期时间">{{ detail ? formatDate(detail.expireAt) : '' }}</el-descriptions-item>
          <el-descriptions-item label="资质">{{ detail?.qualification || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ detail?.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" header="配额用量">
          <div v-for="q in quotas" :key="q.key" class="quota">
            <div class="quota-head"><span>{{ q.label }}</span><span>{{ q.used ?? '-' }} / {{ q.limit > 0 ? q.limit : '不限' }}</span></div>
            <el-progress :percentage="q.limit > 0 && typeof q.used === 'number' ? Math.min(100, Math.round((q.used / q.limit) * 100)) : 0" />
          </div>
          <el-divider />
          <div class="wx">小程序授权：<el-tag :type="detail?.wxAuthStatus === 1 ? 'success' : 'info'">{{ detail?.wxAuthStatus === 1 ? '已授权' : '未授权' }}</el-tag> {{ detail?.wxAppid }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row class="mt">
      <el-col :span="24">
        <el-card shadow="never" header="功能开通">
          <el-tag class="feat">已开通功能点：{{ detail?.featureCount ?? 0 }}</el-tag>
          <el-tag class="feat" type="info">员工数：{{ detail?.staffCount ?? 0 }}</el-tag>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { merchantApi } from '@/api';
import { maskPhone, formatDate } from '@mall/shared-utils';
import type { TenantDetailVO, TenantStatus } from '@/types';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const detail = ref<TenantDetailVO | null>(null);

const STATUS_LABEL: Record<TenantStatus, string> = { NORMAL: '正常', TRIAL: '试用中', EXPIRED: '已到期', DISABLED: '已禁用' };
/**
 * 已用量全部绑定后端真实字段；缺失时显示 -，不填充默认业务数据。
 */
const quotas = computed(() => {
  const d = detail.value;
  if (!d) return [];
  const limits: any = (d as any).limits || {};
  return [
    { key: 'goods', label: '商品', used: d.goodsUsed, limit: limits.goods ?? d.goodsLimit },
    { key: 'member', label: '会员', used: d.memberUsed, limit: limits.member ?? d.memberLimit },
    { key: 'store', label: '门店', used: d.storeUsed, limit: limits.store ?? d.storeLimit },
    { key: 'staff', label: '员工', used: d.staffUsed ?? d.staffCount, limit: limits.staff ?? d.staffLimit },
  ];
});

onMounted(async () => {
  loading.value = true;
  try {
    detail.value = await merchantApi.detail(Number(route.params.id));
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.mt { margin-top: 16px; }
.title { font-weight: 600; }
.quota { margin-bottom: 12px; }
.quota-head { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
.feat { margin-right: 8px; }
</style>
