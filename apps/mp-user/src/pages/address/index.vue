<template>
  <view class="page">
    <view v-for="item in rows" :key="item.id" class="card">
      <view><text class="name">{{ item.name }}</text><text>{{ item.phone }}</text><text v-if="item.isDefault" class="tag">默认</text></view>
      <view class="address">{{ item.regionText || '' }}{{ item.detail }}</view>
      <view class="ops"><text @tap="edit(item)">编辑</text><text v-if="!item.isDefault" :class="{ disabled: acting===item.id }" @tap="setDefault(item)">{{ acting===item.id ? '处理中…' : '设为默认' }}</text><text class="danger" :class="{ disabled: acting===item.id }" @tap="remove(item)">{{ acting===item.id ? '处理中…' : '删除' }}</text></view>
    </view>
    <view v-if="!loading&&!rows.length&&!error" class="empty">暂无收货地址</view>
    <view v-if="error" class="error">{{ error }}</view>
    <button class="primary" @tap="create">新增地址</button>
    <view v-if="editing" class="mask"><view class="form"><view class="title">{{ form.id ? '编辑地址' : '新增地址' }}</view><input v-model.trim="form.name" placeholder="收货人"/><input v-model.trim="form.phone" type="number" placeholder="手机号"/><input v-model.trim="form.regionText" placeholder="省市区"/><input v-model.trim="form.detail" placeholder="详细地址"/><label class="default"><checkbox :checked="form.isDefault" @tap="form.isDefault=!form.isDefault"/>设为默认地址</label><view class="actions"><button @tap="editing=false">取消</button><button class="primary" :loading="saving" @tap="save">保存</button></view></view></view>
  </view>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { apiRequest, toast } from '@mall/uni-shared';
const rows=ref<any[]>([]),loading=ref(false),error=ref(''),editing=ref(false),saving=ref(false);
const form=ref<any>({}); const blank=()=>({id:undefined,name:'',phone:'',regionText:'',detail:'',isDefault:false});
async function load(){loading.value=true;error.value='';try{const data:any=await apiRequest({url:'/api/c/address'});rows.value=Array.isArray(data)?data:data?.list??[]}catch(e:any){rows.value=[];error.value=e.message||'地址加载失败'}finally{loading.value=false}}
function create(){form.value=blank();editing.value=true} function edit(row:any){form.value={...row};editing.value=true}
async function save(){if(!form.value.name||!form.value.phone||!form.value.detail)return toast('请完整填写地址信息');saving.value=true;try{if(form.value.id)await apiRequest({url:`/api/c/address/${form.value.id}`,method:'PUT',data:form.value});else await apiRequest({url:'/api/c/address',method:'POST',data:form.value});toast('地址已保存','success');editing.value=false;await load()}catch(e:any){toast(e.message||'地址保存失败')}finally{saving.value=false}}
const acting=ref<number>();
async function setDefault(item:any){if(acting.value===item.id)return;acting.value=item.id;try{await apiRequest({url:`/api/c/address/${item.id}/default`,method:'PUT'});toast('已设为默认地址','success');await load()}catch(e:any){toast(e.message||'设置默认地址失败')}finally{acting.value=undefined}}
async function remove(item:any){if(acting.value===item.id)return;uni.showModal({title:'删除地址',content:`确定删除「${item.name}」的地址吗？`,success:async(r)=>{if(!r.confirm)return;acting.value=item.id;try{await apiRequest({url:`/api/c/address/${item.id}`,method:'DELETE'});toast('地址已删除','success');await load()}catch(e:any){toast(e.message||'删除地址失败')}finally{acting.value=undefined}}})}
load();
</script>
<style scoped>.page{padding:24rpx;padding-bottom:130rpx}.card,.form{background:#fff;border-radius:16rpx;padding:28rpx;margin-bottom:20rpx}.name{font-weight:700;margin-right:24rpx}.tag{color:#1677ff;font-size:22rpx;margin-left:16rpx}.address{color:#666;margin-top:14rpx;font-size:26rpx}.ops{display:flex;gap:28rpx;justify-content:flex-end;margin-top:18rpx;color:#1677ff;font-size:25rpx}.danger{color:#f5222d}.empty,.error{text-align:center;padding:80rpx 0;color:#999}.error{color:#f5222d;padding:18rpx}.primary{background:#1677ff;color:#fff}.mask{position:fixed;inset:0;background:#0006;padding:100rpx 32rpx}.form input{border-bottom:1rpx solid #eee;padding:22rpx 0;display:block}.title{font-size:34rpx;font-weight:700;margin-bottom:16rpx}.default{display:block;margin:24rpx 0;font-size:26rpx}.actions{display:flex;gap:20rpx}.actions button{flex:1}</style>
