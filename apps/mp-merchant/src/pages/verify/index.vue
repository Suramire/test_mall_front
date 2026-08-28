<template>
  <view class="verify ui-page">
    <view class="scan-card ui-card"><view class="scan-mark">⌾</view>
      <view class="title">扫码核销</view>
      <view class="hint">点击扫描用户核销码（HX/ZTD/VC）</view>
    <button class="scan-btn ui-primary" :loading="verifying" :disabled="verifying" @tap="onScan">调起摄像头扫码</button>
    </view>

    <view v-if="result" class="result ui-card">
      <view class="r-row"><text>核销码</text><text>{{ result.code }}</text></view>
      <view class="r-row"><text>状态</text><text :class="result.ok ? 'ok' : 'fail'">{{ result.ok ? '核销成功' : '核销失败' }}</text></view>
      <view v-if="result.msg" class="r-msg">{{ result.msg }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { apiRequest, toast } from '@mall/uni-shared';

const result = ref<{ code: string; ok: boolean; msg?: string } | null>(null);
const verifying = ref(false);

function onScan() {
  // #ifdef MP-WEIXIN
  uni.scanCode({
    success: (res) => verify(res.result),
    fail: () => toast('扫码取消', 'none'),
  });
  // #endif
  // #ifndef MP-WEIXIN
  verify('HX' + Date.now());
  // #endif
}

async function verify(code: string) {
  if (verifying.value) return;
  verifying.value=true;
  try { const d:any=await apiRequest({url:'/api/mp/verify',method:'POST',data:{code}}); result.value={code,ok:true,msg:d?.status==='USED'?'核销完成':'核销成功'};toast('核销成功','success'); } catch(e:any) { const message=e.message||'核销失败'; result.value={code,ok:false,msg:message};toast(message,'none');} finally { verifying.value=false; }
}
</script>

<style scoped>
.scan-card { padding: 54rpx 40rpx; text-align: center; }.scan-mark{width:112rpx;height:112rpx;line-height:112rpx;margin:0 auto 26rpx;border-radius:50%;background:#e6f6f3;color:#168f86;font-size:58rpx}.title { font-size: 38rpx; font-weight: 750; margin-bottom: 14rpx; }.hint { color: #8995a7; font-size: 26rpx; margin-bottom: 42rpx; }.scan-btn { height:90rpx;line-height:90rpx;font-size:29rpx }.result { padding: 32rpx; margin-top: 20rpx; }.r-row { display: flex; justify-content: space-between; padding: 14rpx 0; font-size: 28rpx; }.ok { color: #168f86; }.fail { color: #d9534f; }.r-msg { color: #8995a7; font-size: 24rpx; margin-top: 12rpx; }
</style>
