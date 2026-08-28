<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';

onLaunch(() => {
  console.log('mp-merchant launch');
});
onShow(() => {});
onHide(() => {});
</script>

<style>
page {
  background: #f6f8fc;
  color: #172033;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", sans-serif;
  font-size: 28rpx;
  line-height: 1.5;
}
view, text { box-sizing: border-box; }
button::after { border: 0; }
.ui-page { min-height: 100vh; padding: 28rpx; padding-bottom: calc(40rpx + env(safe-area-inset-bottom)); }
.ui-card { background: #fff; border-radius: 28rpx; box-shadow: 0 10rpx 30rpx rgba(28, 45, 77, .06); }
.ui-empty { padding: 120rpx 24rpx; color: #8c98ab; text-align: center; font-size: 26rpx; }
.ui-primary { background: linear-gradient(135deg, #16a394, #147a94); color: #fff; border-radius: 20rpx; font-weight: 600; box-shadow: 0 10rpx 20rpx rgba(22, 163, 148, .2); }
</style>
