const examples = require('../../data/examples.js');

const GRADIENTS = [
  'linear-gradient(135deg,#ff5b4a,#ff9a3c)',
  'linear-gradient(135deg,#6c8cff,#8f6bff)',
  'linear-gradient(135deg,#27c2a0,#3bb0ff)',
  'linear-gradient(135deg,#ff6bcb,#ff5b6e)',
  'linear-gradient(135deg,#f4c14b,#ff8a3c)',
  'linear-gradient(135deg,#4b9bff,#27d0c2)',
];

Page({
  data: {
    examples: [],
  },

  onLoad() {
    const list = examples.map((e, i) => ({
      ...e,
      gradient: GRADIENTS[i % GRADIENTS.length],
      initial: (e.title || '?').slice(0, 1).toUpperCase(),
      sizeKB: (e.bytes / 1024).toFixed(0),
    }));
    this.setData({ examples: list });
  },

  open(e) {
    const item = e.currentTarget.dataset.item;
    const data = encodeURIComponent(
      JSON.stringify({ path: item.path, title: item.title, subtitle: item.subtitle }),
    );
    wx.navigateTo({ url: '/pkgRive/pages/player/player?data=' + data });
  },
});
