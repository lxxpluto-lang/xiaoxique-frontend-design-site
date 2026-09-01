// Pure, testable transform that adapts the upstream Rive Emscripten glue
// (`canvas_advanced.mjs`, ESM) into a WeChat-compatible CommonJS module.
//
// Design goal: keep the patch SURFACE MINIMAL so it survives Rive version bumps.
// Everything that *can* be solved at runtime (WASM loading, missing globals) is
// solved in the adapter layer (see libs/rive/adapter/*), NOT by editing the glue.
// Only two things genuinely require touching the source:
//
//   1. Module format. The glue ends with `export default Rive` (ESM). WeChat's
//      build pipeline is happiest with CommonJS, so we emit `module.exports`.
//
//   2. The one *hot-path* global. `emscripten_get_now` is imported into the WASM
//      and called from C++ during advance(); it reads the global `performance`,
//      which does not exist in the Mini Program runtime. We rewrite it to
//      `Date.now()` (millisecond precision is plenty for a frame clock).
//
// Each patch is guarded by an anchor assertion: if upstream changes shape, the
// build fails loudly with the exact anchor that moved, instead of silently
// shipping a broken runtime.

/** @typedef {{ find: string, replace: string, label: string }} Patch */

/** @type {Patch[]} */
export const PATCHES = [
  {
    label: 'esm-export -> commonjs',
    find: 'export default Rive',
    replace: 'module.exports = Rive;',
  },
  {
    // Regex: the glue may be closure-minified (`:()`) or not (`: ()`).
    label: 'emscripten_get_now: performance.now -> Date.now',
    find: /emscripten_get_now:\s*\(\)\s*=>\s*performance\.now\(\)/,
    replace: 'emscripten_get_now: () => Date.now()',
  },
  {
    // The image-mesh WebGL helper does `document.createElement("canvas")` at load
    // time. In a Mini Program / Taro there is no usable DOM canvas factory (Taro's
    // virtual document returns elements without getContext), which threw
    // "getContext is not a function". Hand it a no-op canvas so the helper logs
    // "Image mesh will not be drawn" and disables itself; vector rendering is
    // unaffected. (Image-mesh .riv files are out of scope.)
    //
    // optional: our own WeChat-native renderer (source build) removes this line
    // entirely, so the anchor is absent there — skip rather than fail.
    label: 'image-mesh: neutralize document.createElement("canvas")',
    find: 'document.createElement("canvas")',
    replace: '{getContext:function(){return null}}',
    optional: true,
  },
];

/**
 * @param {string} src   Raw contents of canvas_advanced.mjs
 * @param {{ packageName: string, version: string }} meta
 * @returns {string} Patched CommonJS source
 */
export function patchGlue(src, meta) {
  let out = src;

  for (const p of PATCHES) {
    const isRe = p.find instanceof RegExp;
    const count = isRe ? (p.find.test(out) ? 1 : 0) : out.split(p.find).length - 1;
    if (count === 0) {
      if (p.optional) continue; // anchor absent in this glue variant — fine
      throw new Error(
        `[patch-glue] anchor not found for "${p.label}":\n  ${JSON.stringify(p.find)}\n` +
          `The upstream glue changed. Inspect canvas_advanced.mjs and update tools/lib/patch-glue.mjs.`,
      );
    }
    // Replace the first occurrence; all our anchors are unique by construction.
    out = out.replace(p.find, p.replace);
  }

  // Safety net: no ESM constructs may survive into the CommonJS bundle.
  const residual = [];
  if (/^[\t ]*import[\s{*]/m.test(out)) residual.push('import statement');
  if (/^[\t ]*export[\s{]/m.test(out)) residual.push('export statement');
  if (out.includes('import.meta')) residual.push('import.meta');
  if (residual.length) {
    throw new Error(`[patch-glue] residual ESM syntax after patch: ${residual.join(', ')}`);
  }

  const header =
    `/*\n` +
    ` * AUTO-GENERATED — DO NOT EDIT.\n` +
    ` * Source: ${meta.packageName}@${meta.version} (canvas_advanced.mjs)\n` +
    ` * Adapted for WeChat Mini Program by tools/build-runtime.mjs.\n` +
    ` * Patches applied: ${PATCHES.map((p) => p.label).join('; ')}.\n` +
    ` * Regenerate with: npm run build:runtime\n` +
    ` */\n`;

  return header + out;
}
