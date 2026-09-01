# 使用与 API

## 安装到你的小程序

1. 从 SDK 单一真源 [`packages/rive-weapp/`](../packages/rive-weapp) 拷贝:
   - 核心 `index.js`/`runtime.js`/`layout.js`/`adapter/`/`vendor/` → 你的**子包**(如 `/pkgRive/libs/rive/`)
   - 组件:`components/native/rive-view/`(原生)或 `components/react/RiveView.tsx`(Taro + React)
2. 确认 `vendor/rive.wasm.br` 的**包内路径**。运行时默认 `'/pkgRive/libs/rive/vendor/rive.wasm.br'`；若你放到别处，在初始化前调用 `setWasmPath()`：
   ```js
   const { setWasmPath } = require('/pkgRive/libs/rive/index.js');
   setWasmPath('/your/path/rive.wasm.br'); // 必须在第一次 createRive 之前
   ```
3. `.riv` 引擎文件必须**随包**（`WXWebAssembly` 只能从包内路径加载）；`.riv` 内容文件可随包，也可运行时用 `wx.downloadFile` 下载到本地后再传路径/buffer。

---

## 组件 `<rive-view>`

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `src` | String | `''` | `.riv` 路径（包内路径或 https URL）。变化时自动重载 |
| `artboard` | String | `''` | 画板名；缺省用默认画板 |
| `stateMachine` | String | `''` | 状态机名；缺省自动选第 0 个状态机 |
| `animation` | String | `''` | 线性动画名（与 `stateMachine` 二选一） |
| `fit` | String | `contain` | `fill`/`contain`/`cover`/`fitWidth`/`fitHeight`/`none`/`scaleDown`/`layout` |
| `alignment` | String | `center` | `center`/`topLeft`/…/`bottomRight`（9 种） |
| `autoplay` | Boolean | `true` | 是否自动播放 |
| `maxDpr` | Number | `0` | 设备像素比上限（`0`=不限）。3x 机型设 `2` 可省性能 |

> 用 `style`/`class` 给 `<rive-view>` 一个明确尺寸（如 `style="width:100%;height:60vh"`），画布会铺满。

### 事件

| 事件 | `e.detail` |
|---|---|
| `bind:load` | `{ artboard, stateMachine, animation, inputs:[{name,type}], width, height }` |
| `bind:error` | `{ error: string }` |
| `bind:statechange` | `{ states: string[] }`（本帧进入的状态名） |

### 方法（`this.selectComponent('#id')`）

```js
const v = this.selectComponent('#rive');
v.play(); v.pause();
v.setBool('open', true);
v.setNumber('level', 80);
v.fireTrigger('press');
v.getInputs();   // [{ name, type: 'bool'|'number'|'trigger' }]
v.reload();      // 重新测量并加载
```

---

## 直接用 API（`libs/rive/index.js`）

### `createRive(opts) => Promise<RiveInstance>`

| opt | 说明 |
|---|---|
| `canvas` | **必填**，微信 canvas 节点（`SelectorQuery().fields({node:true}).node`） |
| `src` / `buffer` | `.riv` 路径（自动读取）或已有 `ArrayBuffer`/`Uint8Array`（二选一） |
| `width` / `height` | 布局尺寸（px），用于 HiDPI |
| `devicePixelRatio` | DPR（`wx.getWindowInfo().pixelRatio`） |
| `fit` / `alignment` | 同上 |
| `artboard` / `stateMachine` / `animation` | 同上 |
| `autoplay` | 默认 `true` |
| `onLoad(info)` / `onError(e)` / `onStateChange(states)` / `onLoop(e)` / `onRiveEvent(evt)` | 回调 |

### `RiveInstance` 方法

```js
rive.play(); rive.pause(); rive.stop();
rive.setBool(name, value);
rive.setNumber(name, value);
rive.fireTrigger(name);
rive.getInputs();                 // [{name, type}]
rive.pointerDown(cssX, cssY, id); // 触摸命中（坐标为相对画布的布局 px）
rive.pointerMove(cssX, cssY, id);
rive.pointerUp(cssX, cssY, id);
rive.resize(cssW, cssH, dpr);     // 尺寸变化时调用
rive.info();                      // 元信息
rive.cleanup();                   // 页面卸载务必调用，释放 wasm 对象
```

### 手动获取 canvas 节点的范式

```js
wx.createSelectorQuery()
  .select('#myCanvas')
  .fields({ node: true, size: true })
  .exec(async (res) => {
    const canvas = res[0].node;
    const dpr = wx.getWindowInfo().pixelRatio;
    const rive = await createRive({
      canvas, src: '/pkgRive/assets/riv/vehicles.riv',
      width: res[0].width, height: res[0].height, devicePixelRatio: dpr,
    });
  });
```

```html
<canvas type="2d" id="myCanvas" style="width:100%;height:500rpx;"></canvas>
```

---

## 加载远程 `.riv`

```js
const { loadRivBuffer, createRive } = require('/pkgRive/libs/rive/index.js');
const buffer = await loadRivBuffer('https://your.cdn/foo.riv'); // wx.request arraybuffer
const rive = await createRive({ canvas, buffer, width, height, devicePixelRatio });
```

> 仅 `.riv` **内容**可远程；**引擎 `rive.wasm.br` 必须随包**（`WXWebAssembly` 限制）。

---

## 常见问题

- **画面空白**：确认 `<rive-view>`/canvas 有明确尺寸；确认 `vendor/` 路径正确（`setWasmPath`）。
- **首次加载慢**：进入分包页面时会下载分包（含 wasm），属一次性；之后有缓存。
- **`even-odd` 填充异常**：极少数复杂图形依赖 `ctx.fill('evenodd')`，请真机验证。
- **页面返回后仍在跑**：组件已在 `detached`/页面 `hide` 时暂停；自定义集成请记得 `cleanup()`。
