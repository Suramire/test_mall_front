<template>
  <view class="orders ui-page">
    <view class="page-head"><text>我的订单</text><text>全部订单</text></view>
    <view v-for="o in list" :key="o.id" class="item" @tap="detail(o.id)">
      <view class="top">
        <text class="no">订单 {{ o.orderNo }}</text>
        <text :class="['status', o.status]">{{ statusText(o.status) }}</text>
      </view>
      <view class="goods">{{ o.goodsName || '订单商品' }}</view>
      <view class="bottom">
        <text class="amount">¥{{ o.payAmount }}</text>
        <text class="time">{{ o.createdAt || '-' }}</text>
      </view>
    </view>
    <view v-if="!list.length" class="ui-empty">暂无订单</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { apiRequest } from '@mall/uni-shared';

interface Order {
  id: number;
  orderNo: string;
  status: string;
  goodsName?: string;
  payAmount: string;
  createdAt?: string;
}

const list = ref<Order[]>([]);
apiRequest<any>({url:'/api/c/orders'}).then((d:any)=>{const rows=Array.isArray(d)?d:d?.list||d?.items||[];list.value=rows.map((x:any)=>({id:x.id,orderNo:x.orderNo||x.no||`#${x.id}`,status:x.status,payAmount:x.payAmount||x.amount||'0.00',goodsName:x.goodsName||x.firstGoodsName,createdAt:x.createdAt||x.time}))}).catch(()=>{list.value=[]});

function statusText(s: Order['status']) {
  return ({ PENDING_PAY:'待支付',PAID:'已支付',PENDING_SHIP:'待发货',SHIPPED:'已发货',COMPLETED:'已完成',REFUNDING:'退款中',REFUNDED:'已退款',CLOSED:'已关闭' } as Record<string,string>)[s] || s;
}
function detail(id:number){uni.navigateTo({url:`/pages/order/detail?id=${id}`})}
</script>

<style scoped>
.item { background: #fff; border-radius: 26rpx; padding: 28rpx; margin-bottom: 18rpx; box-shadow:0 8rpx 20rpx #17203308; }
.page-head{display:flex;justify-content:space-between;align-items:baseline;margin:4rpx 4rpx 28rpx;font-size:38rpx;font-weight:750}.page-head text:last-child{font-size:24rpx;color:#9aa6b7;font-weight:400}
.top { display: flex; justify-content: space-between; font-size: 28rpx; }
.no { color: #69768a; }.status{background:#eef6f5;color:#168f86;border-radius:20rpx;padding:5rpx 14rpx;font-size:23rpx; }
.status.PAID { color: #168f86; }
.status.UNPAID { color: #faad14; }
.status.DONE { color: #52c41a; }
.status.REFUND { color: #f5222d; }
.goods { font-size: 30rpx; margin: 22rpx 0; color:#263449;font-weight:600 }.bottom { display: flex; justify-content: space-between; color: #9aa6b7; font-size: 24rpx; }.amount { color: #e85d4a; font-weight: 750; }
</style>
