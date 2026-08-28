<template>
  <view class="goods ui-page">
    <view class="page-head"><text>精选商品</text><text class="sub">为你挑选</text></view>
    <view v-for="g in list" :key="g.id" class="card" @tap="goDetail(g.id)">
      <view class="thumb">{{ g.name.slice(0, 1) }}</view>
      <view class="info">
        <view class="name">{{ g.name }}</view>
        <view class="price">¥{{ g.price }}</view>
        <view class="sales">已售 {{ g.sales }}</view>
      </view>
    </view><view v-if="!list.length" class="ui-empty">暂无商品，换个关键词试试</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { apiRequest, toast } from '@mall/uni-shared';

interface Goods {
  id: number;
  name: string;
  price: string;
  sales: number;
}

const list = ref<Goods[]>([]);
const filters=uni.getStorageSync('c_goods_filters')||{};
async function load() { try { const params=[filters.keyword?`keyword=${encodeURIComponent(filters.keyword)}`:'',filters.categoryId?`categoryId=${encodeURIComponent(filters.categoryId)}`:''].filter(Boolean).join('&'); const d:any=await apiRequest({url:'/api/c/goods'+(params?'?'+params:'')}); const rows=d?.list||d?.items||d||[]; list.value=Array.isArray(rows)?rows.map((x:any)=>({...x,sales:x.soldCount??x.sales??0})):[]; } catch(e:any) { toast(e.message||'商品加载失败'); } }
load();

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/goods/detail?id=${id}` });
}
</script>

<style scoped>
.page-head { display:flex;justify-content:space-between;align-items:baseline;font-size:38rpx;font-weight:750;margin:4rpx 4rpx 28rpx; }.sub{font-size:24rpx;color:#8d99aa;font-weight:400}.card { display: flex; background: #fff; border-radius: 26rpx; padding: 20rpx; margin-bottom: 18rpx; box-shadow:0 8rpx 20rpx #17203308; }
.thumb { width: 148rpx; height: 148rpx; border-radius: 20rpx; background:linear-gradient(135deg,#d8f1ed,#8acfc4); color: #116b66; font-size: 60rpx; display: grid; place-items: center; margin-right: 24rpx; font-weight:700; }
.info { flex: 1; }
.name { font-size: 30rpx; font-weight: 650; color:#28364b; }.price { color: #e85d4a; font-size: 34rpx; font-weight: 750; margin: 12rpx 0; }.sales { color: #9aa6b7; font-size: 24rpx; }
</style>
