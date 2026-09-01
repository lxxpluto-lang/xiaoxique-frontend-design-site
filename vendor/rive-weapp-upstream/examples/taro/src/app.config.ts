export default {
  pages: [
    'pages/index/index'
  ],
  subPackages: [
    {
      root: 'pkgRive',
      name: 'rive',
      pages: ['demo/index']
    }
  ],
  window: {
    navigationBarTitleText: 'Rive · Taro',
    navigationBarBackgroundColor: '#0b0b12',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0b0b12'
  },
  lazyCodeLoading: 'requiredComponents'
}
