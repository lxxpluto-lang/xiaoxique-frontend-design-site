import { Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { CSSProperties, forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { RiveInstance } from '../rive/runtime'
import { setWasmPath } from '../rive/adapter/loader'

// The vendored WASM is copied to this in-package path by config/index.js copy
// patterns and loaded via WXWebAssembly (its own package-read mechanism — not
// affected by the FileSystemManager permission issue below).
setWasmPath('/pkgRive/rive/vendor/rive.wasm.br')

// .riv bytes are bundled as base64 (see scripts/inline-riv.mjs). WeChat's
// getFileSystemManager().readFile() throws "permission denied" on build-copied /
// subpackage assets, so we never touch the filesystem for .riv content.
const RIV_DATA: Record<string, string> = require('../assets/riv-data')

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const B64_LOOKUP = (() => {
  const t = new Uint8Array(256)
  for (let i = 0; i < B64.length; i++) t[B64.charCodeAt(i)] = i
  return t
})()
function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const len = b64.length
  let pad = 0
  if (len && b64[len - 1] === '=') pad = b64[len - 2] === '=' ? 2 : 1
  const out = new Uint8Array((len * 3) / 4 - pad)
  let p = 0
  for (let i = 0; i < len; i += 4) {
    const a = B64_LOOKUP[b64.charCodeAt(i)]
    const b = B64_LOOKUP[b64.charCodeAt(i + 1)]
    const c = B64_LOOKUP[b64.charCodeAt(i + 2)]
    const d = B64_LOOKUP[b64.charCodeAt(i + 3)]
    if (p < out.length) out[p++] = (a << 2) | (b >> 4)
    if (p < out.length) out[p++] = ((b & 15) << 4) | (c >> 2)
    if (p < out.length) out[p++] = ((c & 3) << 6) | (d & 63)
  }
  return out.buffer
}

export interface RiveViewHandle {
  play(): void
  pause(): void
  setBool(name: string, value: boolean): void
  setNumber(name: string, value: number): void
  fireTrigger(name: string): void
  getInputs(): { name: string; type: string }[]
}

interface Props {
  src: string
  canvasId?: string
  fit?: string
  alignment?: string
  stateMachine?: string
  className?: string
  style?: CSSProperties
  onLoad?: (info: any) => void
  onError?: (msg: string) => void
  onStateChange?: (states: string[]) => void
}

function readBuffer(src: string): Promise<ArrayBuffer> {
  // Prefer the bundled base64 (keyed by file name) — no filesystem access.
  const name = src.split('/').pop() || src
  if (RIV_DATA[name]) {
    try {
      return Promise.resolve(base64ToArrayBuffer(RIV_DATA[name]))
    } catch (e: any) {
      return Promise.reject(new Error('decode failed: ' + (e && e.message)))
    }
  }
  // Fallback: remote URL (in-package readFile is intentionally not used).
  return new Promise((resolve, reject) => {
    if (/^https?:/i.test(src)) {
      Taro.request({
        url: src,
        responseType: 'arraybuffer',
        success: (r: any) => resolve(r.data),
        fail: (e: any) => reject(new Error((e && e.errMsg) || 'request failed'))
      })
    } else {
      reject(new Error('no bundled data for ' + name + ' (add it to assets/riv + run scripts/inline-riv.mjs)'))
    }
  })
}

function getDpr(): number {
  try {
    const T: any = Taro
    const info = T.getWindowInfo ? T.getWindowInfo() : Taro.getSystemInfoSync()
    return info.pixelRatio || 2
  } catch (e) {
    return 2
  }
}

const RiveView = forwardRef<RiveViewHandle, Props>((props, ref) => {
  const id = props.canvasId || 'rive-canvas'
  const instRef = useRef<any>(null)
  const rectRef = useRef({ left: 0, top: 0 })

  useImperativeHandle(ref, () => ({
    play: () => instRef.current && instRef.current.play(),
    pause: () => instRef.current && instRef.current.pause(),
    setBool: (n, v) => instRef.current && instRef.current.setBool(n, v),
    setNumber: (n, v) => instRef.current && instRef.current.setNumber(n, v),
    fireTrigger: (n) => instRef.current && instRef.current.fireTrigger(n),
    getInputs: () => (instRef.current ? instRef.current.getInputs() : [])
  }), [])

  useEffect(() => {
    let cancelled = false
    let attempt = 0

    const init = () => {
      Taro.createSelectorQuery()
        .select('#' + id)
        .fields({ node: true, size: true, rect: true } as any)
        .exec(async (res: any[]) => {
          const info = res && res[0]
          const node = info && info.node
          const ready = !!node && typeof node.getContext === 'function' && !!info.width && !!info.height
          // The native canvas node (with getContext) may not be ready on the
          // first tick — retry a few times before giving up.
          if (!ready && attempt < 10) {
            attempt++
            setTimeout(init, 60)
            return
          }
          if (!node || typeof node.getContext !== 'function') {
            const keys = node ? Object.keys(node).slice(0, 10).join(',') : 'null'
            props.onError && props.onError(
              'canvas 节点无 getContext: node=' + typeof node +
              ', getContext=' + (node ? typeof node.getContext : 'n/a') +
              ', keys=[' + keys + ']'
            )
            return
          }
          rectRef.current = { left: info.left || 0, top: info.top || 0 }
          try {
            const buffer = await readBuffer(props.src)
            if (cancelled) return
            const inst = new RiveInstance({
              canvas: info.node,
              buffer,
              width: info.width,
              height: info.height,
              devicePixelRatio: getDpr(),
              fit: props.fit || 'contain',
              alignment: props.alignment || 'center',
              stateMachine: props.stateMachine,
              autoplay: true,
              onError: (e: any) => props.onError && props.onError(String((e && e.message) || e)),
              onStateChange: (s: string[]) => props.onStateChange && props.onStateChange(s)
            })
            await inst.ready
            if (cancelled) {
              inst.cleanup()
              return
            }
            instRef.current = inst
            props.onLoad && props.onLoad(inst.info())
          } catch (e: any) {
            props.onError && props.onError(String((e && e.message) || e))
          }
        })
    }

    // Defer to next tick so the native canvas is mounted before we query it.
    Taro.nextTick(init)
    return () => {
      cancelled = true
      if (instRef.current) {
        instRef.current.cleanup()
        instRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.src])

  const point = (e: any) => {
    const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0])
    if (!t) return null
    const x = t.x != null ? t.x : (t.clientX || 0) - rectRef.current.left
    const y = t.y != null ? t.y : (t.clientY || 0) - rectRef.current.top
    return { x, y, id: t.identifier || 0 }
  }

  return (
    <Canvas
      type='2d'
      id={id}
      className={props.className}
      style={props.style}
      disableScroll
      onTouchStart={(e: any) => { const p = point(e); if (p && instRef.current) instRef.current.pointerDown(p.x, p.y, p.id) }}
      onTouchMove={(e: any) => { const p = point(e); if (p && instRef.current) instRef.current.pointerMove(p.x, p.y, p.id) }}
      onTouchEnd={(e: any) => { const p = point(e); if (p && instRef.current) instRef.current.pointerUp(p.x, p.y, p.id) }}
      onTouchCancel={(e: any) => { const p = point(e); if (p && instRef.current) instRef.current.pointerUp(p.x, p.y, p.id) }}
    />
  )
})

export default RiveView
