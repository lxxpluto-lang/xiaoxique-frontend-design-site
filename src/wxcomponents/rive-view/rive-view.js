// <rive-view> — drop-in component that renders a .riv on a WeChat canvas.
//
//   <rive-view
//     id="rive"
//     src="/pkgRive/assets/riv/vehicles.riv"
//     fit="contain" alignment="center"
//     bind:load="onRiveLoad" bind:error="onRiveError" bind:statechange="onStateChange"
//     style="width:100%;height:60vh;" />
//
// Methods (via this.selectComponent('#rive')): play, pause, setBool, setNumber,
// fireTrigger, getInputs, reload.

// Keep the runtime beside this component so uni-app copies the complete native
// component (including the WASM payload) into the WeChat build output.
const { createRive } = require('./libs/rive/index.js');

Component({
  properties: {
    src: { type: String, value: '' },
    artboard: { type: String, value: '' },
    stateMachine: { type: String, value: '' },
    animation: { type: String, value: '' },
    fit: { type: String, value: 'contain' },
    alignment: { type: String, value: 'center' },
    autoplay: { type: Boolean, value: true },
    playToken: { type: Number, value: 0 },
    celebrateToken: { type: Number, value: 0 },
    reducedMotion: { type: Boolean, value: false },
    // Cap device pixel ratio (0 = use device dpr). Lowering to 2 saves GPU/CPU
    // on 3x phones with little visible loss.
    maxDpr: { type: Number, value: 0 },
  },

  lifetimes: {
    ready() {
      this._mounted = true;
      this._initCanvas();
    },
    detached() {
      this._mounted = false;
      this._destroy();
    },
  },

  pageLifetimes: {
    hide() { if (this._rive) this._rive.pause(); },
    show() { if (this._rive && this.data.autoplay) this._rive.play(); },
  },

  observers: {
    src(value) {
      // Reload when src changes after the first mount (ignore the initial set).
      if (this._mounted && this._canvas && value) this._load();
    },
    'playToken, celebrateToken, reducedMotion'() {
      if (this._rive) this._syncInputs();
    },
  },

  methods: {
    _initCanvas(attempt) {
      attempt = attempt || 0;
      wx.createSelectorQuery()
        .in(this)
        .select('#rivecanvas')
        .fields({ node: true, size: true, rect: true })
        .exec((res) => {
          const info = res && res[0];
          if (!info || !info.node) {
            this.triggerEvent('error', { error: 'canvas node not found' });
            return;
          }
          // Layout may not be settled on the first tick — retry briefly.
          if ((!info.width || !info.height) && attempt < 5) {
            setTimeout(() => this._initCanvas(attempt + 1), 50);
            return;
          }
          let dpr = 2;
          try { dpr = (wx.getWindowInfo && wx.getWindowInfo().pixelRatio) || 2; } catch (e) {}
          if (this.data.maxDpr > 0) dpr = Math.min(dpr, this.data.maxDpr);

          this._canvas = info.node;
          this._rect = { left: info.left || 0, top: info.top || 0 };
          this._dpr = dpr;
          this._width = info.width || 300;
          this._height = info.height || 150;
          this._load();
        });
    },

    async _load() {
      if (!this._canvas || !this.data.src) return;
      try {
        if (this._rive) { this._rive.cleanup(); this._rive = null; }
        const opts = {
          canvas: this._canvas,
          src: this.data.src,
          width: this._width,
          height: this._height,
          devicePixelRatio: this._dpr,
          fit: this.data.fit,
          alignment: this.data.alignment,
          autoplay: this.data.autoplay,
          onError: (e) => this.triggerEvent('error', { error: errMsg(e) }),
          onStateChange: (states) => this.triggerEvent('statechange', { states }),
        };
        if (this.data.artboard) opts.artboard = this.data.artboard;
        if (this.data.stateMachine) opts.stateMachine = this.data.stateMachine;
        if (this.data.animation) opts.animation = this.data.animation;

        const rive = await createRive(opts);
        if (!this._mounted) { rive.cleanup(); return; } // detached during async load
        this._rive = rive;
        this._syncInputs(true);
        this.triggerEvent('load', rive.info());
      } catch (e) {
        this.triggerEvent('error', { error: errMsg(e) });
      }
    },

    _destroy() {
      if (this._rive) { this._rive.cleanup(); this._rive = null; }
    },

    _syncInputs(initial) {
      if (!this._rive) return;
      this._rive.setBool('play', true);
      this._rive.setBool('reducedMotion', Boolean(this.data.reducedMotion));

      if (!initial && this._lastPlayToken !== this.data.playToken) {
        this._rive.fireTrigger('replay');
      }
      if (!initial && this._lastCelebrateToken !== this.data.celebrateToken) {
        this._rive.fireTrigger('celebrate');
      }
      this._lastPlayToken = this.data.playToken;
      this._lastCelebrateToken = this.data.celebrateToken;
    },

    // --- touch -> pointer ---------------------------------------------------
    _point(e) {
      const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
      if (!t) return null;
      const x = t.x != null ? t.x : (t.clientX || 0) - this._rect.left;
      const y = t.y != null ? t.y : (t.clientY || 0) - this._rect.top;
      return { x, y, id: t.identifier || 0 };
    },
    onTouchStart(e) { const p = this._rive && this._point(e); if (p) this._rive.pointerDown(p.x, p.y, p.id); },
    onTouchMove(e) { const p = this._rive && this._point(e); if (p) this._rive.pointerMove(p.x, p.y, p.id); },
    onTouchEnd(e) { const p = this._rive && this._point(e); if (p) this._rive.pointerUp(p.x, p.y, p.id); },

    // --- public API ---------------------------------------------------------
    play() { if (this._rive) this._rive.play(); },
    pause() { if (this._rive) this._rive.pause(); },
    setBool(name, v) { if (this._rive) this._rive.setBool(name, v); },
    setNumber(name, v) { if (this._rive) this._rive.setNumber(name, v); },
    fireTrigger(name) { if (this._rive) this._rive.fireTrigger(name); },
    getInputs() { return this._rive ? this._rive.getInputs() : []; },
    reload() { if (this._mounted) this._initCanvas(); },
  },
});

function errMsg(e) {
  return String((e && e.message) || e || 'unknown error');
}
