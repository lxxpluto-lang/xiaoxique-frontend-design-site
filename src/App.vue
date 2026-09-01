<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
onLaunch(() => {
  console.log("Magpie Motion App Launch");
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style>
page {
  --color-text-primary: #1e293b;
  --color-text-secondary: #64748b;
  --color-text-tertiary: #94a3b8;
  --color-brand: #0ea5a4;
  --color-brand-pressed: #0f766e;
  --color-brand-soft: #ccfbf1;
  --color-page: #f8fafc;
  --color-surface: #ffffff;
  --color-line: #e2e8f0;
  --radius-card: 24rpx;
  --radius-control: 20rpx;
  --font-display: 40rpx;
  --font-page-title: 36rpx;
  --font-section-title: 32rpx;
  --font-card-title: 28rpx;
  --font-body: 26rpx;
  --font-secondary: 24rpx;
  --font-caption: 22rpx;
  --font-nav: 20rpx;
  min-height: 100%;
  background: var(--color-page);
  color: var(--color-text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "HarmonyOS Sans SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif;
  font-synthesis: none;
  letter-spacing: 0;
}

view,
text,
button,
input,
textarea {
  box-sizing: border-box;
  font-family: inherit;
}
</style>
