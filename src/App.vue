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
  --color-text-primary: #102f2c;
  --color-text-secondary: #607078;
  --color-text-tertiary: #65736d;
  --color-brand: #009d8d;
  --color-brand-pressed: #0f766e;
  --color-brand-soft: #e3f7f0;
  --color-page: #f4f7f7;
  --color-surface: #ffffff;
  --color-line: #e4ecea;
  --radius-card: 34rpx;
  --radius-control: 24rpx;
  --gradient-brand: linear-gradient(115deg, #0aa5a5, #008c81);
  --shadow-card: 0 10rpx 27rpx rgba(29, 53, 68, .06);
  --color-mascot: #8170ad;
  --font-display: 48rpx;
  --font-page-title: 36rpx;
  --font-section-title: 32rpx;
  --font-card-title: 32rpx;
  --font-body: 28rpx;
  --font-secondary: 24rpx;
  --font-caption: 23rpx;
  --font-nav: 23rpx;
  --space-page: 32rpx;
  --space-card: 24rpx;
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
button { display: flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; margin: 0; padding: 0; border: 0; border-radius: 0; background: transparent; line-height: 1.4; color: inherit; }
input, textarea { min-height: 44px; }
switch { min-height: 44px; display: inline-flex; align-items: center; }
slider { min-height: 44px; }
button::after { display: none; }
button:focus-visible { outline: 3rpx solid var(--color-brand); outline-offset: 4rpx; }
/* #ifdef H5 */
/* Uni's production CSS preloads a remote shadow via offscreen body::after.
   This single-page local prototype needs no remote navigation decoration. */
html body::after { animation: none; background-image: none; }
uni-button { display: flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; margin: 0; padding: 0; border: 0; border-radius: 0; background: transparent; line-height: 1.4; color: inherit; }
uni-page-body uni-button { display: flex; }
uni-input, uni-textarea { min-height: 44px; }
uni-switch { min-height: 44px; display: inline-flex; align-items: center; }
uni-slider { min-height: 44px; display: flex; align-items: center; }
uni-slider > .uni-slider-wrapper { width: 100%; }
uni-button::after { display: none; }
uni-button:focus-visible { outline: 3rpx solid var(--color-brand); outline-offset: 4rpx; }
.prototype-shell [tabindex="0"]:focus-visible, .prototype-shell input:focus-visible, .uni-modal__btn:focus-visible, .uni-picker-action:focus-visible { outline: 2px solid #0f766e; outline-offset: 3px; }
.prototype-shell.is-training [tabindex="0"]:focus-visible { outline-color: #b6f7e5; }
/* #endif */
</style>
