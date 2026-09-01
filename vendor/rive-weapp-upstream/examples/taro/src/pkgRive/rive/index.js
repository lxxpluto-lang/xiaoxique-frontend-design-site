// Public entry point for the WeChat Rive runtime.
//
//   const { createRive } = require('../../libs/rive/index.js');
//   const rive = await createRive({ canvas, width, height, devicePixelRatio,
//                                   src: '/pkgRive/assets/riv/vehicles.riv',
//                                   stateMachine: 'State Machine 1' });
//   rive.setNumber('level', 2); rive.fireTrigger('press'); rive.cleanup();
//
// `canvas` is a real WeChat canvas node (from SelectorQuery .node()). Pass the
// layout size (width/height in px) and devicePixelRatio so HiDPI is crisp — the
// <rive-view> component does this for you.

const { RiveInstance } = require('./runtime.js');
const { setWasmPath, DEFAULT_WASM_PATH } = require('./adapter/loader.js');

let _fs = null;
function fs() {
  if (!_fs) _fs = wx.getFileSystemManager();
  return _fs;
}

/**
 * Read a .riv into an ArrayBuffer. Accepts a package path ('/pkgRive/assets/...'),
 * a wx temp/store file path, or an https URL.
 * @param {string} src
 * @returns {Promise<ArrayBuffer>}
 */
function loadRivBuffer(src) {
  return new Promise((resolve, reject) => {
    if (/^https?:\/\//i.test(src)) {
      wx.request({
        url: src,
        responseType: 'arraybuffer',
        success: (r) =>
          r.statusCode >= 200 && r.statusCode < 300
            ? resolve(r.data)
            : reject(new Error('[rive] download failed: HTTP ' + r.statusCode + ' ' + src)),
        fail: (e) => reject(new Error('[rive] download failed: ' + (e && e.errMsg) + ' ' + src)),
      });
    } else {
      fs().readFile({
        filePath: src,
        success: (r) => resolve(r.data),
        fail: (e) => reject(new Error('[rive] readFile failed: ' + (e && e.errMsg) + ' ' + src)),
      });
    }
  });
}

/**
 * Create and initialise a Rive instance. Resolves once the .riv is loaded and the
 * first frame is drawn.
 * @param {object} opts - see RiveInstance, plus `src` (string) as an alternative to `buffer`.
 * @returns {Promise<RiveInstance>}
 */
async function createRive(opts) {
  let buffer = opts.buffer;
  if (!buffer) {
    if (!opts.src) throw new Error('[rive] createRive needs `buffer` or `src`');
    buffer = await loadRivBuffer(opts.src);
  }
  const inst = new RiveInstance(Object.assign({}, opts, { buffer }));
  await inst.ready;
  return inst;
}

module.exports = {
  createRive,
  loadRivBuffer,
  setWasmPath,
  DEFAULT_WASM_PATH,
  RiveInstance,
};
