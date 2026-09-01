#!/usr/bin/env bash
#
# Build a size-minimal, WeChat-native Rive canvas2d WASM from source.
#
#   - Clones rive-app/rive-wasm + the rive-runtime submodule
#   - Installs Emscripten 3.1.61 (pinned by Rive) + premake5 5.0.0-beta7
#   - Swaps in our WeChat-native renderer (tools/rive-build/renderer.weapp.js)
#     in place of Rive's browser renderer.js
#   - Builds the LITE target (no text/audio/layout/scripting) with -Oz/--closure
#     and -s MALLOC=emmalloc
#   - Patches the glue for WeChat (CommonJS export + Date.now clock) and
#     brotli-compresses the wasm
#   - Drops rive.glue.js + rive.wasm.br into packages/rive-weapp/vendor/
#     (then `npm run sync` copies the SDK into both example apps)
#
# Usage:   tools/rive-build/build-lite-weapp.sh
# Env:     RIVE_BUILD_WORK   work dir (default /tmp/rive-build)
#          EMSDK_VERSION     default 3.1.61
#
# Re-run is idempotent: clone/emsdk/premake steps are skipped if already present.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"          # tools/rive-build
ROOT="$(cd "$HERE/../.." && pwd)"              # repo root
WORK="${RIVE_BUILD_WORK:-/tmp/rive-build}"
EMSDK_VERSION="${EMSDK_VERSION:-3.1.61}"
RIVE_WASM="$WORK/rive-wasm"
EMSDK="$WORK/emsdk"
VENDOR="$ROOT/packages/rive-weapp/vendor"

log() { printf '\n\033[1;36m[build-lite]\033[0m %s\n' "$*"; }

mkdir -p "$WORK"

# 1) Source ----------------------------------------------------------------
if [ ! -e "$RIVE_WASM/wasm/submodules/rive-runtime/src" ]; then
  log "clone rive-wasm + rive-runtime submodule"
  git clone --depth 1 https://github.com/rive-app/rive-wasm.git "$RIVE_WASM"
  git -C "$RIVE_WASM" submodule update --init --depth 1 wasm/submodules/rive-runtime
fi

# 2) Emscripten ------------------------------------------------------------
if [ ! -f "$EMSDK/upstream/emscripten/emcc" ]; then
  log "install Emscripten $EMSDK_VERSION (large download)"
  [ -d "$EMSDK" ] || git clone --depth 1 https://github.com/emscripten-core/emsdk.git "$EMSDK"
  "$EMSDK/emsdk" install "$EMSDK_VERSION"
  "$EMSDK/emsdk" activate "$EMSDK_VERSION"
fi
# shellcheck disable=SC1091
source "$EMSDK/emsdk_env.sh"

# 3) premake5 --------------------------------------------------------------
PM="$RIVE_WASM/wasm/bin/premake5"
if [ ! -f "$PM" ]; then
  log "download premake5 5.0.0-beta7"
  mkdir -p "$RIVE_WASM/wasm/bin"
  case "$(uname -s)" in
    Darwin*) PMURL="https://github.com/premake/premake-core/releases/download/v5.0.0-beta7/premake-5.0.0-beta7-macosx.tar.gz" ;;
    *)       PMURL="https://github.com/premake/premake-core/releases/download/v5.0.0-beta7/premake-5.0.0-beta7-linux.tar.gz" ;;
  esac
  curl -fsSL "$PMURL" -o "$WORK/premake.tar.gz"
  tar -xf "$WORK/premake.tar.gz" -C "$RIVE_WASM/wasm/bin"
fi

# 4) WeChat-native renderer + size flag ------------------------------------
log "inject WeChat-native renderer.js + emmalloc"
cp "$HERE/renderer.weapp.js" "$RIVE_WASM/wasm/js/renderer.js"
# Add emmalloc (smaller than dlmalloc) to the release link flags, once.
PML="$RIVE_WASM/wasm/premake5.lua"
if ! grep -q "MALLOC=emmalloc" "$PML"; then
  perl -0pi -e "s/(filter\('options:config=release'\)\s*\ndo\s*\n\s*linkoptions\(\{ '-s ASSERTIONS=0', '--closure 1')/\$1, '-s MALLOC=emmalloc'/s" "$PML"
fi

# 5) Build (lite = no heavy features) --------------------------------------
cd "$RIVE_WASM/wasm"
OUT_DIR="build/weapp_lite"
export EMCC_CLOSURE_ARGS="--externs $PWD/js/externs.js"
log "premake gmake2 (lite, release, NO SIMD)"
# --no-wasm-simd: WeChat's WXWebAssembly engine does not support WASM SIMD
# (compiling a SIMD wasm fails with "invalid value type 0x7B"). The official npm
# packages are also built without SIMD for the same broad-compatibility reason.
"$PM" gmake2 --arch=wasm --no-wasm-simd --out="$OUT_DIR" --scripts=./submodules/rive-runtime/build --config=release gmake2
log "make rive_wasm"
make -C "$OUT_DIR" rive_wasm -j"$(getconf _NPROCESSORS_ONLN 2>/dev/null || sysctl -n hw.ncpu)"

WASM="$(find "$OUT_DIR" -name 'canvas_advanced.wasm' | head -1)"
MJS="$(find "$OUT_DIR" -name 'canvas_advanced.mjs' | head -1)"
[ -n "$WASM" ] && [ -n "$MJS" ] || { echo "build produced no canvas_advanced.{wasm,mjs}"; exit 1; }
log "built: $(du -h "$WASM" | cut -f1) raw"

# 6) (No extra wasm-opt pass) ----------------------------------------------
# IMPORTANT: do NOT run `wasm-opt -all`. The `-all` flag enables the GC /
# function-references features, and wasm-opt then rewrites the module to use
# non-nullable ref types (value type 0x64), which WeChat's WXWebAssembly cannot
# compile ("invalid value type 0x64"). emcc's own -Oz output is already
# optimized with only WeChat-supported features, so we ship it as-is.

# 7) Patch glue + brotli + vendor ------------------------------------------
log "patch glue + brotli -> $VENDOR"
mkdir -p "$VENDOR"
node "$HERE/emit-vendor.mjs" "$MJS" "$WASM" "$VENDOR"

log "done. Sync the SDK into both demos with: npm run sync"
