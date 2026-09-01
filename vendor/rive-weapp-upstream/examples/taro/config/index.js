const path = require('path')

const config = {
  projectName: 'rive-taro-demo',
  date: '2026-6-24',
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {},
  // Taro 4: pin the bundler explicitly. prebundle disabled to keep the build
  // self-contained (no esbuild dep-cache writes).
  compiler: {
    type: 'webpack5',
    prebundle: { enable: false }
  },
  // Ship the WASM as a raw package asset (WXWebAssembly can only load from an
  // in-package path). The .riv files are NOT copied — they're bundled as base64
  // (src/pkgRive/assets/riv-data.js) because WeChat's readFile() can't access
  // build-copied package assets.
  copy: {
    patterns: [
      { from: 'src/pkgRive/rive/vendor/rive.wasm.br', to: 'dist/pkgRive/rive/vendor/rive.wasm.br' }
    ],
    options: {
      ignore: ['**/.DS_Store']
    }
  },
  framework: 'react',
  mini: {
    postcss: {
      pxtransform: { enable: false, config: {} },
      url: { enable: true, config: { limit: 1024 } },
      cssModules: { enable: false }
    }
  },
  alias: {
    '@': path.resolve(__dirname, '..', 'src')
  }
}

module.exports = function (merge) {
  return merge({}, config)
}
