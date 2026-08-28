<template>
  <view class="cart">
    <view v-for="c in list" :key="c.id" class="item">
      <checkbox :checked="c.checked" @tap="c.checked=!c.checked" />
      <view class="info">
        <view class="name">{{ c.name }}</view>
        <view class="price">¥{{ c.price }}</view>
      </view>
      <view class="stepper" :class="{ busy: updating.has(c.id) }">
        <text class="btn" @tap="dec(c)">-</text>
        <text class="num">{{ c.qty }}</text>
        <text class="btn" @tap="inc(c)">+</text>
      </view>
    </view>
    <view class="empty" v-if="!list.length">购物车是空的</view>
    <view class="bar" v-if="list.length">
      <text class="total">{{ cartCount }}件 · 合计 ¥{{ total }}</text>
      <button class="remove" :loading="removing" :disabled="removing" @tap="removeSelected">删除</button>
      <button class="checkout" :disabled="removing" @tap="checkout">去结算</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { apiRequest } from '@mall/uni-shared';

interface CartItem {
  id: number;
  skuId: number;
  name: string;
  price: string;
  qty: number;
  checked: boolean;
}

const list = ref<CartItem[]>([]);
const cartCount = ref(0);
const updating = new Set<number>();
const removing = ref(false);
function load(){Promise.all([apiRequest<any[]>({url:'/api/c/cart'}),apiRequest<any>({url:'/api/c/cart/count'})]).then(([d,count]:any)=>{const rows=Array.isArray(d)?d:d?.list||[];list.value=rows.map((x:any)=>({id:x.id,skuId:x.skuId,name:x.goodsName||x.name||`商品${x.goodsId}`,price:x.price||'0.00',qty:x.quantity||1,checked:x.selected!==0}));cartCount.value=Number(count?.count||0)}).catch((e:any)=>uni.showToast({title:e.message||'购物车加载失败',icon:'none'}))}

const total = computed(() =>
  list.value.reduce((s, c) => s + Number(c.price) * c.qty, 0).toFixed(2),
);

async function changeQty(c: CartItem, quantity: number) { if (updating.has(c.id)) return; const old=c.qty; updating.add(c.id); c.qty=quantity; try { await apiRequest({url:`/api/c/cart/${c.id}`,method:'PUT',data:{quantity}}); } catch(e:any) { c.qty=old; uni.showToast({title:e.message||'数量更新失败',icon:'none'}); await load(); } finally { updating.delete(c.id); } }
function inc(c: CartItem) { void changeQty(c, c.qty + 1); }
function dec(c: CartItem) { if (c.qty > 1) void changeQty(c, c.qty - 1); else void removeItem(c); }
async function removeItem(c: CartItem) { if (updating.has(c.id)) return; updating.add(c.id); try { await apiRequest({url:`/api/c/cart/${c.id}`,method:'DELETE'}); await load(); } catch(e:any) { uni.showToast({title:e.message||'删除失败',icon:'none'}); } finally { updating.delete(c.id); } }
async function removeSelected(){if(removing.value)return;const ids=list.value.filter(x=>x.checked).map(x=>x.id);if(!ids.length)return uni.showToast({title:'请选择要删除的商品',icon:'none'});removing.value=true;try{await apiRequest({url:'/api/c/cart',method:'DELETE',data:{ids}});await load()}catch(e:any){uni.showToast({title:e.message||'删除失败',icon:'none'})}finally{removing.value=false}}

function checkout() {
  const first=list.value.find(x=>x.checked); if(!first)return uni.showToast({title:'请选择要结算的商品',icon:'none'}); uni.navigateTo({ url: `/pages/order/create?skuId=${first.skuId}&goodsName=${encodeURIComponent(first.name)}&price=${encodeURIComponent(first.price)}&quantity=${first.qty}` });
}
load();
</script>

<style scoped>
.cart { padding: 24rpx; padding-bottom: 140rpx; }
.item { display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 16rpx; padding: 28rpx; margin-bottom: 20rpx; }
.name { font-size: 30rpx; font-weight: 600; }
.price { color: #f5222d; margin-top: 8rpx; }
.stepper { display: flex; align-items: center; gap: 20rpx; }
.btn { width: 56rpx; height: 56rpx; border: 1rpx solid #eee; border-radius: 8rpx; text-align: center; line-height: 56rpx; }
.num { min-width: 40rpx; text-align: center; }
.empty { text-align: center; color: #aaa; padding: 80rpx 0; }
.bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; padding: 20rpx 40rpx; background: #fff; }
.total { font-size: 32rpx; font-weight: 700; color: #f5222d; }
.checkout { background: #1677ff; color: #fff; border-radius: 40rpx; padding: 0 30rpx; }.remove{background:#fff;color:#f5222d;border:1rpx solid #f5222d;border-radius:40rpx;padding:0 22rpx}
</style>
