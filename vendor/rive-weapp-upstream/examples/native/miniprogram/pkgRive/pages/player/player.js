Page({
  data: {
    title: 'Rive',
    subtitle: '',
    path: '',
    loaded: false,
    error: '',
    paused: false,
    inputs: [],
    numberVals: {},
    states: [],
  },

  onLoad(query) {
    let d = {};
    try { d = JSON.parse(decodeURIComponent(query.data || '%7B%7D')); } catch (e) {}
    if (d.title) wx.setNavigationBarTitle({ title: d.title });
    this.setData({ title: d.title || 'Rive', subtitle: d.subtitle || '', path: d.path || '' });
  },

  _view() { return this.selectComponent('#rive'); },

  onRiveLoad(e) {
    const info = e.detail || {};
    const numberVals = {};
    (info.inputs || []).forEach((i) => { if (i.type === 'number') numberVals[i.name] = 0; });
    this.setData({ loaded: true, error: '', inputs: info.inputs || [], numberVals });
  },

  onRiveError(e) {
    this.setData({ error: (e.detail && e.detail.error) || 'unknown error' });
  },

  onStateChange(e) {
    const incoming = (e.detail && e.detail.states) || [];
    if (!incoming.length) return;
    this.setData({ states: incoming.concat(this.data.states).slice(0, 8) });
  },

  onTapTrigger(e) {
    const v = this._view();
    if (v) v.fireTrigger(e.currentTarget.dataset.name);
  },
  onToggleBool(e) {
    const v = this._view();
    if (v) v.setBool(e.currentTarget.dataset.name, e.detail.value);
  },
  onNumberChange(e) {
    const name = e.currentTarget.dataset.name;
    const val = e.detail.value;
    const v = this._view();
    if (v) v.setNumber(name, val);
    this.setData({ ['numberVals.' + name]: val });
  },

  togglePlay() {
    const v = this._view();
    if (!v) return;
    const paused = !this.data.paused;
    if (paused) v.pause(); else v.play();
    this.setData({ paused });
  },
});
