import { View, Text, Button, Switch, Slider, ScrollView } from '@tarojs/components'
import Taro, { useRouter, useReady } from '@tarojs/taro'
import { useRef, useState } from 'react'
import RiveView, { RiveViewHandle } from '../components/RiveView'
import './index.less'

interface InputDef { name: string; type: string }

export default function Demo() {
  const router = useRouter()
  const file = decodeURIComponent((router.params.file as string) || 'vehicles.riv')
  const title = decodeURIComponent((router.params.title as string) || 'Rive')
  const src = `/pkgRive/assets/riv/${file}`

  const riveRef = useRef<RiveViewHandle>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [inputs, setInputs] = useState<InputDef[]>([])
  const [numVals, setNumVals] = useState<Record<string, number>>({})
  const [states, setStates] = useState<string[]>([])
  const [paused, setPaused] = useState(false)
  const [meta, setMeta] = useState<any>(null)

  useReady(() => {
    Taro.setNavigationBarTitle({ title })
  })

  const onLoad = (info: any) => {
    const nv: Record<string, number> = {}
    ;(info.inputs || []).forEach((i: InputDef) => {
      if (i.type === 'number') nv[i.name] = 0
    })
    setNumVals(nv)
    setInputs(info.inputs || [])
    setMeta(info)
    setLoaded(true)
    setError('')
  }

  const onStateChange = (s: string[]) => {
    if (s && s.length) setStates((prev) => s.concat(prev).slice(0, 8))
  }

  const togglePlay = () => {
    const v = riveRef.current
    if (!v) return
    if (paused) v.play()
    else v.pause()
    setPaused(!paused)
  }

  return (
    <ScrollView scrollY className='page'>
      <View className='stage'>
        <RiveView
          ref={riveRef}
          src={src}
          className='rive'
          fit='contain'
          alignment='center'
          onLoad={onLoad}
          onError={setError}
          onStateChange={onStateChange}
        />
        {!loaded && !error && (
          <View className='overlay'>
            <View className='spinner' />
            <Text>加载 WASM 与 .riv…</Text>
          </View>
        )}
        {!!error && (
          <View className='overlay overlay-err'>
            <Text className='overlay-err-title'>加载失败</Text>
            <Text className='overlay-err-msg'>{error}</Text>
          </View>
        )}
      </View>

      <View className='info'>
        <View className='info-title'>{title}</View>
        <Text className='hint'>
          {!meta
            ? '加载中…'
            : (meta.hasListeners || meta.hasPointerBools)
              ? '点击 / 按住画面交互（也可用下方控件）'
              : (meta.inputs && meta.inputs.length)
                ? '⬇ 用下方控件交互'
                : '纯动画播放'}
        </Text>
        {meta && (
          <Text className='hint' style={{ color: '#9a9aae' }}>
            诊断 · 状态机:{meta.stateMachine || '无'} · 指针监听:{meta.hasListeners ? '有' : '无'} · 输入:{(meta.inputs || []).length}个
          </Text>
        )}
      </View>

      {loaded && (
        <View className='panel'>
          <View className='panel-row'>
            <Text className='panel-title'>控制</Text>
            <Button className='btn' size='mini' onClick={togglePlay}>{paused ? '播放' : '暂停'}</Button>
          </View>

          {inputs.length === 0 && <Text className='empty'>该文件为纯动画，无状态机输入。</Text>}

          {inputs.map((inp) => (
            <View className='ctrl' key={inp.name}>
              <Text className='ctrl-name'>{inp.name}</Text>
              <View className='ctrl-widget'>
                {inp.type === 'trigger' && (
                  <Button
                    className='btn btn-accent'
                    size='mini'
                    onClick={() => riveRef.current && riveRef.current.fireTrigger(inp.name)}
                  >触发</Button>
                )}
                {inp.type === 'bool' && (
                  <Switch
                    color='#ff5b4a'
                    onChange={(e: any) => riveRef.current && riveRef.current.setBool(inp.name, e.detail.value)}
                  />
                )}
                {inp.type === 'number' && (
                  <Slider
                    className='slider'
                    min={0}
                    max={100}
                    step={1}
                    value={numVals[inp.name] || 0}
                    activeColor='#ff5b4a'
                    blockSize={20}
                    showValue
                    onChanging={(e: any) => riveRef.current && riveRef.current.setNumber(inp.name, e.detail.value)}
                    onChange={(e: any) => {
                      setNumVals((p) => ({ ...p, [inp.name]: e.detail.value }))
                      riveRef.current && riveRef.current.setNumber(inp.name, e.detail.value)
                    }}
                  />
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {states.length > 0 && (
        <View className='panel'>
          <Text className='panel-title'>状态变化</Text>
          <View className='state-list'>
            {states.map((s, i) => (
              <Text className='state-item' key={i}>{s}</Text>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  )
}
