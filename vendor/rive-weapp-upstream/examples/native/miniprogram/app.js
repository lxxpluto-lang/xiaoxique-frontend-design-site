App({
  onLaunch() {
    // Cache device pixel ratio once for crisp HiDPI canvas rendering.
    try {
      const info = (wx.getWindowInfo && wx.getWindowInfo()) || wx.getSystemInfoSync();
      this.globalData.pixelRatio = info.pixelRatio || 2;
    } catch (e) {
      this.globalData.pixelRatio = 2;
    }
  },
  globalData: {
    pixelRatio: 2,
  },
});
