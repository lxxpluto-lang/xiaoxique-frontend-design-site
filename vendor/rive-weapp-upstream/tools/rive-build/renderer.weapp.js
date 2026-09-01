// WeChat-native Canvas 2D renderer for the Rive WASM runtime.
//
// This REPLACES Rive's stock `wasm/js/renderer.js` (the `--pre-js` canvas2d
// backend) with one written for the WeChat Mini Program `<canvas type="2d">`
// context. It depends ONLY on bedrock canvas primitives, so the outer adapter
// layer (Path2D recorder / context Proxy / DOMMatrix shim / document stub) is no
// longer needed — the renderer speaks WeChat natively.
//
// Differences vs the browser renderer:
//   • makeMatrix returns a plain {a..f} object (no `DOMMatrix`).
//   • RenderPath is a pure-JS command recorder (no `new Path2D()`); fill/stroke/
//     clip replay the recorded commands into the context's default path, then
//     call fill(rule) / stroke() / clip(rule). (Canvas transforms each point by
//     the CTM at construction time, so replaying synchronously under Rive's CTM
//     is geometrically identical to native ctx.fill(path2d).)
//   • The offscreen-WebGL image-mesh path and raster image decode are disabled
//     (degrade gracefully — vector content is unaffected). No `document` /
//     `Image` / `Blob` / `URL` / WebGL references remain. (Re-enable later via
//     wx.createOffscreenCanvas / canvas.createImage if needed.)
//
// AnimationCallbackHandler / RenderPath / RenderPaint / Renderer / *Mode enums
// come from the other --pre-js files and the embind module, exactly as upstream.

function makeMatrix(xx, xy, yx, yy, tx, ty) {
  return { a: xx, b: xy, c: yx, d: yy, e: tx, f: ty };
}

// Path op codes (kept tiny for the hot path).
var OP_MOVE = 0;
var OP_LINE = 1;
var OP_CUBIC = 2;
var OP_CLOSE = 3;
var OP_ADD = 4;

function replayOps(ctx, ops) {
  for (var i = 0; i < ops.length; i++) {
    var op = ops[i];
    switch (op[0]) {
      case OP_MOVE: ctx["moveTo"](op[1], op[2]); break;
      case OP_LINE: ctx["lineTo"](op[1], op[2]); break;
      case OP_CUBIC: ctx["bezierCurveTo"](op[1], op[2], op[3], op[4], op[5], op[6]); break;
      case OP_CLOSE: ctx["closePath"](); break;
      case OP_ADD: {
        var sub = op[1];
        var m = op[2];
        ctx["save"]();
        ctx["transform"](m.a, m.b, m.c, m.d, m.e, m.f);
        replayOps(ctx, sub._ops);
        ctx["restore"]();
        break;
      }
    }
  }
}

function buildPath(ctx, pathRec) {
  ctx["beginPath"]();
  replayOps(ctx, pathRec._ops);
}

var rendererOnRuntimeInitialized = Module["onRuntimeInitialized"];
Module["onRuntimeInitialized"] = function () {
  rendererOnRuntimeInitialized && rendererOnRuntimeInitialized();

  const RenderPaintStyle = Module.RenderPaintStyle;
  const FillRule = Module.FillRule;
  const RenderPath = Module.RenderPath;
  const RenderImage = Module.RenderImage;

  const RenderPaint = Module.RenderPaint;
  const Renderer = Module.Renderer;
  const StrokeCap = Module.StrokeCap;
  const StrokeJoin = Module.StrokeJoin;
  const BlendMode = Module.BlendMode;

  const fill = RenderPaintStyle.fill;
  const stroke = RenderPaintStyle.stroke;
  const evenOdd = FillRule.evenOdd;

  // --- Raster images: disabled (degrade). Keeps file load() resolving. -------
  var CanvasRenderImage = RenderImage.extend("CanvasRenderImage", {
    "__construct": function ({ onComplete, onDecode } = {}) {
      this["__parent"]["__construct"].call(this);
      this.onComplete = onComplete;
      this.onDecode = onDecode;
    },
    "__destruct": function () {
      this["__parent"]["__destruct"].call(this);
    },
    "decode": function (bytes) {
      var cri = this;
      cri.onDecode && cri.onDecode(cri);
      // Raster decode disabled. Resolve asynchronously (after load() returns, so
      // the load Promise gets the real File) — the image simply won't draw.
      setTimeout(function () { cri.onComplete && cri.onComplete(cri); }, 0);
    },
  });

  function _canvasBlend(value) {
    switch (value) {
      case BlendMode.srcOver: return "source-over";
      case BlendMode.screen: return "screen";
      case BlendMode.overlay: return "overlay";
      case BlendMode.darken: return "darken";
      case BlendMode.lighten: return "lighten";
      case BlendMode.colorDodge: return "color-dodge";
      case BlendMode.colorBurn: return "color-burn";
      case BlendMode.hardLight: return "hard-light";
      case BlendMode.softLight: return "soft-light";
      case BlendMode.difference: return "difference";
      case BlendMode.exclusion: return "exclusion";
      case BlendMode.multiply: return "multiply";
      case BlendMode.hue: return "hue";
      case BlendMode.saturation: return "saturation";
      case BlendMode.color: return "color";
      case BlendMode.luminosity: return "luminosity";
    }
  }

  // --- RenderPath: pure-JS command recorder ----------------------------------
  var CanvasRenderPath = RenderPath.extend("CanvasRenderPath", {
    "__construct": function () {
      this["__parent"]["__construct"].call(this);
      this._ops = [];
    },
    "rewind": function () { this._ops = []; },
    "addPath": function (path, xx, xy, yx, yy, tx, ty) {
      this._ops.push([OP_ADD, path, makeMatrix(xx, xy, yx, yy, tx, ty)]);
    },
    "fillRule": function (fillRule) { this._fillRule = fillRule; },
    "moveTo": function (x, y) { this._ops.push([OP_MOVE, x, y]); },
    "lineTo": function (x, y) { this._ops.push([OP_LINE, x, y]); },
    "cubicTo": function (ox, oy, ix, iy, x, y) { this._ops.push([OP_CUBIC, ox, oy, ix, iy, x, y]); },
    "close": function () { this._ops.push([OP_CLOSE]); },
  });

  function _colorStyle(value) {
    return (
      "rgba(" +
      ((0x00ff0000 & value) >>> 16) + "," +
      ((0x0000ff00 & value) >>> 8) + "," +
      ((0x000000ff & value) >>> 0) + "," +
      ((0xff000000 & value) >>> 24) / 0xff + ")"
    );
  }

  // --- RenderPaint: replays the recorded path into the default path ----------
  var CanvasRenderPaint = RenderPaint.extend("CanvasRenderPaint", {
    "color": function (value) { this._value = _colorStyle(value); },
    "thickness": function (value) { this._thickness = value; },
    "join": function (value) {
      switch (value) {
        case StrokeJoin.miter: this._join = "miter"; break;
        case StrokeJoin.round: this._join = "round"; break;
        case StrokeJoin.bevel: this._join = "bevel"; break;
      }
    },
    "cap": function (value) {
      switch (value) {
        case StrokeCap.butt: this._cap = "butt"; break;
        case StrokeCap.round: this._cap = "round"; break;
        case StrokeCap.square: this._cap = "square"; break;
      }
    },
    "style": function (value) { this._style = value; },
    "blendMode": function (value) { this._blend = _canvasBlend(value); },
    "clearGradient": function () { this._gradient = null; },
    "linearGradient": function (sx, sy, ex, ey) { this._gradient = { sx, sy, ex, ey, stops: [] }; },
    "radialGradient": function (sx, sy, ex, ey) { this._gradient = { sx, sy, ex, ey, stops: [], isRadial: true }; },
    "addStop": function (color, stop) { this._gradient.stops.push({ color, stop }); },
    "completeGradient": function () {},
    "draw": function (ctx, pathRec, fillRule, modulatedOpacity) {
      let _style = this._style;
      let _value = this._value;
      let _gradient = this._gradient;
      let _blend = this._blend;

      const prevBlend = ctx["globalCompositeOperation"];
      const prevAlpha = ctx["globalAlpha"];
      ctx["globalCompositeOperation"] = _blend;
      ctx["globalAlpha"] = modulatedOpacity;

      if (_gradient != null) {
        const sx = _gradient.sx, sy = _gradient.sy, ex = _gradient.ex, ey = _gradient.ey;
        const stops = _gradient.stops;
        if (_gradient.isRadial) {
          var dx = ex - sx, dy = ey - sy;
          _value = ctx["createRadialGradient"](sx, sy, 0, sx, sy, Math.sqrt(dx * dx + dy * dy));
        } else {
          _value = ctx["createLinearGradient"](sx, sy, ex, ey);
        }
        for (let i = 0, l = stops["length"]; i < l; i++) {
          _value["addColorStop"](stops[i].stop, _colorStyle(stops[i].color));
        }
        this._value = _value;
        this._gradient = null;
      }

      switch (_style) {
        case stroke:
          ctx["strokeStyle"] = _value;
          ctx["lineWidth"] = this._thickness;
          ctx["lineCap"] = this._cap;
          ctx["lineJoin"] = this._join;
          buildPath(ctx, pathRec);
          ctx["stroke"]();
          break;
        case fill:
          ctx["fillStyle"] = _value;
          buildPath(ctx, pathRec);
          ctx["fill"](fillRule);
          break;
      }

      ctx["globalCompositeOperation"] = prevBlend;
      ctx["globalAlpha"] = prevAlpha;
    },
  });

  const _pendingCanvasRenderers = new Set();

  function flushCanvasRenderers() {
    for (const renderer of _pendingCanvasRenderers) {
      for (const lambda of renderer._drawList) lambda();
      renderer._drawList = [];
    }
    _pendingCanvasRenderers.clear();
  }

  var CanvasRenderer = (Module.CanvasRenderer = Renderer.extend("Renderer", {
    "__construct": function (canvas) {
      this["__parent"]["__construct"].call(this);
      this._matrixStack = [1, 0, 0, 1, 0, 0];
      this._opacityStack = [1.0];
      this._ctx = canvas["getContext"]("2d");
      this._canvas = canvas;
      this._drawList = [];
    },
    "save": function () {
      const i = this._matrixStack.length - 6;
      this._matrixStack.push(...this._matrixStack.slice(i));
      this._opacityStack.push(this._opacityStack[this._opacityStack.length - 1]);
      this._drawList.push(this._ctx["save"].bind(this._ctx));
    },
    "restore": function () {
      const i = this._matrixStack.length - 6;
      if (i < 6) throw "restore() called without matching save().";
      this._matrixStack.splice(i);
      this._opacityStack.pop();
      this._drawList.push(this._ctx["restore"].bind(this._ctx));
    },
    "transform": function (xx, xy, yx, yy, tx, ty) {
      const S = this._matrixStack;
      const i = S.length - 6;
      S.splice(
        i, 6,
        S[i + 0] * xx + S[i + 2] * xy,
        S[i + 1] * xx + S[i + 3] * xy,
        S[i + 0] * yx + S[i + 2] * yy,
        S[i + 1] * yx + S[i + 3] * yy,
        S[i + 0] * tx + S[i + 2] * ty + S[i + 4],
        S[i + 1] * tx + S[i + 3] * ty + S[i + 5]
      );
      this._drawList.push(this._ctx["transform"].bind(this._ctx, xx, xy, yx, yy, tx, ty));
    },
    "rotate": function (angle) {
      const sin = Math.sin(angle), cos = Math.cos(angle);
      this.transform(cos, sin, -sin, cos, 0, 0);
    },
    "modulateOpacity": function (opacity) {
      this._opacityStack[this._opacityStack.length - 1] *= opacity;
    },
    "_drawPath": function (path, paint) {
      const fillRule = path._fillRule === evenOdd ? "evenodd" : "nonzero";
      const modulatedOpacity = Math.max(0, this._opacityStack[this._opacityStack.length - 1]);
      this._drawList.push(paint["draw"].bind(paint, this._ctx, path, fillRule, modulatedOpacity));
    },
    "_drawRiveImage": function (image, options, blend, opacity) {
      // Raster images disabled — nothing to draw.
    },
    "_getMatrix": function (out) {
      const S = this._matrixStack;
      const i = S.length - 6;
      for (let j = 0; j < 6; ++j) out[j] = S[i + j];
    },
    "_drawImageMesh": function () {
      // Image meshes disabled in the lite WeChat renderer.
    },
    "_clipPath": function (path) {
      const fillRule = path._fillRule === evenOdd ? "evenodd" : "nonzero";
      const ctx = this._ctx;
      this._drawList.push(function () {
        buildPath(ctx, path);
        ctx["clip"](fillRule);
      });
    },
    "clear": function () {
      _pendingCanvasRenderers.add(this);
      this._drawList.push(
        this._ctx["clearRect"].bind(this._ctx, 0, 0, this._canvas["width"], this._canvas["height"])
      );
    },
    "flush": function () {},
    "translate": function (x, y) { this.transform(1, 0, 0, 1, x, y); },
  }));

  Module["makeRenderer"] = function (canvas) {
    const newCanvasRenderer = new CanvasRenderer(canvas);
    return new Proxy(newCanvasRenderer, {
      get(target, property) {
        if (typeof target[property] === "function") {
          return function (...args) { return target[property].apply(target, args); };
        }
        return target[property];
      },
      set(target, property, value) {
        target[property] = value;
        return true;
      },
    });
  };

  Module["decodeImage"] = function (bytes, onComplete) {
    let renderImage = new CanvasRenderImage({ onComplete });
    renderImage.decode(bytes);
  };

  Module["renderFactory"] = {
    makeRenderPaint: function () { return new CanvasRenderPaint(); },
    makeRenderPath: function () { return new CanvasRenderPath(); },
    makeRenderImage: function () {
      let context = loadContext;
      return new CanvasRenderImage({
        onDecode: () => { context.total++; },
        onComplete: () => {
          context.loaded++;
          if (context.loaded === context.total) {
            const ready = context.ready;
            if (ready) { ready(); context.ready = null; }
          }
        },
      });
    },
  };

  let load = Module["load"];
  let loadContext = null;
  Module["load"] = function (bytes, fileAssetLoader, enableRiveAssetCDN = true) {
    const loader = new Module["FallbackFileAssetLoader"]();
    if (fileAssetLoader !== undefined) loader.addLoader(fileAssetLoader);
    if (enableRiveAssetCDN) {
      const cdnLoader = new Module["CDNFileAssetLoader"]();
      loader.addLoader(cdnLoader);
    }
    return new Promise(function (resolve) {
      let result = null;
      loadContext = { total: 0, loaded: 0, ready: function () { resolve(result); } };
      result = load(bytes, loader);
      if (loadContext.total == 0) resolve(result);
    });
  };

  let align = Module["RendererWrapper"]["prototype"]["align"];
  Module["RendererWrapper"]["prototype"]["align"] = function (fit, alignment, frame, content, scaleFactor = 1.0) {
    align.call(this, fit, alignment, frame, content, scaleFactor);
  };

  const _animationCallbackHandler = new AnimationCallbackHandler();
  Module["requestAnimationFrame"] = _animationCallbackHandler.requestAnimationFrame.bind(_animationCallbackHandler);
  Module["cancelAnimationFrame"] = _animationCallbackHandler.cancelAnimationFrame.bind(_animationCallbackHandler);
  Module["enableFPSCounter"] = _animationCallbackHandler.enableFPSCounter.bind(_animationCallbackHandler);
  Module["disableFPSCounter"] = _animationCallbackHandler.disableFPSCounter;
  _animationCallbackHandler.onAfterCallbacks = flushCanvasRenderers;

  Module["resolveAnimationFrame"] = flushCanvasRenderers;

  Module["cleanup"] = function () {};
};
