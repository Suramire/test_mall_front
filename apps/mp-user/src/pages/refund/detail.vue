<template>
  <view class="page"
    ><view class="card"
      ><view class="title">退款进度</view
      ><view v-if="refund"
        ><view class="row"
          ><text>退款单号</text
          ><text>{{ refund.refundNo || refund.id }}</text></view
        ><view class="row"
          ><text>状态</text><text>{{ statusText(refund.status) }}</text></view
        ><view class="row"
          ><text>退款金额</text><text>¥{{ refund.refundAmount }}</text></view
        ><view class="row"
          ><text>原因</text><text>{{ refund.reasonDesc || "-" }}</text></view
        ></view
      ><view v-else-if="!loading" class="error">{{
        error || "退款单不存在"
      }}</view></view
    ></view
  >
</template>
<script setup lang="ts">
const statusText = (s: string) => ({ PENDING_AUDIT: '待审核', APPROVED: '已同意', REJECTED: '已驳回', REFUNDING: '退款中', REFUNDED: '已退款', CLOSED: '已关闭' } as Record<string, string>)[s] || `未配置（${s || '-'}）`;
import { ref } from "vue";
import { apiRequest } from "@mall/uni-shared";
const id = Number((uni.getEnterOptionsSync?.() as any)?.query?.id || 0),
  refund = ref<any>(),
  loading = ref(false),
  error = ref("");
if (id) {
  loading.value = true;
  apiRequest<any>({ url: `/api/c/refund/${id}` })
    .then((d) => (refund.value = d))
    .catch((e: any) => (error.value = e.message || "退款详情加载失败"))
    .finally(() => (loading.value = false));
} else error.value = "退款参数无效";
</script>
<style scoped>
.page {
  padding: 24rpx;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
}
.title {
  font-size: 34rpx;
  font-weight: 700;
  margin-bottom: 20rpx;
}
.row {
  display: flex;
  justify-content: space-between;
  padding: 18rpx 0;
  font-size: 27rpx;
}
.error {
  color: #f5222d;
  padding: 30rpx 0;
  text-align: center;
}
</style>
