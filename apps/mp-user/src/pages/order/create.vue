<template>
  <view class="create">
    <view class="block">
      <view class="label">收货人</view>
      <input class="input" v-model="form.name" placeholder="请输入姓名" />
    </view>
    <view class="block">
      <view class="label">手机号</view>
      <input class="input" v-model="form.phone" placeholder="请输入手机号" />
    </view>
    <view class="block">
      <view class="label">收货地址</view>
      <input class="input" v-model="form.address" placeholder="请输入详细地址" />
      <text class="address-link" @tap="manageAddress">管理收货地址</text>
    </view>
    <view class="block">
      <view class="label">商品</view>
      <view class="goods">{{ preview?.items?.[0]?.goodsName || goodsName }} × {{ qty }}</view>
      <view v-if="preview" class="price-detail">商品 ¥{{preview.goodsAmount}} · 运费 ¥{{preview.freightAmount}}</view>
      <view v-if="previewError" class="error">{{previewError}}</view>
    </view>
    <view class="bar">
      <text class="total">合计 ¥{{ preview?.payAmount || total }}</text>
      <button class="pay" :disabled="previewing" :loading="submitting||previewing" @tap="submit">提交订单</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { apiRequest, toast } from '@mall/uni-shared';

const query = (uni.getEnterOptionsSync?.() as any)?.query || {};
const form = ref({ name: '', phone: '', address: '' });
const goodsName = ref(decodeURIComponent(query.goodsName || '商品'));
const qty = ref(1);
const total = ref(query.price || '0.00');
const skuId = Number(query.skuId || 0);
const submitting = ref(false);
const preview = ref<any>();
const previewError = ref('');
const previewing = ref(false);

async function loadPreview() {
  if (!skuId) { previewError.value = '商品规格无效'; return; }
  if (previewing.value) return;
  previewing.value = true;
  previewError.value = '';
  try { preview.value = await apiRequest({ url: '/api/c/order/preview', method: 'POST', data: { source:'BUY_NOW', items:[{skuId,quantity:qty.value}], deliveryType:'EXPRESS' } }); }
  catch (e:any) { preview.value = undefined; previewError.value = e.message || '订单预览失败'; }
  finally { previewing.value = false; }
}

async function submit() {
  if (submitting.value || previewing.value) return;
  if (!skuId) return toast('商品规格无效');
  if (!form.value.name || !form.value.phone) return toast('请完整填写收货信息');
  submitting.value = true;
  try {
    await loadPreview();
    if (!preview.value) return toast(previewError.value || '订单预览失败');
    await apiRequest({ url: '/api/c/orders', method: 'POST', data: { sku_id: skuId, quantity: qty.value, delivery_type: 'EXPRESS', receiver_name: form.value.name, receiver_phone: form.value.phone, receiver_address: form.value.address } });
    toast('订单已创建，等待支付', 'success');
    uni.switchTab({ url: '/pages/order/list' });
  } catch (e: any) { toast(e.message || '创建订单失败'); }
  finally { submitting.value = false; }
}
function manageAddress() { uni.navigateTo({ url: '/pages/address/index' }); }
loadPreview();
</script>

<style scoped>
.create { padding: 24rpx; padding-bottom: 140rpx; }
.block { background: #fff; border-radius: 16rpx; padding: 28rpx; margin-bottom: 20rpx; }
.label { font-size: 26rpx; color: #888; margin-bottom: 12rpx; }
.input { font-size: 30rpx; }
.goods { font-size: 30rpx; }
.price-detail { color:#888; font-size:24rpx; margin-top:12rpx; }.error{color:#f5222d;font-size:24rpx;margin-top:12rpx}
.address-link { display: block; color: #1677ff; margin-top: 16rpx; font-size: 25rpx; }
.bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; padding: 20rpx 40rpx; background: #fff; }
.total { font-size: 32rpx; font-weight: 700; color: #f5222d; }
.pay { background: #1677ff; color: #fff; border-radius: 40rpx; padding: 0 60rpx; }
</style>
