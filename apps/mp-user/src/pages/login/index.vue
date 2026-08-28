<template>
  <view class="wrap ui-page">
    <view class="hero"><text class="eyebrow">WELCOME TO MALL</text><view class="brand">好物，恰好遇见</view><view class="sub">登录后即可查看订单与会员积分</view></view>
    <view class="card ui-card">
      <view class="login-mark">M</view>
      <view class="login-title">微信授权登录</view>
      <view class="login-desc">授权后将自动关联当前租户会员</view>
      <button class="btn ui-primary" :loading="loading" :disabled="loading" @tap="wxLogin">微信一键登录</button>
      <template v-if="enableDevLogin">
        <view class="dev-divider"><text>开发环境</text></view>
        <view class="label">开发手机号</view>
        <input v-model="phone" class="input" placeholder="仅开发环境可用" type="number" maxlength="11" />
        <button class="dev-btn" :disabled="loading" @tap="devLogin">开发登录</button>
      </template>
      <view class="tip">首次登录将自动创建会员账户</view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { apiRequest, setToken, toast } from "@mall/uni-shared";
const configuredAppId = import.meta.env.VITE_MP_USER_APPID || "";
const enableDevLogin = import.meta.env.VITE_ENABLE_DEV_LOGIN === "true";
const phone = ref("");
const loading = ref(false);

function loginSuccess(d: any) {
  if (!d?.accessToken) throw new Error("登录响应无有效令牌");
  setToken(d.accessToken);
  toast("登录成功", "success");
  uni.switchTab({ url: "/pages/goods/index" });
}

/** 优先读取构建环境；真机则可从 manifest 的 mp-weixin.appid 回读。 */
function resolveAppId(): string {
  if (configuredAppId) return configuredAppId;
  try {
    return (uni.getAccountInfoSync?.() as any)?.miniProgram?.appId || "";
  } catch {
    return "";
  }
}

function getWxCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: "weixin",
      success: (result: any) => result.code ? resolve(result.code) : reject(new Error("未获取到微信授权码")),
      fail: () => reject(new Error("微信授权失败，请确认在微信中打开后重试")),
    });
  });
}

async function wxLogin() {
  if (loading.value) return;
  loading.value = true;
  try {
    const appId = resolveAppId();
    if (!appId) throw new Error("小程序 AppID 未配置，请联系管理员");
    const code = await getWxCode();
    const d: any = await apiRequest({
      url: "/api/c/auth/wx-login",
      method: "POST",
      data: { code, appid: appId },
      auth: false,
    });
    loginSuccess(d);
  } catch (e: any) {
    toast(e.message || "登录失败");
  } finally {
    loading.value = false;
  }
}

async function devLogin() {
  if (loading.value || !enableDevLogin) return;
  if (!/^1\d{10}$/.test(phone.value)) return toast("请输入正确的手机号");
  loading.value = true;
  try {
    const d: any = await apiRequest({ url: "/api/c/auth/login", method: "POST", data: { phone: phone.value, appid: resolveAppId() }, auth: false });
    loginSuccess(d);
  } catch (e: any) {
    toast(e.message || "开发登录失败");
  } finally {
    loading.value = false;
  }
}
</script>
<style scoped>
.wrap { padding-top: 130rpx; }
.hero { padding: 0 20rpx 72rpx; }
.eyebrow { color: #168f86; font-size: 21rpx; font-weight: 700; letter-spacing: 3rpx; }
.brand { margin-top: 18rpx; font-size: 56rpx; line-height: 1.2; font-weight: 750; letter-spacing: -2rpx; }
.sub { color: #718096; margin-top: 18rpx; font-size: 27rpx; }
.card { padding: 44rpx 36rpx; }
.login-mark { width: 78rpx; height: 78rpx; display: grid; place-items: center; margin: 0 auto 22rpx; border-radius: 25rpx; color: #fff; background: linear-gradient(135deg, #36b5aa, #168f86); font-size: 34rpx; font-weight: 800; box-shadow: 0 12rpx 26rpx rgba(22,143,134,.25); }
.login-title { color: #1b2638; text-align: center; font-size: 36rpx; font-weight: 750; }.login-desc { margin: 12rpx 0 32rpx; color: #718096; text-align: center; font-size: 25rpx; }
.label { color: #526078; font-size: 25rpx; font-weight: 600; margin-bottom: 14rpx; }
.input { background: #f6f8fc; padding: 24rpx; border-radius: 16rpx; margin-bottom: 30rpx; }
.btn { height: 92rpx; line-height: 92rpx; font-size: 30rpx; }
.dev-divider { display: flex; align-items: center; gap: 16rpx; margin: 32rpx 0 24rpx; color: #9aa6b7; font-size: 22rpx; }.dev-divider::before,.dev-divider::after { flex: 1; height: 1rpx; background: #e6ebf2; content: ''; }.dev-btn { color: #168f86; background: #eff9f8; border: 1rpx solid #bfe6e2; border-radius: 16rpx; font-size: 27rpx; }
.tip { color: #9aa6b7; text-align: center; font-size: 22rpx; margin-top: 24rpx; }
</style>
