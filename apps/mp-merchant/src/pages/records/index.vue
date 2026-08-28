<template>
  <view class="records ui-page"><view class="page-head"><text>核销记录</text><text>最近操作</text></view>
    <view v-for="r in list" :key="r.id" class="item">
      <view class="top">
        <text class="code">{{ r.code }}</text>
        <text :class="r.ok ? 'ok' : 'fail'">{{ r.ok ? '成功' : '失败' }}</text>
      </view>
      <view class="meta">
        <text>{{ r.operator }}</text>
        <text>{{ r.time }}</text>
      </view>
    </view>
    <view v-if="!list.length" class="ui-empty">暂无核销记录</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';import {apiRequest} from '@mall/uni-shared';

interface VerifyRecord {
  id: number;
  code: string;
  ok: boolean;
  operator: string;
  time: string;
}

const list = ref<VerifyRecord[]>([]);
apiRequest<any>({url:'/api/mp/verify/log'}).then((d:any)=>{const rows=Array.isArray(d)?d:d?.list||[];list.value=rows.map((x:any)=>({id:x.id||x.code,code:x.code,ok:x.status==='USED',operator:x.operator||'-',time:x.verifiedAt||'-'}))}).catch((e:any)=>uni.showToast({title:e.message||'核销记录加载失败',icon:'none'}));
</script>

<style scoped>
.page-head{display:flex;justify-content:space-between;align-items:baseline;margin:4rpx 4rpx 28rpx;font-size:38rpx;font-weight:750}.page-head text:last-child{font-size:24rpx;color:#9aa6b7;font-weight:400}.item { background: #fff; border-radius: 26rpx; padding: 28rpx; margin-bottom: 18rpx; box-shadow:0 8rpx 20rpx #17203308; }
.top { display: flex; justify-content: space-between; font-size: 30rpx; font-weight: 600; }
.meta { display: flex; justify-content: space-between; color: #9aa6b7; font-size: 24rpx; margin-top: 16rpx; }.ok { color: #168f86; }.fail { color: #d9534f; }
</style>
