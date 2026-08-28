<template>
  <view class="login ui-page">
    <view class="hero"><text class="eyebrow">MERCHANT CONSOLE</text><view class="brand">把经营装进口袋</view><view class="sub">核销、记录与门店数据，随时掌握</view></view>
    <view class="card ui-card"><view class="label">商家账号</view><input class="input" v-model="account" placeholder="请输入账号" />
      <view class="label">密码</view>
      <input class="input" v-model="password" placeholder="密码" password />
      <button class="btn ui-primary" :loading="loading" :disabled="loading" @tap="onLogin">账号登录工作台</button>
      <view class="login-divider"><text>或</text></view>
      <button class="wecom-btn" :loading="loading" :disabled="loading" @tap="onWecomLogin">企业微信授权登录</button>
      <view class="tip">企业微信账号需由管理员预先绑定</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { apiRequest, setToken, toast } from '@mall/uni-shared';

const account = ref('');
const password = ref('');
const loading = ref(false);
const configuredAppId = import.meta.env.VITE_MP_MERCHANT_APPID || '';

function completeLogin(d: any) {
  if (!d?.accessToken) throw new Error('登录响应无有效令牌');
  setToken(d.accessToken);
  uni.switchTab({url:'/pages/home/index'});
}

/** 优先读取构建环境；真机则可从 manifest 的 mp-weixin.appid 回读。 */
function resolveAppId(): string {
  if (configuredAppId) return configuredAppId;
  try {
    return (uni.getAccountInfoSync?.() as any)?.miniProgram?.appId || '';
  } catch {
    return '';
  }
}

/**
 * 企业微信小程序优先走 wx.qy.login；普通微信容器则退化为 wx.login。
 * 后端可使用同一 code 适配 /api/mc/auth/wecom-login，前端不持有企业凭据。
 */
function getWorkWechatCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const wxApi: any = (globalThis as any).wx;
    const login = wxApi?.qy?.login || uni.login;
    login({
      ...(login === uni.login ? { provider: 'weixin' } : {}),
      success: (result: any) => result.code ? resolve(result.code) : reject(new Error('未获取到授权码')),
      fail: () => reject(new Error('企业微信授权失败，请使用账号密码登录')),
    });
  });
}

async function onLogin() {
  if (loading.value) return;
  if(!account.value || !password.value)return uni.showToast({title:'请输入账号和密码',icon:'none'});
  loading.value=true;
  try { const d:any=await apiRequest({url:'/api/mp/auth/merchant-login',method:'POST',data:{account:account.value,password:password.value},auth:false}); completeLogin(d); } catch(e:any) {toast(e.message||'登录失败');} finally { loading.value=false; }
}

async function onWecomLogin() {
  if (loading.value) return;
  loading.value = true;
  try {
    const appId = resolveAppId();
    if (!appId) throw new Error('商家小程序 AppID 未配置，请使用账号密码登录');
    const code = await getWorkWechatCode();
    const d: any = await apiRequest({ url: '/api/mc/auth/wecom-login', method: 'POST', data: { code, appid: appId }, auth: false });
    completeLogin(d);
  } catch (e: any) {
    toast(e.message || '企业微信登录失败，请使用账号密码登录');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login{padding-top:130rpx}.hero{padding:0 20rpx 70rpx}.eyebrow{color:#168f86;font-size:21rpx;font-weight:700;letter-spacing:3rpx}.brand{font-size:54rpx;line-height:1.2;font-weight:750;margin-top:18rpx;letter-spacing:-2rpx}.sub{color:#718096;margin-top:18rpx;font-size:27rpx}.card{padding:44rpx 36rpx}.label{color:#526078;font-size:25rpx;font-weight:600;margin-bottom:14rpx}.input{background:#f6f8fc;border-radius:16rpx;padding:24rpx;margin-bottom:28rpx;font-size:28rpx}.btn{height:92rpx;line-height:92rpx;font-size:30rpx}.login-divider{display:flex;align-items:center;gap:16rpx;margin:28rpx 0 20rpx;color:#9aa6b7;font-size:22rpx}.login-divider::before,.login-divider::after{flex:1;height:1rpx;background:#e6ebf2;content:''}.wecom-btn{height:88rpx;line-height:88rpx;color:#168f86;background:#eff9f8;border:1rpx solid #bfe6e2;border-radius:16rpx;font-size:28rpx}.tip{margin-top:18rpx;color:#9aa6b7;text-align:center;font-size:22rpx}
</style>
