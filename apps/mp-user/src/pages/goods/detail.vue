<template>
  <view class="detail" v-if="goods">
    <view class="banner">{{ goods.name.slice(0, 1) }}</view>
    <view class="block">
      <view class="name">{{ goods.name }}</view>
      <view class="price">¥{{ selectedSku?.price || goods.price }}</view>
      <view class="desc">{{ goods.detail || '暂无商品介绍' }}</view>
    </view>
    <view class="sku">
      <text>规格</text>
      <view class="opts">
        <text v-for="s in skus" :key="s.id" :class="['opt', s.id === selectedSkuId ? 'on' : '']" @tap="selectedSkuId = s.id">{{ s.specText || s.skuCode || '默认规格' }}</text>
      </view>
    </view>
    <view class="bar">
      <button class="cart" :disabled="!purchasable" :loading="adding" @tap="addCart">加入购物车</button>
      <button class="buy" :disabled="!purchasable" @tap="buyNow">立即购买</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { apiRequest, toast } from '@mall/uni-shared';

const id = (uni.getEnterOptionsSync?.() as any)?.query?.id || 1;
const goods = ref<any>(null), selectedSkuId=ref<number>(), adding=ref(false), unavailable=ref('');
const skus=computed(()=>Array.isArray(goods.value?.skus)?goods.value.skus:[]);
const selectedSku=computed(()=>skus.value.find((s:any)=>s.id===selectedSkuId.value)||skus.value[0]);
const purchasable=computed(()=>Boolean(goods.value?.status==='ON_SALE'&&selectedSku.value&&Number(selectedSku.value?.stocks?.find((x:any)=>x.channel==='NORMAL')?.availableStock ?? goods.value.totalStock ?? 0)>0));
apiRequest<any>({url:`/api/c/goods/${id}`}).then((data)=>{goods.value=data;selectedSkuId.value=data?.skus?.[0]?.id;if(data?.status!=='ON_SALE')unavailable.value='商品已下架';else if(!purchasable.value)unavailable.value='商品库存不足';if(unavailable.value)toast(unavailable.value)}).catch((e:any)=>toast(e.message||'商品加载失败'));

function addCart() {
  if(!purchasable.value)return toast(unavailable.value||'商品暂不可购买');const skuId=selectedSku.value.id;adding.value=true;apiRequest({url:'/api/c/cart',method:'POST',data:{goods_id:goods.value.id,sku_id:skuId,quantity:1}}).then(()=>toast('已加入购物车','success')).catch((e:any)=>toast(e.message||'加入失败')).finally(()=>adding.value=false);
}
function buyNow() {
  if(!purchasable.value)return toast(unavailable.value||'商品暂不可购买');const sku=selectedSku.value;
  const skuId=sku?.id||goods.value.skuId;
  uni.navigateTo({ url: `/pages/order/create?skuId=${skuId || ''}&goodsName=${encodeURIComponent(goods.value.name||'商品')}&price=${encodeURIComponent(sku?.price||goods.value.price||'0.00')}` });
}
</script>

<style scoped>
.detail { padding-bottom: 140rpx; }
.banner { height: 480rpx; background: #1677ff; color: #fff; font-size: 160rpx; display: grid; place-items: center; }
.block { background: #fff; padding: 32rpx; }
.name { font-size: 34rpx; font-weight: 700; }
.price { color: #f5222d; font-size: 40rpx; font-weight: 700; margin: 12rpx 0; }
.desc { color: #888; font-size: 26rpx; }
.sku { background: #fff; margin-top: 20rpx; padding: 32rpx; display: flex; align-items: center; }
.opts { display: flex; gap: 16rpx; margin-left: 20rpx; }
.opt { border: 1rpx solid #eee; border-radius: 8rpx; padding: 12rpx 24rpx; font-size: 26rpx; }
.opt.on { border-color: #1677ff; color: #1677ff; }
.bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; gap: 20rpx; padding: 20rpx; background: #fff; }
.cart, .buy { flex: 1; border-radius: 40rpx; color: #fff; }
.cart { background: #faad14; }
.buy { background: #1677ff; }
</style>
